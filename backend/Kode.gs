/**
 * ============================================================
 * ProductHub Creator — BACKEND (Kode.gs)
 * Pure REST API — JSON only, tidak ada HtmlService
 * ============================================================
 *
 * Arsitektur (gas-pro-api):
 *   Frontend  : GitHub Pages (index.html + admin.html)  ← file statis
 *   Backend   : file ini                                 ← JSON API
 *   Database  : Google Sheets
 *   Media     : Google Drive
 *
 * Komunikasi 100% lewat fetch() HTTP:
 *   GET  /exec?action=init            → data landing page
 *   GET  /exec?action=track&tipe=...  → catat statistik (fire & forget)
 *   GET  /exec?action=ping            → cek koneksi
 *   POST /exec  body {action, token, data}
 *
 * ⚠️ CATATAN AUTENTIKASI
 * Karena frontend berada di domain lain, permintaan fetch() ke web app ini
 * bersifat ANONIM — Session.getActiveUser().getEmail() SELALU kosong.
 * Karena itu jalur login berbasis email Google dihapus seluruhnya.
 * Satu-satunya jalur masuk adalah PIN → token sesi berbatas waktu.
 *
 * PRINSIP OPTIMASI YANG DIPERTAHANKAN (gas-instant-ux):
 *   1. Satu panggilan untuk seluruh data awal (action=init)
 *   2. Tracking fire & forget — client tidak pernah menunggu
 *   3. CacheService untuk semua pembacaan, di-invalidate saat menulis
 *   4. Batch getValues()/setValues() — tidak ada loop API
 *
 * Versi : 2.0 (API)
 * ============================================================
 */

// ══════════════════════════════════════════════════════════
// BAGIAN 1: KONSTANTA & KONFIGURASI
// ══════════════════════════════════════════════════════════

const APP_NAME    = 'ProductHub Creator';
const FOLDER_NAME = 'ProductHub_Creator';
const SS_NAME     = 'DB_ProductHub_Creator';
const API_VERSION = '2.0';

/**
 * PIN admin awal. WAJIB Anda ganti sebelum menjalankan setupAppEnvironment().
 * Setelah setup, PIN disimpan di sheet AppConfig dan bisa diubah
 * lewat Dashboard → Pengaturan tanpa menyentuh kode lagi.
 */
const ADMIN_PIN_DEFAULT = 'producthub2026';

/** Lama sesi admin dalam detik. 21600 = 6 jam — batas maksimum CacheService. */
const SESSION_TTL = 21600;

/** TTL cache data (detik). */
const CACHE_TTL = {
  MASTER: 1800,  // 30 menit — Produk, Hero, Keunggulan, Testimoni, Config
  STATS: 120     // 2 menit  — rekap statistik
};

/**
 * CONFIG membaca seluruh ID dari Script Properties.
 * Tidak ada ID yang di-hardcode — semuanya diisi oleh setupAppEnvironment().
 */
const CONFIG = {
  get SPREADSHEET_ID()     { return prop('spreadsheetId'); },
  get ROOT_FOLDER_ID()     { return prop('folderId'); },
  get THUMBNAIL_FOLDER_ID(){ return prop('thumbnailFolderId'); },
  get HERO_FOLDER_ID()     { return prop('heroFolderId'); },
  get TESTIMONI_FOLDER_ID(){ return prop('testimoniFolderId'); }
};

const SHEETS = {
  PRODUK:     'Produk',
  HERO:       'KontenHero',
  KEUNGGULAN: 'Keunggulan',
  TESTIMONI:  'Testimoni',
  STATISTIK:  'Statistik',
  CONFIG:     'AppConfig'
};

function prop(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

// ══════════════════════════════════════════════════════════
// BAGIAN 2: HELPER DASAR
// ══════════════════════════════════════════════════════════

/**
 * Balasan standar untuk SELURUH endpoint.
 * WAJIB ContentService (JSON) — bukan HtmlService.
 */
function buildResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data, message) {
  return { success: true, data: data === undefined ? null : data, message: message || 'OK' };
}

function fail(message, data) {
  return { success: false, data: data === undefined ? null : data, message: message || 'Terjadi kesalahan.' };
}

function generateUUID() {
  return Utilities.getUuid();
}

/** Ubah nilai sel apa pun jadi tipe yang aman dikirim sebagai JSON. */
function cleanVal(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v;
}

function todayKey() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ══════════════════════════════════════════════════════════
// BAGIAN 3: ENTRY POINT — doGet (baca, publik)
// ══════════════════════════════════════════════════════════

