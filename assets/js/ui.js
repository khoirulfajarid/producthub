/**
 * ============================================================
 * ProductHub Creator — Utilitas UI Bersama
 * Dipakai oleh index.html (landing) dan admin.html (dashboard).
 * ============================================================
 *
 * Isi berkas ini:
 *   1. Pustaka ikon SVG inline (gaya garis 2px — DESIGN.md)
 *   2. Utilitas teks & format (esc, safeUrl, rupiah, tanggal)
 *   3. Toast, modal, konfirmasi, tombol memuat
 *   4. Mesin jeda universal untuk semua elemen bergerak
 *   5. Tema gelap / terang
 * ============================================================
 */

// ════════════════════════════════════════════════════════════
// BAGIAN 1: IKON (SVG inline, stroke 2px)
// ════════════════════════════════════════════════════════════

const ICONS = {
  sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:     '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  menu:     '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close:    '<path d="M18 6 6 18M6 6l12 12"/>',
  shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  grid:     '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  box:      '<path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>',
  layout:   '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  quote:    '<path d="M3 21c3 0 7-1 7-8V5H3v7h4c0 4-4 4-4 4zM14 21c3 0 7-1 7-8V5h-7v7h4c0 4-4 4-4 4z"/>',
  chart:    '<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>',
  gear:     '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V7a1.7 1.7 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  edit:     '<path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash:    '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  upload:   '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
  logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  lock:     '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  zap:      '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  target:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  eye:      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  users:    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/>',
  cursor:   '<path d="m3 3 7.5 19 2.5-8 8-2.5z"/>',
  cart:     '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  image:    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  home:     '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',

  play:        '<path d="m6 3 15 9-15 9V3z"/>',
  send:        '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
  inbox:       '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1z"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  xCircle:     '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
  film:        '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 9h5M2 15h5M17 9h5M17 15h5"/>',
  mail:        '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
  phone:       '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',

  chevronLeft:  '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  arrowLeft:    '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  arrowRight:   '<path d="M5 12h14M12 5l7 7-7 7"/>',

  // Pilihan ikon untuk poin Keunggulan
  check:    '<path d="M20 6 9 17l-5-5"/>',
  award:    '<circle cx="12" cy="8" r="6"/><path d="m8.2 13.9-1.7 7.1L12 18l5.5 3-1.7-7.1"/>',
  clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  globe:    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  heart:    '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/>',
  code:     '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  palette:  '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/>',
  wallet:   '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  rocket:   '<path d="M4.5 16.5c-1.5 1.3-2 5.5-2 5.5s4.2-.5 5.5-2c.7-.9.7-2.2-.1-3a2.1 2.1 0 0 0-3.4-.5z"/><path d="M12 15 9 12a11 11 0 0 1 8-9c1.5 0 3 .1 3 .1s.1 1.5.1 3a11 11 0 0 1-9 8z"/>'
};

/** Ikon yang bisa dipilih admin untuk poin Keunggulan. */
const IKON_PILIHAN = [
  ['zap', 'Kilat — Cepat'], ['target', 'Target — Presisi'], ['chart', 'Grafik — Analitik'],
  ['shield', 'Perisai — Aman'], ['award', 'Penghargaan — Kualitas'], ['clock', 'Jam — Hemat Waktu'],
  ['users', 'Orang — Komunitas'], ['heart', 'Hati — Disukai'], ['code', 'Kode — Teknis'],
  ['palette', 'Palet — Desain'], ['wallet', 'Dompet — Harga'], ['rocket', 'Roket — Pertumbuhan'],
  ['globe', 'Bola Dunia — Jangkauan'], ['check', 'Centang — Terbukti'], ['box', 'Kotak — Produk'],
  ['eye', 'Mata — Transparan']
];

/** Bangun elemen SVG untuk satu ikon. */
function icon(name, size) {
  const d = ICONS[name];
  if (!d) return '';
  const s = size || 20;
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
         'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
         'aria-hidden="true">' + d + '</svg>';
}

/** Ganti semua <span data-icon="..."> menjadi SVG sungguhan. */
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
    el.innerHTML = icon(el.getAttribute('data-icon'), Number(el.getAttribute('data-icon-size')) || 20);
  });
}

// ════════════════════════════════════════════════════════════
// BAGIAN 2: UTILITAS TEKS & FORMAT
// ════════════════════════════════════════════════════════════

