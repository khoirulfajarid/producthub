# Panduan Upgrade ke v3 — ProductHub Creator

**Untuk aplikasi yang sudah terlanjur di-deploy.** Panduan ini membawa situs Anda
dari v2 ke v3 tanpa kehilangan satu baris data pun: produk, testimoni, statistik,
dan PIN Anda tetap utuh.

Total waktu: sekitar **15 menit**.

---

## Apa yang Baru

| # | Fitur | Di mana terlihat |
|---|---|---|
| 1 | **Section "Bukti Nyata"** — tangkapan layar & video YouTube berjalan otomatis, bisa diklik untuk diperbesar | Landing page, tepat setelah Testimoni |
| 2 | **Form kiriman member** — member mengisi sendiri testimoni + bukti, admin tinggal menyetujui | Tombol di section Bukti Nyata + menu "Pengajuan" di dashboard |
| 3 | **Popup detail produk** — klik gambar produk untuk melihat slide gambar & video preview beserta deskripsinya | Section Produk Unggulan |
| 4 | **Angka statistik berhitung naik** — kecepatannya bisa Anda atur | Section "Dipercaya Para Kreator" |

Semuanya punya modul pengaturan sendiri di dashboard admin.

---

## Urutan yang Benar

Ikuti persis urutan ini. Menukar langkah 2 dan 3 akan membuat dashboard
menampilkan galat sesaat, karena frontend baru mencari sheet yang belum dibuat.

```
1. Ganti Kode.gs          →  2. Jalankan upgradeKeV3()  →  3. Deploy versi baru
                                                                    ↓
                                              4. Push berkas frontend ke GitHub
```

---

## A. Backend — Google Apps Script

### A1. Ganti isi Kode.gs

1. Buka <https://script.google.com> → pilih proyek ProductHub Anda
2. Klik berkas **Kode** di panel kiri
3. **Blok semua isinya** (Ctrl+A) lalu **hapus**
4. **Tempel** seluruh isi `backend/Kode.gs` yang baru
5. Simpan (Ctrl+S)

> **PIN Anda aman.** Nilai `ADMIN_PIN_DEFAULT` di kode hanya dipakai saat setup
> pertama kali. PIN yang sedang berlaku tersimpan di sheet `AppConfig`, dan
> tidak tersentuh oleh penggantian kode ini.

### A2. Jalankan migrasi database — sekali saja

1. Pada dropdown fungsi di atas editor, pilih **`upgradeKeV3`**
2. Klik **▶ Run**
3. Bila diminta izin lagi: **Review permissions** → pilih akun Anda →
   **Advanced** → **Go to (nama proyek)** → **Allow**
4. Buka **Execution log**. Anda akan melihat:

```
✅ MIGRASI v3 SELESAI
   • Folder Galeri / ProfilMember / BuktiMember siap.
   • Sheet "Galeri" dibuat.
   • Sheet "Pengajuan" dibuat.
   • Kolom "Galeri" ditambahkan ke sheet Produk.
   • 9 pengaturan baru ditambahkan.
```

Fungsi ini **hanya menambah** — tidak pernah menghapus atau menimpa data lama.
Aman dijalankan berkali-kali kalau Anda ragu sudah menjalankannya atau belum.

### A3. Deploy — ⚠️ INI BAGIAN PALING PENTING

Anda sudah punya deployment yang berjalan. Tujuannya adalah memperbarui
deployment itu **tanpa mengganti URL-nya**, supaya `config.js` di GitHub tidak
perlu diubah.

1. **Deploy** → **Manage deployments**
2. Klik ikon **pensil (Edit)** di kanan atas deployment yang aktif
3. Pada dropdown **Version**, pilih **New version**
4. Klik **Deploy**

> **JANGAN pilih "New deployment".** Itu membuat URL `/exec` yang benar-benar
> baru, dan situs Anda akan menampilkan data kosong sampai Anda menyalin URL
> barunya ke `config.js`. Gunakan **Edit → New version** agar URL lama tetap dipakai.

### A4. Pastikan backend sehat

Pilih fungsi **`ujiAPI`** → **▶ Run** → buka Execution log. Yang perlu Anda lihat:

```
galeri     : 0 bukti tayang
adminPin bocor? ✅ tidak
ID folder bocor? ✅ tidak
siap v3?     ✅ ya
kiriman kosong ditolak? ✅ ya
```

Kalau `siap v3?` masih **❌ BELUM**, berarti langkah A2 belum berhasil — ulangi.

