/**
 * ============================================================
 * ProductHub Creator — Logika Landing Page
 * ============================================================
 *
 * Berbeda dengan versi lama, berkas ini TIDAK memakai
 * google.script.run sama sekali. Seluruh data diambil lewat
 * satu panggilan Api.init() (fetch → GAS → JSON).
 *
 * Prinsip yang dipertahankan:
 *   - Satu panggilan server untuk seluruh isi halaman
 *   - Tracking klik fire & forget — tautan terbuka seketika
 *   - Semua elemen bergerak berhenti saat disentuh
 * ============================================================
 */

// ════════════════════════════════════════════════════════════
// BAGIAN 1: STATE
// ════════════════════════════════════════════════════════════

const AppState = {
  produk: [],
  hero: {},
  keunggulan: [],
  testimoni: [],
  galeri: [],
  config: {},

  // Slideshow hero
  heroSlides: [],
  heroIndex: 0,
  heroTimer: null,
  heroPaused: false,

  // Lightbox bukti nyata
  lightboxIndex: 0,

  // Popup detail produk
  detailSlides: [],
  detailIndex: 0,

  // Berkas yang dipilih di form kiriman member (belum diunggah)
  berkasProfil: null,
  berkasBukti: null,

  // Agar angka social proof hanya dihitung sekali per kunjungan
  statSudahDianimasi: false
};

// ════════════════════════════════════════════════════════════
// BAGIAN 2: INISIALISASI
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
  hydrateIcons();
  muatTemaTersimpan();
  pasangPenutupModal();
  pasangTombolPanahModal();
  pasangPenggantiGambar();

  window.addEventListener('resize', function () {
    perbaruiTombolRail('produkRail');
  });

  muatDataAwal();
});

/**
 * Panah kiri/kanan pada keyboard menggerakkan lightbox dan popup produk.
 * Dipasang sekali di tingkat dokumen — jauh lebih ringan daripada
 * memasang listener pada setiap slide.
 */
function pasangTombolPanahModal() {
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const maju = e.key === 'ArrowRight';

    if (document.getElementById('modalLightbox').classList.contains('open')) {
      geserLightbox(maju ? 1 : -1);
    } else if (document.getElementById('modalDetail').classList.contains('open')) {
      geserDetail(maju ? 1 : -1);
    }
  });

  // Menutup lightbox atau popup produk harus menghentikan video yang
  // sedang berputar — kalau tidak, suaranya terus terdengar di latar.
  ['modalLightbox', 'modalDetail'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    new MutationObserver(function () {
      if (!el.classList.contains('open')) hentikanVideo(el);
    }).observe(el, { attributes: true, attributeFilter: ['class'] });
  });
}

/** Buang seluruh iframe di dalam sebuah wadah agar pemutaran benar-benar berhenti. */
function hentikanVideo(wadah) {
  wadah.querySelectorAll('iframe').forEach(function (f) { f.remove(); });
}

/** Satu panggilan server untuk seluruh isi landing page. */
async function muatDataAwal() {
  const res = await Api.init();

  if (!res.success) {
    sembunyikanOverlay();
    tampilkanGagalMuat(res.message);
    return;
  }

  AppState.produk     = res.data.produk || [];
  AppState.hero       = res.data.hero || {};
  AppState.keunggulan = res.data.keunggulan || [];
  AppState.testimoni  = res.data.testimoni || [];
  AppState.galeri     = res.data.galeri || [];
  AppState.config     = res.data.config || {};

  renderLanding();
  sembunyikanOverlay();

  catatKunjungan();
}

/**
 * Catat kunjungan — maksimal sekali per browser per JEDA_TRACK_VIEW.
 *
 * Pada arsitektur API publik, siapa pun bisa memanggil endpoint track.
 * Pembatas sederhana ini setidaknya menjaga agar refresh berulang oleh
 * pengunjung yang sama tidak menggelembungkan angka pengunjung Anda.
 */
function catatKunjungan() {
  let terakhir = 0;
  try { terakhir = Number(localStorage.getItem(APP_CONFIG.KEY_VIEW)) || 0; } catch (e) {}

  const sekarang = Date.now();
  if (sekarang - terakhir < APP_CONFIG.JEDA_TRACK_VIEW) return;

  Api.track('view', '');
  try { localStorage.setItem(APP_CONFIG.KEY_VIEW, String(sekarang)); } catch (e) {}
}

function sembunyikanOverlay() {
  const el = document.getElementById('loadingOverlay');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(function () { el.style.display = 'none'; }, 300);
}

