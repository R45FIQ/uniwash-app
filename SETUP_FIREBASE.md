# 🔥 Panduan Setup Firebase — UniWash
*Panduan step-by-step bahasa Indonesia. Estimasi waktu: 10–15 menit.*

---

## Langkah 1 — Buat Firebase Project

1. Buka browser, pergi ke: **https://console.firebase.google.com**
2. Login dengan akun Google Anda
3. Klik tombol **"Add project"** (tombol besar di tengah)
4. Isi nama project: `uniwash` → klik **Continue**
5. Google Analytics: boleh diaktifkan atau tidak → klik **Create project**
6. Tunggu beberapa detik → klik **Continue**

---

## Langkah 2 — Aktifkan Authentication (Login System)

1. Di sidebar kiri, klik **Build** → **Authentication**
2. Klik tombol **Get started**
3. Di tab "Sign-in method", klik **Email/Password**
4. Toggle pertama (Email/Password) → aktifkan (**Enable**)
5. Klik **Save**

---

## Langkah 3 — Buat Database Firestore

1. Di sidebar kiri, klik **Build** → **Firestore Database**
2. Klik **Create database**
3. Pilih **Start in test mode** (untuk development) → klik **Next**
4. Pilih lokasi server: **asia-southeast1 (Singapore)** → klik **Enable**
5. Tunggu database dibuat (sekitar 1 menit)

---

## Langkah 4 — Dapatkan Config Firebase

1. Di sidebar kiri, klik ikon ⚙️ **Project Settings** (di samping "Project Overview")
2. Scroll ke bawah ke section **"Your apps"**
3. Klik ikon **`</>`** (Web app)
4. Isi "App nickname": `UniWash Web` → klik **Register app**
5. Anda akan melihat kode seperti ini:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "uniwash.firebaseapp.com",
  projectId: "uniwash",
  storageBucket: "uniwash.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. **Copy semua isi object `firebaseConfig` tersebut**
7. Buka file `firebase-config.js` di project Anda
8. Ganti bagian `PASTE_YOUR_CONFIG_HERE` dengan config yang Anda copy
9. Simpan file

---

## Langkah 5 — Seed Data Demo ke Firestore

Setelah Firebase dikonfigurasi dan file `firebase-config.js` diisi:

1. Buka `http://localhost:8500/login.html` di browser
2. Login sebagai Admin (email: `admin@uniwash.id`, password: `admin123`)
3. Di Admin Dashboard → klik menu **"Setup Firebase"** di sidebar
4. Klik tombol **"Seed Data Demo"** yang ada di halaman tersebut
5. Tunggu beberapa detik → data demo akan masuk ke Firestore

---

## Langkah 6 — (Opsional) Deploy ke Internet

Jika sudah mau deploy online:

1. Install Node.js dari https://nodejs.org (pilih LTS)
2. Buka Command Prompt / PowerShell di folder project:
```bash
cd "d:\PROJECT WEB LAUNDRY KBT"
npm install -g firebase-tools
firebase login
firebase deploy
```
3. Setelah deploy selesai, URL aplikasi Anda akan tampil:
   - Contoh: `https://uniwash.web.app`

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| "Firebase not configured" di konsol | Pastikan `firebase-config.js` sudah diisi dengan config yang benar |
| Login gagal setelah Firebase aktif | Klik "Seed Data Demo" di Setup Firebase page untuk buat akun di Firebase Auth |
| Data tidak muncul | Buka Firestore Console, cek collection `orders` sudah ada |
| Deploy gagal | Pastikan sudah `firebase login` dan nama project benar di `.firebaserc` |

---

*File ini dibuat otomatis oleh sistem. Simpan sebagai referensi.*