---

## B. Frontend — GitHub Pages

### B1. Ganti berkas di folder proyek Anda

Ekstrak paket baru, lalu **timpa** berkas-berkas ini di folder `producthub` Anda:

| Berkas | Status |
|---|---|
| `index.html` | ganti — sudah berisi URL situs Anda |
| `admin.html` | ganti |
| `assets/css/style.css` | ganti |
| `assets/js/ui.js` | ganti |
| `assets/js/api.js` | ganti |
| `assets/js/landing.js` | ganti |
| `assets/js/admin.js` | ganti |
| `assets/js/config.js` | ganti — **lalu baca peringatan di bawah** |
| `backend/Kode.gs` | ganti (arsip saja) |
| `robots.txt`, `sitemap.xml` | ganti — sudah berisi URL situs Anda |

> ### ⚠️ Satu hal yang wajib dicek: `config.js`
>
> Berkas `config.js` yang baru berisi **URL placeholder**, bukan URL Anda.
> Setelah menimpanya, buka `assets/js/config.js` dan pastikan barisnya kembali
> berisi URL `/exec` milik Anda:
>
> ```javascript
> GAS_URL: 'https://script.google.com/macros/s/XXXXXXXXXX/exec',
> ```
>
> Salin URL lama Anda dari riwayat, atau ambil ulang lewat
> **Deploy → Manage deployments** di editor Apps Script.
>
> Kalau langkah ini terlewat, landing page akan menampilkan pesan
> *"GAS_URL belum diisi"*.

### B2. Push ke GitHub

Buka Git Bash / Terminal di folder `producthub`, lalu:

```bash
git add .
git commit -m "Upgrade v3: bukti nyata, form member, popup produk, animasi angka"
git push
```

Tunggu 1–2 menit. GitHub Pages membangun ulang situs Anda secara otomatis.

### B3. Lihat hasilnya

Buka `https://khoirulfajarid.github.io/producthub/` lalu tekan
**Ctrl+Shift+R** (hard refresh) — ini penting, karena browser masih menyimpan
CSS dan JavaScript versi lama.

---

## C. Uji Coba Setelah Tayang

| Langkah | Yang diharapkan |
|---|---|
| Gulir ke section "Dipercaya Para Kreator" | Angka berhitung naik dari nol |
| Gulir sedikit lagi | Muncul section **Bukti Nyata** (masih kosong — wajar, belum ada isinya) |
| Klik gambar salah satu produk | Popup terbuka berisi gambar + deskripsi produk |
| Buka `/admin.html` → masuk dengan PIN | Muncul dua menu baru: **Bukti Nyata** dan **Pengajuan** |
| Pengaturan → **Uji Koneksi ke API** | "✓ Tersambung — API v3.0 … Database terhubung." |

Kalau dashboard menampilkan peringatan kuning *"Database perlu diperbarui"*,
berarti langkah A2 terlewat.

---

## D. Cara Memakai Fitur Baru

### D1. Mengisi Bukti Nyata sendiri (jalur admin)

**Dashboard → Bukti Nyata → Tambah Bukti**

- **Untuk gambar**: klik area unggah, pilih tangkapan layar. URL-nya terisi otomatis.
- **Untuk video**: tempel tautan YouTube pada kolom URL. Bentuk apa pun diterima —
  `youtube.com/watch?v=…`, `youtu.be/…`, atau `youtube.com/shorts/…`.
- **Keterangan**: teks yang muncul di bawah gambar.
- **Status Draft**: menyimpan bukti tanpa menayangkannya.

Jenis media (gambar atau video) dikenali otomatis dari URL — Anda tidak perlu memilihnya.

### D2. Membiarkan member mengisi sendiri (jalur member)

Bagikan tautan ini ke grup member Anda:

```
https://khoirulfajarid.github.io/producthub/#kirim
```

Tautan itu membuka form secara langsung. Member mengisi nama, pekerjaan,
testimoni, saran, email, nomor WhatsApp, foto profil, dan tangkapan layar bukti.

**Yang terjadi setelah mereka mengirim:**

1. Kiriman masuk ke **Dashboard → Pengajuan** dengan status *Perlu Diperiksa*
   (penanda angka muncul di sidebar)
2. Anda melihat semuanya dalam satu kartu — foto, testimoni, saran, kontak, dan bukti
3. Klik **Setujui & Tayangkan**, maka sekaligus:
   - testimoninya tampil di section **Testimoni** (dengan nama & fotonya)
   - gambar buktinya tampil di section **Bukti Nyata**