function tampilkanGagalMuat(pesan) {
  const belumDikonfigurasi = !konfigurasiSiap();

  document.getElementById('produkRail').innerHTML =
    '<div class="empty-state" style="flex:1">' +
      '<div class="h-md">Data belum bisa dimuat</div>' +
      '<p class="body-sm">' + esc(pesan) + '</p>' +
      (belumDikonfigurasi
        ? '<p class="body-sm">Buka <code>assets/js/config.js</code> lalu tempel URL <code>/exec</code> ' +
          'dari deployment Google Apps Script Anda.</p>'
        : '<p class="body-sm">Pastikan fungsi <code>setupAppEnvironment()</code> sudah dijalankan ' +
          'di editor Apps Script, dan Web App di-deploy dengan akses <strong>Anyone</strong>.</p>') +
    '</div>';

  document.getElementById('produkPrev').classList.add('hidden');
  document.getElementById('produkNext').classList.add('hidden');

  showToast('Gagal memuat', pesan, 'danger');
}

// ════════════════════════════════════════════════════════════
// BAGIAN 3: RENDER LANDING PAGE
// ════════════════════════════════════════════════════════════

function renderLanding() {
  const h = AppState.hero;
  const c = AppState.config;

  // ── Identitas brand ──
  const brand = c.appName || APP_CONFIG.BRAND_DEFAULT;
  ['brandName', 'footerBrand'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.textContent = brand;
  });

  document.getElementById('footerTagline').textContent =
    c.tagline || 'Memberdayakan kreator digital dengan alat kelas dunia.';
  document.getElementById('footerCopy').textContent =
    '© ' + new Date().getFullYear() + ' ' + brand + '. Seluruh hak cipta dilindungi.';

  const wa = String(c.waNumber || '').replace(/\D/g, '');
  const waLink = wa ? 'https://wa.me/' + wa : '';
  const footerWa = document.getElementById('footerWa');
  if (waLink) {
    footerWa.href = waLink;
  } else {
    document.getElementById('footerWaItem').style.display = 'none';
  }

  // ── Hero ──
  if (h.Headline) document.getElementById('heroHeadline').textContent = h.Headline;
  if (h.Subheadline) document.getElementById('heroSub').textContent = h.Subheadline;
  if (h.TeksCTA)         document.getElementById('heroCtaPrimary').textContent = h.TeksCTA;
  if (h.TeksCTASekunder) document.getElementById('heroCtaSecondary').textContent = h.TeksCTASekunder;

  renderHeroSlideshow();

  // ── CTA navbar & penutup ──
  const navCtaLink = safeUrl(h.LinkCTAPenutup) || waLink;
  const navCta = document.getElementById('navCta');
  if (navCtaLink) { navCta.href = navCtaLink; } else { navCta.classList.add('hidden'); }
  if (h.TeksCTA) navCta.textContent = h.TeksCTA;

  if (h.JudulPenutup) document.getElementById('closingTitle').textContent = h.JudulPenutup;
  document.getElementById('closingDesc').textContent = h.DeskripsiPenutup || '';

  const closingCta = document.getElementById('closingCta');
  if (h.TeksCTAPenutup) closingCta.textContent = h.TeksCTAPenutup;
  if (navCtaLink) { closingCta.href = navCtaLink; } else { closingCta.classList.add('hidden'); }

  renderFitur();
  renderProdukRail();
  renderDemoMarquee();
  renderStatGrid();
  renderTestimoniMarquee();
  renderGaleriBukti();
  siapkanFormKirim();
}

// ── Slideshow hero ──────────────────────────────────────────

/** Pecah kolom HeroSlides (satu URL per baris) menjadi array bersih. */
function bacaSlides(hero) {
  const mentah = String(hero.HeroSlides || hero.HeroVisual || '');
  return mentah.split(/[\n,]+/)
    .map(function (s) { return safeUrl(s.trim()); })
    .filter(function (s) { return s; })
    .slice(0, APP_CONFIG.MAX_HERO_SLIDES);
}

function renderHeroSlideshow() {
  const slides = bacaSlides(AppState.hero);
  AppState.heroSlides = slides;
  AppState.heroIndex = 0;

  const wrapSlides = document.getElementById('heroSlides');
  const kosong = document.getElementById('heroEmpty');
  const dots   = document.getElementById('heroDots');
  const stage  = document.getElementById('heroStage');

  clearInterval(AppState.heroTimer);

  if (!slides.length) {
    wrapSlides.innerHTML = '';
    dots.innerHTML = '';
    kosong.classList.remove('hidden');
    stage.querySelectorAll('.hero-arrow').forEach(function (b) { b.classList.add('hidden'); });
    return;
  }

  kosong.classList.add('hidden');

  wrapSlides.innerHTML = slides.map(function (url, i) {
    return '<div class="hero-slide' + (i === 0 ? ' active' : '') + '">' +
             '<img src="' + esc(url) + '" alt="Tampilan produk ' + (i + 1) + '" ' +
             (i === 0 ? 'fetchpriority="high"' : 'loading="lazy"') + '>' +
           '</div>';
  }).join('');

  const banyak = slides.length > 1;
  stage.querySelectorAll('.hero-arrow').forEach(function (b) {
    b.classList.toggle('hidden', !banyak);
  });

  dots.innerHTML = banyak
    ? slides.map(function (_, i) {
        return '<button class="hero-dot' + (i === 0 ? ' active' : '') + '" ' +
               'onclick="heroGoTo(' + i + ')" aria-label="Slide ' + (i + 1) + '"></button>';
      }).join('')
    : '';

  if (banyak) {
    pasangJeda(stage,
      function () { AppState.heroPaused = true; },
      function () { AppState.heroPaused = false; });
    mulaiHeroTimer();
  }
}

