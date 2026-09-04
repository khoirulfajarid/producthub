/**
 * ============================================================
 * ProductHub Creator — Logika Dashboard Admin
 * ============================================================
 *
 * Autentikasi:
 *   PIN → Api.login() → token sesi disimpan di sessionStorage.
 *   Setiap operasi tulis membawa token, bukan PIN. Bila server
 *   menolak token (kedaluwarsa), Api memanggil onSessionExpired
 *   dan pengguna dikembalikan ke layar masuk.
 *
 * Navigasi antar section tetap 0 ms — seluruh section sudah ada
 * di DOM, berpindah hanya menyalakan/mematikan kelas .active.
 * ============================================================
 */

// ════════════════════════════════════════════════════════════
// BAGIAN 1: STATE
// ════════════════════════════════════════════════════════════

const AdminState = {
  data: null,           // seluruh data dashboard dari server
  produkFilter: '',     // kata kunci pencarian lokal
  editorSlides: [],     // daftar slide hero yang sedang diedit
  charts: {}            // instance Chart.js aktif
};

// ════════════════════════════════════════════════════════════
// BAGIAN 2: INISIALISASI
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  hydrateIcons();
  muatTemaTersimpan();
  pasangPenutupModal();
  pasangPenggantiGambar();

  // Bangun ulang grafik saat tema berganti agar warnanya menyesuaikan
  onThemeChange = refreshChartsTheme;

  // Dipanggil Api ketika server menolak token
  Api.onSessionExpired = function (pesan) {
    tampilkanLayarMasuk(pesan || 'Sesi berakhir. Silakan masuk kembali.');
  };

  window.addEventListener('resize', syncLayout);
  syncLayout();

  // Sesi masih hidup dari tab yang sama? Langsung masuk.
  if (Api.getToken()) {
    masukDashboard();
  } else {
    tampilkanLayarMasuk(
      konfigurasiSiap()
        ? 'Masukkan PIN admin untuk membuka dashboard.'
        : '⚠️ GAS_URL belum diisi. Buka assets/js/config.js dan tempel URL /exec deployment Anda.'
    );
  }
});

function syncLayout() {
  const btn = document.getElementById('sidebarToggleBtn');
  if (btn) btn.style.display = window.innerWidth <= 900 ? 'inline-flex' : 'none';

  const satuKolom = window.innerWidth <= 1024 ? '1fr' : null;
  const dashRow = document.getElementById('dashRow');
  const lapRow  = document.getElementById('laporanCharts');
  if (dashRow) dashRow.style.gridTemplateColumns = satuKolom || '2fr 1fr';
  if (lapRow)  lapRow.style.gridTemplateColumns  = satuKolom || '1fr 1fr';
}

// ════════════════════════════════════════════════════════════
// BAGIAN 3: MASUK & KELUAR
// ════════════════════════════════════════════════════════════

function tampilkanLayarMasuk(pesan) {
  document.getElementById('adminApp').classList.remove('active');
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('authInfo').textContent = pesan || '';

  AdminState.data = null;
  const input = document.getElementById('pinInput');
  if (input) { input.value = ''; setTimeout(function () { input.focus(); }, 80); }
}

async function submitPinLogin(e) {
  e.preventDefault();

  const pin = document.getElementById('pinInput').value;
  const btn = e.target.querySelector('button[type="submit"]');
  const pulih = setBtnLoading(btn, 'Memeriksa…');

  const res = await Api.login(pin);
  pulih();

  if (!res.success) {
    showToast('Gagal masuk', res.message, 'danger');
    document.getElementById('pinInput').select();
    return;
  }

  document.getElementById('pinInput').value = '';
  masukDashboard();
}

function masukDashboard() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('adminApp').classList.add('active');
  window.scrollTo(0, 0);
  document.getElementById('adminIdentity').textContent = 'Sesi admin aktif';
  muatDataAdmin();
}

function logoutAdmin() {
  konfirmasi('Keluar dari panel admin?', async function () {
    await Api.logout();
    tampilkanLayarMasuk('Anda telah keluar. Masukkan PIN untuk masuk kembali.');
    showToast('Keluar', 'Sesi admin telah diakhiri.', 'success');
  }, { label: 'Keluar', jenis: 'danger' });
}

// ════════════════════════════════════════════════════════════
// BAGIAN 4: NAVIGASI DASHBOARD (0 ms)
// ════════════════════════════════════════════════════════════

const JUDUL_SECTION = {
  dashboard:  'Dashboard',
  produk:     'Kelola Produk',
  hero:       'Konten Hero',
  keunggulan: 'Keunggulan',
  testimoni:  'Testimoni',
  galeri:     'Bukti Nyata',
  pengajuan:  'Pengajuan Member',
  laporan:    'Laporan & Analytics',
  pengaturan: 'Pengaturan'
};

function navigateTo(sectionId) {
  document.querySelectorAll('#adminApp .content-section').forEach(function (s) {
    s.classList.remove('active');
  });
  const target = document.getElementById('section-' + sectionId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sidebar-nav a').forEach(function (a) {
    a.classList.toggle('active', a.dataset.section === sectionId);
  });

  document.getElementById('adminPageTitle').textContent = JUDUL_SECTION[sectionId] || 'Dashboard';
  closeSidebar();

  // Chart hanya dibuat saat sectionnya benar-benar terlihat
  if (sectionId === 'dashboard') renderChart7Hari();
  if (sectionId === 'laporan')   renderChartLaporan();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarBackdrop').classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('open');
}

// ════════════════════════════════════════════════════════════
// BAGIAN 5: MUAT DATA DASHBOARD
// ════════════════════════════════════════════════════════════

async function muatDataAdmin() {
  document.getElementById('kpiGrid').innerHTML =
    '<div class="skeleton" style="height:104px"></div>'.repeat(4);

  const res = await Api.adminData();

  if (!res.success) {
    // Sesi kedaluwarsa sudah ditangani Api.onSessionExpired
    if (!(res.data && res.data.sessionExpired)) {
      showToast('Gagal memuat', res.message, 'danger');
    }
    return;
  }

  AdminState.data = res.data;

  const brand = (res.data.config && res.data.config.appName) || APP_CONFIG.BRAND_DEFAULT;
  document.getElementById('sidebarBrand').textContent = brand;

  renderDashboard();
  renderProdukTable();
  renderKeunggulanList();
  renderTestimoniTable();
  renderGaleriAdmin();
  renderPengajuan();
  isiFormHero();
  isiFormKonfigurasi();
  renderLaporan();
  ingatkanMigrasi();
}

/**
 * Dua modul baru bergantung pada sheet yang hanya ada setelah migrasi.
 * Daripada membiarkan admin bingung melihat menu kosong, katakan
 * langsung apa yang perlu dijalankan.
 */
