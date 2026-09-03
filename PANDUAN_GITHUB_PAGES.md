# Panduan Lengkap: Deploy ProductHub ke GitHub Pages

**Untuk pemula yang belum pernah pakai GitHub sama sekali.**

---

## Daftar Isi

1. Apa itu GitHub & GitHub Pages?
2. Membuat Akun GitHub
3. Menginstal Git di Komputer
4. Menyiapkan Git Pertama Kali
5. Membuat Repository Baru
6. Mengunggah File Proyek
7. Mengaktifkan GitHub Pages
8. Mengakses Situs Anda
9. Cara Update / Deploy Ulang
10. Mengatasi Masalah Umum

---

## 1. Apa itu GitHub & GitHub Pages?

**GitHub** = tempat menyimpan kode/file proyek secara online (seperti Google Drive, tapi khusus untuk kode).

**GitHub Pages** = fitur gratis dari GitHub yang mengubah file HTML/CSS/JS di repository Anda menjadi website yang bisa diakses siapa saja.

**Repository (repo)** = folder proyek Anda di GitHub.

**Git** = software di komputer Anda untuk mengirim file ke GitHub.

Jadi alurnya:
```
File di komputer Anda
       ↓ (git push)
GitHub Repository
       ↓ (otomatis)
Website GitHub Pages (bisa diakses publik)
```

---

## 2. Membuat Akun GitHub

1. Buka **https://github.com**
2. Klik **Sign up**
3. Isi:
   - **Email** → email aktif Anda
   - **Password** → minimal 8 karakter
   - **Username** → pilih nama unik (ini akan jadi bagian URL situs Anda nanti, contoh: `username.github.io`)
4. Verifikasi email Anda (cek inbox, klik link konfirmasi)
5. Selesai — Anda sudah punya akun GitHub

---

## 3. Menginstal Git di Komputer

### Windows

1. Buka **https://git-scm.com/download/win**
2. Download akan otomatis dimulai
3. Jalankan installer, klik **Next** terus sampai selesai (pakai pengaturan default saja)
4. Setelah selesai, buka **Start Menu** → cari **Git Bash** → buka
5. Ketik perintah ini untuk memastikan Git terinstal:
   ```
   git --version
   ```
   Jika muncul `git version 2.xx.x` → berhasil!

### Mac

1. Buka **Terminal** (cari di Spotlight dengan Cmd+Space, ketik "Terminal")
2. Ketik:
   ```
   git --version
   ```
3. Jika belum terinstal, Mac akan otomatis menawarkan instalasi → klik **Install**
4. Tunggu selesai, lalu ketik `git --version` lagi untuk memastikan

### Linux (Ubuntu/Debian)

```
sudo apt update
sudo apt install git
```

---

## 4. Menyiapkan Git Pertama Kali

Buka **Git Bash** (Windows) atau **Terminal** (Mac/Linux), lalu jalankan 2 perintah ini (ganti dengan data Anda):

```bash
git config --global user.name "Nama Anda"
git config --global user.email "email@anda.com"
```

Contoh:
```bash
git config --global user.name "Budi Santoso"
git config --global user.email "budi@gmail.com"
```

**Gunakan email yang sama** dengan yang Anda pakai untuk daftar GitHub.

Ini hanya perlu dilakukan **sekali saja** — tidak perlu diulang untuk proyek berikutnya.

---

## 5. Membuat Repository Baru di GitHub

1. Login ke **https://github.com**
2. Klik tombol **+** di pojok kanan atas → **New repository**
3. Isi formulir:
   - **Repository name**: `producthub` (atau nama lain yang Anda mau)
   - **Description**: `Landing page produk digital` (opsional)
   - **Visibility**: pilih **Public** (wajib Public supaya GitHub Pages gratis)
   - **JANGAN** centang "Add a README file"
   - **JANGAN** centang "Add .gitignore"
   - **JANGAN** centang "Choose a license"
4. Klik **Create repository**
5. Akan muncul halaman instruksi — **biarkan halaman ini terbuka**, kita akan pakai URL-nya nanti

---

## 6. Mengunggah File Proyek ke GitHub

### Langkah A — Buka Terminal di Folder Proyek

Pertama, pastikan Anda sudah mengekstrak file `producthub-api.zip` di komputer Anda. Misalnya ke folder `C:\Users\Budi\producthub` (Windows) atau `~/producthub` (Mac/Linux).

**Windows:**
1. Buka **File Explorer**, masuk ke folder `producthub`
2. Klik kanan di area kosong → **Open Git Bash here**

   Atau buka Git Bash lalu ketik:
   ```bash
   cd /c/Users/Budi/producthub
   ```
   (sesuaikan dengan lokasi folder Anda)

**Mac/Linux:**
```bash
cd ~/producthub
```

### Langkah B — Pastikan Anda di Folder yang Benar