function mulaiHeroTimer() {
  clearInterval(AppState.heroTimer);
  const detik = Math.max(2, Number(AppState.config.heroSlideDelay) || 5);
  AppState.heroTimer = setInterval(function () {
    if (!AppState.heroPaused) heroGoTo(AppState.heroIndex + 1);
  }, detik * 1000);
}

function heroGoTo(index) {
  const total = AppState.heroSlides.length;
  if (total < 2) return;

  const baru = ((index % total) + total) % total;
  AppState.heroIndex = baru;

  document.querySelectorAll('#heroSlides .hero-slide').forEach(function (el, i) {
    el.classList.toggle('active', i === baru);
  });
  document.querySelectorAll('#heroDots .hero-dot').forEach(function (el, i) {
    el.classList.toggle('active', i === baru);
  });
}

/** Panah manual — timer di-reset agar slide baru dapat waktu tayang penuh. */
function heroPrev() { heroGoTo(AppState.heroIndex - 1); mulaiHeroTimer(); }
function heroNext() { heroGoTo(AppState.heroIndex + 1); mulaiHeroTimer(); }

// ── Keunggulan ──────────────────────────────────────────────

function renderFitur() {
  const list = AppState.keunggulan;
  const grid = document.getElementById('featureGrid');

  if (!list.length) { grid.innerHTML = ''; return; }

  grid.innerHTML = list.map(function (f) {
    return '<div class="feature">' +
             '<div class="feature-icon">' + icon(f.Ikon || 'check', 20) + '</div>' +
             '<h3>' + esc(f.Judul) + '</h3>' +
             '<p>' + esc(f.Deskripsi) + '</p>' +
           '</div>';
  }).join('');
}

// ── Kartu produk ────────────────────────────────────────────

/** Satu kartu produk — dipakai rel produk maupun marquee demo. */
function kartuProduk(p, modeDemo) {
  const thumb = safeUrl(p.Thumbnail);
  const demo = safeUrl(p.LinkDemo);
  const checkout = safeUrl(p.LinkCheckout);
  const id = esc(p.ID);

  if (modeDemo) {
    return '<article class="produk-card">' +
      '<div class="produk-thumb">' +
        (thumb
          ? '<img src="' + esc(thumb) + '" alt="Demo ' + esc(p.NamaProduk) + '" loading="lazy">'
          : '<div class="produk-thumb-empty">' + icon('eye', 22) + '</div>') +
      '</div>' +
      '<div class="produk-body">' +
        '<h3 class="produk-nama">' + esc(p.NamaProduk) + '</h3>' +
        '<p class="produk-desc">Coba sendiri aplikasinya sebelum memutuskan membeli.</p>' +
        '<a class="btn btn-secondary btn-sm" href="' + esc(demo) + '" ' +
           'target="_blank" rel="noopener" onclick="trackDemo(\'' + id + '\')">' +
           icon('external', 16) + ' Buka Demo</a>' +
      '</div>' +
    '</article>';
  }

  // Thumbnail adalah pintu masuk ke galeri produk. Dibuat sebagai <button>
  // supaya bisa difokuskan dengan Tab dan ditekan dengan Enter — bukan
  // sekadar <div> yang hanya patuh pada klik mouse.
  const jumlahMedia = daftarMediaProduk(p).length;

  return '<article class="produk-card">' +
    '<button type="button" class="produk-thumb produk-thumb-klik" ' +
            'onclick="bukaDetailProduk(\'' + id + '\')" ' +
            'aria-label="Lihat galeri ' + esc(p.NamaProduk) + '">' +
      (thumb
        ? '<img src="' + esc(thumb) + '" alt="' + esc(p.NamaProduk) + '" loading="lazy">'
        : '<div class="produk-thumb-empty">' + icon('image', 22) + '</div>') +
      '<span class="thumb-overlay">' + icon('eye', 20) +
        '<span>Lihat Detail</span>' +
      '</span>' +
      (jumlahMedia > 1
        ? '<span class="media-count">' + icon('image', 13) + ' ' + jumlahMedia + '</span>'
        : '') +
    '</button>' +
    '<div class="produk-body">' +
      '<div class="row-between" style="align-items:flex-start">' +
        '<h3 class="produk-nama produk-nama-klik" onclick="bukaDetailProduk(\'' + id + '\')">' +
          esc(p.NamaProduk) + '</h3>' +
        (p.Badge ? '<span class="badge-chip badge-accent">' + esc(p.Badge) + '</span>' : '') +
      '</div>' +
      '<p class="produk-desc">' + esc(p.Deskripsi) + '</p>' +
      '<div class="produk-harga">' + formatRupiah(p.Harga) + '</div>' +
      '<div class="produk-actions">' +
        (demo
          ? '<a class="btn btn-secondary btn-sm" href="' + esc(demo) + '" target="_blank" rel="noopener" ' +
            'onclick="trackDemo(\'' + id + '\')">Lihat Demo</a>'
          : '') +
        (checkout
          ? '<a class="btn btn-primary btn-sm" href="' + esc(checkout) + '" target="_blank" rel="noopener" ' +
            'onclick="trackCta(\'' + id + '\')">Beli Sekarang</a>'
          : '<button class="btn btn-primary btn-sm" disabled>Segera Hadir</button>') +
      '</div>' +
    '</div>' +
  '</article>';
}