function ingatkanMigrasi() {
  if (AdminState.data.siapV3 !== false) return;
  showToast('Database perlu diperbarui',
    'Jalankan fungsi upgradeKeV3() sekali di editor Apps Script agar modul ' +
    'Bukti Nyata dan Pengajuan bisa dipakai.', 'warning');
}

function renderDashboard() {
  const d = AdminState.data;
  const s = d.statistik;

  const kpi = [
    { label: 'Total Pengunjung', nilai: s.totalPengunjung.toLocaleString('id-ID'), ic: 'users' },
    { label: 'Total Klik Beli',  nilai: s.totalKlikCTA.toLocaleString('id-ID'),   ic: 'cursor' },
    { label: 'Produk Aktif',     nilai: s.produkAktif + ' / ' + s.produkTotal,    ic: 'box' },
    { label: 'Tingkat Konversi', nilai: s.tingkatKonversi + '%',                  ic: 'cart' }
  ];

  document.getElementById('kpiGrid').innerHTML = kpi.map(function (k) {
    return '<div class="stat-card">' +
             '<div class="row-between">' +
               '<div class="label-md">' + esc(k.label) + '</div>' +
               '<span class="text-muted-2">' + icon(k.ic, 18) + '</span>' +
             '</div>' +
             '<div class="value">' + esc(k.nilai) + '</div>' +
           '</div>';
  }).join('');

  document.getElementById('insightList').innerHTML =
    s.insights.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('');

  // Tabel produk terbaru (5 teratas)
  const terbaru = d.produk.slice().sort(function (a, b) {
    return String(b.TanggalUpload).localeCompare(String(a.TanggalUpload));
  }).slice(0, 5);

  document.getElementById('dashProdukTable').innerHTML = terbaru.length
    ? '<table class="tbl"><thead><tr>' +
        '<th>Nama Produk</th><th>Status</th><th>Tanggal</th><th style="text-align:right">Aksi</th>' +
      '</tr></thead><tbody>' +
      terbaru.map(function (p) {
        return '<tr>' +
          '<td style="font-weight:600">' + esc(p.NamaProduk) + '</td>' +
          '<td>' + badgeStatus(p.Status) + '</td>' +
          '<td class="text-secondary">' + esc(formatTanggal(p.TanggalUpload)) + '</td>' +
          '<td style="text-align:right"><button class="btn-icon" onclick="openProdukModal(\'' +
            esc(p.ID) + '\')" aria-label="Edit">' + icon('edit', 16) + '</button></td>' +
        '</tr>';
      }).join('') + '</tbody></table>'
    : '<div class="empty-state"><div class="h-md">Belum ada produk</div></div>';

  renderChart7Hari();
}

function badgeStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'published') return '<span class="badge-chip badge-success">Published</span>';
  if (s === 'draft')     return '<span class="badge-chip badge-warning">Draft</span>';

  // Status antrean pengajuan — "Baru" sengaja memakai warna aksen supaya
  // yang menunggu tindakan langsung menarik mata admin.
  if (s === 'baru')      return '<span class="badge-chip badge-accent">Perlu Diperiksa</span>';
  if (s === 'disetujui') return '<span class="badge-chip badge-success">Disetujui</span>';
  if (s === 'ditolak')   return '<span class="badge-chip badge-neutral">Ditolak</span>';

  return '<span class="badge-chip badge-neutral">' + esc(status || '-') + '</span>';
}

// ════════════════════════════════════════════════════════════
// BAGIAN 6: TABEL PRODUK + PENCARIAN LOKAL
// ════════════════════════════════════════════════════════════

let searchTimer = null;

/** Debounce 250 ms, lalu filter dari memori — tanpa panggilan server. */
function handleProdukSearch(nilai) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function () {
    AdminState.produkFilter = String(nilai || '').toLowerCase().trim();
    renderProdukTable();
  }, 250);
}

function renderProdukTable() {
  if (!AdminState.data) return;

  const status = document.getElementById('produkFilterStatus').value;
  const q = AdminState.produkFilter;

  const list = AdminState.data.produk.filter(function (p) {
    const cocokStatus = !status || String(p.Status) === status;
    const cocokQuery = !q ||
      String(p.NamaProduk).toLowerCase().indexOf(q) !== -1 ||
      String(p.Deskripsi).toLowerCase().indexOf(q) !== -1;
    return cocokStatus && cocokQuery;
  });

  const wrap = document.getElementById('produkTableWrap');
  if (!list.length) {
    wrap.innerHTML = '<div class="empty-state">' +
      '<div class="h-md">Tidak ada produk yang cocok</div>' +
      '<p class="body-sm">Ubah kata kunci atau filter status.</p></div>';
    return;
  }

  wrap.innerHTML = '<table class="tbl"><thead><tr>' +
      '<th>Produk</th><th>Harga</th><th>Demo</th><th>Status</th>' +
      '<th style="text-align:right">Aksi</th>' +
    '</tr></thead><tbody>' +
    list.map(function (p) {
      const thumb = safeUrl(p.Thumbnail);
      const demo = safeUrl(p.LinkDemo);
      const id = esc(p.ID);
      return '<tr>' +
        '<td><div class="row-gap" style="flex-wrap:nowrap">' +
          (thumb
            ? '<img class="tbl-thumb" src="' + esc(thumb) + '" alt="" loading="lazy">'
            : '<div class="tbl-thumb">' + icon('image', 14) + '</div>') +
          '<div><div style="font-weight:600">' + esc(p.NamaProduk) + '</div>' +
          '<div class="body-sm text-secondary">' + esc(formatTanggal(p.TanggalUpload)) + '</div></div>' +
        '</div></td>' +
        '<td>' + formatRupiah(p.Harga) + '</td>' +
        '<td>' + (demo
          ? '<a href="' + esc(demo) + '" target="_blank" rel="noopener">Buka ' + icon('external', 14) + '</a>'
          : '<span class="text-muted-2">—</span>') + '</td>' +
        '<td>' + badgeStatus(p.Status) + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' +
          '<button class="btn-icon" onclick="openProdukModal(\'' + id + '\')" aria-label="Edit">' +
            icon('edit', 16) + '</button>' +
          '<button class="btn-icon" onclick="hapusProdukKonfirmasi(\'' + id + '\')" aria-label="Hapus">' +
            icon('trash', 16) + '</button>' +
        '</td>' +
      '</tr>';
    }).join('') + '</tbody></table>';
}

// ════════════════════════════════════════════════════════════
// BAGIAN 7: CRUD PRODUK
// ════════════════════════════════════════════════════════════

