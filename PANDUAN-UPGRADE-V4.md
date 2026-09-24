# Panduan Upgrade ke v4 — Login Google, Notifikasi WA & Email, Migrasi Data

Repo Anda sudah terpasang dan sudah pernah di-push, jadi ini **bukan deploy dari nol**.
Tidak ada `git init`, tidak ada `git remote add`, tidak perlu membuat repo baru.

Perkiraan waktu: **30–40 menit**, sebagian besar untuk membuat Client ID Google (sekali saja seumur aplikasi).

> **Baca urutannya dulu.** Login PIN langsung mati begitu backend v4 aktif. Jadi siapkan
> Client ID Google (Tahap A) **sebelum** menjalankan migrasi di Apps Script (Tahap B) —
> kalau tidak, Anda akan sempat tidak bisa masuk dashboard sampai Tahap A selesai.

---

## Apa yang berubah

| # | Perubahan | Di mana |
|---|---|---|
| 1 | Notifikasi otomatis ke member via **WhatsApp (Fonnte)** dan **email** saat pengajuan disetujui, ditolak, atau dihapus — tiga pesan berbeda, bisa diedit, bisa dimatikan | Dashboard → **Notifikasi** |
| 2 | Section **Bukti Nyata** jadi **3 baris** yang berjalan lebih lambat, berlawanan arah | Landing page |
| 3 | Modul **Migrasi Data**: pindahkan isi app lama ke instalasi baru, aman diulang | Dashboard → **Migrasi Data** |
| 4 | Antarmuka tanpa jeda: halaman tampil dari salinan terakhir, aksi pengajuan langsung terlihat, refresh kembali ke menu yang sama | Landing & dashboard |
| 5 | Tombol panel admin **dihapus dari atas** (tetap ada di footer); **login wajib Google** | Landing & admin |

---

## Berkas yang Anda terima

| Berkas | Cara pakai |
|---|---|
| `producthub-v4-frontend.zip` | Diekstrak, isinya menimpa folder repo |
| `Kode.gs` | Disalin-tempel ke editor Apps Script — **tidak** ikut ke GitHub |
| Panduan ini | Dibaca sambil jalan |

> **`assets/js/config.js` sengaja tidak ada di ZIP.** Berkas itu menyimpan `GAS_URL` Anda,
> jadi tidak mungkin tertimpa. URL `/exec` juga tidak berubah — tidak perlu disentuh.

---

# TAHAP A — Buat Client ID Google (sekali saja)

Ini "kartu identitas" aplikasi Anda di mata Google. Tanpanya, tombol **Masuk dengan Google**
tidak bisa muncul.

## A1. Buka Google Cloud Console

Buka **https://console.cloud.google.com** dengan akun Google yang sama dengan pemilik Apps Script.

Di bagian atas, klik pemilih project → **New Project** → beri nama `ProductHub` → **Create**.
Pastikan project baru itu yang terpilih.

> Project apa pun boleh dipakai — tidak harus project yang sama dengan Apps Script Anda.

## A2. Layar persetujuan (consent screen)

Buka menu **APIs & Services → OAuth consent screen**. Di tampilan Google yang lebih baru,
namanya **Google Auth Platform** dengan sub-menu *Branding*, *Audience*, dan *Clients*.

Isi yang diminta saja:

| Kolom | Isi |
|---|---|
| App name | `ProductHub Admin` |
| User support email | email Anda |
| Audience / User type | **External** |
| Developer contact | email Anda |

Lalu satu dari dua pilihan ini — **wajib**, kalau tidak login akan ditolak Google:

- **Publish app** (menu *Audience* → *Publish app*). Aman: aplikasi ini hanya meminta nama,
  email, dan foto profil, jadi tidak perlu verifikasi Google.
- **atau** tetap mode *Testing* dan tambahkan setiap email admin di **Test users**.

## A3. Buat Client ID

Menu **Credentials → Create Credentials → OAuth client ID** (atau **Clients → Create client**
di tampilan baru).

| Kolom | Isi |
|---|---|
| Application type | **Web application** |
| Name | `ProductHub GitHub Pages` |
| Authorized JavaScript origins | `https://khoirulfajarid.github.io` |
| Authorized redirect URIs | **kosongkan** — tidak dipakai |

> ⚠️ Origin ditulis **tanpa** `/producthub/` di belakangnya dan **tanpa** garis miring
> penutup. Ini penyebab paling umum tombol Google gagal (galat `origin_mismatch`).

Klik **Create**. Salin **Client ID** — bentuknya seperti:

```
123456789012-abcdefghijk.apps.googleusercontent.com
```

