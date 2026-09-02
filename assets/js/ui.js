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

/** Konfirmasi berbasis modal — tidak pernah memakai confirm() bawaan. */
function konfirmasi(pesan, onYes) {
  const kotak = document.getElementById('konfirmasiPesan');
  const btn = document.getElementById('konfirmasiBtn');
  if (!kotak || !btn) { if (onYes) onYes(); return; }

  kotak.textContent = pesan;
  const fresh = btn.cloneNode(true);   // buang listener lama
  btn.parentNode.replaceChild(fresh, btn);
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
