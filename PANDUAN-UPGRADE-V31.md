# Panduan Upgrade ke v3.1 — lewat Terminal

Repo Anda sudah terpasang dan sudah pernah di-push. Jadi ini **bukan** deploy dari nol —
tidak ada `git init`, tidak ada `git remote add`, tidak perlu bikin repo baru. Yang Anda
lakukan hanya: **timpa berkas → 3 perintah git → upgrade backend**.

Total waktu sekitar 10 menit.

---

## Apa yang berubah di v3.1

| Perubahan | Terlihat di mana |
|---|---|
| Tombol **Mulai Sekarang** bisa diarahkan ke tautan apa pun (Lynk.id, toko, halaman bayar) | Hero & navbar |
| Tombol **Hubungi Admin** — chat WhatsApp atau kirim email lewat form | Hero, penutup, footer |
| Kartu testimoni bertinggi tetap + tombol **Baca selengkapnya** | Section Testimoni |
| Label tombol konfirmasi diperbaiki (dulu selalu tertulis "Hapus") | Dashboard → Pengajuan |

---

## Berkas yang Anda terima

| Berkas | Cara pakai |
|---|---|
| `producthub-v31-frontend.zip` | Diekstrak, isinya menimpa folder repo |
| `Kode.gs` | Disalin-tempel ke editor Apps Script (**tidak** ikut ke GitHub) |
| Panduan ini | Dibaca sambil jalan |

> **`assets/js/config.js` sengaja tidak ada di dalam ZIP.** Berkas itu menyimpan `GAS_URL`
> Anda. Karena tidak disertakan, ia tidak mungkin tertimpa — URL Apps Script Anda aman
> tanpa perlu Anda lakukan apa pun.

---

# TAHAP A — Timpa berkas di folder repo

## A1. Ekstrak ZIP

Klik kanan `producthub-v31-frontend.zip` → **Extract All** → pilih folder mana saja
(misalnya Downloads). Hasilnya sebuah folder berisi `index.html`, `admin.html`, dan
folder `assets`.

## A2. Salin ke folder repo

Folder repo Anda ada di:

```
C:\Users\stisa\Documents\12 – APLIKASI GITHUB\producthub\producthub
```

> Perhatikan ada **`producthub` dua kali**. Yang benar adalah yang paling dalam — itu
> hasil `git clone` Anda kemarin, dan di dalamnya ada folder tersembunyi `.git`.

Caranya:

1. Buka folder hasil ekstraksi ZIP
2. Tekan **Ctrl+A** (pilih semua) lalu **Ctrl+C** (salin)
3. Buka folder repo di atas
4. Tekan **Ctrl+V** (tempel)
5. Muncul kotak dialog **"Replace the files in the destination?"** → klik
   **Replace the files in the destination**

Selesai. Berkas lama sudah terganti isi baru.

---

# TAHAP B — Push ke GitHub

## B1. Buka PowerShell di folder repo

Cara tercepat: buka folder repo di File Explorer, klik **address bar** di atas,
ketik `powershell`, lalu Enter. PowerShell terbuka tepat di folder itu.

## B2. Pastikan Anda di folder yang benar

```powershell
dir
```

Yang **wajib** terlihat: `index.html`, `admin.html`, folder `assets`, folder `backend`.

> Kalau yang muncul justru satu folder bernama `producthub`, berarti Anda masih di
> folder induk. Jalankan `cd producthub` dulu, lalu `dir` lagi.
>
> Gerbang ini penting: git akan menerima folder yang salah **tanpa protes sedikit pun**,
> dan Anda baru sadar setelah situs jadi 404.

## B3. Lihat berkas apa saja yang berubah

```powershell
git status
```

Harusnya muncul 7 berkas di bawah `modified:` — `index.html`, `admin.html`,
`assets/css/style.css`, dan empat berkas di `assets/js/`.