Client ID **bukan rahasia** (memang tampil di halaman), jadi aman disimpan di Notepad.

---

# TAHAP B — Upgrade backend di Apps Script

## B1. Tempel Kode.gs yang baru

1. Buka proyek **Apps Script** Anda
2. Klik berkas `Kode.gs` → **Ctrl+A** → **Delete** → tempel isi `Kode.gs` yang baru
3. Di bagian atas berkas, cari dan isi:

```javascript
const GOOGLE_CLIENT_ID = '123456789012-abcdefghijk.apps.googleusercontent.com';
```

4. **Ctrl+S**

> Baris `ADMIN_EMAILS_AWAL` boleh dibiarkan kosong — email pemilik skrip otomatis menjadi
> admin pertama. Isi hanya bila ada admin lain sejak awal, misalnya
> `'kuliahbijak.official@gmail.com, rekan@gmail.com'`.

## B2. Jalankan migrasi

Pada dropdown fungsi di atas editor, pilih **`upgradeKeV4`** → **Run**.

Google akan meminta **izin baru**. Ini normal — v4 memakai dua layanan yang belum dipakai sebelumnya:

| Izin yang diminta | Untuk apa |
|---|---|
| *Connect to an external service* | Memeriksa token login ke Google & mengirim WA lewat Fonnte |
| *Send email as you* | Mengirim email notifikasi ke member |

Pilih akun Anda → **Advanced** → **Go to (nama proyek)** → **Allow**.

Tanda berhasil di **Execution log**:

```
✅ MIGRASI v4 SELESAI
   • Sheet "LogNotifikasi" dibuat.
   • Kolom NoHP di Pengajuan diformat teks.
   • 15 pengaturan baru ditambahkan.
   • Semua sesi lama diputus — silakan masuk ulang dengan Google.

🔐 Google Client ID : 123456789012-abcdefghijk.apps.googleusercontent.com
👤 Admin terdaftar  : kuliahbijak.official@gmail.com
```

> Kalau baris Client ID bertuliskan **❌ BELUM DIISI**, ulangi B1 langkah 3 lalu jalankan
> `upgradeKeV4` sekali lagi. Fungsi ini aman diulang — tidak ada data yang dobel atau terhapus.

## B3. Deploy versi baru

**Deploy → Manage deployments →** ikon **pensil** → Version: **New version** → **Deploy**.

> Langkah yang paling sering terlewat. Tanpa *New version*, Apps Script tetap menjalankan
> kode lama meski sudah disimpan.

---

# TAHAP C — Push frontend ke GitHub

## C1. Timpa berkas

1. Ekstrak `producthub-v4-frontend.zip`
2. Buka folder hasil ekstraksi → **Ctrl+A** → **Ctrl+C**
3. Buka folder repo:
   ```
   C:\Users\stisa\Documents\12 – APLIKASI GITHUB\producthub\producthub
   ```
4. **Ctrl+V** → **Replace the files in the destination**

## C2. Kirim lewat terminal

Buka PowerShell di folder repo (klik address bar File Explorer → ketik `powershell` → Enter).

```powershell
dir
```
Wajib terlihat `index.html`, `admin.html`, dan folder `assets`. Kalau yang muncul justru folder
`producthub`, jalankan `cd producthub` dulu.

```powershell
git status
```
Yang muncul di bawah `modified:` harus 7 berkas: `index.html`, `admin.html`,
`assets/css/style.css`, dan empat berkas di `assets/js/` — **tanpa** `config.js`.

```powershell
git add .
git commit -m "Upgrade v4 - login Google, notifikasi WA & email, migrasi data"
git push
```

Tanda berhasil: `Writing objects: 100%` lalu `main -> main`. Bila diminta password, tempel
**Personal Access Token** (layar memang tampak kosong saat menempel — itu normal).

Tunggu 1–2 menit, lalu buka situs dan tekan **Ctrl+Shift+R**.

---

# TAHAP D — Masuk dengan Google

1. Buka `https://khoirulfajarid.github.io/producthub/admin.html`
2. Klik **Masuk dengan Google** → pilih akun admin
3. Dashboard terbuka, email Anda tampil di pojok kanan atas

**Tambah admin lain:** Dashboard → **Pengaturan → Akses Admin** → tulis emailnya → Simpan.
Email yang dicoret langsung kehilangan akses, termasuk sesi yang sedang terbuka di HP lain.

---

# TAHAP E — Nyalakan notifikasi member

## E1. WhatsApp lewat Fonnte

1. Daftar di **https://fonnte.com**, lalu hubungkan nomor WhatsApp pengirim dengan memindai
   kode QR (seperti WhatsApp Web)