// ── Rel produk: selalu satu baris, bisa digeser ─────────────

function renderProdukRail() {
  const rail = document.getElementById('produkRail');
  const list = AppState.produk;

  if (!list.length) {
    rail.innerHTML = '<div class="empty-state" style="flex:1">' +
      '<div class="h-md">Belum ada produk tayang</div>' +
      '<p class="body-sm">Tambahkan produk lewat panel admin, lalu atur statusnya menjadi Published.</p></div>';
    document.getElementById('produkPrev').classList.add('hidden');
    document.getElementById('produkNext').classList.add('hidden');
    return;
  }

  rail.innerHTML = list.map(function (p) { return kartuProduk(p, false); }).join('');

  pasangGeserDrag(rail);

  // Dipasang sekali saja — renderLanding() bisa dipanggil berulang
  if (rail.dataset.scrollTerpasang !== '1') {
    rail.dataset.scrollTerpasang = '1';
    rail.addEventListener('scroll', function () { perbaruiTombolRail('produkRail'); }, { passive: true });
  }
  setTimeout(function () { perbaruiTombolRail('produkRail'); }, 60);
}

/** Geser rel sejauh satu kartu penuh. */
function railScroll(railId, arah) {
  const rail = document.getElementById(railId);
  if (!rail) return;
  const kartu = rail.querySelector('.produk-card');
  const langkah = kartu ? kartu.offsetWidth + 24 : rail.clientWidth * 0.8;
  rail.scrollBy({ left: arah * langkah, behavior: 'smooth' });
}

/** Redupkan panah saat rel sudah mentok. */
function perbaruiTombolRail(railId) {
  const rail = document.getElementById(railId);
  if (!rail) return;
  const prev = document.getElementById('produkPrev');
  const next = document.getElementById('produkNext');
  if (!prev || !next) return;

  const bisaGeser = rail.scrollWidth > rail.clientWidth + 4;
  prev.classList.toggle('hidden', !bisaGeser);
  next.classList.toggle('hidden', !bisaGeser);
  if (!bisaGeser) return;

  prev.disabled = rail.scrollLeft <= 2;
  next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
}

/** Seret dengan mouse (di ponsel sudah alami lewat sentuhan). */
function pasangGeserDrag(rail) {
  if (rail.dataset.dragTerpasang === '1') return;
  rail.dataset.dragTerpasang = '1';

  let menyeret = false, mulaiX = 0, mulaiScroll = 0, bergerak = false;

  rail.addEventListener('mousedown', function (e) {
    menyeret = true; bergerak = false;
    mulaiX = e.pageX; mulaiScroll = rail.scrollLeft;
    rail.classList.add('dragging');
  });

  window.addEventListener('mousemove', function (e) {
    if (!menyeret) return;
    const delta = e.pageX - mulaiX;
    if (Math.abs(delta) > 4) bergerak = true;
    rail.scrollLeft = mulaiScroll - delta;
    if (bergerak) e.preventDefault();
  });

  window.addEventListener('mouseup', function () {
    if (!menyeret) return;
    menyeret = false;
    rail.classList.remove('dragging');
  });

  // Cegah tautan ikut terklik setelah seretan
  rail.addEventListener('click', function (e) {
    if (bergerak) { e.preventDefault(); e.stopPropagation(); bergerak = false; }
  }, true);
}

// ── Marquee ─────────────────────────────────────────────────

/**
 * Isi satu marquee. Isi digandakan supaya perputarannya mulus tanpa jeda.
 *
 * @param {string} trackId id elemen .marquee-track
 * @param {Array}  items   array HTML string kartu
 * @param {number} durasi  detik untuk satu putaran penuh
 */
function isiMarquee(trackId, items, durasi) {
  const track = document.getElementById(trackId);
  if (!track) return;

  if (!items.length) { track.innerHTML = ''; return; }

  // Ulangi sampai cukup lebar, lalu gandakan untuk trik translateX(-50%)
  let dasar = items.slice();
  while (dasar.length < 6) dasar = dasar.concat(items);

  track.innerHTML = dasar.join('') + dasar.join('');
  track.style.setProperty('--marquee-duration', Math.max(10, Number(durasi) || 40) + 's');
}

