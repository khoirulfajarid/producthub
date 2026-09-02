# ProductHub Creator — Panduan Instalasi & Deployment

**Arsitektur baru:** Frontend statis di GitHub Pages + Google Apps Script sebagai REST API.

```
GitHub Pages                      Google Apps Script
┌────────────────────┐            ┌──────────────────────┐
│ index.html  (publik)│  fetch()   │ doGet  → JSON        │
│ admin.html  (PIN)   │ ─────────► │ doPost → JSON        │
│ assets/css, assets/js│ ◄───────── │                      │
└────────────────────┘   JSON     │ Sheets + Drive       │
                                   └──────────────────────┘
```

Tidak ada iframe. Tidak ada `google.script.run`. Tidak ada `HtmlService`.

---

## Daftar Berkas

| Berkas | Tempat | Perlu diedit? |
|---|---|---|
| `backend/Kode.gs` | Google Apps Script | ✅ ganti `ADMIN_PIN_DEFAULT` |
| `index.html` | repo GitHub | ✅ ganti meta SEO & URL kanonik |
| `admin.html` | repo GitHub | — |
| `assets/css/style.css` | repo GitHub | — |
| `assets/js/config.js` | repo GitHub | ✅ **wajib** — isi `GAS_URL` |
| `assets/js/api.js` | repo GitHub | — |
| `assets/js/ui.js` | repo GitHub | — |
| `assets/js/landing.js` | repo GitHub | — |
| `assets/js/admin.js` | repo GitHub | — |
| `robots.txt`, `sitemap.xml` | repo GitHub | ✅ ganti domain |

---

## A. Backend — Google Apps Script

### A1. Ganti PIN sebelum apa pun

Buka `backend/Kode.gs`, cari **BAGIAN 1** dan ganti:

```javascript
const ADMIN_PIN_DEFAULT = 'producthub2026';   // ← ganti dengan PIN rahasia Anda
```

Minimal 6 karakter. PIN ini adalah **satu-satunya** jalur masuk ke dashboard.

> **Mengapa tidak ada login email Google lagi?**
> Ketika frontend berada di domain lain dan memanggil Apps Script lewat `fetch()`,
> permintaan itu anonim — `Session.getActiveUser().getEmail()` selalu kosong.
> Jadi jalur OAuth memang tidak bisa dipakai pada arsitektur ini, dan sudah dihapus.

### A2. Pasang kode

1. Buka <https://script.google.com> → **Proyek Baru**.
2. Rename `Code.gs` menjadi **`Kode`**, hapus isinya, tempel seluruh isi `backend/Kode.gs`.
3. Simpan (Ctrl+S).

Hanya satu berkas. Tidak perlu membuat `Index`, `Stylesheet`, atau `JavaScript` — semuanya sudah pindah ke GitHub.

### A3. Jalankan setup — sekali saja

1. Dropdown fungsi di atas editor → pilih **`setupAppEnvironment`** → klik **▶ Run**.
2. Saat diminta izin: **Review permissions** → pilih akun Anda → **Advanced** → **Go to (nama proyek)** → **Allow**.
3. Buka **Execution log**, pastikan muncul:

```
✅ SETUP SELESAI
📁 Folder Drive : https://drive.google.com/...
📊 Spreadsheet  : https://docs.google.com/spreadsheets/...
🔑 PIN admin    : ...
```

Yang otomatis dibuat:

| Lokasi | Isi |
|---|---|
| Drive `/ProductHub_Creator` | folder utama |
| └ `/Thumbnail`, `/Hero`, `/Testimoni` | penyimpanan media per kategori |
| Spreadsheet `DB_ProductHub_Creator` | database |
| Sheet `Produk` | 3 produk contoh |
| Sheet `KontenHero` | konten hero + section penutup (kolom `HeroSlides` sudah ada) |
| Sheet `Keunggulan` | 4 poin default |
| Sheet `Testimoni` | 2 testimoni contoh |
| Sheet `Statistik` | 1 baris per hari |
| Sheet `AppConfig` | identitas brand, ID folder, PIN, angka social proof |

Aman dijalankan berkali-kali — tidak akan menggandakan folder atau sheet.

### A4. Deploy sebagai Web App

1. **Deploy → New deployment** → ikon gerigi → **Web app**.
2. Isi:
   - **Description**: `ProductHub API v2`
   - **Execute as**: **Me**
   - **Who has access**: **Anyone** ← wajib, kalau tidak landing page tidak bisa memuat data
3. **Deploy** → **salin URL yang berakhiran `/exec`**.

> **Setiap kali Anda mengubah `Kode.gs`, buat New deployment lagi** (atau naikkan versi pada deployment yang ada). Menyimpan saja tidak cukup — perubahan tidak akan tayang.

