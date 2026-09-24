/**
 * ============================================================
 * ProductHub Creator — Konfigurasi Frontend
 * ============================================================
 *
 * ⚠️ INI SATU-SATUNYA BERKAS YANG PERLU ANDA EDIT.
 *
 * Ganti nilai GAS_URL dengan URL /exec dari deployment Web App
 * Google Apps Script Anda. Caranya:
 *
 *   Editor Apps Script → Deploy → New deployment → Web app
 *     Execute as     : Me
 *     Who has access : Anyone
 *   → Deploy → salin URL yang berakhiran /exec
 *
 * URL ini memang harus publik agar landing page bisa memuat data.
 * Keamanan dashboard tidak bertumpu pada menyembunyikan URL,
 * melainkan pada PIN + token sesi yang divalidasi di sisi server.
 * ============================================================
 */

const APP_CONFIG = {

  /** URL Web App Google Apps Script — WAJIB diisi. */
  GAS_URL: 'https://script.google.com/macros/s/AKfycby08p85S-tR4kC2gaw8mmXWVfUh7ccsfFN5zLTtcF64R6VFxOpVEoMd5PAXJmGfFhWQ/exec',

  /** Nama brand cadangan, dipakai sebelum data dari server tiba. */
  BRAND_DEFAULT: 'ProductHub',

  /** Batas ukuran unggahan gambar (byte). Server juga memeriksa ini. */
  MAX_UPLOAD_BYTES: 5 * 1024 * 1024,   // 5 MB

  /** Maksimum slide pada hero. */
  MAX_HERO_SLIDES: 8,

  /** Maksimum slide pada popup detail produk. */
  MAX_GALERI_PRODUK: 10,

  /**
   * Batas ukuran gambar yang dikirim lewat form publik (byte).
   * Lebih ketat daripada unggahan admin: form ini terbuka untuk siapa saja,
   * dan server menolak apa pun di atas 3 MB.
   */
  MAX_KIRIMAN_BYTES: 3 * 1024 * 1024,  // 3 MB

  /**
   * Jeda minimum antar pencatatan kunjungan dari satu browser (milidetik).
   * Mencegah angka pengunjung menggelembung saat halaman di-refresh
   * berulang kali. 30 menit = 1.800.000 ms.
   */
  JEDA_TRACK_VIEW: 30 * 60 * 1000,

  /** Batas waktu setiap permintaan ke server (milidetik). */
  TIMEOUT: 30000,

  /** Kunci penyimpanan browser. */
  KEY_TEMA:  'ph_theme',
  KEY_TOKEN: 'ph_token',
  KEY_VIEW:  'ph_last_view'
};

/** Cek apakah GAS_URL sudah benar-benar diisi. */
function konfigurasiSiap() {
  const u = APP_CONFIG.GAS_URL || '';
  return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(u) &&
         u.indexOf('GANTI_DENGAN') === -1;
}