function openProdukModal(id) {
  const form = document.getElementById('produkForm');
  form.reset();
  document.getElementById('prodThumb').value = '';
  document.getElementById('prodGaleri').value = '';
  document.getElementById('prodYoutubeUrl').value = '';
  document.getElementById('prodPreview').classList.add('hidden');

  if (id && AdminState.data) {
    const p = AdminState.data.produk.filter(function (x) { return x.ID === id; })[0];
    if (p) {
      document.getElementById('produkModalTitle').textContent = 'Edit Produk';
      document.getElementById('prodId').value       = p.ID;
      document.getElementById('prodNama').value     = p.NamaProduk || '';
      document.getElementById('prodHarga').value    = p.Harga || '';
      document.getElementById('prodStatus').value   = p.Status || 'Published';
      document.getElementById('prodDesk').value     = p.Deskripsi || '';
      document.getElementById('prodDemo').value     = p.LinkDemo || '';
      document.getElementById('prodCheckout').value = p.LinkCheckout || '';
      document.getElementById('prodBadge').value    = p.Badge || '';
      document.getElementById('prodUrutan').value   = p.Urutan || '';
      document.getElementById('prodLink').value     = p.LinkProduk || '';
      document.getElementById('prodThumb').value    = p.Thumbnail || '';
      document.getElementById('prodGaleri').value   = p.Galeri || '';
      if (safeUrl(p.Thumbnail)) {
        const img = document.getElementById('prodPreview');
        img.src = p.Thumbnail;
        img.classList.remove('hidden');
      }
    }
  } else {
    document.getElementById('produkModalTitle').textContent = 'Tambah Produk Baru';
    document.getElementById('prodId').value = '';
  }

  openModal('modalProduk');
}

async function submitProduk(e) {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const record = {};
  new FormData(form).forEach(function (v, k) { record[k] = v; });
  if (!record.ID) delete record.ID;

  const btn = document.getElementById('produkSubmitBtn');
  const pulih = setBtnLoading(btn);

  const res = await Api.simpanProduk(record);
  pulih();

  if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }

  closeModal('modalProduk');
  showToast('Berhasil', res.message, 'success');
  muatDataAdmin();
}

function hapusProdukKonfirmasi(id) {
  const p = AdminState.data.produk.filter(function (x) { return x.ID === id; })[0];
  konfirmasi('Hapus produk "' + (p ? p.NamaProduk : '') + '"? Tindakan ini tidak bisa dibatalkan.',
    async function () {
      const res = await Api.hapusProduk(id);
      if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }
      showToast('Berhasil', res.message, 'success');
      muatDataAdmin();
    });
}

// ════════════════════════════════════════════════════════════
// BAGIAN 8: KONTEN HERO
// ════════════════════════════════════════════════════════════

function isiFormHero() {
  const h = AdminState.data.hero || {};
  const map = {
    heroInHeadline: 'Headline', heroInSub: 'Subheadline', heroInCta: 'TeksCTA',
    heroInCtaSec: 'TeksCTASekunder',
    heroInClosingTitle: 'JudulPenutup', heroInClosingDesc: 'DeskripsiPenutup',
    heroInClosingCta: 'TeksCTAPenutup', heroInClosingLink: 'LinkCTAPenutup'
  };
  Object.keys(map).forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = h[map[id]] || '';
  });

  document.getElementById('heroInDelay').value = AdminState.data.config.heroSlideDelay || 5;

  AdminState.editorSlides = bacaSlides(h);
  renderEditorSlides();
}

/** Pecah kolom HeroSlides (satu URL per baris) menjadi array bersih. */
function bacaSlides(hero) {
  const mentah = String(hero.HeroSlides || hero.HeroVisual || '');
  return mentah.split(/[\n,]+/)
    .map(function (s) { return safeUrl(s.trim()); })
    .filter(function (s) { return s; })
    .slice(0, APP_CONFIG.MAX_HERO_SLIDES);
}

/** Gambar daftar slide, lengkap dengan tombol urutkan & hapus. */
function renderEditorSlides() {
  const list = AdminState.editorSlides;
  const wrap = document.getElementById('heroSlideList');
  const hint = document.getElementById('heroSlideHint');

  document.getElementById('heroInSlides').value = list.join('\n');

  wrap.innerHTML = list.map(function (url, i) {
    return '<div class="slide-item">' +
      '<img src="' + esc(url) + '" alt="Slide ' + (i + 1) + '">' +
      '<span class="slide-order">' + (i + 1) + '</span>' +
      '<div class="slide-tools">' +
        '<button type="button" onclick="geserSlide(' + i + ',-1)" aria-label="Geser ke kiri"' +
          (i === 0 ? ' disabled' : '') + '>' + icon('arrowLeft', 14) + '</button>' +
        '<button type="button" onclick="geserSlide(' + i + ',1)" aria-label="Geser ke kanan"' +
          (i === list.length - 1 ? ' disabled' : '') + '>' + icon('arrowRight', 14) + '</button>' +
        '<button type="button" onclick="hapusSlide(' + i + ')" aria-label="Hapus slide">' +
          icon('trash', 14) + '</button>' +
      '</div>' +
    '</div>';
  }).join('');

  hint.textContent = list.length === 0
    ? 'Belum ada slide. Unggah 2–5 gambar agar hero terasa hidup.'
    : list.length === 1
      ? 'Baru 1 gambar — hero akan tampil diam. Tambah minimal satu lagi untuk slideshow.'
      : list.length + ' slide aktif. Urutan tampil mengikuti nomor di atas.';
}

function geserSlide(i, arah) {
  const list = AdminState.editorSlides;
  const j = i + arah;
  if (j < 0 || j >= list.length) return;
  const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
  renderEditorSlides();
}

function hapusSlide(i) {
  AdminState.editorSlides.splice(i, 1);
  renderEditorSlides();
}

