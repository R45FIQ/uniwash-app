/**
 * ═══════════════════════════════════════════════════════
 *  UniWash — Authentication Manager (auth.js)
 *
 *  Dual-mode:
 *  - FIREBASE_ENABLED = true  → Firebase Auth + Firestore profile
 *  - FIREBASE_ENABLED = false → localStorage demo mode
 *
 *  Requires: firebase-config.js (load sebelum auth.js)
 * ═══════════════════════════════════════════════════════
 */

const AuthManager = (() => {
  const STORAGE_KEY = 'lk_current_user';
  const USERS_KEY   = 'lk_users';

  // ─── DEMO ACCOUNTS (localStorage mode) ───
  const DEFAULT_USERS = [
    { id: 'usr_admin_001',   name: 'Sulaiman Rafiq', email: 'admin@uniwash.id', password: 'admin123',    role: 'admin',    avatar: 'SR' },
    { id: 'usr_cust_001',    name: 'Rina Aulia',      email: 'rina@email.com',         password: 'customer123', role: 'customer', avatar: 'RA' },
    { id: 'usr_partner_001', name: 'Bu Siti',          email: 'busiti@mitra.id',        password: 'mitra123',    role: 'partner',  avatar: 'BS', storeName: 'Laundry Berkah KBT' },
    { id: 'usr_courier_001', name: 'Ahmad Rifai',      email: 'ahmad@kurir.id',         password: 'kurir123',    role: 'courier',  avatar: 'AR', phone: '0812-3456-7890' },
  ];

  // ─── FIREBASE REFS ───
  let _firebaseAuth = null;

  function _initFirebaseAuth() {
    if (!FIREBASE_ENABLED) return;
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      _firebaseAuth = firebase.auth();
    } catch (e) {
      console.error('Auth Firebase init error:', e);
    }
  }

  // ═══════════════════════════════
  //  GOOGLE SIGN-IN
  // ═══════════════════════════════

  /**
   * Login / Register menggunakan Google OAuth.
   * Hanya untuk role 'customer' — role admin/partner/courier
   * harus pakai email + password agar bisa diverifikasi manual.
   *
   * Flow:
   *  1. Popup Google Pilih Akun
   *  2. Baca profil dari Firestore (jika sudah pernah daftar)
   *  3. Jika belum ada → auto-buat profil dengan role='customer'
   *  4. Simpan session ke localStorage dan return
   *
   * @returns {Promise<{success, user?, error?}>}
   */
  async function loginWithGoogle() {
    if (!FIREBASE_ENABLED || !_firebaseAuth) {
      return { success: false, error: 'Google Sign-In hanya tersedia dalam mode Firebase. Aktifkan Firebase terlebih dahulu.' };
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });

      const cred = await _firebaseAuth.signInWithPopup(provider);
      const uid  = cred.user.uid;

      // Cek apakah profil sudah ada di Firestore
      const db   = firebase.firestore();
      const ref  = db.collection('users').doc(uid);
      let profile = null;

      try {
        const doc = await ref.get();
        if (doc.exists) {
          profile = doc.data();

          // Jika profil sudah ada tapi bukan customer, tolak
          if (profile.role && profile.role !== 'customer') {
            await _firebaseAuth.signOut();
            return {
              success: false,
              error: `Akun Google ini terdaftar sebagai "${profile.role}". Gunakan login email & password untuk role tersebut.`
            };
          }
        }
      } catch (e) {
        console.warn('[Google Auth] Firestore read error:', e);
      }

      // Auto-buat profil baru jika belum ada
      if (!profile) {
        const googleName  = cred.user.displayName || cred.user.email.split('@')[0];
        profile = {
          uid,
          name:      googleName,
          email:     cred.user.email,
          role:      'customer',
          avatar:    _getInitials(googleName),
          photoURL:  cred.user.photoURL || null,
          provider:  'google',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        try {
          await ref.set(profile);
        } catch (e) {
          console.warn('[Google Auth] Firestore write error:', e);
        }
      }

      const session = {
        id:        uid,
        name:      profile.name      || cred.user.displayName,
        email:     cred.user.email,
        role:      profile.role      || 'customer',
        avatar:    profile.avatar    || _getInitials(profile.name || ''),
        photoURL:  profile.photoURL  || cred.user.photoURL || null,
        storeName: profile.storeName || null,
        phone:     profile.phone     || null,
        loginAt:   new Date().toISOString(),
        source:    'google',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true, user: session };

    } catch (err) {
      // User menutup popup
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return { success: false, error: null }; // silent cancel
      }
      const MAP = {
        'auth/popup-blocked':          'Popup diblokir browser. Izinkan popup untuk domain ini.',
        'auth/account-exists-with-different-credential': 'Email ini sudah terdaftar dengan metode lain. Gunakan login email & password.',
        'auth/network-request-failed': 'Tidak ada koneksi internet.',
      };
      return { success: false, error: MAP[err.code] || `Google Sign-In gagal (${err.code}).` };
    }
  }

  // ─── INIT localStorage demo accounts ───
  function _initUsers() {
    const existing = localStorage.getItem(USERS_KEY);
    if (!existing) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return;
    }
    const users = JSON.parse(existing);
    let updated = false;
    DEFAULT_USERS.forEach(du => {
      if (!users.find(u => u.email === du.email)) {
        users.push(du);
        updated = true;
      }
    });
    if (updated) localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function _getUsers()         { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  function _saveUsers(users)   { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

  function _getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  function _generateId() {
    return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  }

  // ─── ROLE PAGES ───
  const ROLE_PAGES = {
    admin:    'uniwash_ui_demo.html',
    customer: 'customer.html',
    partner:  'partner.html',
    courier:  'courier.html',
  };

  // ═══════════════════════════════
  //  LOGIN
  // ═══════════════════════════════

  /**
   * Login user.
   * Firebase mode: signInWithEmailAndPassword → baca role dari Firestore
   * Demo mode:     cocokkan email+password+role di localStorage
   *
   * @param {string} email
   * @param {string} password
   * @param {string} role - 'admin' | 'customer' | 'partner' | 'courier'
   * @returns {Promise<{success, user?, error?}>}
   */
  async function login(email, password, role) {
    if (FIREBASE_ENABLED && _firebaseAuth) {
      return _loginFirebase(email, password, role);
    }
    return _loginLocal(email, password, role);
  }

  async function _loginFirebase(email, password, role) {
    console.log('[DEBUG] Starting _loginFirebase with', email, role);
    try {
      console.log('[DEBUG] Calling signInWithEmailAndPassword...');
      const cred = await _firebaseAuth.signInWithEmailAndPassword(email, password);
      console.log('[DEBUG] signInWithEmailAndPassword SUCCESS', cred.user.uid);
      const uid = cred.user.uid;

      // Ambil profile dari Firestore
      let profile = null;
      try {
        console.log('[DEBUG] Fetching user profile from Firestore...');
        const doc = await firebase.firestore().collection('users').doc(uid).get();
        console.log('[DEBUG] Firestore get() resolved', doc.exists);
        if (doc.exists) profile = doc.data();
      } catch (e) {
        console.error('[DEBUG] Firestore error:', e);
      }

      // Cek role cocok
      const userRole = profile?.role || null;
      if (userRole !== role) {
        await _firebaseAuth.signOut();
        return { success: false, error: `Akun ini terdaftar sebagai "${userRole || 'unknown'}", bukan "${role}".` };
      }

      const session = {
        id:        uid,
        name:      profile?.name      || cred.user.displayName || email.split('@')[0],
        email:     cred.user.email,
        role:      userRole,
        avatar:    profile?.avatar    || _getInitials(profile?.name || email),
        storeName: profile?.storeName || null,
        phone:     profile?.phone     || null,
        loginAt:   new Date().toISOString(),
        source:    'firebase',
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      console.log('[DEBUG] Login process completed successfully');
      return { success: true, user: session };

    } catch (err) {
      console.error('[DEBUG] Caught error in _loginFirebase:', err);
      // BOOTSTRAP: Jika Firebase kosong, admin pertama kali login akan gagal (user-not-found/invalid-credential)
      // Kita akan auto-create admin account untuk bootstrapping.
      if ((err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') 
          && email === 'admin@uniwash.id' && password === 'admin123' && role === 'admin') {
        console.log('[DEBUG] Bootstrapping admin account...');
        try {
          const cred = await _firebaseAuth.createUserWithEmailAndPassword(email, password);
          console.log('[DEBUG] createUserWithEmailAndPassword SUCCESS', cred.user.uid);
          const uid = cred.user.uid;
          
          const profile = {
            id: uid,
            name: 'Sulaiman Rafiq (Admin)',
            email: email,
            role: 'admin',
            avatar: 'SR',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          
          console.log('[DEBUG] Saving profile to Firestore...');
          await firebase.firestore().collection('users').doc(uid).set(profile);
          console.log('[DEBUG] Firestore set() SUCCESS');
          
          const session = {
            id: uid,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            avatar: profile.avatar,
            loginAt: new Date().toISOString(),
            source: 'firebase',
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          console.log('[DEBUG] Bootstrap completed successfully');
          return { success: true, user: session, isNewBootstrap: true };
        } catch (bootstrapErr) {
           console.error('[DEBUG] Bootstrap error:', bootstrapErr);
           return { success: false, error: 'Gagal bootstrap admin: ' + bootstrapErr.message };
        }
      }

      const msg = _mapFirebaseError(err.code);
      return { success: false, error: msg };
    }
  }

  function _loginLocal(email, password, role) {
    _initUsers();
    const users = _getUsers();
    const user  = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password &&
      u.role === role
    );

    if (!user) return { success: false, error: 'Email atau password salah untuk role ini.' };

    const session = {
      id:        user.id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      avatar:    user.avatar || _getInitials(user.name),
      storeName: user.storeName || null,
      phone:     user.phone    || null,
      loginAt:   new Date().toISOString(),
      source:    'local',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { success: true, user: session };
  }

  // ═══════════════════════════════
  //  REGISTER
  // ═══════════════════════════════

  /**
   * Daftar akun baru.
   * Firebase mode: createUserWithEmailAndPassword → simpan profile ke Firestore
   * Demo mode:     tambah ke array localStorage
   */
  async function register(name, email, password, role, extra = {}) {
    // Validasi umum
    if (!name || name.trim().length < 2) return { success: false, error: 'Nama minimal 2 karakter.' };
    if (!email || !email.includes('@'))  return { success: false, error: 'Format email tidak valid.' };
    if (!password || password.length < 6) return { success: false, error: 'Password minimal 6 karakter.' };

    if (FIREBASE_ENABLED && _firebaseAuth) {
      return _registerFirebase(name, email, password, role, extra);
    }
    return _registerLocal(name, email, password, role, extra);
  }

  async function _registerFirebase(name, email, password, role, extra) {
    try {
      const cred = await _firebaseAuth.createUserWithEmailAndPassword(email, password);
      const uid  = cred.user.uid;

      const profile = {
        uid,
        name:      name.trim(),
        email:     email.toLowerCase(),
        role,
        avatar:    _getInitials(name),
        storeName: extra.storeName || null,
        phone:     extra.phone     || null,
        location:  extra.location  || null,
        lat:       extra.lat       || null,
        lng:       extra.lng       || null,
        createdAt: new Date().toISOString(),
      };

      await firebase.firestore().collection('users').doc(uid).set(profile);

      // Sign out setelah register — user harus login ulang
      await _firebaseAuth.signOut();

      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: _mapFirebaseError(err.code) };
    }
  }

  function _registerLocal(name, email, password, role, extra) {
    _initUsers();
    const users  = _getUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (exists) return { success: false, error: 'Email sudah terdaftar untuk role ini.' };

    const newUser = {
      id:        _generateId(),
      name:      name.trim(),
      email:     email.toLowerCase().trim(),
      password,
      role,
      avatar:    _getInitials(name),
      storeName: extra.storeName || null,
      phone:     extra.phone     || null,
      location:  extra.location  || null,
      lat:       extra.lat       || null,
      lng:       extra.lng       || null,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    _saveUsers(users);
    return { success: true, user: newUser };
  }

  // ═══════════════════════════════
  //  LOGOUT
  // ═══════════════════════════════

  async function logout() {
    localStorage.removeItem(STORAGE_KEY);
    if (FIREBASE_ENABLED && _firebaseAuth) {
      try { await _firebaseAuth.signOut(); } catch (_) {}
    }
    window.location.href = 'login.html';
  }

  // ═══════════════════════════════
  //  SESSION
  // ═══════════════════════════════

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  /** Cek session dan redirect jika tidak punya akses */
  function requireAuth(allowedRoles = []) {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }

  /** Redirect ke dashboard jika sudah login (panggil di login.html) */
  function redirectIfLoggedIn() {
    const user = getCurrentUser();
    if (!user) return false;
    const target = ROLE_PAGES[user.role];
    if (target) { window.location.href = target; return true; }
    return false;
  }

  // ═══════════════════════════════
  //  FIREBASE ERROR MAPPING
  // ═══════════════════════════════

  function _mapFirebaseError(code) {
    const MAP = {
      'auth/user-not-found':     'Email tidak terdaftar.',
      'auth/wrong-password':     'Password salah.',
      'auth/invalid-email':      'Format email tidak valid.',
      'auth/email-already-in-use': 'Email sudah digunakan.',
      'auth/weak-password':      'Password terlalu lemah (minimal 6 karakter).',
      'auth/network-request-failed': 'Tidak ada koneksi internet.',
      'auth/too-many-requests':  'Terlalu banyak percobaan. Coba lagi nanti.',
      'auth/invalid-credential': 'Email atau password salah.',
    };
    return MAP[code] || `Terjadi kesalahan (${code}). Coba lagi.`;
  }

  // ─── INIT ───
  _initFirebaseAuth();
  _initUsers();

  return { login, register, logout, getCurrentUser, requireAuth, redirectIfLoggedIn, loginWithGoogle };
})();