/**
 * Seluruh permintaan baca dari landing page.
 * Tidak pernah menyentuh data rahasia dan tidak memerlukan token.
 */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = p.action || 'init';

    switch (action) {
      case 'init':
        return buildResponse(getInitialData());

      case 'track':
        // Fire & forget dari client — tidak pernah memblokir antarmuka
        return buildResponse(trackEvent(p.tipe, p.id));

      case 'ping':
        return buildResponse(ok({
          app: APP_NAME,
          version: API_VERSION,
          waktu: new Date().toISOString(),
          siap: !!CONFIG.SPREADSHEET_ID
        }, 'API aktif.'));

      default:
        return buildResponse(fail('Action GET tidak dikenal: ' + action));
    }
  } catch (err) {
    return buildResponse(fail(err.message));
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 4: ENTRY POINT — doPost (tulis, butuh token)
// ══════════════════════════════════════════════════════════

/**
 * Seluruh permintaan tulis dari dashboard admin.
 *
 * Body dikirim sebagai text/plain (bukan application/json) supaya
 * browser TIDAK melakukan preflight OPTIONS — GAS tidak melayani OPTIONS.
 * Isinya tetap JSON, kita parse manual di sini.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return buildResponse(fail('Permintaan kosong.'));
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return buildResponse(fail('Format permintaan tidak valid (JSON rusak).'));
    }

    const action = payload.action || '';
    const token  = payload.token || '';
    const data   = payload.data || {};

    // ── Endpoint tanpa token ──
    if (action === 'login')  return buildResponse(login(data.pin));
    if (action === 'logout') return buildResponse(logout(token));

    // ── Mulai sini seluruhnya butuh sesi yang sah ──
    const sesi = validateToken(token);
    if (!sesi.valid) {
      return buildResponse(fail(sesi.message, { sessionExpired: true }));
    }

    switch (action) {
      case 'getAdminData':      return buildResponse(getAdminData());
      case 'saveProduk':        return buildResponse(simpanProduk(data));
      case 'deleteProduk':      return buildResponse(hapusProduk(data.id));
      case 'batchStatusProduk': return buildResponse(ubahStatusProdukBatch(data.ids, data.status));
      case 'saveHero':          return buildResponse(simpanHero(data));
      case 'saveKeunggulan':    return buildResponse(simpanKeunggulan(data));
      case 'deleteKeunggulan':  return buildResponse(hapusKeunggulan(data.id));
      case 'saveTestimoni':     return buildResponse(simpanTestimoni(data));
      case 'deleteTestimoni':   return buildResponse(hapusTestimoni(data.id));
      case 'saveConfig':        return buildResponse(simpanKonfigurasi(data));
      case 'uploadMedia':       return buildResponse(uploadMedia(data.base64, data.fileName, data.mimeType, data.kategori));
      default:
        return buildResponse(fail('Action POST tidak dikenal: ' + action));
    }
  } catch (err) {
    return buildResponse(fail(err.message));
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 5: SESI ADMIN — PIN → TOKEN
// ══════════════════════════════════════════════════════════

/**
 * Tukar PIN dengan token sesi.
 *
 * Token adalah UUID acak yang disimpan di CacheService. Setelah ini
 * PIN tidak pernah lagi dikirim melalui jaringan — setiap operasi tulis
 * cukup membawa token. Token hilang sendiri setelah SESSION_TTL.
 */
function login(pin) {
  try {
    const tersimpan = String(getConfigValue('adminPin') || ADMIN_PIN_DEFAULT);
    const masukan = String(pin || '').trim();

    if (!masukan) return fail('PIN belum diisi.');

    if (masukan !== tersimpan) {
      Utilities.sleep(600);  // perlambat percobaan beruntun
      return fail('PIN salah.');
    }

    const token = generateUUID();
    simpanSesi(token);

    return ok({
      token: token,
      berlakuDetik: SESSION_TTL
    }, 'Login berhasil.');

  } catch (err) {
    return fail(err.message);
  }
}

function logout(token) {
  try {
    if (token) CacheService.getScriptCache().remove('sesi_' + token);
    return ok(null, 'Anda telah keluar.');
  } catch (err) {
    return fail(err.message);
  }
}

function simpanSesi(token) {
  CacheService.getScriptCache().put(
    'sesi_' + token,
    JSON.stringify({ dibuat: Date.now() }),
    SESSION_TTL
  );
}

/**
 * Periksa token dan perpanjang masa berlakunya (sliding session).
 * Selama admin aktif bekerja, sesinya tidak akan putus di tengah jalan.
 */
function validateToken(token) {
  if (!token) {
    return { valid: false, message: 'Sesi tidak ditemukan. Silakan masuk kembali.' };
  }

  const hit = CacheService.getScriptCache().get('sesi_' + token);
  if (!hit) {
    return { valid: false, message: 'Sesi sudah berakhir. Silakan masuk kembali dengan PIN.' };
  }

  simpanSesi(token);  // perpanjang
  return { valid: true, message: 'OK' };
}

// ══════════════════════════════════════════════════════════
// BAGIAN 6: AKSES SPREADSHEET & CACHE
// ══════════════════════════════════════════════════════════

/** Ambil spreadsheet database (Script Properties dulu, fallback cari di Drive). */
function getSpreadsheet() {
  const ssId = CONFIG.SPREADSHEET_ID;
  if (ssId) {
    try { return SpreadsheetApp.openById(ssId); } catch (e) { /* lanjut ke fallback */ }
  }

  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (!folders.hasNext()) {
    throw new Error('Folder aplikasi belum ada. Jalankan setupAppEnvironment() di editor Apps Script.');
  }
  const files = folders.next().getFilesByName(SS_NAME);
  if (!files.hasNext()) {
    throw new Error('Database belum ada. Jalankan setupAppEnvironment() di editor Apps Script.');
  }

  const ss = SpreadsheetApp.open(files.next());
  PropertiesService.getScriptProperties().setProperty('spreadsheetId', ss.getId());
  return ss;
}

function getSheet(name) {
  const sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" tidak ditemukan.');
  return sheet;
}

/** Baca sheet sebagai array objek — satu getValues() saja (Prinsip 4). */
function readSheetRaw(sheetName) {
  const values = getSheet(sheetName).getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1)
    .filter(function (row) { return row.join('').trim() !== ''; })
    .map(function (row) {
      const obj = {};
      headers.forEach(function (h, i) { obj[h] = cleanVal(row[i]); });
      return obj;
    });
}