/** Unggah beberapa gambar sekaligus; setiap yang berhasil ditambahkan ke daftar. */
function uploadHeroSlides(input) {
  const files = Array.prototype.slice.call(input.files || []);
  input.value = '';
  if (!files.length) return;

  const sisaKuota = APP_CONFIG.MAX_HERO_SLIDES - AdminState.editorSlides.length;
  if (sisaKuota <= 0) {
    showToast('Sudah penuh',
      'Maksimal ' + APP_CONFIG.MAX_HERO_SLIDES + ' slide. Hapus salah satu dulu.', 'warning');
    return;
  }

  const antre = files.slice(0, sisaKuota);
  if (files.length > sisaKuota) {
    showToast('Sebagian dilewati', 'Hanya ' + sisaKuota + ' gambar pertama yang diproses.', 'warning');
  }

  showToast('Mengunggah…', antre.length + ' gambar sedang diproses.', 'info');

  antre.forEach(function (file) {
    if (file.size > APP_CONFIG.MAX_UPLOAD_BYTES) {
      showToast('Dilewati', file.name + ' lebih dari 5 MB.', 'warning');
      return;
    }
    if (file.type.indexOf('image/') !== 0) {
      showToast('Dilewati', file.name + ' bukan berkas gambar.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function () {
      const base64 = String(reader.result).split(',')[1];
      const res = await Api.uploadMedia(base64, file.name, file.type, 'hero');

      if (!res.success) { showToast('Gagal unggah', res.message, 'danger'); return; }

      AdminState.editorSlides.push(res.data.url);
      renderEditorSlides();
      showToast('Berhasil', file.name + ' ditambahkan.', 'success');
    };
    reader.onerror = function () { showToast('Error', file.name + ' gagal dibaca.', 'danger'); };
    reader.readAsDataURL(file);
  });
}

async function submitHero(e) {
  e.preventDefault();

  const record = {};
  new FormData(e.target).forEach(function (v, k) { record[k] = v; });
  record.HeroSlides = AdminState.editorSlides.join('\n');
  // Slide pertama disimpan juga ke kolom lama agar tetap kompatibel
  record.HeroVisual = AdminState.editorSlides[0] || '';

  const delay = Math.max(2, Math.min(20, Number(document.getElementById('heroInDelay').value) || 5));

  const btn = e.target.querySelector('button[type="submit"]');
  const pulih = setBtnLoading(btn);

  const res = await Api.simpanHero(record);
  if (!res.success) {
    pulih();
    showToast('Gagal', res.message, 'danger');
    return;
  }

  // Jeda slide tersimpan di AppConfig, bukan di sheet KontenHero
  const res2 = await Api.simpanKonfigurasi({ heroSlideDelay: String(delay) });
  pulih();

  if (!res2.success) {
    showToast('Sebagian tersimpan', 'Konten tersimpan, jeda slide gagal disimpan.', 'warning');
  } else {
    showToast('Berhasil', 'Konten hero tersimpan.', 'success');
  }

  muatDataAdmin();
}

// ════════════════════════════════════════════════════════════
// BAGIAN 9: KEUNGGULAN
// ════════════════════════════════════════════════════════════

function renderKeunggulanList() {
  const list = AdminState.data.keunggulan || [];
  const wrap = document.getElementById('keunggulanList');

  if (!list.length) {
    wrap.innerHTML = '<div class="empty-state">' +
      '<div class="h-md">Belum ada poin keunggulan</div>' +
      '<p class="body-sm">Klik "Tambah Poin" untuk membuat yang pertama.</p></div>';
    return;
  }

  wrap.innerHTML = list.map(function (k) {
    const id = esc(k.ID);
    return '<div class="keunggulan-row">' +
      '<div class="row-gap" style="flex-wrap:nowrap">' +
        '<div class="feature-icon" style="margin:0;width:38px;height:38px">' +
          icon(k.Ikon || 'check', 18) + '</div>' +
        '<div>' + badgeStatus(k.Status) +
          '<div class="body-sm text-secondary" style="margin-top:6px">Urutan ' +
          esc(k.Urutan || '-') + '</div></div>' +
      '</div>' +
      '<div>' +
        '<div style="font-weight:600;margin-bottom:4px">' + esc(k.Judul) + '</div>' +
        '<div class="body-sm text-secondary">' + esc(k.Deskripsi) + '</div>' +
      '</div>' +
      '<div style="white-space:nowrap">' +
        '<button class="btn-icon" onclick="openKeunggulanModal(\'' + id + '\')" aria-label="Edit">' +
          icon('edit', 16) + '</button>' +
        '<button class="btn-icon" onclick="hapusKeunggulanKonfirmasi(\'' + id + '\')" aria-label="Hapus">' +
          icon('trash', 16) + '</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function openKeunggulanModal(id) {
  const form = document.getElementById('keunggulanForm');
  form.reset();

  // Isi pilihan ikon sekali saja
  const sel = document.getElementById('keunIkon');
  if (!sel.options.length) {
    sel.innerHTML = IKON_PILIHAN.map(function (p) {
      return '<option value="' + p[0] + '">' + esc(p[1]) + '</option>';
    }).join('');
  }

  if (id && AdminState.data) {
    const k = AdminState.data.keunggulan.filter(function (x) { return x.ID === id; })[0];
    if (k) {
      document.getElementById('keunggulanModalTitle').textContent = 'Edit Poin Keunggulan';
      document.getElementById('keunId').value     = k.ID;
      document.getElementById('keunIkon').value   = k.Ikon || 'check';
      document.getElementById('keunUrutan').value = k.Urutan || '';
      document.getElementById('keunJudul').value  = k.Judul || '';
      document.getElementById('keunDesk').value   = k.Deskripsi || '';
      document.getElementById('keunStatus').value = k.Status || 'Published';
    }
  } else {
    document.getElementById('keunggulanModalTitle').textContent = 'Tambah Poin Keunggulan';
    document.getElementById('keunId').value = '';
    document.getElementById('keunUrutan').value = (AdminState.data.keunggulan || []).length + 1;
  }

  previewIkon();
  openModal('modalKeunggulan');
}

function previewIkon() {
  const nama = document.getElementById('keunIkon').value;
  document.getElementById('keunIkonPreview').innerHTML = icon(nama, 20);
}

async function submitKeunggulan(e) {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const record = {};
  new FormData(form).forEach(function (v, k) { record[k] = v; });
  if (!record.ID) delete record.ID;

  const btn = document.getElementById('keunSubmitBtn');
  const pulih = setBtnLoading(btn);

  const res = await Api.simpanKeunggulan(record);
  pulih();

  if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }

  closeModal('modalKeunggulan');
  showToast('Berhasil', res.message, 'success');
  muatDataAdmin();
}

function hapusKeunggulanKonfirmasi(id) {
  konfirmasi('Hapus poin keunggulan ini?', async function () {
    const res = await Api.hapusKeunggulan(id);
    showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
    if (res.success) muatDataAdmin();
  });
}

// ════════════════════════════════════════════════════════════
// BAGIAN 10: TESTIMONI
// ════════════════════════════════════════════════════════════

function renderTestimoniTable() {
  const list = AdminState.data.testimoni || [];
  const wrap = document.getElementById('testimoniTableWrap');

  if (!list.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="h-md">Belum ada testimoni</div>' +
      '<p class="body-sm">Tambahkan testimoni untuk memperkuat kepercayaan pengunjung.</p></div>';
    return;
  }

  wrap.innerHTML = '<table class="tbl"><thead><tr>' +
      '<th>Nama</th><th>Isi</th><th>Status</th><th style="text-align:right">Aksi</th>' +
    '</tr></thead><tbody>' +
    list.map(function (t) {
      const id = esc(t.ID);
      const potongan = String(t.Isi || '');
      return '<tr>' +
        '<td><div style="font-weight:600">' + esc(t.Nama) + '</div>' +
        '<div class="body-sm text-secondary">' + esc(t.Jabatan) + '</div></td>' +
        '<td class="text-secondary" style="max-width:360px">' +
          esc(potongan.length > 110 ? potongan.slice(0, 110) + '…' : potongan) + '</td>' +
        '<td>' + badgeStatus(t.Status) + '</td>' +
        '<td style="text-align:right;white-space:nowrap">' +
          '<button class="btn-icon" onclick="openTestimoniModal(\'' + id + '\')" aria-label="Edit">' +
            icon('edit', 16) + '</button>' +
          '<button class="btn-icon" onclick="hapusTestimoniKonfirmasi(\'' + id + '\')" aria-label="Hapus">' +
            icon('trash', 16) + '</button>' +
        '</td>' +
      '</tr>';
    }).join('') + '</tbody></table>';
}

function openTestimoniModal(id) {
  const form = document.getElementById('testimoniForm');
  form.reset();
  document.getElementById('testiFoto').value = '';
  document.getElementById('testiPreview').classList.add('hidden');

  if (id && AdminState.data) {
    const t = AdminState.data.testimoni.filter(function (x) { return x.ID === id; })[0];
    if (t) {
      document.getElementById('testiModalTitle').textContent = 'Edit Testimoni';
      document.getElementById('testiId').value      = t.ID;
      document.getElementById('testiNama').value    = t.Nama || '';
      document.getElementById('testiJabatan').value = t.Jabatan || '';
      document.getElementById('testiIsi').value     = t.Isi || '';
      document.getElementById('testiStatus').value  = t.Status || 'Published';
      document.getElementById('testiFoto').value    = t.Foto || '';
      if (safeUrl(t.Foto)) {
        const img = document.getElementById('testiPreview');
        img.src = t.Foto;
        img.classList.remove('hidden');
      }
    }
  } else {
    document.getElementById('testiModalTitle').textContent = 'Tambah Testimoni';
    document.getElementById('testiId').value = '';
  }

  openModal('modalTestimoni');
}

async function submitTestimoni(e) {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const record = {};
  new FormData(form).forEach(function (v, k) { record[k] = v; });
  if (!record.ID) delete record.ID;

  const btn = document.getElementById('testiSubmitBtn');
  const pulih = setBtnLoading(btn);

  const res = await Api.simpanTestimoni(record);
  pulih();

  if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }

  closeModal('modalTestimoni');
  showToast('Berhasil', res.message, 'success');
  muatDataAdmin();
}

function hapusTestimoniKonfirmasi(id) {
  konfirmasi('Hapus testimoni ini?', async function () {
    const res = await Api.hapusTestimoni(id);
    showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
    if (res.success) muatDataAdmin();
  });
}

// ════════════════════════════════════════════════════════════
// BAGIAN 11: LAPORAN & GRAFIK
// ════════════════════════════════════════════════════════════

function renderLaporan() {
  const s = AdminState.data.statistik;

  const kpi = [
    { label: 'Total Pengunjung', nilai: s.totalPengunjung.toLocaleString('id-ID'), ic: 'users' },
    { label: 'Total Klik',       nilai: (s.totalKlikCTA + s.totalKlikDemo).toLocaleString('id-ID'), ic: 'cursor' },
    { label: 'Tingkat Konversi', nilai: s.tingkatKonversi + '%', ic: 'cart' }
  ];

  document.getElementById('laporanKpi').innerHTML = kpi.map(function (k) {
    return '<div class="stat-card">' +
             '<div class="row-between"><div class="label-md">' + esc(k.label) + '</div>' +
             '<span class="text-muted-2">' + icon(k.ic, 18) + '</span></div>' +
             '<div class="value">' + esc(k.nilai) + '</div></div>';
  }).join('');

  const r = s.ranking || [];
  document.getElementById('rankingTableWrap').innerHTML = r.length
    ? '<table class="tbl"><thead><tr><th>#</th><th>Produk</th>' +
      '<th style="text-align:right">Klik Beli</th><th style="text-align:right">Klik Demo</th>' +
      '<th style="text-align:right">Total</th></tr></thead><tbody>' +
      r.map(function (x, i) {
        return '<tr><td class="text-secondary">' + (i + 1) + '</td>' +
          '<td style="font-weight:600">' + esc(x.nama) + '</td>' +
          '<td style="text-align:right">' + x.cta + '</td>' +
          '<td style="text-align:right">' + x.demo + '</td>' +
          '<td style="text-align:right;font-weight:600">' + x.total + '</td></tr>';
      }).join('') + '</tbody></table>'
    : '<div class="empty-state"><div class="h-md">Belum ada interaksi tercatat</div>' +
      '<p class="body-sm">Data akan muncul setelah pengunjung mengklik tombol beli atau demo.</p></div>';
}

function buatChart(canvasId, config) {
  const el = document.getElementById(canvasId);
  if (!el || typeof Chart === 'undefined') return;
  if (AdminState.charts[canvasId]) AdminState.charts[canvasId].destroy();
  AdminState.charts[canvasId] = new Chart(el, config);
}

function opsiDasar() {
  const grid = tokenWarna('--border');
  const teks = tokenWarna('--text-secondary');
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: teks, boxWidth: 12, font: { family: 'Inter', size: 12 } } } },
    scales: {
      x: { grid: { color: grid }, ticks: { color: teks, font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: grid }, ticks: { color: teks, font: { family: 'Inter', size: 11 } }, beginAtZero: true }
    }
  };
}