4. **Tolak** menyimpannya sebagai arsip tanpa menayangkan

**Tidak ada yang tayang tanpa persetujuan Anda.** Email, nomor HP, dan kolom
saran tidak pernah ikut ditampilkan ke publik — hanya Anda yang melihatnya.

Ingin menutup form sementara? **Pengaturan → Form Kiriman Member → Ditutup.**

### D3. Mengisi galeri popup produk

**Dashboard → Produk → Edit → bagian "Galeri Produk"**

- Unggah beberapa gambar sekaligus, atau
- Tempel tautan YouTube lalu klik **Tambah Video YouTube**

Semua URL muncul di kotak teks di bawahnya, **satu URL per baris**. Urutan baris
menentukan urutan slide. Hapus barisnya untuk membuang media itu.

Thumbnail produk otomatis menjadi slide pertama — tidak perlu ditambahkan lagi.

### D4. Mengatur animasi angka

**Pengaturan → Animasi Angka Statistik**

- **Aktif / Nonaktif** — matikan bila Anda ingin angka langsung tampil
- **Durasi** dalam milidetik: `2000` = 2 detik. Semakin kecil, semakin cepat.

Animasi menyala saat pengunjung menggulir sampai ke section itu, bukan saat
halaman dimuat — supaya benar-benar terlihat. Pengunjung yang mengaktifkan
*reduce motion* di perangkatnya langsung melihat angka final.

---

## E. Kalau Ada Masalah

| Gejala | Penyebab & Solusi |
|---|---|
| Dashboard: "Database perlu diperbarui" | `upgradeKeV3()` belum dijalankan — ulangi langkah A2 |
| "GAS_URL belum diisi" | `config.js` tertimpa placeholder — lihat peringatan di B1 |
| Menu Bukti Nyata & Pengajuan kosong terus | Wajar bila memang belum ada isinya. Coba tambah satu bukti lewat D1 |
| Situs masih terlihat versi lama | Cache browser — tekan **Ctrl+Shift+R** atau buka Incognito |
| Fitur baru tidak muncul sama sekali | Deployment belum diperbarui — ulangi A3 (**Edit → New version**) |
| Data tidak berubah padahal sudah disimpan | Cache 30 menit. Jalankan `resetCache()` di editor Apps Script |
| Landing page kosong setelah upgrade | URL `/exec` berubah karena memilih "New deployment". Salin URL barunya ke `config.js`, lalu push ulang |
| Gambar bukti tidak muncul | Berkasnya sudah dihapus dari Drive. Kotak abu-abu "Gambar tidak dapat dimuat" adalah penggantinya |
| Member melapor "Mohon tunggu sebentar" | Jeda antar kiriman 3 detik. Minta mereka coba lagi |
| Video YouTube tidak tampil | Videonya berstatus privat. Ubah menjadi "Unlisted" atau "Public" |

---

## F. Yang Perlu Anda Ketahui soal Keamanan

Form member adalah **satu-satunya** jalur tulis yang terbuka tanpa PIN — memang
harus begitu, karena pengunjung tidak punya PIN. Pengamannya:

- Kiriman **tidak pernah langsung tayang**; selalu lewat persetujuan Anda
- Hanya berkas gambar yang diterima, maksimal **3 MB** per gambar
- Panjang teks dibatasi 1.500 karakter per kolom
- Ada jeda 3 detik antar kiriman, memperlambat pengiriman beruntun
- Anda bisa menutup form kapan saja lewat Pengaturan

Yang tetap perlu Anda perhatikan: karena terbuka untuk publik, sesekali mungkin
ada kiriman iseng masuk ke antrean. Cukup klik **Hapus** — tidak ada yang
sampai ke halaman publik.

---

## G. Ringkasan Perintah

**Di editor Apps Script:**

| Fungsi | Kapan dijalankan |
|---|---|
| `upgradeKeV3()` | Sekali, saat upgrade ini |
| `ujiAPI()` | Untuk memastikan seluruh endpoint sehat |
| `resetCache()` | Bila landing page terasa tertinggal dari Sheets |
| `warmupCache()` | Sesudah deployment baru, agar pengunjung pertama tetap cepat |

**Di terminal, setiap kali mengubah berkas frontend:**

```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```

---

*ProductHub Creator v3 — frontend statis di GitHub Pages, backend REST API di Google Apps Script.*