/** Baca sheet dengan cache (Prinsip 3). */
function getCachedSheet(sheetName, ttl) {
  const cache = CacheService.getScriptCache();
  const key = 'ph_' + sheetName.toLowerCase();

  try {
    const hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  } catch (e) { /* cache bermasalah — baca langsung */ }

  const records = readSheetRaw(sheetName);

  try {
    cache.put(key, JSON.stringify(records), ttl || CACHE_TTL.MASTER);
  } catch (e) { /* payload > 100 KB — lewati cache, tidak fatal */ }

  return records;
}

function invalidateCache(sheetName) {
  CacheService.getScriptCache().remove('ph_' + sheetName.toLowerCase());
}

function invalidateAllCache() {
  const cache = CacheService.getScriptCache();
  Object.keys(SHEETS).forEach(function (k) {
    cache.remove('ph_' + SHEETS[k].toLowerCase());
  });
  cache.remove('ph_rekap_statistik');
}

function getConfigValue(key) {
  const rows = getCachedSheet(SHEETS.CONFIG, CACHE_TTL.MASTER);
  const row = rows.filter(function (r) { return r.Key === key; })[0];
  return row ? row.Value : '';
}

// ══════════════════════════════════════════════════════════
// BAGIAN 7: DATA LANDING PAGE (satu panggilan)
// ══════════════════════════════════════════════════════════

/**
 * Seluruh isi landing page dalam satu balasan (Prinsip 1 & 4).
 * Semuanya dari cache, jadi umumnya selesai dalam milidetik.
 *
 * Rahasia (adminPin) TIDAK PERNAH ikut terkirim.
 */
function getInitialData() {
  try {
    const produk = getCachedSheet(SHEETS.PRODUK, CACHE_TTL.MASTER)
      .filter(function (p) { return String(p.Status).toLowerCase() === 'published'; })
      .sort(function (a, b) { return (Number(a.Urutan) || 999) - (Number(b.Urutan) || 999); })
      .map(bersihkanProdukPublik);

    const heroRows = getCachedSheet(SHEETS.HERO, CACHE_TTL.MASTER);
    const hero = heroRows.length ? heroRows[0] : {};

    const keunggulan = getCachedSheet(SHEETS.KEUNGGULAN, CACHE_TTL.MASTER)
      .filter(function (k) { return String(k.Status).toLowerCase() !== 'draft'; })
      .sort(function (a, b) { return (Number(a.Urutan) || 999) - (Number(b.Urutan) || 999); });

    const testimoni = getCachedSheet(SHEETS.TESTIMONI, CACHE_TTL.MASTER)
      .filter(function (t) { return String(t.Status).toLowerCase() !== 'draft'; });

    const config = {};
    getCachedSheet(SHEETS.CONFIG, CACHE_TTL.MASTER).forEach(function (r) {
      config[r.Key] = r.Value;
    });

    // Jangan pernah kirim rahasia atau ID internal ke publik
    delete config.adminPin;
    delete config.folderId;
    delete config.thumbnailFolderId;
    delete config.heroFolderId;
    delete config.testimoniFolderId;
    delete config.spreadsheetId;

    return ok({
      produk: produk,
      hero: hero,
      keunggulan: keunggulan,
      testimoni: testimoni,
      config: config
    }, 'OK');

  } catch (err) {
    return fail(err.message);
  }
}

/** Buang kolom yang hanya untuk keperluan internal admin. */
function bersihkanProdukPublik(p) {
  const salinan = {};
  Object.keys(p).forEach(function (k) { salinan[k] = p[k]; });
  delete salinan.LinkProduk;   // catatan internal — bukan konsumsi publik
  return salinan;
}

// ══════════════════════════════════════════════════════════
// BAGIAN 8: PENCATATAN STATISTIK
// ══════════════════════════════════════════════════════════

/**
 * Catat aktivitas pengunjung — satu baris per hari, bukan per kejadian
 * (Prinsip 4: aman untuk ribuan pengunjung tanpa membengkakkan sheet).
 *
 * @param {string} tipe 'view' | 'cta' | 'demo'
 * @param {string} produkId ID produk terkait (opsional)
 */
