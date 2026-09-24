/**
 * ============================================================
 * ProductHub Creator — Lapisan API
 * Semua komunikasi dengan Google Apps Script lewat berkas ini.
 * ============================================================
 *
 * ATURAN PENTING (gas-pro-api):
 *
 * 1. POST WAJIB memakai Content-Type: text/plain;charset=utf-8.
 *    Bila memakai application/json, browser akan mengirim permintaan
 *    preflight OPTIONS terlebih dahulu — dan Google Apps Script tidak
 *    melayani OPTIONS, sehingga permintaan gagal dengan galat CORS.
 *    Isinya tetap JSON; server yang mem-parse-nya secara manual.
 *
 * 2. TIDAK ADA google.script.run di mana pun. Fungsi itu hanya tersedia
 *    di dalam halaman yang di-render HtmlService — bukan dari domain luar.
 *
 * 3. Token sesi disimpan di sessionStorage, bukan localStorage:
 *    sesi berakhir begitu tab ditutup.
 * ============================================================
 */

const Api = {

  // ══════════════════════════════════════════════════════════
  // TOKEN SESI
  // ══════════════════════════════════════════════════════════

  getToken: function () {
    try { return sessionStorage.getItem(APP_CONFIG.KEY_TOKEN) || ''; }
    catch (e) { return Api._tokenMemori || ''; }
  },

  setToken: function (token) {
    Api._tokenMemori = token || '';
    try {
      if (token) sessionStorage.setItem(APP_CONFIG.KEY_TOKEN, token);
      else sessionStorage.removeItem(APP_CONFIG.KEY_TOKEN);
    } catch (e) { /* mode privat — token cukup hidup di memori */ }
  },

  clearToken: function () { Api.setToken(''); },

  _tokenMemori: '',

  // ══════════════════════════════════════════════════════════
  // PERMINTAAN DASAR
  // ══════════════════════════════════════════════════════════

  /**
   * Bungkus fetch dengan batas waktu, supaya antarmuka tidak
   * menggantung selamanya bila jaringan bermasalah.
   */
  _fetchTimeout: function (url, opsi, batasMs) {
    const kontrol = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const pilihan = Object.assign({}, opsi || {});
    if (kontrol) pilihan.signal = kontrol.signal;

    const jam = setTimeout(function () {
      if (kontrol) kontrol.abort();
    }, batasMs || APP_CONFIG.TIMEOUT);

    return fetch(url, pilihan).then(
      function (res) { clearTimeout(jam); return res; },
      function (err) {
        clearTimeout(jam);
        if (err && err.name === 'AbortError') {
          throw new Error('Server terlalu lama merespons. Periksa koneksi Anda.');
        }
        throw err;
      }
    );
  },

  /**
   * GET — untuk data publik landing page.
   * @param {string} action nama action di doGet
   * @param {Object} params parameter tambahan
   */
  get: async function (action, params) {
    if (!konfigurasiSiap()) {
      return {
        success: false,
        data: null,
        message: 'GAS_URL belum diisi. Buka assets/js/config.js dan tempel URL /exec deployment Anda.'
      };
    }

    const q = new URLSearchParams(Object.assign({ action: action }, params || {}));

    try {
      const res = await Api._fetchTimeout(APP_CONFIG.GAS_URL + '?' + q.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      if (!res.ok) throw new Error('Server membalas kode ' + res.status + '.');

      const teks = await res.text();
      return Api._parse(teks);

    } catch (err) {
      return { success: false, data: null, message: Api._pesanRamah(err) };
    }
  },

  /**
   * POST — untuk seluruh operasi tulis. Token disertakan otomatis.
   * @param {string} action nama action di doPost
   * @param {Object} data payload
   */
  post: async function (action, data, batasMs) {
    if (!konfigurasiSiap()) {
      return {
        success: false,
        data: null,
        message: 'GAS_URL belum diisi. Buka assets/js/config.js dan tempel URL /exec deployment Anda.'
      };
    }

    try {
      const res = await Api._fetchTimeout(APP_CONFIG.GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        // ⚠️ WAJIB text/plain — lihat catatan di kepala berkas ini
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: action,
          token: Api.getToken(),
          data: data || {}
        })
      }, batasMs);

      if (!res.ok) throw new Error('Server membalas kode ' + res.status + '.');

      const teks = await res.text();
      const hasil = Api._parse(teks);

      // Sesi kedaluwarsa — bersihkan token dan beri tahu halaman
      if (!hasil.success && hasil.data && hasil.data.sessionExpired) {
        Api.clearToken();
        if (typeof Api.onSessionExpired === 'function') Api.onSessionExpired(hasil.message);
      }

      return hasil;

    } catch (err) {
      return { success: false, data: null, message: Api._pesanRamah(err) };
    }
  },

  /**
   * Kirim sinyal tanpa menunggu balasan (Optimistic UI / Prinsip 2).
   * Dipakai untuk pencatatan statistik: tautan tetap terbuka seketika.
   */
  kirimDiamDiam: function (action, params) {
    if (!konfigurasiSiap()) return;
    const q = new URLSearchParams(Object.assign({ action: action }, params || {}));
    const url = APP_CONFIG.GAS_URL + '?' + q.toString();

    try {
      // keepalive membuat permintaan tetap terkirim walau halaman berpindah
      fetch(url, { method: 'GET', mode: 'no-cors', keepalive: true }).catch(function () {});
    } catch (e) {
      // Cadangan paling sederhana bila fetch diblokir
      try { new Image().src = url; } catch (e2) {}
    }
  },

  // ══════════════════════════════════════════════════════════
  // ENDPOINT KHUSUS
  // ══════════════════════════════════════════════════════════

  /** Seluruh isi landing page dalam satu panggilan. */
  init: function () {
    return Api.get('init');
  },

  /** Cek koneksi & versi API — berguna saat menelusuri masalah. */
  ping: function () {
    return Api.get('ping');
  },

  /** Catat kunjungan / klik. Tidak pernah memblokir antarmuka. */
  track: function (tipe, produkId) {
    Api.kirimDiamDiam('track', { tipe: tipe, id: produkId || '' });
  },

  /** Client ID Google untuk tombol masuk (publik, bukan rahasia). */
  authConfig: function () { return Api.get('authConfig'); },

  /** Tukar ID token Google (JWT) dengan token sesi dashboard. */
  loginGoogle: async function (credential) {
    const res = await Api.post('loginGoogle', { credential: credential });
    if (res.success && res.data && res.data.token) Api.setToken(res.data.token);
    return res;
  },

  logout: async function () {
    const res = await Api.post('logout', {});
    Api.clearToken();
    return res;
  },

  adminData:        function ()          { return Api.post('getAdminData', {}); },
  simpanProduk:     function (record)    { return Api.post('saveProduk', record); },
  hapusProduk:      function (id)        { return Api.post('deleteProduk', { id: id }); },
  batchStatus:      function (ids, s)    { return Api.post('batchStatusProduk', { ids: ids, status: s }); },
  simpanHero:       function (record)    { return Api.post('saveHero', record); },
  simpanKeunggulan: function (record)    { return Api.post('saveKeunggulan', record); },
  hapusKeunggulan:  function (id)        { return Api.post('deleteKeunggulan', { id: id }); },
  simpanTestimoni:  function (record)    { return Api.post('saveTestimoni', record); },
  hapusTestimoni:   function (id)        { return Api.post('deleteTestimoni', { id: id }); },
  simpanKonfigurasi:function (obj)       { return Api.post('saveConfig', obj); },

  // ── Galeri bukti (admin) ──
  simpanGaleri:     function (record)    { return Api.post('saveGaleri', record); },
  hapusGaleri:      function (id)        { return Api.post('deleteGaleri', { id: id }); },

  // ── Antrean pengajuan member (admin) ──
  setujuiPengajuan: function (id, edit)  {
    return Api.post('approvePengajuan', Object.assign({ id: id }, edit || {}));
  },
  tolakPengajuan:   function (id, notify) { return Api.post('rejectPengajuan', { id: id, notify: notify !== false }); },
  hapusPengajuan:   function (id, notify) { return Api.post('deletePengajuan', { id: id, notify: notify !== false }); },

  // ── Notifikasi member (v4) ──
  kirimUlangNotif:  function (id)        { return Api.post('kirimUlangNotif', { id: id }); },
  ujiNotifikasi:    function (data)      { return Api.post('testNotifikasi', data); },

  // ── Migrasi: import bisa lama untuk data besar — beri 5 menit ──
  importData:       function (data)      { return Api.post('importData', data, 300000); },

  /**
   * Kiriman testimoni dari member — endpoint publik, tanpa token.
   *
   * Token tetap ikut terkirim oleh Api.post() dan itu tidak masalah:
   * server memproses action ini sebelum pemeriksaan token, jadi pengunjung
   * biasa (yang tokennya kosong) tetap dilayani.
   */
  kirimTestimoni:   function (data)      { return Api.post('submitTestimoni', data); },

  /**
   * Pesan dari form "Hubungi Admin" — juga publik, tanpa token.
   * Server mencatatnya ke sheet Pesan lalu mengirim email ke admin.
   */
  kirimPesan:       function (data)      { return Api.post('kirimPesan', data); },

  /** Unggah gambar: base64 → Drive → URL publik. */
  uploadMedia: function (base64, fileName, mimeType, kategori) {
    return Api.post('uploadMedia', {
      base64: base64,
      fileName: fileName,
      mimeType: mimeType,
      kategori: kategori
    });
  },

  /** Dipasang oleh admin.js — dipanggil saat token ditolak server. */
  onSessionExpired: null,

  // ══════════════════════════════════════════════════════════
  // INTERNAL
  // ══════════════════════════════════════════════════════════

  _parse: function (teks) {
    try {
      return JSON.parse(teks);
    } catch (e) {
      // Balasan berupa HTML biasanya berarti deployment salah konfigurasi
      if (String(teks).indexOf('<!DOCTYPE') === 0 || String(teks).indexOf('<html') !== -1) {
        return {
          success: false,
          data: null,
          message: 'Server membalas HTML, bukan JSON. Pastikan Web App di-deploy dengan ' +
                   '"Who has access: Anyone" dan URL-nya berakhiran /exec.'
        };
      }
      return { success: false, data: null, message: 'Balasan server tidak bisa dibaca.' };
    }
  },

  _pesanRamah: function (err) {
    const m = (err && err.message) ? String(err.message) : String(err);
    if (m.indexOf('Failed to fetch') !== -1 || m.indexOf('NetworkError') !== -1) {
      return 'Tidak dapat menghubungi server. Periksa koneksi internet Anda, ' +
             'dan pastikan Web App di-deploy dengan akses "Anyone".';
    }
    return m;
  }
};
