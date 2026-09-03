# ProductHub Creator

Landing page produk digital dengan panel admin — **frontend statis di GitHub Pages, backend REST API di Google Apps Script.**

Setiap produk disertai demo yang bisa dicoba pengunjung sebelum membeli. Data produk, hero, keunggulan, testimoni, bukti nyata, dan statistik dikelola lewat dashboard, tersimpan di Google Sheets, dan media diunggah ke Google Drive.

**Baru di v3** — section *Bukti Nyata* berisi tangkapan layar dan video YouTube dari pengguna sungguhan; member bisa mengirim testimoni beserta buktinya sendiri lewat form publik yang diverifikasi admin; kartu produk membuka popup galeri gambar & video; dan angka social proof berhitung naik saat terlihat.

Sudah pernah men-deploy v2? Ikuti **[PANDUAN_UPGRADE_V3.md](PANDUAN_UPGRADE_V3.md)** — data lama tetap utuh.

---

## Mulai Cepat

1. **Backend** — tempel `backend/Kode.gs` ke proyek Apps Script baru, ganti `ADMIN_PIN_DEFAULT`, jalankan `setupAppEnvironment()`, lalu deploy sebagai Web App (*Execute as: Me*, *Who has access: Anyone*).
2. **Frontend** — isi `GAS_URL` di `assets/js/config.js` dengan URL `/exec` hasil deploy.
3. **Terbitkan** — push ke GitHub, aktifkan Pages dari branch `main`.

Langkah lengkap beserta penyelesaian masalah ada di **[PANDUAN_DEPLOYMENT.md](PANDUAN_DEPLOYMENT.md)**.

---

## Struktur

```
producthub/
├── index.html                 Landing page — publik, SEO-friendly
├── admin.html                 Dashboard — dilindungi PIN + token sesi
├── assets/
│   ├── css/style.css          Design system (dipakai kedua halaman)
│   └── js/
│       ├── config.js          ⚙️ SATU-SATUNYA berkas yang perlu diedit
│       ├── api.js             Lapisan fetch, token, penanganan galat
│       ├── ui.js              Ikon SVG, toast, modal, format, mesin jeda
│       ├── landing.js         Logika landing page
│       └── admin.js           Logika dashboard
├── backend/Kode.gs            Google Apps Script — REST API
├── robots.txt, sitemap.xml    SEO
└── PANDUAN_DEPLOYMENT.md      Panduan lengkap
```

`ui.js` berisi semua yang dipakai bersama kedua halaman, jadi tidak ada kode yang digandakan.

---

## Kontrak API

Backend hanya mengembalikan JSON. Bentuk balasan selalu sama:

```json
{ "success": true, "data": { }, "message": "OK" }
```

### GET — publik, tanpa token

| Action | Fungsi |
|---|---|
| `?action=init` | Seluruh isi landing page dalam satu panggilan (termasuk galeri bukti) |
| `?action=track&tipe=view\|cta\|demo&id=` | Catat statistik (fire & forget) |
| `?action=ping` | Cek koneksi, versi API, dan kesiapan database |

### POST publik — tanpa token

| Action | Fungsi |
|---|---|
| `submitTestimoni` | Kiriman testimoni + bukti dari member → antrean `Pengajuan` |

Satu-satunya jalur tulis yang terbuka untuk umum. Hasilnya tidak pernah langsung
tayang: statusnya `Baru` sampai admin menyetujui. Dibatasi gambar saja (maks. 3 MB),
teks maks. 1.500 karakter, dan jeda 3 detik antar kiriman.

### POST — butuh token sesi

Body dikirim sebagai `text/plain;charset=utf-8` berisi JSON `{action, token, data}`.

> Header `text/plain` itu **wajib**. Dengan `application/json`, browser mengirim preflight `OPTIONS` lebih dulu — dan Apps Script tidak melayani `OPTIONS`, sehingga permintaan gagal dengan galat CORS.

| Action | Fungsi |
|---|---|
| `login` | Tukar PIN dengan token sesi 6 jam |
| `logout` | Hapus token dari cache server |
| `getAdminData` | Seluruh data dashboard + rekap statistik |
| `saveProduk` / `deleteProduk` / `batchStatusProduk` | CRUD produk |
| `saveHero` | Konten hero + daftar slide |
| `saveKeunggulan` / `deleteKeunggulan` | CRUD keunggulan |
| `saveTestimoni` / `deleteTestimoni` | CRUD testimoni |
| `saveGaleri` / `deleteGaleri` | CRUD bukti nyata (gambar & video YouTube) |
| `approvePengajuan` | Setujui kiriman member → testimoni **dan** bukti tayang sekaligus |
| `rejectPengajuan` / `deletePengajuan` | Tolak (arsipkan) atau hapus kiriman |
| `saveConfig` | AppConfig, termasuk ganti PIN |
| `uploadMedia` | base64 → Google Drive → URL publik |

---

## Autentikasi

```
PIN ──► POST login ──► token UUID (CacheService, 6 jam)
                            │
                            ├─► sessionStorage browser
                            └─► divalidasi setiap POST, diperpanjang otomatis
```

PIN hanya melintas sekali. Setelah itu setiap operasi tulis membawa token. Token hilang saat tab ditutup, dan server menolaknya begitu masa berlaku habis — frontend otomatis kembali ke layar masuk.

**Login berbasis email Google tidak tersedia pada arsitektur ini.** Panggilan `fetch()` lintas domain bersifat anonim, sehingga `Session.getActiveUser().getEmail()` selalu kosong. PIN adalah satu-satunya jalur masuk.

---

## Optimasi yang Diterapkan

1. **Satu panggilan untuk seluruh data** — landing page memanggil server tepat sekali (`action=init`); dashboard juga sekali (`getAdminData`).
2. **Optimistic UI** — pencatatan klik dikirim tanpa ditunggu, tautan beli terbuka seketika. Pratinjau gambar muncul dari berkas lokal sebelum unggahan selesai.
3. **CacheService** — Produk, Hero, Keunggulan, Testimoni, dan Config di-cache 30 menit, otomatis di-invalidate setiap penyimpanan.
4. **Batch** — semua tulis memakai `setValues()` sekali jalan. Statistik memakai satu baris per hari yang di-update, bukan satu baris per kejadian.
5. **Pencarian & filter lokal** — menyaring tabel produk tidak memanggil server sama sekali.
6. **Navigasi 0 ms** — semua section dashboard sudah ada di DOM; berpindah hanya menyalakan kelas CSS.

---

## Desain

Mengikuti **Premium Minimalism** dari `DESIGN.md`: *Surface & Stroke*, bukan *Depth & Shadow*. Garis 1px `#E2E2E2` mendefinisikan wadah, bukan bayangan. Off-black `#111111` untuk CTA, indigo `#4F46E5` untuk elemen interaktif, Inter sebagai satu-satunya tipografi.

Mode gelap tersedia di kedua halaman dan tersimpan di `localStorage`. Grafik ikut berganti warna karena mengambil nilai langsung dari token CSS.

---

## Diuji

Seluruh alur diverifikasi otomatis di Chromium dengan API tiruan: rendering landing page pada 1440px dan 375px, tidak ada scroll horizontal, gerbang PIN menolak PIN salah, token palsu ditolak server dan dibuang dari browser, seluruh section dashboard terisi, grafik benar-benar tergambar di kanvas, pencarian dan filter lokal, mode gelap tanpa galat, dan produk berstatus Draft tidak bocor ke halaman publik.

---

## Lisensi

Gunakan bebas untuk proyek Anda sendiri.