function trackEvent(tipe, produkId) {
  const jenis = String(tipe || '').toLowerCase();
  if (['view', 'cta', 'demo'].indexOf(jenis) === -1) {
    return fail('Tipe event tidak dikenal.');
  }

  const lock = LockService.getScriptLock();
  try {
    // Statistik bukan data kritis — bila sedang sibuk, lewati saja
    if (!lock.tryLock(5000)) return ok(null, 'Dilewati (sibuk).');

    const sheet = getSheet(SHEETS.STATISTIK);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    const cTgl   = headers.indexOf('Tanggal');
    const cView  = headers.indexOf('TotalPengunjung');
    const cCta   = headers.indexOf('TotalKlikCTA');
    const cDemo  = headers.indexOf('TotalKlikDemo');
    const cDetil = headers.indexOf('DetailProduk');

    const key = todayKey();
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (cleanVal(values[i][cTgl]) === key) { rowIndex = i; break; }
    }

    let row;
    if (rowIndex === -1) {
      row = new Array(headers.length).fill('');
      row[cTgl] = key; row[cView] = 0; row[cCta] = 0; row[cDemo] = 0; row[cDetil] = '{}';
      rowIndex = values.length;
    } else {
      row = values[rowIndex].slice();
    }

    if (jenis === 'view') row[cView] = (Number(row[cView]) || 0) + 1;
    if (jenis === 'cta')  row[cCta]  = (Number(row[cCta])  || 0) + 1;
    if (jenis === 'demo') row[cDemo] = (Number(row[cDemo]) || 0) + 1;

    if (produkId) {
      let detail = {};
      try { detail = JSON.parse(row[cDetil] || '{}'); } catch (e) { detail = {}; }
      if (!detail[produkId]) detail[produkId] = { cta: 0, demo: 0 };
      if (jenis === 'cta')  detail[produkId].cta  = (detail[produkId].cta  || 0) + 1;
      if (jenis === 'demo') detail[produkId].demo = (detail[produkId].demo || 0) + 1;
      row[cDetil] = JSON.stringify(detail);
    }

    sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);
    CacheService.getScriptCache().remove('ph_rekap_statistik');

    return ok(null, 'Tercatat.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 9: DATA DASHBOARD ADMIN (satu panggilan)
// ══════════════════════════════════════════════════════════

function getAdminData() {
  try {
    const produk    = readSheetRaw(SHEETS.PRODUK);
    const heroRows  = readSheetRaw(SHEETS.HERO);
    const testimoni = readSheetRaw(SHEETS.TESTIMONI);
    const statistik = readSheetRaw(SHEETS.STATISTIK);

    const keunggulan = readSheetRaw(SHEETS.KEUNGGULAN)
      .sort(function (a, b) { return (Number(a.Urutan) || 999) - (Number(b.Urutan) || 999); });

    const config = {};
    readSheetRaw(SHEETS.CONFIG).forEach(function (r) { config[r.Key] = r.Value; });
    delete config.adminPin;   // PIN tidak pernah dikirim, bahkan ke admin

    return ok({
      produk: produk,
      hero: heroRows.length ? heroRows[0] : {},
      keunggulan: keunggulan,
      testimoni: testimoni,
      config: config,
      statistik: hitungRekapStatistik(statistik, produk)
    }, 'OK');

  } catch (err) {
    return fail(err.message);
  }
}

/** Olah baris statistik harian menjadi ringkasan siap tampil (semuanya di memori). */
function hitungRekapStatistik(statistik, produk) {
  const rows = statistik
    .filter(function (r) { return r.Tanggal; })
    .sort(function (a, b) { return String(a.Tanggal).localeCompare(String(b.Tanggal)); });

  const last30 = rows.slice(-30);
  const last7  = rows.slice(-7);

  let totalView = 0, totalCta = 0, totalDemo = 0;
  last30.forEach(function (r) {
    totalView += Number(r.TotalPengunjung) || 0;
    totalCta  += Number(r.TotalKlikCTA) || 0;
    totalDemo += Number(r.TotalKlikDemo) || 0;
  });

  const perProduk = {};
  last30.forEach(function (r) {
    let d = {};
    try { d = JSON.parse(r.DetailProduk || '{}'); } catch (e) { d = {}; }
    Object.keys(d).forEach(function (id) {
      if (!perProduk[id]) perProduk[id] = { cta: 0, demo: 0 };
      perProduk[id].cta  += Number(d[id].cta)  || 0;
      perProduk[id].demo += Number(d[id].demo) || 0;
    });
  });

  const namaById = {};
  produk.forEach(function (p) { namaById[p.ID] = p.NamaProduk; });

  const ranking = Object.keys(perProduk).map(function (id) {
    const v = perProduk[id];
    return {
      id: id,
      nama: namaById[id] || '(produk dihapus)',
      cta: v.cta,
      demo: v.demo,
      total: v.cta + v.demo
    };
  }).sort(function (a, b) { return b.total - a.total; });

  const konversi = totalView > 0 ? (totalCta / totalView) * 100 : 0;

  // Insight tekstual otomatis
  const insights = [];
  insights.push('Dalam 30 hari terakhir tercatat ' + totalView.toLocaleString('id-ID') +
    ' kunjungan dan ' + totalCta.toLocaleString('id-ID') + ' klik tombol beli.');
  insights.push('Tingkat konversi kunjungan ke klik beli berada di angka ' + konversi.toFixed(2) + '%.');
  if (ranking.length) {
    insights.push('Produk "' + ranking[0].nama + '" paling banyak menarik perhatian dengan ' +
      ranking[0].total + ' interaksi.');
  }
  if (totalDemo > totalCta && totalCta > 0) {
    insights.push('Klik demo lebih tinggi daripada klik beli — pertimbangkan memperjelas tombol beli pada kartu produk.');
  }
  const aktif = produk.filter(function (p) { return String(p.Status).toLowerCase() === 'published'; }).length;
  insights.push('Saat ini ada ' + aktif + ' produk tayang dari total ' + produk.length + ' produk.');

  return {
    totalPengunjung: totalView,
    totalKlikCTA: totalCta,
    totalKlikDemo: totalDemo,
    tingkatKonversi: Number(konversi.toFixed(2)),
    produkAktif: aktif,
    produkTotal: produk.length,
    grafik7Hari: last7.map(function (r) {
      return {
        tanggal: r.Tanggal,
        pengunjung: Number(r.TotalPengunjung) || 0,
        klik: Number(r.TotalKlikCTA) || 0
      };
    }),
    grafik30Hari: last30.map(function (r) {
      return { tanggal: r.Tanggal, pengunjung: Number(r.TotalPengunjung) || 0 };
    }),
    ranking: ranking.slice(0, 10),
    insights: insights
  };
}

// ══════════════════════════════════════════════════════════
// BAGIAN 10: CRUD PRODUK
// ══════════════════════════════════════════════════════════

function simpanProduk(record) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (!record || !String(record.NamaProduk || '').trim()) {
      return fail('Nama produk wajib diisi.');
    }

    const sheet = getSheet(SHEETS.PRODUK);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('ID');

    if (record.ID) {
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][idCol] === record.ID) { rowIndex = i; break; }
      }
      if (rowIndex === -1) return fail('Produk tidak ditemukan.');

      const updated = headers.map(function (h, i) {
        return record[h] !== undefined ? record[h] : values[rowIndex][i];
      });
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([updated]);

    } else {
      record.ID = generateUUID();
      record.TanggalUpload = record.TanggalUpload || todayKey();
      if (!record.Urutan) record.Urutan = values.length;

      const newRow = headers.map(function (h) {
        return record[h] !== undefined ? record[h] : '';
      });
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([newRow]);
    }

    invalidateCache(SHEETS.PRODUK);
    return ok(record, 'Produk berhasil disimpan.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function hapusProduk(id) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const sheet = getSheet(SHEETS.PRODUK);
    const values = sheet.getDataRange().getValues();
    const idCol = values[0].indexOf('ID');

    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === id) {
        sheet.deleteRow(i + 1);
        invalidateCache(SHEETS.PRODUK);
        return ok(null, 'Produk berhasil dihapus.');
      }
    }
    return fail('Produk tidak ditemukan.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/** Ubah status beberapa produk sekaligus — satu setValues() untuk semuanya. */
function ubahStatusProdukBatch(ids, statusBaru) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (!ids || !ids.length) return fail('Tidak ada produk yang dipilih.');

    const sheet = getSheet(SHEETS.PRODUK);
    const range = sheet.getDataRange();
    const values = range.getValues();
    const headers = values[0];
    const idCol = headers.indexOf('ID');
    const stCol = headers.indexOf('Status');

    let n = 0;
    for (let i = 1; i < values.length; i++) {
      if (ids.indexOf(values[i][idCol]) !== -1) { values[i][stCol] = statusBaru; n++; }
    }

    range.setValues(values);
    invalidateCache(SHEETS.PRODUK);
    return ok({ diubah: n }, n + ' produk diperbarui.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 11: KONTEN HERO, KEUNGGULAN & TESTIMONI
// ══════════════════════════════════════════════════════════

/** Simpan konten hero — selalu baris pertama. */
function simpanHero(record) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const sheet = getSheet(SHEETS.HERO);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    const existing = values.length > 1 ? values[1] : new Array(headers.length).fill('');
    const updated = headers.map(function (h, i) {
      if (h === 'ID') return existing[i] || generateUUID();
      return record[h] !== undefined ? record[h] : existing[i];
    });

    sheet.getRange(2, 1, 1, headers.length).setValues([updated]);
    invalidateCache(SHEETS.HERO);
    return ok(null, 'Konten hero berhasil disimpan.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function simpanKeunggulan(record) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (!String(record.Judul || '').trim()) return fail('Judul keunggulan wajib diisi.');

    const sheet = getSheet(SHEETS.KEUNGGULAN);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('ID');

    if (record.ID) {
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][idCol] === record.ID) { rowIndex = i; break; }
      }
      if (rowIndex === -1) return fail('Data tidak ditemukan.');

      const updated = headers.map(function (h, i) {
        return record[h] !== undefined ? record[h] : values[rowIndex][i];
      });
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([updated]);
    } else {
      record.ID = generateUUID();
      if (!record.Status) record.Status = 'Published';
      if (!record.Urutan) record.Urutan = values.length;
      const newRow = headers.map(function (h) { return record[h] !== undefined ? record[h] : ''; });
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([newRow]);
    }

    invalidateCache(SHEETS.KEUNGGULAN);
    return ok(record, 'Keunggulan berhasil disimpan.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function hapusKeunggulan(id) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const sheet = getSheet(SHEETS.KEUNGGULAN);
    const values = sheet.getDataRange().getValues();
    const idCol = values[0].indexOf('ID');

    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === id) {
        sheet.deleteRow(i + 1);
        invalidateCache(SHEETS.KEUNGGULAN);
        return ok(null, 'Keunggulan berhasil dihapus.');
      }
    }
    return fail('Data tidak ditemukan.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function simpanTestimoni(record) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (!String(record.Nama || '').trim() || !String(record.Isi || '').trim()) {
      return fail('Nama dan isi testimoni wajib diisi.');
    }

    const sheet = getSheet(SHEETS.TESTIMONI);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('ID');

    if (record.ID) {
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][idCol] === record.ID) { rowIndex = i; break; }
      }
      if (rowIndex === -1) return fail('Testimoni tidak ditemukan.');

      const updated = headers.map(function (h, i) {
        return record[h] !== undefined ? record[h] : values[rowIndex][i];
      });
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([updated]);
    } else {
      record.ID = generateUUID();
      if (!record.Status) record.Status = 'Published';
      const newRow = headers.map(function (h) { return record[h] !== undefined ? record[h] : ''; });
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([newRow]);
    }

    invalidateCache(SHEETS.TESTIMONI);
    return ok(record, 'Testimoni berhasil disimpan.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function hapusTestimoni(id) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const sheet = getSheet(SHEETS.TESTIMONI);
    const values = sheet.getDataRange().getValues();
    const idCol = values[0].indexOf('ID');

    for (let i = 1; i < values.length; i++) {
      if (values[i][idCol] === id) {
        sheet.deleteRow(i + 1);
        invalidateCache(SHEETS.TESTIMONI);
        return ok(null, 'Testimoni berhasil dihapus.');
      }
    }
    return fail('Testimoni tidak ditemukan.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 12: PENGATURAN (AppConfig)
// ══════════════════════════════════════════════════════════

/** Simpan beberapa nilai konfigurasi sekaligus (batch). */
function simpanKonfigurasi(configObj) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    if (!configObj || !Object.keys(configObj).length) {
      return fail('Tidak ada pengaturan yang dikirim.');
    }

    // Kunci yang tidak boleh ditimpa dari luar — ID lingkungan dikelola setup
    const TERKUNCI = ['folderId', 'thumbnailFolderId', 'heroFolderId', 'testimoniFolderId', 'spreadsheetId'];

    if (configObj.adminPin !== undefined) {
      const pinBaru = String(configObj.adminPin).trim();
      if (pinBaru.length < 6) return fail('PIN minimal 6 karakter.');
      configObj.adminPin = pinBaru;
    }

    const sheet = getSheet(SHEETS.CONFIG);
    const range = sheet.getDataRange();
    const values = range.getValues();

    const indexByKey = {};
    for (let i = 1; i < values.length; i++) indexByKey[values[i][0]] = i;

    const tambahan = [];
    Object.keys(configObj).forEach(function (k) {
      if (TERKUNCI.indexOf(k) !== -1) return;
      const v = configObj[k];
      if (indexByKey[k] !== undefined) {
        values[indexByKey[k]][1] = v;
      } else {
        tambahan.push([k, v]);
      }
    });

    range.setValues(values);
    if (tambahan.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, tambahan.length, 2).setValues(tambahan);
    }

    invalidateCache(SHEETS.CONFIG);
    return ok(null, 'Pengaturan berhasil disimpan.');

  } catch (err) {
    return fail(err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 13: UPLOAD MEDIA KE DRIVE
// ══════════════════════════════════════════════════════════

/**
 * Unggah gambar ke sub-folder Drive sesuai kategori, lalu kembalikan URL
 * yang bisa dipakai langsung pada tag <img>.
 *
 * @param {string} base64   isi file dalam base64 (tanpa prefix data:)
 * @param {string} fileName nama file
 * @param {string} mimeType tipe MIME
 * @param {string} kategori 'thumbnail' | 'hero' | 'testimoni'
 */
function uploadMedia(base64, fileName, mimeType, kategori) {
  try {
    if (!base64) return fail('File kosong.');
    if (String(mimeType).indexOf('image/') !== 0) {
      return fail('Hanya berkas gambar (PNG/JPG/GIF/WebP) yang diizinkan.');
    }

    const folderKey = {
      thumbnail: 'thumbnailFolderId',
      hero:      'heroFolderId',
      testimoni: 'testimoniFolderId'
    }[String(kategori).toLowerCase()] || 'thumbnailFolderId';

    const folderId = prop(folderKey);
    if (!folderId) {
      throw new Error('Folder media belum dikonfigurasi. Jalankan setupAppEnvironment().');
    }

    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName || 'gambar');
    const file = DriveApp.getFolderById(folderId).createFile(blob);

    // Agar gambar bisa tampil di landing page publik
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const id = file.getId();
    return ok({
      fileId: id,
      // Format lh3 paling stabil untuk ditampilkan langsung sebagai <img>
      url: 'https://lh3.googleusercontent.com/d/' + id,
      fileName: file.getName()
    }, 'Gambar berhasil diunggah.');

  } catch (err) {
    return fail(err.message);
  }
}

// ══════════════════════════════════════════════════════════
// BAGIAN 14: SETUP LINGKUNGAN — JALANKAN SEKALI
// ══════════════════════════════════════════════════════════

/**
 * Membuat seluruh infrastruktur aplikasi: folder Drive, sub-folder media,
 * spreadsheet database beserta sheet, header, dan data contoh.
 *
 * Bersifat idempoten — aman dijalankan berkali-kali, tidak akan
 * menggandakan folder maupun sheet yang sudah ada.
 */
function setupAppEnvironment() {
  try {
    Logger.log('🚀 Memulai setup ' + APP_NAME + '…');

    // ── 1. Folder utama & sub-folder media ──
    const folders = DriveApp.getFoldersByName(FOLDER_NAME);
    const mainFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(FOLDER_NAME);

    const subThumbnail = getOrCreateSubFolder(mainFolder, 'Thumbnail');
    const subHero      = getOrCreateSubFolder(mainFolder, 'Hero');
    const subTestimoni = getOrCreateSubFolder(mainFolder, 'Testimoni');

    // ── 2. Spreadsheet database ──
    let ss;
    const files = mainFolder.getFilesByName(SS_NAME);
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      ss = SpreadsheetApp.create(SS_NAME);
      DriveApp.getFileById(ss.getId()).moveTo(mainFolder);
    }

    const now = todayKey();

    // ── 3. Sheet: Produk ──
    createSheetIfNotExists(ss, SHEETS.PRODUK,
      ['ID', 'NamaProduk', 'Harga', 'Deskripsi', 'LinkProduk', 'LinkDemo',
       'Thumbnail', 'TanggalUpload', 'Status', 'LinkCheckout', 'Badge', 'Urutan'],
      [generateUUID(), 'SaaS Boilerplate Pro', 149000,
       'Fondasi aplikasi siap pakai berbasis Google Apps Script — lengkap dengan autentikasi, CRUD, dan dashboard.',
       '', 'https://script.google.com/', '', now, 'Published',
       'https://wa.me/6281234567890?text=Saya%20ingin%20membeli%20SaaS%20Boilerplate%20Pro', 'Bestseller', 1],
      [generateUUID(), 'Admin Dashboard UI', 89000,
       'Template dashboard premium untuk aplikasi yang padat data. Grafik, tabel, dan filter siap pakai.',
       '', 'https://script.google.com/', '', now, 'Published',
       'https://wa.me/6281234567890?text=Saya%20ingin%20membeli%20Admin%20Dashboard%20UI', '', 2],
      [generateUUID(), 'Iconography Set', 49000,
       'Lebih dari 500 ikon garis yang dirancang rapi untuk antarmuka profesional.',
       '', '', '', now, 'Draft',
       'https://wa.me/6281234567890?text=Saya%20ingin%20membeli%20Iconography%20Set', '', 3]
    );

    // ── 4. Sheet: KontenHero (hanya 1 baris aktif) ──
    // HeroSlides = daftar URL gambar slideshow, satu URL per baris.
    createSheetIfNotExists(ss, SHEETS.HERO,
      ['ID', 'Headline', 'Subheadline', 'HeroVisual', 'HeroSlides', 'TeksCTA', 'LinkCTA',
       'TeksCTASekunder', 'JudulPenutup', 'DeskripsiPenutup', 'TeksCTAPenutup', 'LinkCTAPenutup'],
      [generateUUID(),
       'Wujudkan Visi Digital Anda Hari Ini',
       'Bangun, kelola, dan skalakan produk digital Anda dengan alat yang dirancang untuk kreator modern. Bukti nyata, bukan sekadar janji.',
       '', '', 'Beli Sekarang', '#produk', 'Lihat Demo',
       'Siap meluncurkan produk berikutnya?',
       'Bergabunglah dengan ribuan kreator yang memercayai ProductHub untuk perdagangan digital mereka.',
       'Mulai Sekarang', 'https://wa.me/6281234567890']
    );

    // ── 5. Sheet: Keunggulan (4 poin di bawah hero) ──
    createSheetIfNotExists(ss, SHEETS.KEUNGGULAN,
      ['ID', 'Ikon', 'Judul', 'Deskripsi', 'Urutan', 'Status'],
      [generateUUID(), 'zap', 'Sangat Ringan',
       'Performa dioptimalkan agar produk Anda terbuka seketika dan lebih banyak pengunjung berubah jadi pembeli.', 1, 'Published'],
      [generateUUID(), 'target', 'Presisi Detail',
       'Setiap komponen dirancang cermat mengikuti prinsip minimalis premium.', 2, 'Published'],
      [generateUUID(), 'chart', 'Wawasan Mendalam',
       'Analitik yang dapat ditindaklanjuti agar keputusan Anda berbasis data, bukan tebakan.', 3, 'Published'],
      [generateUUID(), 'shield', 'Dukungan Penuh',
       'Panduan langkah demi langkah dan pendampingan sampai aplikasi Anda benar-benar berjalan.', 4, 'Published']
    );

    // ── 6. Sheet: Testimoni ──
    createSheetIfNotExists(ss, SHEETS.TESTIMONI,
      ['ID', 'Nama', 'Jabatan', 'Isi', 'Foto', 'Status'],
      [generateUUID(), 'Alex Rivera', 'Senior Product Designer',
       'ProductHub benar-benar mengubah cara saya memamerkan aset digital. Desainnya minimalis sehingga karya saya yang berbicara, dan tingkat konversinya belum pernah setinggi ini.',
       '', 'Published'],
      [generateUUID(), 'Dewi Anggraini', 'Founder, Kelas Digital',
       'Yang membuat saya yakin adalah demo aplikasinya. Saya bisa mencoba sendiri sebelum membeli — itu jarang ada di penjual produk digital lain.',
       '', 'Published']
    );

    // ── 7. Sheet: Statistik (1 baris per hari) ──
    createSheetIfNotExists(ss, SHEETS.STATISTIK,
      ['Tanggal', 'TotalPengunjung', 'TotalKlikCTA', 'TotalKlikDemo', 'DetailProduk'],
      [now, 0, 0, 0, '{}']
    );

    // ── 8. Sheet: AppConfig ──
    createSheetIfNotExists(ss, SHEETS.CONFIG,
      ['Key', 'Value'],
      ['appName', APP_NAME],
      ['tagline', 'Alat kelas dunia untuk kreator digital.'],
      ['folderId', mainFolder.getId()],
      ['thumbnailFolderId', subThumbnail.getId()],
      ['heroFolderId', subHero.getId()],
      ['testimoniFolderId', subTestimoni.getId()],
      ['spreadsheetId', ss.getId()],
      ['adminPin', ADMIN_PIN_DEFAULT],
      ['waNumber', '6281234567890'],

      // Angka social proof — 4 pasang label + nilai, semuanya bisa diedit admin
      ['statLabel1', 'Pengguna Aktif'],   ['statValue1', '10.000+'],
      ['statLabel2', 'Produk Terjual'],   ['statValue2', '50.000+'],
      ['statLabel3', 'Tingkat Kepuasan'], ['statValue3', '99,8%'],
      ['statLabel4', 'Uptime Server'],    ['statValue4', '99,9%'],

      // Kecepatan animasi (detik untuk satu putaran penuh)
      ['heroSlideDelay', '5'],
      ['demoSpeed', '40'],
      ['testiSpeed', '55']
    );

    // ── 9. Simpan ID ke Script Properties (akses tercepat) ──
    PropertiesService.getScriptProperties().setProperties({
      spreadsheetId: ss.getId(),
      folderId: mainFolder.getId(),
      thumbnailFolderId: subThumbnail.getId(),
      heroFolderId: subHero.getId(),
      testimoniFolderId: subTestimoni.getId()
    });

    // ── 10. Hapus Sheet1 bawaan ──
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);

    // ── 11. Bersihkan cache lama ──
    invalidateAllCache();

    Logger.log('');
    Logger.log('✅ SETUP SELESAI');
    Logger.log('📁 Folder Drive : ' + mainFolder.getUrl());
    Logger.log('📊 Spreadsheet  : ' + ss.getUrl());
    Logger.log('🔑 PIN admin    : ' + ADMIN_PIN_DEFAULT);
    Logger.log('');
    Logger.log('➡️  Langkah berikutnya:');
    Logger.log('   1. Deploy → New deployment → Web app');
    Logger.log('      Execute as: Me   |   Who has access: Anyone');
    Logger.log('   2. Salin URL /exec');
    Logger.log('   3. Tempel URL itu ke assets/js/config.js di repo GitHub Anda');

    return ok({
      folderUrl: mainFolder.getUrl(),
      spreadsheetUrl: ss.getUrl()
    }, 'Setup berhasil.');

  } catch (err) {
    Logger.log('❌ Setup gagal: ' + err.message);
    return fail(err.message);
  }
}