function renderDemoMarquee() {
  const withDemo = AppState.produk.filter(function (p) { return safeUrl(p.LinkDemo); });
  const section = document.getElementById('sec-demo');

  if (!withDemo.length) { section.classList.add('hidden'); return; }
  section.classList.remove('hidden');

  isiMarquee('demoTrack',
    withDemo.map(function (p) { return kartuProduk(p, true); }),
    AppState.config.demoSpeed);

  pasangJeda(document.getElementById('demoMarquee'));
}

function renderStatGrid() {
  const c = AppState.config;
  const stats = [];

  for (let i = 1; i <= 4; i++) {
    const label = c['statLabel' + i];
    const nilai = c['statValue' + i];
    if (label || nilai) stats.push({ label: label || '', nilai: nilai || '—' });
  }

  const grid = document.getElementById('statGrid');
  if (!stats.length) { grid.innerHTML = ''; return; }

  grid.innerHTML = stats.map(function (s) {
    // Nilai akhir disimpan di data-nilai; isi awal sengaja dibiarkan
    // terbaca supaya pengunjung tanpa JavaScript tetap melihat angkanya.
    return '<div class="stat-box">' +
             '<div class="label-md">' + esc(s.label) + '</div>' +
             '<div class="stat-num" data-nilai="' + esc(s.nilai) + '">' + esc(s.nilai) + '</div>' +
           '</div>';
  }).join('');

  siapkanAnimasiStat();
}

/**
 * Jalankan hitung-naik saat kotak angka benar-benar terlihat pengunjung.
 *
 * Menganimasikannya saat halaman dimuat akan sia-sia — section ini berada
 * jauh di bawah layar pertama, dan angkanya sudah selesai berhitung sebelum
 * sempat dilihat. IntersectionObserver membuatnya menyala tepat waktu.
 */
function siapkanAnimasiStat() {
  const grid = document.getElementById('statGrid');
  if (!grid) return;

  const aktif = String(AppState.config.statCountEnabled === undefined
    ? '1' : AppState.config.statCountEnabled);

  if (aktif === '0' || aktif.toLowerCase() === 'false') return;

  const durasi = Number(AppState.config.statCountDuration) || 2000;

  function jalankan() {
    if (AppState.statSudahDianimasi) return;
    AppState.statSudahDianimasi = true;
    grid.querySelectorAll('.stat-num').forEach(function (el, i) {
      // Jeda bertingkat antar kotak — terasa mengalir, bukan serentak
      setTimeout(function () {
        animasiAngka(el, el.getAttribute('data-nilai'), durasi);
      }, i * 120);
    });
  }

  if (typeof IntersectionObserver === 'undefined') { jalankan(); return; }

  const pengamat = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      jalankan();
      pengamat.disconnect();
    }
  }, { threshold: 0.35 });

  pengamat.observe(grid);
}

function kartuTestimoni(t) {
  const foto = safeUrl(t.Foto);
  return '<article class="testimoni-card">' +
    '<p class="testimoni-quote">“' + esc(t.Isi) + '”</p>' +
    '<div class="testimoni-meta">' +
      (foto
        ? '<img class="testimoni-foto" src="' + esc(foto) + '" alt="' + esc(t.Nama) + '" loading="lazy">'
        : '<div class="testimoni-foto">' + esc(inisial(t.Nama)) + '</div>') +
      '<div>' +
        '<div class="testimoni-nama">' + esc(t.Nama) + '</div>' +
        '<div class="testimoni-jabatan">' + esc(t.Jabatan) + '</div>' +
      '</div>' +
    '</div>' +
  '</article>';
}

/**
 * Dua tingkat testimoni yang bergerak berlawanan arah.
 * Bila testimoni hanya sedikit, tingkat kedua disembunyikan
 * agar tidak terasa mengulang-ulang.
 */
function renderTestimoniMarquee() {
  const list = AppState.testimoni;
  const m1 = document.getElementById('testiMarquee1');
  const m2 = document.getElementById('testiMarquee2');

  if (!list.length) {
    m1.classList.add('hidden');
    m2.classList.add('hidden');
    return;
  }
  m1.classList.remove('hidden');

  const kecepatan = AppState.config.testiSpeed;

  if (list.length < 4) {
    isiMarquee('testiTrack1', list.map(kartuTestimoni), kecepatan);
    m2.classList.add('hidden');
  } else {
    const tengah = Math.ceil(list.length / 2);
    isiMarquee('testiTrack1', list.slice(0, tengah).map(kartuTestimoni), kecepatan);
    // Baris kedua sedikit lebih lambat agar dua arah tidak terasa kaku
    isiMarquee('testiTrack2', list.slice(tengah).map(kartuTestimoni), Number(kecepatan || 55) * 1.15);
    m2.classList.remove('hidden');
  }

  pasangJeda(m1);
  pasangJeda(m2);
}

// ════════════════════════════════════════════════════════════
// BAGIAN 4: INTERAKSI
// ════════════════════════════════════════════════════════════