> `assets/js/config.js` **tidak boleh** ikut muncul di daftar. Kalau ternyata muncul,
> berarti config.js Anda ikut tertimpa — buka berkas itu dan isi ulang `GAS_URL`
> sebelum lanjut.

## B4. Kirim ke GitHub

Tiga perintah, jalankan berurutan:

```powershell
git add .
```

> Ada **titik** di akhir — artinya "semua berkas di folder ini". Tanpa output = berhasil.

```powershell
git commit -m "Upgrade v3.1 - CTA Lynk, Hubungi Admin, kartu testimoni"
```

> Muncul daftar berkas dan angka `7 files changed`.

```powershell
git push
```

> Muncul `Writing objects: 100%` lalu baris berisi `main -> main`. Itu tandanya berhasil.

**Kalau diminta username & password:**
- Username: `khoirulfajarid`
- Password: **Personal Access Token** Anda (bukan password akun GitHub)

> Saat mengetik/paste token, **layar terlihat kosong** — tidak ada bintang atau karakter
> apa pun. Itu normal. Paste (klik kanan), lalu tekan Enter.

**Warning `LF will be replaced by CRLF`** boleh diabaikan sepenuhnya. Itu peringatan soal
format baris Windows vs Linux, bukan error, dan berkasnya tetap berfungsi normal.

---

# TAHAP C — Upgrade backend di Apps Script

Frontend baru memanggil dua hal yang belum ada di backend lama: endpoint `kirimPesan`
dan sheet `Pesan`. Tanpa tahap ini, tombol Hubungi Admin akan menolak kiriman.

## C1. Tempel Kode.gs yang baru

1. Buka proyek **Apps Script** Anda
2. Klik berkas `Kode.gs`
3. **Ctrl+A** → **Delete** → tempel isi `Kode.gs` yang baru → **Ctrl+S**

> `ADMIN_PIN_DEFAULT` di baris atas **tidak perlu** Anda ubah. PIN Anda yang sekarang
> tersimpan di sheet AppConfig, bukan di kode ini.

## C2. Jalankan migrasi

Di bagian atas editor, pada dropdown pilihan fungsi, pilih **`upgradeKeV31`** →
klik **Run**.

Lihat panel **Execution log** di bawah. Tandanya berhasil:

```
✅ MIGRASI v3.1 SELESAI
   • Sheet "Pesan" dibuat.
   • Kolom "LinkCTA" sudah ada — dilewati.
   • 4 pengaturan baru ditambahkan.
```

> Fungsi ini **hanya menambah**: satu sheet baru, empat baris pengaturan, dan satu kolom
> bila belum ada. Tidak ada satu pun data lama yang dihapus atau ditimpa, dan aman
> dijalankan berkali-kali kalau Anda ragu apakah tadi sudah jalan.

## C3. Deploy versi baru

**Deploy** → **Manage deployments** → klik ikon **pensil** (Edit) →
pada dropdown **Version** pilih **New version** → **Deploy**.

> Langkah ini sering terlewat. Tanpa "New version", Apps Script masih menyajikan kode
> lama meski Anda sudah menyimpannya. URL `/exec` Anda **tidak berubah**, jadi
> `config.js` tidak perlu disentuh.

---

# TAHAP D — Isi pengaturan baru di dashboard

Buka `admin.html` di situs Anda, masuk dengan PIN.

## D1. Konten Hero → Link Tombol Utama

Tempel tautan Lynk.id Anda, misalnya:

```
https://lynk.id/kuliahbijak
```

Klik **Simpan Konten**. Sekarang tombol **Mulai Sekarang** di hero dan navbar mengarah
ke sana.

> Dikosongkan, tombol hero kembali menggulir ke daftar produk seperti sebelumnya —
> jadi tidak ada yang rusak kalau Anda belum siap mengisinya.

## D2. Pengaturan → Email Admin & Nomor WhatsApp