function getOrCreateSubFolder(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/**
 * Buat sheet lengkap dengan header dan baris contoh bila belum ada.
 * Penulisan dilakukan sekali (batch), bukan appendRow berulang.
 */
function createSheetIfNotExists(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;

  const dataRows = Array.prototype.slice.call(arguments, 3);
  sheet = ss.insertSheet(sheetName);

  const allRows = [headers].concat(dataRows);
  sheet.getRange(1, 1, allRows.length, headers.length).setValues(
    allRows.map(function (r) {
      const row = r.slice(0, headers.length);
      while (row.length < headers.length) row.push('');
      return row;
    })
  );

  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#111111')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  return sheet;
}

// ══════════════════════════════════════════════════════════
// BAGIAN 15: UTILITAS PEMELIHARAAN
// ══════════════════════════════════════════════════════════

/** Panaskan cache setelah deployment baru agar pengunjung pertama tetap cepat. */
function warmupCache() {
  [SHEETS.PRODUK, SHEETS.HERO, SHEETS.KEUNGGULAN, SHEETS.TESTIMONI, SHEETS.CONFIG]
    .forEach(function (s) {
      try { getCachedSheet(s, CACHE_TTL.MASTER); }
      catch (e) { Logger.log('Warmup ' + s + ': ' + e.message); }
    });
  Logger.log('🔥 Cache siap.');
}

/** Kosongkan seluruh cache bila data di landing page terasa tertinggal. */
function resetCache() {
  invalidateAllCache();
  Logger.log('🗑️ Cache dikosongkan.');
  return ok(null, 'Cache dikosongkan.');
}

/** Paksa seluruh sesi admin yang sedang berjalan untuk login ulang. */
function resetSemuaSesi() {
  // Token tersimpan di CacheService dengan kunci acak; cara paling
  // sederhana memutus semua sesi adalah mengganti PIN.
  Logger.log('ℹ️  Untuk memutus semua sesi, ganti PIN lewat Dashboard → Pengaturan.');
  Logger.log('   Sesi lama tetap berlaku sampai 6 jam, kecuali Anda menunggu masa berlakunya habis.');
}

/**
 * Uji cepat seluruh endpoint tanpa membuka browser.
 * Jalankan dari editor Apps Script, lalu periksa Execution log.
 */
function ujiAPI() {
  Logger.log('── ping ──');
  Logger.log(doGet({ parameter: { action: 'ping' } }).getContent());

  Logger.log('── init ──');
  const init = JSON.parse(doGet({ parameter: { action: 'init' } }).getContent());
  Logger.log('success: ' + init.success);
  if (init.success) {
    Logger.log('produk     : ' + init.data.produk.length);
    Logger.log('keunggulan : ' + init.data.keunggulan.length);
    Logger.log('testimoni  : ' + init.data.testimoni.length);
    Logger.log('config     : ' + Object.keys(init.data.config).length + ' kunci');
    Logger.log('adminPin bocor? ' + (init.data.config.adminPin !== undefined ? '❌ YA' : '✅ tidak'));
  } else {
    Logger.log('pesan: ' + init.message);
  }

  Logger.log('── login (PIN benar) ──');
  const pin = String(getConfigValue('adminPin') || ADMIN_PIN_DEFAULT);
  const res = JSON.parse(doPost({
    postData: { contents: JSON.stringify({ action: 'login', data: { pin: pin } }) }
  }).getContent());
  Logger.log('success: ' + res.success + ' | ' + res.message);

  if (res.success) {
    Logger.log('── getAdminData (token sah) ──');
    const admin = JSON.parse(doPost({
      postData: { contents: JSON.stringify({ action: 'getAdminData', token: res.data.token }) }
    }).getContent());
    Logger.log('success: ' + admin.success + ' | produk: ' +
      (admin.success ? admin.data.produk.length : admin.message));

    Logger.log('── getAdminData (token palsu) ──');
    const tolak = JSON.parse(doPost({
      postData: { contents: JSON.stringify({ action: 'getAdminData', token: 'token-palsu' }) }
    }).getContent());
    Logger.log('ditolak? ' + (tolak.success ? '❌ TIDAK' : '✅ ya — ' + tolak.message));
  }

  Logger.log('');
  Logger.log('✅ Uji selesai.');
}