/** Gulir halus ke section. */
function scrollToSection(nama) {
  const map = {
    hero: 'sec-hero', produk: 'sec-produk', demo: 'sec-demo',
    testimoni: 'sec-testimoni', bukti: 'sec-bukti'
  };
  const el = document.getElementById(map[nama] || nama);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('navLinks').classList.remove('open');
}

function toggleNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

/** Catat klik tombol beli. Tautan tetap terbuka seketika (Optimistic UI). */
function trackCta(produkId) {
  Api.track('cta', (produkId === 'nav' || produkId === 'closing') ? '' : produkId);
  return true;
}

/** Catat klik demo. */
function trackDemo(produkId) {
  Api.track('demo', produkId);
  return true;
}

// ════════════════════════════════════════════════════════════
// BAGIAN 5: BUKTI NYATA — running image & video
// ════════════════════════════════════════════════════════════

/**
 * Section pembuktian: tangkapan layar dan video dari pengguna sungguhan.
 *
 * Testimoni berupa teks mudah ditulis siapa saja; gambar dashboard yang
 * benar-benar terpakai jauh lebih sulit dipalsukan. Itu sebabnya section
 * ini berdiri sendiri, tepat setelah testimoni.
 */
function renderGaleriBukti() {
  const list = AppState.galeri;
  const section = document.getElementById('sec-bukti');
  const c = AppState.config;

  // Judul & subjudul bisa diganti admin tanpa menyentuh kode
  const judul = document.getElementById('buktiJudul');
  const sub   = document.getElementById('buktiSub');
  if (judul) judul.textContent = c.galeriJudul || 'Bukti Nyata dari Pengguna';
  if (sub)   sub.textContent   = c.galeriSubjudul ||
    'Tangkapan layar dan video asli dari mereka yang sudah memakainya.';

  // Tombol ajakan mengirim hanya tampil bila form memang dibuka admin
  const formAktif = String(c.formMemberEnabled === undefined ? '1' : c.formMemberEnabled);
  const bolehKirim = formAktif !== '0' && formAktif.toLowerCase() !== 'false';
  document.querySelectorAll('[data-kirim-cta]').forEach(function (el) {
    el.classList.toggle('hidden', !bolehKirim);
  });

  // Tanpa bukti sama sekali, section ini hanya akan terlihat kosong —
  // lebih baik disembunyikan sepenuhnya kecuali form masih terbuka.
  if (!list.length) {
    section.classList.toggle('hidden', !bolehKirim);
    document.getElementById('buktiMarquee').classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  document.getElementById('buktiMarquee').classList.remove('hidden');

  isiMarquee('buktiTrack',
    list.map(function (g, i) { return kartuBukti(g, i); }),
    c.galeriSpeed || 45);

  pasangJeda(document.getElementById('buktiMarquee'));
}

/** Satu kartu bukti. Video ditandai jelas agar tidak dikira gambar diam. */
function kartuBukti(g, i) {
  const url = safeUrl(g.Url);
  if (!url) return '';

  const vid = youtubeId(url);
  const gambar = vid ? youtubeThumb(vid) : url;
  const judul = g.Judul || (vid ? 'Video bukti' : 'Tangkapan layar');

  return '<button type="button" class="bukti-card" onclick="bukaLightbox(' + i + ')" ' +
           'aria-label="Perbesar: ' + esc(judul) + '">' +
    '<img src="' + esc(gambar) + '" alt="' + esc(judul) + '" loading="lazy">' +
    (vid ? '<span class="bukti-play">' + icon('play', 20) + '</span>' : '') +
    '<span class="bukti-cap">' + esc(judul) + '</span>' +
  '</button>';
}

function bukaLightbox(i) {
  if (!AppState.galeri.length) return;
  AppState.lightboxIndex = i;
  renderLightbox();
  openModal('modalLightbox');
}

function geserLightbox(arah) {
  const total = AppState.galeri.length;
  if (total < 2) return;
  AppState.lightboxIndex = ((AppState.lightboxIndex + arah) % total + total) % total;
  renderLightbox();
}

function renderLightbox() {
  const g = AppState.galeri[AppState.lightboxIndex];
  const isi = document.getElementById('lightboxIsi');
  if (!g || !isi) return;

  hentikanVideo(isi);

  const url = safeUrl(g.Url);
  const vid = youtubeId(url);

  // Video langsung diputar karena pengunjung memang menekan untuk melihatnya
  isi.innerHTML = vid
    ? '<div class="rasio-video"><iframe src="' + esc(youtubeEmbed(vid, true)) + '" ' +
      'title="' + esc(g.Judul || 'Video bukti') + '" frameborder="0" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" ' +
      'allowfullscreen></iframe></div>'
    : '<img src="' + esc(url) + '" alt="' + esc(g.Judul || 'Bukti') + '">';

  document.getElementById('lightboxCap').textContent = g.Judul || '';
  document.getElementById('lightboxPos').textContent =
    (AppState.lightboxIndex + 1) + ' / ' + AppState.galeri.length;

  const banyak = AppState.galeri.length > 1;
  document.querySelectorAll('#modalLightbox .lightbox-nav').forEach(function (b) {
    b.classList.toggle('hidden', !banyak);
  });
}

// ════════════════════════════════════════════════════════════
// BAGIAN 6: POPUP DETAIL PRODUK
// ════════════════════════════════════════════════════════════

/**
 * Kumpulkan seluruh media satu produk: thumbnail lebih dulu, lalu isi
 * kolom Galeri (gambar maupun tautan YouTube, satu URL per baris).
 * Duplikat dibuang supaya thumbnail tidak muncul dua kali.
 */
function daftarMediaProduk(p) {
  const hasil = [];
  const thumb = safeUrl(p.Thumbnail);
  if (thumb) hasil.push(thumb);

  bacaDaftarUrl(p.Galeri, APP_CONFIG.MAX_GALERI_PRODUK).forEach(function (u) {
    if (hasil.indexOf(u) === -1) hasil.push(u);
  });

  return hasil;
}

function bukaDetailProduk(id) {
  const p = AppState.produk.filter(function (x) { return String(x.ID) === String(id); })[0];
  if (!p) return;

  AppState.detailSlides = daftarMediaProduk(p);
  AppState.detailIndex = 0;

  document.getElementById('detailJudul').textContent = p.NamaProduk || 'Detail Produk';
  document.getElementById('detailHarga').textContent = formatRupiah(p.Harga);
  document.getElementById('detailDesc').textContent =
    p.Deskripsi || 'Belum ada deskripsi untuk produk ini.';

  const badge = document.getElementById('detailBadge');
  badge.textContent = p.Badge || '';
  badge.classList.toggle('hidden', !p.Badge);

  // Tombol aksi mengikuti data produk — tidak ada tombol mati yang membingungkan
  const demo = safeUrl(p.LinkDemo);
  const checkout = safeUrl(p.LinkCheckout);
  document.getElementById('detailActions').innerHTML =
    (demo
      ? '<a class="btn btn-secondary" href="' + esc(demo) + '" target="_blank" rel="noopener" ' +
        'onclick="trackDemo(\'' + esc(p.ID) + '\')">' + icon('external', 16) + ' Lihat Demo</a>'
      : '') +
    (checkout
      ? '<a class="btn btn-primary" href="' + esc(checkout) + '" target="_blank" rel="noopener" ' +
        'onclick="trackCta(\'' + esc(p.ID) + '\')">Beli Sekarang</a>'
      : '<button class="btn btn-primary" disabled>Segera Hadir</button>');

  renderDetailSlide();
  openModal('modalDetail');
}

/**
 * Tampilkan satu slide saja, bukan semuanya sekaligus.
 *
 * Video dimuat sebagai gambar sampul dengan tombol putar (facade), bukan
 * iframe langsung: satu produk dengan lima video tidak akan menyeret lima
 * pemutar YouTube ke dalam halaman hanya untuk berjaga-jaga.
 */
function renderDetailSlide() {
  const panggung = document.getElementById('detailSlides');
  const slides = AppState.detailSlides;

  hentikanVideo(panggung);

  if (!slides.length) {
    panggung.innerHTML = '<div class="detail-kosong">' + icon('image', 28) +
      '<p class="body-sm">Belum ada gambar untuk produk ini.</p></div>';
    document.getElementById('detailDots').innerHTML = '';
    document.querySelectorAll('#modalDetail .lightbox-nav').forEach(function (b) {
      b.classList.add('hidden');
    });
    return;
  }

  const url = slides[AppState.detailIndex];
  const vid = youtubeId(url);

  panggung.innerHTML = vid
    ? '<button type="button" class="video-facade" onclick="putarVideoDetail()" ' +
        'aria-label="Putar video pratinjau">' +
        '<img src="' + esc(youtubeThumb(vid)) + '" alt="Pratinjau video">' +
        '<span class="bukti-play besar">' + icon('play', 26) + '</span>' +
      '</button>'
    : '<img src="' + esc(url) + '" alt="Tampilan produk ' +
      (AppState.detailIndex + 1) + '">';

  const banyak = slides.length > 1;
  document.querySelectorAll('#modalDetail .lightbox-nav').forEach(function (b) {
    b.classList.toggle('hidden', !banyak);
  });

  document.getElementById('detailDots').innerHTML = banyak
    ? slides.map(function (_, i) {
        return '<button class="hero-dot' + (i === AppState.detailIndex ? ' active' : '') + '" ' +
               'onclick="detailGoTo(' + i + ')" aria-label="Media ' + (i + 1) + '"></button>';
      }).join('')
    : '';
}

/** Ganti sampul video dengan pemutar sungguhan setelah ditekan. */
function putarVideoDetail() {
  const vid = youtubeId(AppState.detailSlides[AppState.detailIndex]);
  if (!vid) return;

  document.getElementById('detailSlides').innerHTML =
    '<div class="rasio-video"><iframe src="' + esc(youtubeEmbed(vid, true)) + '" ' +
    'title="Video pratinjau produk" frameborder="0" ' +
    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" ' +
    'allowfullscreen></iframe></div>';
}

function geserDetail(arah) {
  const total = AppState.detailSlides.length;
  if (total < 2) return;
  AppState.detailIndex = ((AppState.detailIndex + arah) % total + total) % total;
  renderDetailSlide();
}

function detailGoTo(i) {
  AppState.detailIndex = i;
  renderDetailSlide();
}

// ════════════════════════════════════════════════════════════
// BAGIAN 7: FORM KIRIMAN MEMBER
// ════════════════════════════════════════════════════════════

/**
 * Form ini yang membuat section testimoni dan bukti bisa tumbuh sendiri:
 * member mengisi, admin tinggal menyetujui. Tidak ada lagi menyalin
 * tangkapan layar satu per satu dari chat.
 *
 * Yang tayang ke publik hanya nama, testimoni, foto profil, dan gambar
 * buktinya. Email, nomor HP, dan saran tetap tinggal di dashboard.
 */
function siapkanFormKirim() {
  // Tautan langsung index.html#kirim membuka form seketika — memudahkan
  // admin membagikan satu tautan saja ke grup membernya.
  if (window.location.hash === '#kirim') {
    setTimeout(bukaFormKirim, 400);
  }
}

function bukaFormKirim() {
  const form = document.getElementById('kirimForm');
  const sukses = document.getElementById('kirimSukses');

  // Selalu mulai dari keadaan bersih — modal yang sama bisa dibuka berkali-kali
  form.classList.remove('hidden');
  sukses.classList.add('hidden');
  form.reset();
  AppState.berkasProfil = null;
  AppState.berkasBukti = null;
  ['previewProfil', 'previewBukti'].forEach(function (id) {
    const el = document.getElementById(id);
    el.src = '';
    el.classList.add('hidden');
  });

  openModal('modalKirim');
}

/**
 * Simpan berkas pilihan di memori dan tampilkan pratinjau seketika.
 * Unggahan sesungguhnya baru terjadi saat tombol kirim ditekan — kalau
 * pengunjung berubah pikiran, tidak ada berkas nyasar di Drive Anda.
 */
async function pilihBerkasKirim(input, jenis) {
  const file = input.files[0];
  if (!file) return;

  if (file.type.indexOf('image/') !== 0) {
    showToast('Format tidak didukung', 'Gunakan berkas gambar (PNG, JPG, atau WebP).', 'warning');
    input.value = '';
    return;
  }
  if (file.size > APP_CONFIG.MAX_KIRIMAN_BYTES) {
    showToast('Ukuran terlalu besar',
      'Maksimal 3 MB. Kompres gambarnya dulu, ya.', 'warning');
    input.value = '';
    return;
  }

  try {
    const hasil = await bacaFileBase64(file);
    const data = {
      base64: hasil.base64,
      fileName: file.name,
      mimeType: file.type
    };

    if (jenis === 'profil') AppState.berkasProfil = data;
    else AppState.berkasBukti = data;

    const img = document.getElementById(jenis === 'profil' ? 'previewProfil' : 'previewBukti');
    img.src = hasil.dataUrl;
    img.classList.remove('hidden');

  } catch (err) {
    showToast('Gagal membaca berkas', err.message, 'danger');
    input.value = '';
  }
}

async function submitKirimTestimoni(e) {
  e.preventDefault();

  const form = e.target;
  const nilai = {};
  new FormData(form).forEach(function (v, k) { nilai[k] = String(v).trim(); });

  if (!nilai.nama || nilai.nama.length < 2) {
    showToast('Nama belum diisi', 'Tuliskan nama Anda lebih dulu.', 'warning');
    return;
  }
  if (!nilai.testimoni || nilai.testimoni.length < 10) {
    showToast('Testimoni terlalu pendek',
      'Ceritakan sedikit lebih banyak — minimal 10 karakter.', 'warning');
    return;
  }

  const tombol = document.getElementById('kirimBtn');
  const pulihkan = setBtnLoading(tombol, 'Mengirim…');

  const res = await Api.kirimTestimoni({
    nama: nilai.nama,
    jabatan: nilai.jabatan,
    email: nilai.email,
    noHp: nilai.noHp,
    testimoni: nilai.testimoni,
    saran: nilai.saran,
    fotoProfil: AppState.berkasProfil,
    fotoBukti: AppState.berkasBukti
  });

  pulihkan();

  if (!res.success) {
    showToast('Gagal mengirim', res.message, 'danger');
    return;
  }

  // Ganti form dengan pesan terima kasih — memberi kepastian bahwa
  // kiriman sudah masuk dan menjelaskan mengapa belum langsung tampil.
  form.classList.add('hidden');
  document.getElementById('kirimSukses').classList.remove('hidden');
  AppState.berkasProfil = null;
  AppState.berkasBukti = null;
}