function renderChart7Hari() {
  if (!AdminState.data) return;
  const data = AdminState.data.statistik.grafik7Hari || [];
  const accent = tokenWarna('--accent');

  buatChart('chart7Hari', {
    type: 'line',
    data: {
      labels: data.map(function (d) { return formatTanggal(d.tanggal); }),
      datasets: [
        { label: 'Pengunjung', data: data.map(function (d) { return d.pengunjung; }),
          borderColor: accent, backgroundColor: 'rgba(79,70,229,.10)',
          fill: true, tension: .35, borderWidth: 2, pointRadius: 3 },
        { label: 'Klik Beli', data: data.map(function (d) { return d.klik; }),
          borderColor: tokenWarna('--text-secondary'), borderDash: [5, 4],
          fill: false, tension: .35, borderWidth: 2, pointRadius: 3 }
      ]
    },
    options: opsiDasar()
  });
}

function renderChartLaporan() {
  if (!AdminState.data) return;
  const s = AdminState.data.statistik;
  const accent = tokenWarna('--accent');

  buatChart('chartTrafik', {
    type: 'line',
    data: {
      labels: (s.grafik30Hari || []).map(function (d) { return formatTanggal(d.tanggal); }),
      datasets: [{
        label: 'Pengunjung',
        data: (s.grafik30Hari || []).map(function (d) { return d.pengunjung; }),
        borderColor: accent, backgroundColor: 'rgba(79,70,229,.10)',
        fill: true, tension: .35, borderWidth: 2, pointRadius: 0
      }]
    },
    options: opsiDasar()
  });

  const top = (s.ranking || []).slice(0, 6);
  buatChart('chartProduk', {
    type: 'bar',
    data: {
      labels: top.map(function (x) {
        return x.nama.length > 18 ? x.nama.slice(0, 18) + '…' : x.nama;
      }),
      datasets: [
        { label: 'Klik Beli', data: top.map(function (x) { return x.cta; }),
          backgroundColor: accent, borderRadius: 4 },
        { label: 'Klik Demo', data: top.map(function (x) { return x.demo; }),
          backgroundColor: tokenWarna('--border-strong'), borderRadius: 4 }
      ]
    },
    options: opsiDasar()
  });
}