| Kolom | Isi | Menyalakan apa |
|---|---|---|
| **Email Admin** | `kuliahbijak.official@gmail.com` | Form kirim pesan di modal Hubungi Admin |
| **Nomor WhatsApp** | `62…` (tanpa tanda + dan tanpa 0 di depan) | Tombol "Chat WhatsApp Admin" |

Klik **Simpan Pengaturan**.

> Kalau keduanya dikosongkan, seluruh tombol **Hubungi Admin** otomatis disembunyikan.
> Ini disengaja — tombol yang tidak menuju ke mana pun lebih buruk daripada tidak ada.

---

# TAHAP E — Verifikasi

Tunggu 1–2 menit setelah push, lalu buka situs Anda dan tekan **Ctrl+Shift+R**
(hard refresh — memaksa browser memuat JavaScript baru, bukan versi cache).

Periksa satu per satu:

- [ ] Tombol **Mulai Sekarang** di navbar → membuka Lynk.id Anda di tab baru
- [ ] Tombol **Hubungi Admin** di hero → modal terbuka
- [ ] Di dalam modal ada **Chat WhatsApp Admin** dan form Nama/Email/Pesan
- [ ] Kirim pesan uji coba ke diri sendiri → muncul layar "Pesan terkirim"
- [ ] Email masuk ke inbox Anda, dan barisnya tercatat di sheet **Pesan**
- [ ] Kartu testimoni **sama tinggi semua**, yang panjang punya **Baca selengkapnya**
- [ ] Dashboard → Pengajuan → klik **Setujui & Tayangkan** → tombol konfirmasinya
      sekarang bertuliskan **"Setujui & Tayangkan"** warna hitam, bukan "Hapus" merah

---

# Kalau ada yang tidak beres

| Yang terjadi | Penyebab | Solusi |
|---|---|---|
| Situs masih tampilan lama | Cache browser | **Ctrl+Shift+R**, atau buka jendela Incognito |
| Tombol Hubungi Admin tidak muncul | Email Admin & Nomor WA masih kosong | Isi salah satu di Dashboard → Pengaturan |
| Kirim pesan gagal: *"Form kontak belum siap"* | `upgradeKeV31()` belum dijalankan | Ulangi Tahap C2 |
| Kirim pesan berhasil tapi email tidak masuk | Kuota email harian Apps Script habis | Pesan tetap aman di sheet **Pesan** — cek di sana |
| Tombol Mulai Sekarang masih menggulir ke produk | Link Tombol Utama masih kosong | Isi di Dashboard → Konten Hero |
| Data tidak muncul sama sekali | `config.js` ikut tertimpa | Buka `assets/js/config.js`, isi ulang `GAS_URL` dengan URL `/exec` Anda |
| Situs 404 | Yang di-push folder induk, bukan folder repo | Ulangi Tahap B2 — pastikan `dir` menampilkan `index.html` |
| `git push` ditolak token | Token kadaluarsa | Buat token baru di github.com/settings/tokens, centang scope **repo** |
| `Updates were rejected` | Ada perubahan di GitHub yang belum ada di lokal | `git pull --rebase` lalu `git push` lagi |

---

# Ringkasan perintah

Untuk setiap update berikutnya, cukup tiga baris ini dari folder repo:

```powershell
git add .
git commit -m "Deskripsi singkat perubahan"
git push
```

GitHub Pages otomatis membangun ulang dalam 1–2 menit.

---

## Glosarium singkat

- **Commit** — menyimpan perubahan beserta catatannya; seperti "Save" tapi tercatat riwayatnya
- **Push** — mengirim commit dari komputer ke GitHub; seperti "Upload"
- **Personal Access Token** — password khusus dari GitHub untuk operasi git lewat terminal;
  GitHub tidak lagi menerima password akun biasa
- **Hard refresh** (Ctrl+Shift+R) — memaksa browser mengunduh ulang CSS & JavaScript
  alih-alih memakai salinan lama di cache
