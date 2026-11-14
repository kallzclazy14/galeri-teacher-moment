# Galeri Hari Guru — SMK ARRAHMAN

Website galeri foto berbasis React, Vite, Tailwind CSS, dan Supabase.

## 1. Persiapan Supabase

1. Buka project Supabase yang digunakan.
2. Masuk ke **SQL Editor**.
3. Buka file `supabase-setup.sql`, salin seluruh isinya, lalu jalankan di SQL Editor.
4. Pastikan bucket Storage bernama `foto-acara` tersedia. Script SQL juga menyiapkan bucket dan policy yang diperlukan.
5. Dari **Project Settings → API**, salin Project URL dan **publishable key**. Jangan pernah menaruh `secret` atau `service_role` key di frontend.

## 2. Menjalankan di komputer

Pastikan Node.js versi LTS sudah terpasang. Buka terminal pada folder project ini, lalu jalankan:

```bash
npm install
```

Salin `.env.example` menjadi `.env`, kemudian isi `.env`:

```env
VITE_SUPABASE_URL=https://ahwwxwnmgwnkbopmfgzw.supabase.co
VITE_SUPABASE_ANON_KEY=PASTE_PUBLISHABLE_KEY_DI_SINI
```

Jalankan website:

```bash
npm run dev
```

Buka alamat lokal yang ditampilkan Vite (biasanya `http://localhost:5173`). Untuk membuat versi produksi, jalankan `npm run build`.

## 3. Upload ke GitHub

1. Buat repository baru di GitHub.
2. Upload isi folder project ini (bukan file ZIP-nya).
3. Jangan upload file `.env`. File tersebut sudah diabaikan oleh `.gitignore`.

## 4. Deploy ke Netlify

**Cara yang disarankan: lewat GitHub.** Upload isi folder project ini ke repository GitHub (bukan ZIP), lalu di Netlify pilih **Add new site → Import an existing project** dan hubungkan repository tersebut.

Pengaturan build: `npm run build`; publish directory: `dist`; base directory kosong jika `package.json` berada di root repository. File `netlify.toml` sudah menyimpan pengaturan build dan folder publik tersebut.

Di Netlify → Site configuration → Environment variables, tambahkan:
- `VITE_SUPABASE_URL` = URL project Supabase
- `VITE_SUPABASE_ANON_KEY` = Supabase publishable key

Simpan lalu jalankan deploy ulang. Jangan mengunggah file `.env` ke GitHub.

**Jika memakai Netlify Drop:** Netlify Drop hanya menerima hasil website yang sudah dibuild. Jalankan `npm install` lalu `npm run build` di komputer; setelah itu unggah isi folder `dist`, bukan seluruh folder source project.

## Catatan keamanan

Project ini memakai publishable key di browser; itu memang key untuk penggunaan frontend. Jangan pernah menggunakan atau mengunggah Supabase secret/service-role key. Policy pada SQL adalah konfigurasi awal untuk galeri publik; sebelum dibuka luas, pertimbangkan autentikasi, moderasi unggahan, pembatasan ukuran/jenis file, dan perlindungan spam. Jangan menganggap URL foto atau isi galeri sebagai data privat.