/** Bangun ulang grafik saat tema berganti agar warnanya menyesuaikan. */
function refreshChartsTheme() {
  if (!AdminState.data) return;
  const dash = document.getElementById('section-dashboard');
  const lap  = document.getElementById('section-laporan');
  if (dash && dash.classList.contains('active')) renderChart7Hari();
  if (lap  && lap.classList.contains('active'))  renderChartLaporan();
}

/** Unduh rekap statistik sebagai CSV — dibuat sepenuhnya di sisi client. */
function exportCsv() {
  if (!AdminState.data) return;

  const r = AdminState.data.statistik.ranking || [];
  const baris = [['Peringkat', 'Produk', 'Klik Beli', 'Klik Demo', 'Total']];
  r.forEach(function (x, i) { baris.push([i + 1, x.nama, x.cta, x.demo, x.total]); });

  const csv = baris.map(function (row) {
    return row.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'laporan-producthub.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Berhasil', 'Laporan diunduh sebagai CSV.', 'success');
}

// ════════════════════════════════════════════════════════════
// BAGIAN 12: PENGATURAN
// ════════════════════════════════════════════════════════════

function isiFormKonfigurasi() {
  const c = AdminState.data.config || {};
  const map = {
    cfgAppName: 'appName', cfgTagline: 'tagline', cfgWa: 'waNumber',
    cfgLabel1: 'statLabel1', cfgValue1: 'statValue1',
    cfgLabel2: 'statLabel2', cfgValue2: 'statValue2',
    cfgLabel3: 'statLabel3', cfgValue3: 'statValue3',
    cfgLabel4: 'statLabel4', cfgValue4: 'statValue4',
    cfgDemoSpeed: 'demoSpeed', cfgTestiSpeed: 'testiSpeed',
    cfgGaleriSpeed: 'galeriSpeed',
    cfgStatDurasi: 'statCountDuration',
    cfgGaleriJudul: 'galeriJudul', cfgGaleriSub: 'galeriSubjudul'
  };
  Object.keys(map).forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = c[map[id]] || '';
  });

  // Saklar aktif/nonaktif: nilai kosong berarti belum pernah diatur,
  // dan bawaannya adalah aktif — sama seperti yang dipakai landing page.
  isiSaklar('cfgStatCount', c.statCountEnabled);
  isiSaklar('cfgFormMember', c.formMemberEnabled);
}

function isiSaklar(elId, nilai) {
  const el = document.getElementById(elId);
  if (!el) return;
  const mati = String(nilai) === '0' || String(nilai).toLowerCase() === 'false';
  el.value = mati ? '0' : '1';
}

async function submitConfig(e) {
  e.preventDefault();

  const obj = {};
  new FormData(e.target).forEach(function (v, k) { obj[k] = v; });

  const btn = e.target.querySelector('button[type="submit"]');
  const pulih = setBtnLoading(btn);

  const res = await Api.simpanKonfigurasi(obj);
  pulih();

  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) muatDataAdmin();
}

async function submitPinChange(e) {
  e.preventDefault();

  const pinBaru = document.getElementById('cfgPinBaru').value.trim();
  const ulang   = document.getElementById('cfgPinUlang').value.trim();

  if (!pinBaru) {
    showToast('Belum diisi', 'Masukkan PIN baru terlebih dahulu.', 'warning');
    return;
  }
  if (pinBaru.length < 6) {
    showToast('Terlalu pendek', 'PIN minimal 6 karakter.', 'warning');
    return;
  }
  if (pinBaru !== ulang) {
    showToast('Tidak cocok', 'Kedua kolom PIN harus sama persis.', 'warning');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  const pulih = setBtnLoading(btn);

  const res = await Api.simpanKonfigurasi({ adminPin: pinBaru });
  pulih();

  if (!res.success) { showToast('Gagal', res.message, 'danger'); return; }

  document.getElementById('cfgPinBaru').value = '';
  document.getElementById('cfgPinUlang').value = '';
  showToast('Berhasil', 'PIN telah diganti. Gunakan PIN baru saat masuk berikutnya.', 'success');
}

/** Diagnostik: pastikan frontend benar-benar tersambung ke backend. */
async function cekKoneksi(btn) {
  const pulih = setBtnLoading(btn, 'Menguji…');
  const hasil = document.getElementById('pingHasil');
  hasil.textContent = '';

  const mulai = Date.now();
  const res = await Api.ping();
  const durasi = Date.now() - mulai;
  pulih();

  if (!res.success) {
    hasil.innerHTML = '<span style="color:var(--danger)">✕ Gagal — ' + esc(res.message) + '</span>';
    return;
  }

  hasil.innerHTML =
    '<span style="color:var(--success)">✓ Tersambung</span> — ' +
    'API v' + esc(res.data.version) + ', balasan dalam ' + durasi + ' ms. ' +
    (res.data.siap
      ? 'Database terhubung.'
      : '<span style="color:var(--warning)">Database belum siap — jalankan setupAppEnvironment().</span>');
}

// ════════════════════════════════════════════════════════════
// BAGIAN 13: UNGGAH GAMBAR
// ════════════════════════════════════════════════════════════

function pickFile(inputId) {
  document.getElementById(inputId).click();
}

/**
 * Unggah gambar ke Drive lalu isi field tersembunyi dengan URL hasilnya.
 * Pratinjau lokal ditampilkan seketika (Optimistic UI) sementara
 * unggahan berjalan di latar belakang.
 */
function uploadImage(input, kategori, hiddenId, previewId) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > APP_CONFIG.MAX_UPLOAD_BYTES) {
    showToast('Ukuran terlalu besar', 'Maksimal 5 MB. Kompres gambar terlebih dahulu.', 'warning');
    input.value = '';
    return;
  }
  if (file.type.indexOf('image/') !== 0) {
    showToast('Format tidak didukung', 'Gunakan berkas gambar (PNG, JPG, WebP, GIF).', 'warning');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    // Pratinjau instan dari data lokal
    const img = document.getElementById(previewId);
    img.src = reader.result;
    img.classList.remove('hidden');
    showToast('Mengunggah…', file.name, 'info');

    const base64 = String(reader.result).split(',')[1];
    const res = await Api.uploadMedia(base64, file.name, file.type, kategori);

    if (!res.success) { showToast('Gagal unggah', res.message, 'danger'); return; }

    document.getElementById(hiddenId).value = res.data.url;
    img.src = res.data.url;
    showToast('Berhasil', 'Gambar tersimpan di Google Drive.', 'success');
  };
  reader.onerror = function () { showToast('Error', 'Berkas gagal dibaca.', 'danger'); };
  reader.readAsDataURL(file);
}

