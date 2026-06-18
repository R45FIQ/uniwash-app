/**
 * ═══════════════════════════════════════════════════════
 *  UniWash — Database Layer (db.js)
 *
 *  Abstraksi Firestore untuk semua operasi data.
 *  Jika Firebase belum dikonfigurasi → pakai localStorage (demo).
 *  Jika Firebase aktif → semua data tersimpan di Cloud Firestore.
 * ═══════════════════════════════════════════════════════
 */

const DB = (() => {

  // ─── FIREBASE REFS (jika aktif) ───
  let _db = null;
  let _auth = null;

  function _initFirebase() {
    if (!FIREBASE_ENABLED) return;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      _db   = firebase.firestore();
      _auth = firebase.auth();
      console.info('🔥 Firestore connected');
    } catch (e) {
      console.error('Firebase init error:', e);
    }
  }

  // ─── DEMO DATA (localStorage fallback) ───
  const DEMO_ORDERS = [
    { id: 'LK-2406-0047', customerId: 'usr_cust_001', customerName: 'M. Sulaiman Rafiq', service: 'Reguler', weight: 3, totalPrice: 23000, courierId: 'usr_courier_001', courierName: 'Fariz S.', partnerId: 'usr_partner_001', partnerName: 'Bu Siti', status: 'dicuci', statusGroup: 'proses', createdAt: new Date().toISOString() },
    { id: 'LK-2406-0046', customerId: 'usr_cust_001', customerName: 'Rina Aulia',        service: 'Ekspres', weight: 2, totalPrice: 21000, courierId: 'usr_courier_001', courierName: 'Ahmad R.', partnerId: 'usr_partner_001', partnerName: 'Bu Siti', status: 'diantar',   statusGroup: 'diantar', createdAt: new Date().toISOString() },
    { id: 'LK-2406-0045', customerId: 'usr_cust_001', customerName: 'Dimas Cahyo',       service: 'Reguler', weight: 5, totalPrice: 35000, courierId: null,              courierName: '—',        partnerId: 'usr_partner_001', partnerName: 'Bu Siti', status: 'antri',    statusGroup: 'antri',   createdAt: new Date().toISOString() },
    { id: 'LK-2406-0044', customerId: 'usr_cust_001', customerName: 'Laily Nur',         service: 'Bundel',  weight: 3, totalPrice: 60000, courierId: 'usr_courier_001', courierName: 'Budi W.', partnerId: 'usr_partner_001', partnerName: 'Bu Siti', status: 'selesai',  statusGroup: 'selesai', createdAt: new Date().toISOString() },
    { id: 'LK-2406-0043', customerId: 'usr_cust_001', customerName: 'Hafiz Maulana',     service: 'Reguler', weight: 2.5, totalPrice: 20000, courierId: 'usr_courier_001', courierName: 'Ahmad R.', partnerId: 'usr_partner_002', partnerName: 'Pak Heru', status: 'dijemput', statusGroup: 'proses', createdAt: new Date().toISOString() },
    { id: 'LK-2406-0042', customerId: 'usr_cust_001', customerName: 'Dewi Rahayu',       service: 'Ekspres', weight: 4, totalPrice: 37000, courierId: null,              courierName: '—',        partnerId: 'usr_partner_002', partnerName: 'Pak Heru', status: 'antri',    statusGroup: 'antri',   createdAt: new Date().toISOString() },
    { id: 'LK-2406-0041', customerId: 'usr_cust_001', customerName: 'Baiq Rasty',        service: 'Reguler', weight: 3, totalPrice: 23000, courierId: 'usr_courier_001', courierName: 'Fariz S.', partnerId: 'usr_partner_001', partnerName: 'Bu Siti', status: 'dikeringkan', statusGroup: 'proses', createdAt: new Date().toISOString() },
  ];

  const DEMO_COURIERS = [
    { id: 'usr_courier_001', name: 'Ahmad Rifai',    phone: '0812-3456-7890', rating: 4.9, todayOrders: 3, totalOrders: 87, feePerOrder: 10000, status: 'Aktif',   initials: 'AR', bg: '',                  color: '' },
    { id: 'usr_courier_002', name: 'Budi Wicaksono', phone: '0821-9876-5432', rating: 4.7, todayOrders: 2, totalOrders: 54, feePerOrder: 10000, status: 'Standby', initials: 'BW', bg: '#EDE9FE',            color: '#7C3AED' },
    { id: 'usr_courier_003', name: 'Fariz Setiawan', phone: '0857-1122-3344', rating: 4.6, todayOrders: 2, totalOrders: 31, feePerOrder: 10000, status: 'Jemput',  initials: 'FS', bg: 'var(--amber-100)',   color: 'var(--amber-600)' },
  ];

  const DEMO_PARTNERS = [
    { id: 'usr_partner_001', name: 'Laundry Bu Siti', storeName: 'Laundry Berkah KBT', type: 'Mitra utama',    address: 'Jl. Tlogomas No. 7', capacity: 30, commission: 15, totalOrders: 72, status: 'Aktif', lat: -7.934, lng: 112.605 },
    { id: 'usr_partner_002', name: 'Laundry Pak Heru', storeName: 'Laundry Pak Heru',  type: 'Mitra cadangan', address: 'Jl. Dinoyo No. 24',   capacity: 20, commission: 18, totalOrders: 24, status: 'Aktif', lat: -7.940, lng: 112.608 },
  ];

  const LS_ORDERS_KEY  = 'lk_orders';
  const LS_COURIERS_KEY = 'lk_couriers';
  const LS_PARTNERS_KEY = 'lk_partners';

  function _initLocalStorage() {
    if (!localStorage.getItem(LS_ORDERS_KEY))   localStorage.setItem(LS_ORDERS_KEY,   JSON.stringify(DEMO_ORDERS));
    if (!localStorage.getItem(LS_COURIERS_KEY)) localStorage.setItem(LS_COURIERS_KEY, JSON.stringify(DEMO_COURIERS));
    if (!localStorage.getItem(LS_PARTNERS_KEY)) localStorage.setItem(LS_PARTNERS_KEY, JSON.stringify(DEMO_PARTNERS));
  }

  function _lsGet(key)          { return JSON.parse(localStorage.getItem(key) || '[]'); }
  function _lsSave(key, data)   { localStorage.setItem(key, JSON.stringify(data)); }

  // ─── GENERATE ORDER ID ───
  function _generateOrderId() {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    return `LK-${y}${m}-${rand}`;
  }

  // ─── HITUNG HARGA ───
  function _calcPrice(service, weight) {
    if (service === 'Bundel')  return 60000;
    if (service === 'Ekspres') return Math.round(weight * 8000);
    return Math.round(weight * 6000); // Reguler
  }

  // ═══════════════════════════════════════
  //  ALGORITMA AUTO-ASSIGN (FASE 3)
  // ═══════════════════════════════════════

  function _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi dalam KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // jarak dalam KM
  }

  async function _findBestMatch(customerLat, customerLng) {
    const partners = await getPartners();
    const couriers = await getCouriers();

    // Cari partner aktif terdekat
    let bestPartner = null;
    let minDistance = Infinity;

    partners.forEach(p => {
      if (p.status === 'Aktif' && p.lat && p.lng) {
        const dist = _haversineDistance(customerLat, customerLng, p.lat, p.lng);
        if (dist < minDistance) {
          minDistance = dist;
          bestPartner = p;
        }
      }
    });

    // Default ke partner pertama jika gagal mapping
    if (!bestPartner && partners.length > 0) bestPartner = partners[0];

    // Cari kurir standby dengan pesanan tersedikit hari ini
    let bestCourier = null;
    let minLoad = Infinity;

    couriers.forEach(c => {
      if (c.status === 'Standby') {
        if (c.todayOrders < minLoad) {
          minLoad = c.todayOrders;
          bestCourier = c;
        }
      }
    });

    // Fallback kurir aktif
    if (!bestCourier && couriers.length > 0) bestCourier = couriers[0];

    return { partner: bestPartner, courier: bestCourier };
  }

  // ═══════════════════════════════════════
  //  ORDERS
  // ═══════════════════════════════════════

  /**
   * Buat order baru
   * @param {object} data - { customerId, customerName, service, weight, address, partnerId, partnerName }
   * @returns {Promise<{success, orderId, error}>}
   */
  async function createOrder(data) {
    const orderId = _generateOrderId();
    const totalPrice = _calcPrice(data.service, parseFloat(data.weight));
    
    // Auto-Assign Fase 3
    let match = { partner: null, courier: null };
    if (data.lat && data.lng) {
      match = await _findBestMatch(data.lat, data.lng);
    }

    const partnerId   = match.partner ? match.partner.id : data.partnerId;
    const partnerName = match.partner ? match.partner.storeName : data.partnerName;
    const courierId   = match.courier ? match.courier.id : null;
    const courierName = match.courier ? match.courier.name : '—';
    const autoAssigned = !!(match.partner || match.courier);

    const order = {
      id:           orderId,
      customerId:   data.customerId,
      customerName: data.customerName,
      service:      data.service,
      weight:       parseFloat(data.weight),
      totalPrice:   totalPrice,
      address:      data.address,
      lat:          data.lat || null,
      lng:          data.lng || null,
      partnerId:    partnerId,
      partnerName:  partnerName,
      courierId:    courierId,
      courierName:  courierName,
      autoAssigned: autoAssigned,
      status:       'antri',
      statusGroup:  'antri',
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString()
    };

    if (FIREBASE_ENABLED && _db) {
      try {
        await _db.collection('orders').doc(orderId).set(order);
        return { success: true, orderId };
      } catch (e) {
        console.error('createOrder Firebase error:', e);
        return { success: false, error: e.message };
      }
    } else {
      // localStorage fallback
      const orders = _lsGet(LS_ORDERS_KEY);
      orders.unshift(order);
      _lsSave(LS_ORDERS_KEY, orders);
      return { success: true, orderId };
    }
  }

  /**
   * Update status order
   * @param {string} orderId
   * @param {object} updates - { status, statusGroup, courierId?, courierName? }
   */
  async function updateOrder(orderId, updates) {
    updates.updatedAt = new Date().toISOString();

    if (FIREBASE_ENABLED && _db) {
      try {
        await _db.collection('orders').doc(orderId).update(updates);
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    } else {
      const orders = _lsGet(LS_ORDERS_KEY);
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], ...updates };
        _lsSave(LS_ORDERS_KEY, orders);
      }
      return { success: true };
    }
  }

  /**
   * Ambil semua orders (one-time)
   */
  async function getOrders(filters = {}) {
    if (FIREBASE_ENABLED && _db) {
      try {
        let query = _db.collection('orders').orderBy('createdAt', 'desc');
        if (filters.partnerId)  query = query.where('partnerId', '==', filters.partnerId);
        if (filters.courierId)  query = query.where('courierId', '==', filters.courierId);
        if (filters.customerId) query = query.where('customerId', '==', filters.customerId);
        if (filters.status)     query = query.where('status', '==', filters.status);
        const snap = await query.get();
        return snap.docs.map(d => ({ ...d.data(), id: d.id }));
      } catch (e) {
        console.error('getOrders error:', e);
        return [];
      }
    } else {
      let orders = _lsGet(LS_ORDERS_KEY);
      if (filters.partnerId)  orders = orders.filter(o => o.partnerId  === filters.partnerId);
      if (filters.courierId)  orders = orders.filter(o => o.courierId  === filters.courierId);
      if (filters.customerId) orders = orders.filter(o => o.customerId === filters.customerId);
      if (filters.status)     orders = orders.filter(o => o.status     === filters.status);
      return orders;
    }
  }

  /**
   * Listen realtime orders (Firestore onSnapshot atau polling localStorage)
   * @param {function} callback - dipanggil setiap ada perubahan dengan array orders
   * @param {object} filters - { partnerId, courierId, customerId }
   * @returns {function} unsubscribe function
   */
  function listenOrders(callback, filters = {}) {
    if (FIREBASE_ENABLED && _db) {
      let query = _db.collection('orders').orderBy('createdAt', 'desc');
      if (filters.partnerId)  query = query.where('partnerId',  '==', filters.partnerId);
      if (filters.courierId)  query = query.where('courierId',  '==', filters.courierId);
      if (filters.customerId) query = query.where('customerId', '==', filters.customerId);

      const unsubscribe = query.onSnapshot(snap => {
        const orders = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        callback(orders);
      }, err => console.error('listenOrders error:', err));

      return unsubscribe;
    } else {
      // localStorage: panggil sekali, lalu poll setiap 2 detik
      const poll = () => {
        let orders = _lsGet(LS_ORDERS_KEY);
        if (filters.partnerId)  orders = orders.filter(o => o.partnerId  === filters.partnerId);
        if (filters.courierId)  orders = orders.filter(o => o.courierId  === filters.courierId);
        if (filters.customerId) orders = orders.filter(o => o.customerId === filters.customerId);
        callback(orders);
      };
      poll();
      const interval = setInterval(poll, 3000);
      return () => clearInterval(interval); // unsubscribe
    }
  }

  // ═══════════════════════════════════════
  //  COURIERS
  // ═══════════════════════════════════════

  async function getCouriers() {
    if (FIREBASE_ENABLED && _db) {
      const snap = await _db.collection('couriers').get();
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    }
    return _lsGet(LS_COURIERS_KEY);
  }

  async function saveCourier(data) {
    const id = data.id || ('cour_' + Date.now().toString(36));
    const courier = { ...data, id, updatedAt: new Date().toISOString() };

    if (FIREBASE_ENABLED && _db) {
      await _db.collection('couriers').doc(id).set(courier, { merge: true });
      return { success: true, id };
    } else {
      const couriers = _lsGet(LS_COURIERS_KEY);
      const idx = couriers.findIndex(c => c.id === id);
      if (idx !== -1) couriers[idx] = courier;
      else couriers.push(courier);
      _lsSave(LS_COURIERS_KEY, couriers);
      return { success: true, id };
    }
  }

  // ═══════════════════════════════════════
  //  PARTNERS
  // ═══════════════════════════════════════

  async function getPartners() {
    if (FIREBASE_ENABLED && _db) {
      const snap = await _db.collection('partners').get();
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    }
    return _lsGet(LS_PARTNERS_KEY);
  }

  async function savePartner(data) {
    const id = data.id || ('part_' + Date.now().toString(36));
    const partner = { ...data, id, updatedAt: new Date().toISOString() };

    if (FIREBASE_ENABLED && _db) {
      await _db.collection('partners').doc(id).set(partner, { merge: true });
      return { success: true, id };
    } else {
      const partners = _lsGet(LS_PARTNERS_KEY);
      const idx = partners.findIndex(p => p.id === id);
      if (idx !== -1) partners[idx] = partner;
      else partners.push(partner);
      _lsSave(LS_PARTNERS_KEY, partners);
      return { success: true, id };
    }
  }

  // ═══════════════════════════════════════
  //  SEED DEMO DATA KE FIRESTORE
  // ═══════════════════════════════════════

  /**
   * Seed semua data demo ke Firestore (panggil sekali saat setup)
   * Tersedia via tombol "Seed Data Demo" di halaman Setup Firebase
   */
  async function seedDemoData(onProgress) {
    if (!FIREBASE_ENABLED || !_db) {
      return { success: false, error: 'Firebase belum dikonfigurasi.' };
    }

    try {
      onProgress && onProgress('Menyimpan demo orders...');
      const batch1 = _db.batch();
      DEMO_ORDERS.forEach(o => {
        batch1.set(_db.collection('orders').doc(o.id), o);
      });
      await batch1.commit();

      onProgress && onProgress('Menyimpan data kurir...');
      const batch2 = _db.batch();
      DEMO_COURIERS.forEach(c => {
        batch2.set(_db.collection('couriers').doc(c.id), c);
      });
      await batch2.commit();

      onProgress && onProgress('Menyimpan data mitra...');
      const batch3 = _db.batch();
      DEMO_PARTNERS.forEach(p => {
        batch3.set(_db.collection('partners').doc(p.id), p);
      });
      await batch3.commit();

      onProgress && onProgress('Selesai! ✅');
      return { success: true };
    } catch (e) {
      console.error('seedDemoData error:', e);
      return { success: false, error: e.message };
    }
  }

  // ═══════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════

  function calcPrice(service, weight) { return _calcPrice(service, weight); }

  function formatPrice(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
  }

  const STATUS_GROUP_MAP = {
    antri: 'antri', dijemput: 'proses', dicuci: 'proses',
    dikeringkan: 'proses', diantar: 'diantar', selesai: 'selesai'
  };

  // ─── INIT ───
  _initFirebase();
  _initLocalStorage();

  // ─── PUBLIC API ───
  return {
    createOrder,
    updateOrder,
    getOrders,
    listenOrders,
    getCouriers,
    saveCourier,
    getPartners,
    savePartner,
    seedDemoData,
    calcPrice,
    formatPrice,
    STATUS_GROUP_MAP,
    DEMO_ORDERS,
    DEMO_COURIERS,
    DEMO_PARTNERS,
    isFirebaseEnabled: () => FIREBASE_ENABLED,
  };
})();