Ketik:
```bash
ls
```

Anda harus melihat daftar file seperti ini:
```
index.html  admin.html  assets/  backend/  robots.txt  sitemap.xml  ...
```

Jika tidak melihat `index.html`, berarti Anda belum di folder yang tepat. Navigasi ke folder yang benar dulu.

### Langkah C — Pastikan config.js Sudah Diisi

Sebelum upload, pastikan file `assets/js/config.js` sudah berisi URL GAS Anda yang benar:

```javascript
GAS_URL: 'https://script.google.com/macros/s/XXXXXXX/exec',
```

Ganti `XXXXXXX` dengan ID deployment Anda dari Google Apps Script.

### Langkah D — Pastikan URL di index.html Sudah Benar

Buka `index.html` dengan text editor (Notepad, VS Code, dll), cari dan ganti semua URL yang mengandung `username.github.io` dengan URL GitHub Pages Anda yang sebenarnya:

```
https://USERNAME.github.io/producthub/
```

Ganti `USERNAME` dengan username GitHub Anda. URL ini muncul di beberapa tempat:
- `<link rel="canonical" href="...">`
- `<meta property="og:url" content="...">`
- `<meta property="og:image" content="...">`
- bagian `JSON-LD` di bawah

Lakukan hal yang sama di `robots.txt` dan `sitemap.xml`.

### Langkah E — Inisialisasi Git dan Push

Jalankan perintah ini **satu per satu** (copy-paste baris per baris):

```bash
git init
```
→ Membuat folder ini menjadi proyek Git.

```bash
git add .
```
→ Menandai semua file untuk diunggah. (Ada titik di belakang `add`, jangan lupa.)

```bash
git commit -m "Upload pertama ProductHub"
```
→ Menyimpan snapshot file-file Anda.

```bash
git branch -M main
```
→ Memastikan branch utama bernama `main`.

```bash
git remote add origin https://github.com/USERNAME/producthub.git
```
→ **Ganti `USERNAME`** dengan username GitHub Anda. URL ini bisa Anda salin dari halaman repository yang tadi dibuka di langkah 5.

```bash
git push -u origin main
```
→ Mengirim semua file ke GitHub.

**Saat pertama kali push**, Git akan meminta login:
- Akan muncul jendela login GitHub di browser → klik **Authorize**
- Atau diminta username & password. Untuk password, **gunakan Personal Access Token** (bukan password akun GitHub — lihat bagian di bawah).

### Cara Membuat Personal Access Token

GitHub tidak lagi menerima password biasa untuk push. Anda perlu token:

1. Login ke GitHub → klik foto profil pojok kanan atas → **Settings**
2. Scroll ke bawah di sidebar kiri → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**
4. Isi:
   - **Note**: `producthub` (atau apa saja sebagai pengingat)
   - **Expiration**: pilih `90 days` atau `No expiration`
   - **Centang**: `repo` (cukup centang ini saja)
5. Klik **Generate token**
6. **SALIN TOKEN YANG MUNCUL** (hanya ditampilkan sekali!) — simpan di Notepad
7. Saat Git meminta password, **paste token ini** (bukan password GitHub Anda)

---

## 7. Mengaktifkan GitHub Pages

1. Buka repository Anda di browser: `https://github.com/USERNAME/producthub`
2. Klik tab **Settings** (ikon gerigi, di deretan menu atas repo)
3. Di sidebar kiri, klik **Pages**
4. Di bagian **Build and deployment**:
   - **Source**: pilih **Deploy from a branch**
   - **Branch**: pilih **main**
   - **Folder**: pilih **/ (root)**
5. Klik **Save**
6. Tunggu 1–2 menit. Refresh halaman Settings → Pages
7. Di bagian atas akan muncul:
   ```
   Your site is live at https://USERNAME.github.io/producthub/
   ```

**Selamat! Situs Anda sudah online!** 🎉

---

## 8. Mengakses Situs Anda

Setelah GitHub Pages aktif, situs Anda bisa diakses di:

| Halaman | URL |
|---|---|
| Landing page | `https://USERNAME.github.io/producthub/` |
| Dashboard admin | `https://USERNAME.github.io/producthub/admin.html` |

Ganti `USERNAME` dengan username GitHub Anda.

**Tips:** Bookmark kedua URL ini agar mudah diakses.

---

## 9. Cara Update / Deploy Ulang

Setiap kali Anda mengubah file apa pun dan ingin perubahan itu tampil di website, lakukan 3 langkah ini:

### Langkah 1 — Buka Terminal di Folder Proyek

Sama seperti langkah 6A di atas.

### Langkah 2 — Cek File yang Berubah

```bash
git status
```

Akan muncul daftar file yang berubah (berwarna merah). Contoh:
```
modified:   index.html
modified:   assets/js/config.js
```

### Langkah 3 — Kirim Perubahan