// ════════════════════════════════════════════════════════════
// BAGIAN 14: GALERI PRODUK (di dalam modal produk)
// ════════════════════════════════════════════════════════════

/** Tambahkan satu URL ke kotak galeri produk tanpa menimpa isi yang sudah ada. */
function tambahBarisGaleri(url) {
  const kotak = document.getElementById('prodGaleri');
  const baris = kotak.value.split('\n').map(function (s) { return s.trim(); })
    .filter(function (s) { return s; });

  if (baris.indexOf(url) !== -1) {
    showToast('Sudah ada', 'URL itu sudah ada di daftar galeri.', 'warning');
    return false;
  }

  baris.push(url);
  kotak.value = baris.join('\n');
  return true;
}

/** Unggah beberapa gambar sekaligus, lalu tempelkan URL-nya ke daftar. */
function unggahGaleriProduk(input) {
  const antre = Array.prototype.slice.call(input.files || []);
  input.value = '';
  if (!antre.length) return;

  showToast('Mengunggah…', antre.length + ' gambar sedang diproses.', 'info');

  antre.forEach(async function (file) {
    if (file.size > APP_CONFIG.MAX_UPLOAD_BYTES) {
      showToast('Dilewati', file.name + ' lebih dari 5 MB.', 'warning');
      return;
    }
    if (file.type.indexOf('image/') !== 0) {
      showToast('Dilewati', file.name + ' bukan berkas gambar.', 'warning');
      return;
    }

    try {
      const hasil = await bacaFileBase64(file);
      const res = await Api.uploadMedia(hasil.base64, file.name, file.type, 'galeri');

      if (!res.success) { showToast('Gagal unggah', res.message, 'danger'); return; }

      tambahBarisGaleri(res.data.url);
      showToast('Berhasil', file.name + ' ditambahkan ke galeri.', 'success');

    } catch (err) {
      showToast('Error', file.name + ' gagal dibaca.', 'danger');
    }
  });
}

/** Tambahkan tautan YouTube sebagai slide video pada galeri produk. */
function tambahVideoProduk() {
  const input = document.getElementById('prodYoutubeUrl');
  const url = input.value.trim();

  if (!url) {
    showToast('Kosong', 'Tempel dulu tautan YouTube-nya.', 'warning');
    return;
  }
  if (!youtubeId(url)) {
    showToast('Bukan tautan YouTube',
      'Gunakan tautan seperti https://youtube.com/watch?v=… atau https://youtu.be/…', 'warning');
    return;
  }

  if (tambahBarisGaleri(url)) {
    input.value = '';
    showToast('Ditambahkan', 'Video masuk ke galeri produk.', 'success');
  }
}

// ════════════════════════════════════════════════════════════
// BAGIAN 15: BUKTI NYATA (GALERI)
// ════════════════════════════════════════════════════════════

