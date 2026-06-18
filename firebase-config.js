/**
 * ═══════════════════════════════════════════════════════
 *  UniWash — Firebase Configuration
 *
 *  CARA MENGISI:
 *  1. Buka https://console.firebase.google.com
 *  2. Pilih project Anda → Project Settings → Your apps → Web
 *  3. Copy isi firebaseConfig lalu paste di bawah
 *
 *  Baca panduan lengkap di: SETUP_FIREBASE.md
 * ═══════════════════════════════════════════════════════
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBnfOSWUUXdJz1UPIXtA6urJYA0npSnYVo",
  authDomain: "uniwash-29400.firebaseapp.com",
  projectId: "uniwash-29400",
  storageBucket: "uniwash-29400.firebasestorage.app",
  messagingSenderId: "213613294088",
  appId: "1:213613294088:web:86306a77bdfe4eb273d7bd"
};

/**
 * Cek apakah Firebase sudah dikonfigurasi atau masih placeholder.
 * Jika belum dikonfigurasi, sistem akan otomatis pakai localStorage (demo mode).
 */
const FIREBASE_ENABLED = (() => {
  const vals = Object.values(FIREBASE_CONFIG);
  return vals.every(v => v && !v.startsWith('PASTE_'));
})();

if (FIREBASE_ENABLED) {
  console.info('🔥 Firebase: AKTIF — menggunakan Firebase Auth + Firestore');
} else {
  console.info('💾 Firebase: BELUM DIKONFIGURASI — menggunakan mode demo (localStorage)');
  console.info('   → Baca SETUP_FIREBASE.md untuk cara mengaktifkan Firebase');
}