/** Cegah XSS saat menyusun HTML dari data pengguna. */
function esc(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Validasi URL — hanya http/https yang boleh dijadikan href. */
function safeUrl(v) {
  const s = String(v || '').trim();
  return /^https?:\/\//i.test(s) ? s : '';
}

function formatRupiah(n) {
  const num = Number(n) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}

function formatTanggal(iso) {
  if (!iso) return '-';
  const parts = String(iso).split('-');
  if (parts.length !== 3) return String(iso);
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return Number(parts[2]) + ' ' + bulan[Number(parts[1]) - 1] + ' ' + parts[0];
}

function inisial(nama) {
  return String(nama || '?').trim().charAt(0).toUpperCase();
}

// ── Media: YouTube & daftar URL ─────────────────────────────

/**
 * Ambil ID video dari berbagai bentuk tautan YouTube yang biasa disalin
 * orang: tautan panjang, tautan pendek youtu.be, /embed/, dan /shorts/.
 *
 * Mengembalikan '' bila bukan tautan YouTube — pemanggilnya memakai itu
 * untuk memutuskan apakah media ini gambar atau video.
 */
function youtubeId(url) {
  const s = String(url || '');
  const pola = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/
  ];
  for (let i = 0; i < pola.length; i++) {
    const m = s.match(pola[i]);
    if (m) return m[1];
  }
  return '';
}

function youtubeThumb(id) {
  return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
}

/** URL embed. Autoplay hanya dipakai saat pengunjung sendiri yang menekan putar. */
function youtubeEmbed(id, autoplay) {
  return 'https://www.youtube.com/embed/' + id +
         '?rel=0&modestbranding=1' + (autoplay ? '&autoplay=1' : '');
}

/** Jenis media dari URL — dipakai galeri bukti maupun galeri produk. */
function jenisMedia(url) {
  return youtubeId(url) ? 'youtube' : 'image';
}

/**
 * Pecah teks berisi banyak URL (satu per baris, atau dipisah koma)
 * menjadi array URL yang sudah divalidasi.
 */
function bacaDaftarUrl(teks, maks) {
  return String(teks || '')
    .split(/[\n,]+/)
    .map(function (s) { return safeUrl(s.trim()); })
    .filter(function (s) { return s; })
    .slice(0, maks || 20);
}

/**
 * Gambar pengganti saat sebuah berkas tidak bisa dimuat.
 *
 * Sumber gambar di aplikasi ini berada di luar kendali halaman: berkas Drive
 * bisa dihapus pemiliknya, dan sampul YouTube bisa hilang bila videonya
 * dijadikan privat. Ikon "gambar rusak" bawaan browser membuat halaman
 * terlihat tidak terurus — kotak abu-abu netral jauh lebih baik.
 */
const GAMBAR_PENGGANTI =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400">' +
    '<rect width="640" height="400" fill="#F2F2F2"/>' +
    '<g stroke="#B8B8B8" stroke-width="2" fill="none" ' +
    'transform="translate(296 176) scale(2)">' +
    '<rect x="0" y="0" width="24" height="24" rx="2"/>' +
    '<circle cx="8.5" cy="8.5" r="1.5"/><path d="m24 15-5-5L2 24"/></g>' +
    '<text x="320" y="330" font-family="system-ui,sans-serif" font-size="18" ' +
    'fill="#8A8A8A" text-anchor="middle">Gambar tidak dapat dimuat</text></svg>');

/**
 * Pasang sekali di setiap halaman. Memakai fase capture karena event
 * "error" pada <img> tidak menggelembung ke atas seperti event biasa,
 * sehingga satu pemasang di tingkat dokumen cukup untuk semua gambar —
 * termasuk yang baru dibuat belakangan lewat innerHTML.
 */
function pasangPenggantiGambar() {
  document.addEventListener('error', function (e) {
    const el = e.target;
    if (!el || el.tagName !== 'IMG') return;
    if (el.dataset.gagal === '1') return;   // cegah putaran tanpa akhir
    el.dataset.gagal = '1';
    el.src = GAMBAR_PENGGANTI;
  }, true);
}

/** Baca berkas menjadi base64 tanpa prefix data: — dipakai semua unggahan. */
function bacaFileBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () {
      resolve({
        base64: String(reader.result).split(',')[1],
        dataUrl: String(reader.result)
      });
    };
    reader.onerror = function () { reject(new Error('Berkas gagal dibaca.')); };
    reader.readAsDataURL(file);
  });
}