```bash
git add .
git commit -m "Deskripsi perubahan Anda"
git push
```

Ganti `"Deskripsi perubahan Anda"` dengan penjelasan singkat. Contoh:
```bash
git add .
git commit -m "Perbaiki URL kanonik di index.html"
git push
```

Tunggu 1–2 menit, lalu buka situs Anda — perubahan sudah tayang!

**Jika halaman masih menampilkan versi lama** → tekan **Ctrl+Shift+R** (hard refresh) untuk membersihkan cache browser.

### Rangkuman Perintah Update

```bash
git add .                           # Tandai semua perubahan
git commit -m "Pesan perubahan"     # Simpan snapshot
git push                            # Kirim ke GitHub → otomatis deploy
```

Tiga perintah ini akan Anda pakai berulang kali setiap ada perubahan. Hafalkan atau simpan catatannya.

---

## 10. Mengatasi Masalah Umum

### "fatal: not a git repository"
**Penyebab:** Anda belum menjalankan `git init` di folder ini, atau terminal Anda terbuka di folder yang salah.

**Solusi:** Pastikan Anda di folder yang benar (`cd path/ke/producthub`), lalu jalankan `git init` jika belum.

---

### "error: remote origin already exists"
**Penyebab:** `git remote add origin ...` sudah pernah dijalankan.

**Solusi:** Tidak masalah — lanjutkan ke perintah berikutnya (`git push`). Atau kalau URL-nya salah:
```bash
git remote set-url origin https://github.com/USERNAME/producthub.git
```

---

### "rejected — failed to push"
**Penyebab:** Ada perubahan di GitHub yang belum ada di komputer Anda (misalnya Anda mengedit file langsung di github.com).

**Solusi:**
```bash
git pull origin main --rebase
git push
```

---

### "Authentication failed" saat push
**Penyebab:** Password atau token salah/kedaluwarsa.

**Solusi:** Buat Personal Access Token baru (lihat langkah 6E di atas), lalu coba push lagi.

---

### Halaman kosong / 404 setelah mengaktifkan Pages
**Penyebab:** Branch atau folder salah, atau belum push file.

**Solusi:**
1. Cek Settings → Pages → pastikan **branch: main**, folder: **/ (root)**
2. Pastikan `index.html` ada di **root** repository (bukan di dalam subfolder)
3. Buka tab **Actions** di repo → lihat apakah ada deployment yang gagal

---

### "GAS_URL belum diisi" saat membuka landing page
**Penyebab:** File `assets/js/config.js` masih berisi URL placeholder.

**Solusi:** Edit `config.js`, isi URL GAS yang benar, lalu:
```bash
git add .
git commit -m "Isi GAS_URL yang benar"
git push
```

---

### Website sudah update tapi masih tampil versi lama
**Penyebab:** Cache browser.

**Solusi:**
- Tekan **Ctrl+Shift+R** (Windows/Linux) atau **Cmd+Shift+R** (Mac)
- Atau buka di jendela **Incognito/Private**

---

### Galat CORS di Console browser
**Penyebab:** Deployment GAS belum di-set "Anyone" atau URL salah.

**Solusi:** Pastikan deployment GAS menggunakan:
- Execute as: **Me**
- Who has access: **Anyone**

Jika sudah benar tapi masih error, buat **New deployment** baru dan update URL di `config.js`.

---

## Glosarium untuk Pemula

| Istilah | Artinya |
|---|---|
| **Repository (repo)** | Folder proyek di GitHub |
| **Branch** | Versi/cabang dari proyek (kita pakai `main`) |
| **Commit** | Menyimpan snapshot perubahan (seperti "Save" dengan catatan) |
| **Push** | Mengirim commit dari komputer ke GitHub |
| **Pull** | Mengambil perubahan dari GitHub ke komputer |
| **Clone** | Mengunduh seluruh repo dari GitHub ke komputer |
| **Deploy** | Menerbitkan/menayangkan website |
| **Terminal** | Aplikasi untuk mengetik perintah (Git Bash di Windows) |

---

## Checklist Sebelum Deploy

- [ ] `assets/js/config.js` → GAS_URL sudah diisi URL `/exec` yang benar
- [ ] `index.html` → URL canonical, og:url, og:image sudah diganti
- [ ] `robots.txt` → URL sudah diganti
- [ ] `sitemap.xml` → URL sudah diganti
- [ ] `backend/Kode.gs` → ADMIN_PIN_DEFAULT sudah diganti (sebelum setup)
- [ ] `setupAppEnvironment()` sudah dijalankan di Apps Script
- [ ] Backend sudah di-deploy sebagai Web App dengan akses "Anyone"
- [ ] Repository GitHub sudah dibuat (Public)
- [ ] GitHub Pages sudah diaktifkan (branch main, folder root)

---

*Panduan ini bagian dari proyek ProductHub Creator.*