2. Di dashboard Fonnte buka menu **Device**, salin **Token** perangkat Anda
3. Di dashboard ProductHub: **Notifikasi → WhatsApp Gateway** → tempel token

> Token disimpan di server dan **tidak pernah ditampilkan ulang** — dashboard hanya
> menunjukkan 4 karakter terakhirnya. Mengosongkan kolom ini saat menyimpan = token lama
> tetap dipakai.

## E2. Email

Cukup ubah **Kirim notifikasi email** menjadi **Aktif**. Email dikirim dari akun Google pemilik
skrip, dan balasan member masuk ke **Email Admin** di menu Pengaturan.

> Akun Gmail biasa dibatasi Google sekitar **100 email per hari**. Lebih dari cukup untuk
> notifikasi testimoni.

## E3. Alamat situs

Isi **Alamat situs Anda** dengan `https://khoirulfajarid.github.io/producthub/` — ini yang
menggantikan penanda `{situs}` di pesan.

## E4. Uji sebelum menyalakan

1. Pilih tab templat (**Disetujui / Ditolak / Dihapus**)
2. Di **Uji kirim**, pilih WhatsApp, isi nomor Anda sendiri → **Kirim Uji**
3. Ulangi dengan Email

Uji kirim tetap jalan walau saklar masih **Nonaktif**, dan memakai isi kolom yang belum
disimpan. Setelah pesan uji sampai, ubah saklar ke **Aktif** → **Simpan Notifikasi**.

## E5. Mengedit templat

Setiap peristiwa punya tiga isian: pesan WhatsApp, subjek email, dan isi email. Klik penanda
untuk menyisipkannya di posisi kursor:

| Penanda | Diganti dengan |
|---|---|
| `{nama}` | nama member |
| `{jabatan}` | pekerjaan/asal member |
| `{tanggal}` | tanggal kiriman, misal *20 September 2026* |
| `{testimoni}` | cuplikan testimoni (maks. 160 karakter) |
| `{brand}` | nama aplikasi dari Pengaturan |
| `{situs}` | alamat situs dari E3 |

Di WhatsApp, `*teks*` jadi **tebal** dan `_teks_` jadi *miring*. Di email, `*teks*` juga ditebalkan.

## Cara kerjanya saat memproses pengajuan

Setiap kali Anda menekan **Setujui**, **Tolak**, atau **Hapus**, modal konfirmasi menampilkan:

> ☑ **Kirim notifikasi ke Alfian Haga**
> Lewat WhatsApp 081234567890 dan email alfian@contoh.com.

Centang aktif secara bawaan. **Lepas centangnya untuk kiriman spam** — supaya pengirim spam
tidak ikut menerima pesan. Kotak ini tidak muncul bila member tidak meninggalkan kontak apa pun.

Hasil pengiriman tampil di notifikasi setelah aksi selesai, dan tercatat di
**Notifikasi → Riwayat Pengiriman** (sheet `LogNotifikasi`). Kalau pengiriman gagal —
misalnya perangkat Fonnte terputus — pengajuannya **tetap** diproses; kirim ulang lewat tombol
**Kirim ulang notifikasi** di kartu pengajuan setelah masalahnya beres.

---

# TAHAP F — Migrasi Data (opsional)

**Tidak perlu** bila Anda upgrade di tempat seperti panduan ini — data lama sudah ada di
spreadsheet yang sama.

Gunakan menu **Migrasi Data** bila Anda memasang ProductHub **dari nol** (proyek Apps Script
dan spreadsheet baru) — misalnya untuk klien baru, atau ingin memulai bersih — dan ingin isi
app lama ikut pindah.

1. Pasang instalasi baru: `setupAppEnvironment()` → Deploy → login Google
2. Dashboard → **Migrasi Data** → tempel URL spreadsheet app lama
3. **Pindai** → periksa tabel: berapa yang akan ditambah, diperbarui, dilewati
4. **Jalankan Import** → cek produk, testimoni, gambar, pengaturan
5. **Tepat sebelum pindah alamat, jalankan import sekali lagi** — kiriman yang masuk ke app
   lama selama transisi ikut terbawa, tanpa ada yang dobel
6. Ganti `GAS_URL` di `config.js` ke URL `/exec` instalasi baru, push

Yang dijamin modul ini:

- Spreadsheet lama **hanya dibaca** — app lama tetap berjalan selama transisi
- **Aman diulang**: import kedua menambah 0 baris
- Pengajuan yang sudah Anda setujui/tolak di app baru **tidak ditimpa** status lama
- Nomor WA member tetap diawali 0, walau di spreadsheet lama sudah berubah jadi angka
- Pengaturan lama dipakai bila di app baru masih bernilai bawaan
- Statistik digabung dengan nilai **terbesar**, bukan dijumlah — import ulang tidak menggelembungkan angka