// ── Animasi angka (count-up) ────────────────────────────────

/**
 * Pisahkan "10.000+" menjadi { prefix:'', angka:10000, suffix:'+', desimal:0 }
 * sehingga angkanya bisa dianimasikan tanpa kehilangan format aslinya.
 *
 * Format Indonesia: titik = pemisah ribuan, koma = desimal.
 * Nilai yang tidak mengandung angka sama sekali (misal "—") dikembalikan
 * apa adanya dan tidak dianimasikan.
 */
function uraikanAngka(teks) {
  const s = String(teks === null || teks === undefined ? '' : teks).trim();
  const m = s.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!m) return null;

  const mentah = m[2];
  const desimal = mentah.indexOf(',') !== -1 ? mentah.split(',')[1].length : 0;
  const angka = Number(mentah.replace(/\./g, '').replace(',', '.'));
  if (!isFinite(angka)) return null;

  return { prefix: m[1], angka: angka, suffix: m[3], desimal: desimal };
}

function formatAngkaId(nilai, desimal) {
  return nilai.toLocaleString('id-ID', {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal
  });
}

/**
 * Hitung angka naik dari 0 sampai nilai tujuan.
 *
 * Memakai requestAnimationFrame (bukan setInterval) supaya gerakannya
 * mengikuti kecepatan layar dan berhenti sendiri saat tab tidak aktif.
 * Kurva easing membuat angka melambat menjelang akhir — terasa jauh
 * lebih hidup daripada kenaikan linear.
 *
 * Pengunjung yang mengaktifkan "reduce motion" langsung melihat angka final.
 */
function animasiAngka(el, teksTujuan, durasiMs) {
  const bagian = uraikanAngka(teksTujuan);

  if (!bagian) { el.textContent = teksTujuan; return; }

  const kurangiGerak = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const durasi = Math.max(200, Number(durasiMs) || 2000);

  if (kurangiGerak || durasi < 250) {
    el.textContent = teksTujuan;
    return;
  }

  const mulai = performance.now();

  function langkah(sekarang) {
    const t = Math.min(1, (sekarang - mulai) / durasi);
    const eased = 1 - Math.pow(1 - t, 3);   // ease-out cubic
    el.textContent = bagian.prefix +
      formatAngkaId(bagian.angka * eased, bagian.desimal) +
      bagian.suffix;

    if (t < 1) requestAnimationFrame(langkah);
    else el.textContent = teksTujuan;   // pastikan hasil akhir persis
  }

  el.textContent = bagian.prefix + formatAngkaId(0, bagian.desimal) + bagian.suffix;
  requestAnimationFrame(langkah);
}

// ════════════════════════════════════════════════════════════
// BAGIAN 3: TOAST, MODAL & TOMBOL
// ════════════════════════════════════════════════════════════

/** Notifikasi non-blocking. */
function showToast(title, message, type) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;

  const el = document.createElement('div');
  el.className = 'toast-ph ' + (type || 'info');
  el.setAttribute('role', 'status');
  el.innerHTML = '<div class="t-title">' + esc(title) + '</div>' +
                 (message ? '<div class="t-msg">' + esc(message) + '</div>' : '');
  stack.appendChild(el);

  setTimeout(function () {
    el.style.opacity = '0';
    setTimeout(function () { el.remove(); }, 250);
  }, 3800);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

/**
 * Konfirmasi berbasis modal — tidak pernah memakai confirm() bawaan.
 *
 * @param {string}   pesan  kalimat yang dibaca pengguna
 * @param {Function} onYes  dijalankan saat tombol aksi ditekan
 * @param {Object}   [opsi] { label, jenis } — tulisan & warna tombol aksi.
 *                          Default 'Hapus' + merah, karena mayoritas
 *                          konfirmasi di panel ini memang penghapusan.
 */
function konfirmasi(pesan, onYes, opsi) {
  const kotak = document.getElementById('konfirmasiPesan');
  const btn = document.getElementById('konfirmasiBtn');
  if (!kotak || !btn) { if (onYes) onYes(); return; }

  const label = (opsi && opsi.label) || 'Hapus';
  const jenis = (opsi && opsi.jenis) || 'danger';

  kotak.textContent = pesan;
  const fresh = btn.cloneNode(true);   // buang listener lama
  btn.parentNode.replaceChild(fresh, btn);

  fresh.className = 'btn btn-' + jenis;   // warna mengikuti sifat tindakan
  fresh.textContent = label;              // tulisan mengikuti tindakan
  fresh.onclick = function () { closeModal('modalKonfirmasi'); onYes(); };
  openModal('modalKonfirmasi');
}