### A5. Uji backend tanpa browser

Di editor Apps Script, pilih fungsi **`ujiAPI`** → **▶ Run** → buka Execution log. Anda akan melihat hasil uji `ping`, `init`, `login`, dan penolakan token palsu — termasuk pemeriksaan bahwa PIN tidak ikut terkirim ke publik.

---

## B. Frontend — GitHub Pages

### B1. Isi GAS_URL

Buka `assets/js/config.js` dan ganti satu baris ini:

```javascript
GAS_URL: 'https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT_ANDA/exec',
```

dengan URL `/exec` dari langkah A4. **Ini satu-satunya baris yang wajib Anda ubah.**

### B2. Sesuaikan SEO

Di `index.html`, ganti `https://username.github.io/producthub/` (muncul di `canonical`, `og:url`, `og:image`, dan JSON-LD) dengan URL Pages Anda yang sebenarnya. Lakukan hal yang sama di `robots.txt` dan `sitemap.xml`.

### B3. Unggah ke GitHub

```bash
cd producthub
git init
git add .
git commit -m "ProductHub — frontend statis + GAS REST API"
git branch -M main
git remote add origin https://github.com/USERNAME/producthub.git
git push -u origin main
```

> `backend/Kode.gs` boleh ikut di repo sebagai arsip. Isinya tidak mengandung rahasia — PIN yang sebenarnya tersimpan di sheet `AppConfig`, bukan di kode, begitu setup dijalankan. Kalau Anda ragu, ganti nilai `ADMIN_PIN_DEFAULT` menjadi placeholder sebelum push.

### B4. Aktifkan Pages

Repo GitHub → **Settings** → **Pages** → **Source: Deploy from a branch** → branch `main`, folder `/ (root)` → **Save**.

Tunggu 1–2 menit. Situs Anda tayang di:

- Landing page: `https://USERNAME.github.io/producthub/`
- Dashboard: `https://USERNAME.github.io/producthub/admin.html`

---

## C. Uji Coba Setelah Tayang

| Langkah | Yang diharapkan |
|---|---|
| Buka landing page | Produk, keunggulan, testimoni, dan angka statistik tampil |
| Buka DevTools → Network | Ada permintaan ke `…/exec?action=init` dengan status **200** |
| Buka DevTools → Console | **Tidak ada** galat CORS |
| Buka `/admin.html` | Muncul layar PIN |
| Masukkan PIN salah | Ditolak, tetap di layar PIN |
| Masukkan PIN benar | Dashboard terbuka, KPI dan grafik terisi |
| Pengaturan → **Uji Koneksi ke API** | "✓ Tersambung — API v2.0 … Database terhubung." |
| Tambah produk → cek Google Sheets | Baris baru muncul di sheet `Produk` |
| Unggah thumbnail | Berkas masuk ke Drive `/ProductHub_Creator/Thumbnail` |
| Kembali ke landing page | Produk baru tampil (tunggu ≤30 menit atau jalankan `resetCache()`) |

---

## D. Kalau Ada Masalah

| Gejala | Penyebab & Solusi |
|---|---|
| "GAS_URL belum diisi" | `config.js` masih berisi placeholder — lihat B1 |
| Galat CORS di Console | Deployment tidak memakai **Who has access: Anyone**. Buat New deployment dengan setelan benar |
| "Server membalas HTML, bukan JSON" | URL salah (mungkin berakhiran `/dev`, bukan `/exec`), atau akses deployment masih terbatas |
| "Tidak dapat menghubungi server" | URL salah ketik, atau deployment sudah dihapus |
| Data tampil kosong | `setupAppEnvironment()` belum dijalankan. Jalankan, lalu `resetCache()` |
| Perubahan kode tidak tayang | Lupa **New deployment** setelah mengubah `Kode.gs` |
| Landing page masih menampilkan data lama | Cache 30 menit. Jalankan `resetCache()` di editor Apps Script |
| Sesi admin putus sebelum 6 jam | `CacheService` sesekali dibersihkan Google lebih awal. Masuk lagi dengan PIN — tidak ada data yang hilang |
| Gambar Drive tidak muncul | Berkas belum dibagikan. Unggah ulang lewat dashboard — pembagian diatur otomatis |

Dua fungsi pemeliharaan di editor Apps Script:

- **`warmupCache()`** — jalankan sesudah deployment baru supaya pengunjung pertama tetap cepat.
- **`resetCache()`** — jalankan bila landing page terasa tertinggal dari Sheets.

---

## E. Alur Kerja Harian