Yang **tidak** ikut pindah: sesi login, PIN lama, dan berkas gambar (tautannya dipakai ulang,
jadi gambar tetap tampil selama berkas aslinya di Drive tidak dihapus).

---

# Periksa hasilnya

Setelah Ctrl+Shift+R:

- [ ] Landing: ikon perisai (panel admin) **tidak ada** lagi di kanan atas; tautan **Panel Admin** ada di footer
- [ ] Landing: **Bukti Nyata** tampil 3 baris, bergerak pelan berlawanan arah
- [ ] Buka landing kedua kalinya → isi halaman muncul seketika, tanpa layar memuat
- [ ] `admin.html` → hanya ada tombol **Masuk dengan Google**, tidak ada kolom PIN
- [ ] Setujui satu pengajuan uji → modal menawarkan centang notifikasi → WA & email sampai
- [ ] Refresh halaman admin saat di menu Notifikasi → tetap di menu Notifikasi, data langsung tampil

---

# Kalau ada yang tidak beres

| Yang terjadi | Penyebab | Solusi |
|---|---|---|
| Tombol Google tidak muncul, ada pesan "belum dikonfigurasi" | Client ID belum masuk ke sheet | Isi `GOOGLE_CLIENT_ID`, jalankan `upgradeKeV4`, Deploy **New version** |
| Popup Google menampilkan `origin_mismatch` | Origin di Tahap A3 salah | Harus persis `https://khoirulfajarid.github.io` — tanpa path, tanpa `/` |
| Google menolak dengan `access_denied` | Consent screen masih *Testing* | Tahap A2: **Publish app**, atau tambahkan email Anda di *Test users* |
| "Akun … tidak terdaftar sebagai admin" | Email belum ada di daftar | Tambahkan lewat admin lain, atau lihat *Terkunci* di bawah |
| Tombol Google tidak termuat sama sekali | Pemblokir iklan/skrip | Izinkan `accounts.google.com` untuk situs Anda |
| WA "gagal (invalid token)" | Token Fonnte salah/kedaluwarsa | Salin ulang dari menu Device di Fonnte |
| WA "gagal (device disconnected)" | Nomor pengirim terputus dari Fonnte | Pindai ulang QR di dashboard Fonnte |
| Email "kuota harian habis" | Batas harian Gmail | Tunggu besok — pesan WA tetap jalan |
| Tidak ada centang notifikasi di modal | Kedua kanal nonaktif, atau member tak meninggalkan kontak | Nyalakan di menu Notifikasi |
| Menu Notifikasi kosong & muncul peringatan kuning | `upgradeKeV4` belum dijalankan | Tahap B2 |
| Situs masih tampilan lama | Cache browser | **Ctrl+Shift+R** atau jendela Incognito |

## Kalau terkunci dari dashboard

1. Buka spreadsheet database di Google Sheets → sheet **AppConfig**
2. Cari baris **adminEmails** → tulis email Anda di kolom Value
3. Di editor Apps Script jalankan **`resetCache`**
4. Masuk lagi dengan Google

Client ID ada di baris **googleClientId** — sengaja tidak bisa diubah dari dashboard, supaya
salah ketik tidak mengunci semua admin sekaligus.

**Memutus semua sesi** (misalnya HP admin hilang): jalankan **`resetSemuaSesi`** di editor.
Semua admin perlu masuk ulang dengan Google.

---

# Diuji sebelum diserahkan

**Backend (37 kasus)** — `Kode.gs` dijalankan di tiruan Apps Script yang meniru kebiasaan
Sheets menghapus angka 0 di depan nomor: pindai tidak menulis, import ulang menambah 0,
delta sync, keputusan app baru tidak ditimpa, statistik tidak menggelembung, token untuk
Client ID lain ditolak, email yang dicoret langsung kehilangan akses, rahasia tidak bocor
ke halaman publik, tiga templat berbeda terkirim, centang dilepas = tidak ada yang terkirim,
Fonnte gagal tidak menggagalkan aksi.

**Ujung-ke-ujung (46 kasus)** — browser Chromium sungguhan terhadap `Kode.gs` yang sama,
di 1440px dan 375px: login Google, aksi pengajuan tampil dalam < 600 ms walau server
lambat 1,5 detik, dikembalikan bila server menolak, landing tampil dari salinan walau
server lambat 3 detik, 3 baris bukti berisi gambar berbeda, migrasi pindai → import,
tanpa galat JavaScript.