function renderGaleriAdmin() {
  const list = AdminState.data.galeri || [];
  const grid = document.getElementById('galeriGrid');
  const kosong = document.getElementById('galeriKosong');

  kosong.classList.toggle('hidden', list.length > 0);

  if (!list.length) { grid.innerHTML = ''; return; }

  grid.innerHTML = list.map(function (g) {
    const id = esc(g.ID);
    const url = safeUrl(g.Url);
    const vid = youtubeId(url);
    const gambar = vid ? youtubeThumb(vid) : url;
    const judul = g.Judul || (vid ? 'Video' : 'Tangkapan layar');

    return '<div class="galeri-item">' +
      (gambar
        ? '<img src="' + esc(gambar) + '" alt="' + esc(judul) + '" loading="lazy" ' +
          'onclick="bukaPratinjau(\'' + esc(url) + '\',\'' + esc(judul) + '\')" style="cursor:zoom-in">'
        : '') +
      '<div class="isi">' +
        '<div class="judul">' + esc(judul) + '</div>' +
        '<div class="row-gap" style="gap:6px;flex-wrap:wrap">' +
          badgeStatus(g.Status) +
          '<span class="badge-chip badge-neutral">' + (vid ? 'Video' : 'Gambar') + '</span>' +
          (String(g.Sumber) === 'member'
            ? '<span class="badge-chip badge-accent">Dari member</span>' : '') +
        '</div>' +
        '<div class="aksi">' +
          '<button class="btn-icon" onclick="openGaleriModal(\'' + id + '\')" aria-label="Edit">' +
            icon('edit', 16) + '</button>' +
          '<button class="btn-icon" onclick="hapusGaleriKonfirmasi(\'' + id + '\')" aria-label="Hapus">' +
            icon('trash', 16) + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function openGaleriModal(id) {
  const form = document.getElementById('galeriForm');
  form.reset();
  document.getElementById('galPreview').classList.add('hidden');

  if (id && AdminState.data) {
    const g = (AdminState.data.galeri || []).filter(function (x) { return x.ID === id; })[0];
    if (g) {
      document.getElementById('galeriModalTitle').textContent = 'Edit Bukti';
      document.getElementById('galId').value     = g.ID;
      document.getElementById('galUrl').value    = g.Url || '';
      document.getElementById('galJudul').value  = g.Judul || '';
      document.getElementById('galStatus').value = g.Status || 'Published';
      document.getElementById('galUrutan').value = g.Urutan || '';

      // Video tidak perlu pratinjau <img> — sampulnya sudah terlihat di grid
      if (safeUrl(g.Url) && !youtubeId(g.Url)) {
        const img = document.getElementById('galPreview');
        img.src = g.Url;
        img.classList.remove('hidden');
      }
    }
  } else {
    document.getElementById('galeriModalTitle').textContent = 'Tambah Bukti';
    document.getElementById('galId').value = '';
  }

  openModal('modalGaleri');
}

async function submitGaleri(e) {
  e.preventDefault();
  const form = e.target;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const record = {};
  new FormData(form).forEach(function (v, k) { record[k] = v; });
  if (!record.ID) delete record.ID;

  const pulih = setBtnLoading(document.getElementById('galeriSubmitBtn'));
  const res = await Api.simpanGaleri(record);
  pulih();

  showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
  if (res.success) { closeModal('modalGaleri'); muatDataAdmin(); }
}

function hapusGaleriKonfirmasi(id) {
  konfirmasi('Hapus bukti ini dari galeri? Gambarnya tetap tersimpan di Google Drive.',
    async function () {
      const res = await Api.hapusGaleri(id);
      showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
      if (res.success) muatDataAdmin();
    });
}

/** Perbesar gambar (atau buka video) dari dalam dashboard. */
function bukaPratinjau(url, judul) {
  const isi = document.getElementById('pratinjauIsi');
  const vid = youtubeId(url);

  isi.innerHTML = vid
    ? '<div class="rasio-video"><iframe src="' + esc(youtubeEmbed(vid, true)) + '" ' +
      'title="Pratinjau video" frameborder="0" allowfullscreen ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture">' +
      '</iframe></div>'
    : '<img src="' + esc(url) + '" alt="' + esc(judul || 'Pratinjau') + '">';

  document.getElementById('pratinjauCap').textContent = judul || '';
  openModal('modalPratinjau');
}

// ════════════════════════════════════════════════════════════
// BAGIAN 16: ANTREAN PENGAJUAN MEMBER
// ════════════════════════════════════════════════════════════

/**
 * Kotak masuk kiriman member.
 *
 * Yang paling penting di sini adalah admin bisa memutuskan dengan cepat:
 * foto, testimoni, dan gambar buktinya tampil sekaligus dalam satu kartu,
 * sehingga tidak perlu membuka Google Sheets untuk memeriksa.
 */
function renderPengajuan() {
  const semua = AdminState.data.pengajuan || [];
  const filter = document.getElementById('filterPengajuan').value;
  const wrap = document.getElementById('pengajuanList');

  // Penanda di sidebar selalu menghitung yang benar-benar perlu tindakan
  const jumlahBaru = semua.filter(function (p) { return String(p.Status) === 'Baru'; }).length;
  const badge = document.getElementById('badgePengajuan');
  badge.textContent = jumlahBaru;
  badge.classList.toggle('hidden', jumlahBaru === 0);

  const list = filter
    ? semua.filter(function (p) { return String(p.Status) === filter; })
    : semua;

  if (!list.length) {
    wrap.innerHTML = '<div class="card empty-state">' +
      '<div class="h-md">Tidak ada kiriman di kategori ini</div>' +
      '<p class="body-sm">Bagikan tautan <code>index.html#kirim</code> ke member Anda ' +
      'supaya mereka bisa mengirim testimoni beserta buktinya sendiri.</p></div>';
    return;
  }

  wrap.innerHTML = list.map(kartuPengajuan).join('');
}

function kartuPengajuan(p) {
  const id = esc(p.ID);
  const foto = safeUrl(p.FotoProfil);
  const bukti = safeUrl(p.FotoBukti);
  const baru = String(p.Status) === 'Baru';

  return '<div class="pengajuan-card' + (baru ? ' baru' : '') + '">' +
    '<div>' +
      (foto
        ? '<img class="pengajuan-foto" src="' + esc(foto) + '" alt="' + esc(p.Nama) + '" ' +
          'onclick="bukaPratinjau(\'' + esc(foto) + '\',\'Foto profil ' + esc(p.Nama) + '\')" ' +
          'style="cursor:zoom-in">'
        : '<div class="pengajuan-foto-kosong">' + esc(inisial(p.Nama)) + '</div>') +
    '</div>' +

    '<div class="stack-sm">' +
      '<div class="row-between" style="align-items:flex-start;gap:12px">' +
        '<div>' +
          '<div style="font-weight:600;font-size:16px">' + esc(p.Nama) + '</div>' +
          '<div class="body-sm text-secondary">' + esc(p.Jabatan || '—') + '</div>' +
        '</div>' +
        '<div class="row-gap" style="gap:6px">' +
          badgeStatus(p.Status) +
          '<span class="body-sm text-secondary">' + esc(formatTanggal(p.Tanggal)) + '</span>' +
        '</div>' +
      '</div>' +

      '<blockquote style="margin:0;padding:12px 14px;background:var(--bg-muted);' +
        'border-radius:var(--r-md);font-size:14px;line-height:1.6">' +
        esc(p.Testimoni) + '</blockquote>' +

      (p.Saran
        ? '<div class="body-sm"><strong>Saran (hanya untuk Anda):</strong> ' +
          '<span class="text-secondary">' + esc(p.Saran) + '</span></div>'
        : '') +

      '<div class="pengajuan-kontak">' +
        (p.Email ? '<span>' + icon('mail', 14) + esc(p.Email) + '</span>' : '') +
        (p.NoHP  ? '<span>' + icon('phone', 14) + esc(p.NoHP) + '</span>' : '') +
      '</div>' +

      (bukti
        ? '<div><div class="body-sm text-secondary" style="margin-bottom:6px">Gambar bukti:</div>' +
          '<img class="pengajuan-bukti" src="' + esc(bukti) + '" alt="Bukti dari ' + esc(p.Nama) + '" ' +
          'onclick="bukaPratinjau(\'' + esc(bukti) + '\',\'Bukti dari ' + esc(p.Nama) + '\')"></div>'
        : '<div class="body-sm text-secondary">Tidak melampirkan gambar bukti.</div>') +

      '<div class="row-gap" style="gap:8px;flex-wrap:wrap;margin-top:4px">' +
        (baru
          ? '<button class="btn btn-primary btn-sm" onclick="setujuiPengajuanKonfirmasi(\'' + id + '\')">' +
              icon('checkCircle', 16) + ' Setujui &amp; Tayangkan</button>' +
            '<button class="btn btn-secondary btn-sm" onclick="tolakPengajuanKonfirmasi(\'' + id + '\')">' +
              icon('xCircle', 16) + ' Tolak</button>'
          : '') +
        '<button class="btn btn-ghost btn-sm" onclick="hapusPengajuanKonfirmasi(\'' + id + '\')">' +
          icon('trash', 16) + ' Hapus</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function setujuiPengajuanKonfirmasi(id) {
  konfirmasi(
    'Setujui kiriman ini? Testimoninya akan langsung tayang di landing page, ' +
    'dan gambar buktinya masuk ke section Bukti Nyata.',
    async function () {
      const res = await Api.setujuiPengajuan(id);
      showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
      if (res.success) muatDataAdmin();
    },
    { label: 'Setujui & Tayangkan', jenis: 'primary' });
}

function tolakPengajuanKonfirmasi(id) {
  konfirmasi(
    'Tolak kiriman ini? Datanya tetap tersimpan sebagai arsip, ' +
    'hanya saja tidak akan ditayangkan.',
    async function () {
      const res = await Api.tolakPengajuan(id);
      showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
      if (res.success) muatDataAdmin();
    },
    { label: 'Tolak', jenis: 'danger' });
}

function hapusPengajuanKonfirmasi(id) {
  konfirmasi(
    'Hapus kiriman ini secara permanen? Testimoni yang sudah terlanjur tayang ' +
    'tidak ikut terhapus.',
    async function () {
      const res = await Api.hapusPengajuan(id);
      showToast(res.success ? 'Berhasil' : 'Gagal', res.message, res.success ? 'success' : 'danger');
      if (res.success) muatDataAdmin();
    });
}