/** Ubah tombol jadi status memuat, kembalikan fungsi pemulih. */
function setBtnLoading(btn, teks) {
  if (!btn) return function () {};
  const asli = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner spinner-sm"></span> ' + (teks || 'Menyimpan…');
  return function () { btn.disabled = false; btn.innerHTML = asli; };
}

/** Pasang penutup modal standar: klik latar gelap & tombol Escape. */
function pasangPenutupModal() {
  document.querySelectorAll('.modal-backdrop-ph').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) m.classList.remove('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop-ph.open').forEach(function (m) {
        m.classList.remove('open');
      });
    }
  });
}

// ════════════════════════════════════════════════════════════
// BAGIAN 4: MESIN JEDA UNIVERSAL
// ════════════════════════════════════════════════════════════

/**
 * Pasang perilaku "berhenti saat disentuh, lanjut saat dilepas" pada
 * satu elemen. Dipakai slideshow hero dan semua marquee.
 *
 * Yang menghentikan: kursor masuk, jari menyentuh, fokus keyboard, dan
 * saat elemen keluar dari layar (hemat baterai).
 * Yang melanjutkan: kursor keluar, jari diangkat, fokus hilang.
 *
 * @param {Element}  el       elemen yang menerima kelas .is-paused
 * @param {Function} onJeda   dipanggil saat mulai dijeda (opsional)
 * @param {Function} onLanjut dipanggil saat kembali berjalan (opsional)
 */
function pasangJeda(el, onJeda, onLanjut) {
  if (!el || el.dataset.jedaTerpasang === '1') return;
  el.dataset.jedaTerpasang = '1';

  let sentuh = false;   // jari/kursor sedang menahan
  let terlihat = true;  // elemen ada di layar

  function hitung() {
    const jeda = sentuh || !terlihat;
    el.classList.toggle('is-paused', jeda);
    if (jeda) { if (onJeda) onJeda(); }
    else { if (onLanjut) onLanjut(); }
  }

  function tahan() { sentuh = true;  hitung(); }
  function lepas() { sentuh = false; hitung(); }

  // Kursor (desktop)
  el.addEventListener('mouseenter', tahan);
  el.addEventListener('mouseleave', lepas);

  // Sentuhan (ponsel & tablet) — passive agar scroll tetap mulus
  el.addEventListener('touchstart',  tahan, { passive: true });
  el.addEventListener('touchend',    lepas, { passive: true });
  el.addEventListener('touchcancel', lepas, { passive: true });

  // Keyboard — pengguna yang menavigasi dengan Tab juga perlu waktu membaca
  el.addEventListener('focusin',  tahan);
  el.addEventListener('focusout', lepas);

  // Hentikan saat elemen keluar dari layar
  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(function (entries) {
      terlihat = entries[0].isIntersecting;
      hitung();
    }, { threshold: 0.08 }).observe(el);
  }
}

// ════════════════════════════════════════════════════════════
// BAGIAN 5: TEMA GELAP / TERANG
// ════════════════════════════════════════════════════════════

/**
 * Dipasang oleh admin.js supaya grafik ikut berganti warna
 * ketika tema diubah. Landing page membiarkannya kosong.
 */
let onThemeChange = null;

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  const svg = icon(theme === 'dark' ? 'sun' : 'moon');
  document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
    el.innerHTML = svg;
  });

  try { localStorage.setItem(APP_CONFIG.KEY_TEMA, theme); } catch (e) { /* mode privat */ }
  if (typeof onThemeChange === 'function') onThemeChange(theme);
}

function toggleTheme() {
  const now = document.documentElement.getAttribute('data-theme');
  applyTheme(now === 'dark' ? 'light' : 'dark');
}

/** Terapkan tema yang tersimpan — panggil sedini mungkin agar tidak berkedip. */
function muatTemaTersimpan() {
  let saved = 'light';
  try { saved = localStorage.getItem(APP_CONFIG.KEY_TEMA) || 'light'; } catch (e) {}
  applyTheme(saved);
}

/** Ambil nilai token warna CSS — dipakai agar grafik ikut tema. */
function tokenWarna(nama) {
  return getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
}