| Tugas | Jalur |
|---|---|
| Tambah produk | Dashboard → Produk → **Tambah Produk** |
| Sembunyikan produk | Ubah Status menjadi **Draft** |
| Ganti headline hero | Dashboard → Konten Hero |
| Atur slideshow hero | Konten Hero → **Slide Hero** (unggah 2–5 gambar, urutkan dengan panah, atur jeda) |
| Ubah 4 poin keunggulan | Dashboard → Keunggulan |
| Tambah testimoni | Dashboard → Testimoni |
| Lihat performa | Dashboard → Laporan (+ **Export CSV**) |
| Ganti nama brand / nomor WA | Dashboard → Pengaturan |
| Ubah 4 angka social proof | Pengaturan → Angka Social Proof |
| Atur kecepatan animasi | Pengaturan → Kecepatan Animasi |
| **Ganti PIN** | Pengaturan → Keamanan Dashboard |

### Cara kerja tiap section yang bergerak

| Section | Perilaku |
|---|---|
| **Hero** | Lebar penuh dari tepi ke tepi. Slideshow berganti otomatis sesuai jeda yang Anda atur, lengkap dengan panah dan titik navigasi. Satu gambar saja → tampil diam. |
| **Keunggulan** | 4 poin statis, ikon dipilih dari 16 pilihan. |
| **Produk Unggulan** | Selalu **satu baris**, berapa pun jumlah produknya — digeser dengan panah, seretan mouse, atau usapan jari. |
| **Lihat Aksinya** | Berjalan otomatis terus-menerus seperti running text, arah ke kiri. |
| **Testimoni** | Dua tingkat: baris atas ke kanan, baris bawah ke kiri (sedikit lebih lambat). Kurang dari 4 testimoni → otomatis satu baris saja. |
| **CTA penutup** | Tombol berdenyut halus dengan kilau melintas, berhenti begitu kursor diarahkan ke sana. |

**Jeda saat dibaca.** Semua elemen bergerak berhenti ketika pengunjung menyentuh atau mengarahkan kursor ke section-nya, lalu jalan lagi begitu dilepas. Label kecil "Dijeda" muncul sebagai penanda. Elemen juga berhenti sendiri saat keluar dari layar — menghemat baterai ponsel. Pengunjung yang mengaktifkan *reduce motion* mendapat halaman yang sepenuhnya diam.

**Tampilan ponsel.** Struktur desktop dipertahankan: carousel produk tetap satu baris geser, marquee tetap berjalan, dan kotak angka statistik tetap berdampingan 2×2. Tombol CTA di navbar disembunyikan di bawah 560px agar navbar tidak melebihi lebar layar — CTA tetap tersedia di hero dan section penutup.

Kompres gambar ke bawah 300 KB sebelum unggah — batas keras aplikasi 5 MB.

---

## F. Catatan Keamanan

**Yang dilindungi:**

- Seluruh operasi tulis memvalidasi token sesi di sisi server. Tanpa token yang sah, `doPost` menolak sebelum menyentuh data.
- PIN hanya dikirim sekali (saat login), lalu diganti token acak. Token hidup di `sessionStorage` — hilang begitu tab ditutup.
- PIN tidak pernah dikirim ke client, bahkan ke admin yang sudah masuk.
- Kolom internal (`LinkProduk`) dan ID folder Drive dibuang dari balasan publik.
- Produk berstatus Draft tidak pernah ikut terkirim ke landing page.
- PIN salah dijeda 600 ms sebelum dibalas, memperlambat percobaan beruntun.

**Yang perlu Anda sadari:**

- URL `/exec` memang publik — harus begitu agar landing page berfungsi. Keamanan bertumpu pada PIN + token, bukan pada menyembunyikan URL.
- Endpoint `track` bisa dipanggil siapa pun. Frontend membatasi satu pencatatan kunjungan per browser per 30 menit, tapi angka statistik tetap bukan data forensik.
- Gunakan PIN yang panjang dan tidak dipakai di layanan lain.
- Bila PIN bocor, gantilah lewat Pengaturan. Sesi lama tetap berlaku sampai masa 6 jam-nya habis.

---

## G. Perbedaan dengan Versi iFrame

| Aspek | Versi lama (GAS + iframe) | Versi ini |
|---|---|---|
| Berkas | 4 file GAS | 1 file `.gs` + 9 file repo |
| Frontend | HtmlService di dalam iframe Blogger | HTML statis di GitHub Pages |
| Komunikasi | `google.script.run` | `fetch()` + JSON |
| SEO | Buruk — mesin pencari hanya melihat iframe | Sempurna — HTML nyata dengan meta, OG, JSON-LD |
| Kecepatan muat | Dua kali loading (Blogger, lalu iframe) | Sekali; HTML dari CDN GitHub |
| Mobile | Scrollbar ganda | Responsif native |
| Login admin | Email Google + PIN cadangan | PIN → token sesi |
| Panel admin | Satu bundle dengan landing page | Halaman terpisah — landing jadi lebih ringan |
