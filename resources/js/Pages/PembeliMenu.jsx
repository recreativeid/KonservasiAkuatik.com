import React, { useState, useEffect } from 'react';

export default function PembeliMenu({ menus, qris, id_toko, toko, subscription_tier, free_plan_fee, wa_number, staffs = [] }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };
    const [sessionId] = useState(() => {
        let id = localStorage.getItem('pembeli_session');
        if (!id) {
            id = 'PEMBELI-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
            localStorage.setItem('pembeli_session', id);
        }
        return id;
    });

    const [cart, setCart] = useState({});
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Semua');
    const [layoutMode, setLayoutMode] = useState('grid');
    const [bookIndex, setBookIndex] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [customQty, setCustomQty] = useState(1);
    const [namaPembeli, setNamaPembeli] = useState('');
    const [catatan, setCatatan] = useState('');
    const [proofFile, setProofFile] = useState(null);
    
    // Default to 'midtrans' if store is on free plan, else 'qris'
    const isFreePlan = subscription_tier === 'free';
    const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState(isFreePlan ? 'midtrans' : 'qris');
    
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [checkoutOrder, setCheckoutOrder] = useState(null);
    const [qrisPayload, setQrisPayload] = useState(null);
    const [qrisInfo, setQrisInfo] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentQueue, setCurrentQueue] = useState(null);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    // Midtrans Snap / Simulation states
    const [midtransToken, setMidtransToken] = useState(null);
    const [midtransRedirectUrl, setMidtransRedirectUrl] = useState(null);
    const [isSimulation, setIsSimulation] = useState(false);

    // QRIS Expiration Countdown Timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    // Poll payment status to automatically redirect to success screen when payment is verified
    useEffect(() => {
        if (!checkoutOrder) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(getAppUrl(`/api/order/status/${checkoutOrder}`));
                const data = await res.json();
                if (res.ok && data.success) {
                    if (data.status_pembayaran === 'lunas') {
                        clearInterval(interval);
                        showToast('Pembayaran berhasil dikonfirmasi!');
                        setCart({});
                        const orderId = checkoutOrder;
                        setCheckoutOrder(null);
                        setProofFile(null);
                        setTimeout(() => {
                            window.location.href = getAppUrl(`/pembeli/success?order_id=${orderId}`);
                        }, 1000);
                    }
                }
            } catch (err) {
                console.error("Error checking order status:", err);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [checkoutOrder]);

    useEffect(() => {
        const fetchCurrentQueue = async () => {
            try {
                const res = await fetch(getAppUrl(`/api/antrian/live?id_toko=${id_toko || 1}`), {
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const activeTrx = data.active?.find(ord => ord.status_pesanan === 'diproses');
                    if (activeTrx) {
                        setCurrentQueue(activeTrx);
                    } else if (data.active && data.active.length > 0) {
                        setCurrentQueue(data.active[0]);
                    } else {
                        setCurrentQueue(null);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchCurrentQueue();
        const interval = setInterval(fetchCurrentQueue, 5000);
        return () => clearInterval(interval);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const uniqueCategories = [...new Set(menus.map(m => m.kategori).filter(Boolean))];
    const categories = uniqueCategories.length > 0 ? ['Semua', ...uniqueCategories] : ['Semua'];

    const filteredMenus = menus.filter(m => {
        const matchesSearch = m.nama_menu.toLowerCase().includes(search.toLowerCase());
        if (category === 'Semua') return matchesSearch;
        return matchesSearch && m.kategori === category;
    });

    const cartItems = Object.values(cart);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.harga * item.jumlah), 0);
    const tax = 0;
    const feeVal = 0;
    const grandTotal = subtotal;

    const addToCart = (product, qty = 1) => {
        setCart(prev => {
            const current = prev[product.id] || { ...product, jumlah: 0 };
            return { ...prev, [product.id]: { ...current, jumlah: current.jumlah + qty } };
        });
        showToast(`${product.nama_menu} ditambahkan ke keranjang!`);
    };

    const updateCartQty = (productId, diff) => {
        setCart(prev => {
            const item = prev[productId];
            if (!item) return prev;
            const newQty = item.jumlah + diff;
            if (newQty <= 0) { const next = { ...prev }; delete next[productId]; return next; }
            return { ...prev, [productId]: { ...item, jumlah: newQty } };
        });
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) { showToast('Keranjang masih kosong!', 'error'); return; }
        if (!namaPembeli.trim()) { showToast('Nama pemesan harus diisi!', 'error'); return; }

        setLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            // Calculate total with fee if free plan
            const baseTotal = cartItems.reduce((acc, it) => acc + (it.harga * it.jumlah), 0);
            const totalWithFee = isFreePlan ? baseTotal + Number(free_plan_fee || 500) : baseTotal;

            const response = await fetch(getAppUrl('/api/order/create'), {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    id_toko: id_toko || 1,
                    metode_pembayaran: checkoutPaymentMethod,
                    nama_pembeli: namaPembeli.trim() + (catatan.trim() ? ` (${catatan.trim()})` : ''),
                    items: cartItems.map(it => ({ id_menu: it.id, jumlah: it.jumlah })),
                    total_biaya: totalWithFee // Pass computed total containing fee
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setCheckoutOrder(data.order_id);
                
                if (checkoutPaymentMethod === 'midtrans') {
                    showToast('Menghubungkan ke gerbang pembayaran Midtrans...');
                    setLoading(true);
                    const midtransRes = await fetch(getAppUrl('/api/payment/create-midtrans-charge'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            order_id: data.order_id,
                            amount: data.total_biaya
                        })
                    });
                    const midtransData = await midtransRes.json();
                    if (midtransRes.ok && midtransData.success) {
                        if (midtransData.simulation) {
                            setIsSimulation(true);
                            setMidtransToken(midtransData.token);
                            setMidtransRedirectUrl(midtransData.redirect_url);
                            showToast('Alur simulasi Midtrans aktif (Server Key kosong).');
                        } else {
                            // Redirect to Midtrans secure payment window
                            window.location.href = midtransData.redirect_url;
                        }
                    } else {
                        showToast(midtransData.message || 'Gagal membuat tagihan Midtrans.', 'error');
                    }
                } else if (checkoutPaymentMethod === 'qris') {
                    showToast('Pesanan dibuat! Silakan scan QRIS untuk membayar.');
                    setLoading(true);
                    const qrisRes = await fetch(getAppUrl('/api/qris/generate'), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            order_id: data.order_id,
                            amount: data.total_biaya,
                            id_toko: id_toko || 1
                        })
                    });
                    const qrisData = await qrisRes.json();
                    if (qrisRes.ok && qrisData.success) {
                        setQrisPayload(qrisData.qr_payload);
                        setQrisInfo({
                            merchant_name: qrisData.merchant_name,
                            bank_name: qrisData.bank_name,
                            no_rekening: qrisData.no_rekening
                        });
                        setTimeLeft(qrisData.minutes_left * 60);
                    }
                } else {
                    showToast('Pesanan dibuat! Silakan transfer ke rekening Virtual Account.');
                    setTimeLeft(15 * 60);
                }
            } else {
                showToast(data.message || 'Gagal mengirim pesanan.', 'error');
            }
        } catch (e) {
            showToast('Error: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadProof = async (e) => {
        e.preventDefault();
        if (!proofFile) { showToast('Silakan pilih file bukti pembayaran!', 'error'); return; }
        setLoading(true);
        const formData = new FormData();
        formData.append('order_id', checkoutOrder);
        formData.append('bukti_qris', proofFile);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(getAppUrl('/api/order/upload-proof'), {
                method: 'POST',
                headers: { 
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json'
                },
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Bukti pembayaran berhasil diunggah!');
                const orderId = checkoutOrder;
                setCart({});
                setCheckoutOrder(null);
                setProofFile(null);
                setTimeout(() => { window.location.href = getAppUrl(`/pembeli/success?order_id=${orderId}`); }, 1200);
            } else {
                showToast(data.message || 'Gagal mengunggah bukti.', 'error');
            }
        } catch (err) {
            showToast('Kesalahan: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatTimer = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans select-none">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2 transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    <span className="material-symbols-outlined text-lg">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo & Store Hours */}
                        <div className="flex items-center gap-2.5 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-[#4361EE] flex items-center justify-center text-white shadow shadow-[#4361EE]/20">
                                <span className="material-symbols-outlined text-lg font-bold">bolt</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-base text-slate-800 leading-tight block">{toko?.nama_toko || 'CuanGO'}</span>
                                    <button 
                                        onClick={() => setIsInfoOpen(true)}
                                        className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#4361EE] text-[9px] font-extrabold flex items-center gap-0.5 transition cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[10px]">info</span> Info Toko
                                    </button>
                                </div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                                    {toko?.jam_buka ? `🕒 Buka: ${toko.jam_buka.substring(0,5)} - ${toko.jam_tutup.substring(0,5)}` : 'INTELLIGENCE LAYER'}
                                </span>
                            </div>
                        </div>

                        {/* Right: Search + actions */}
                        <div className="flex items-center gap-3">
                            <div className="relative hidden md:block">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Cari menu..."
                                    className="bg-slate-100 text-xs rounded-xl py-2 pl-8 pr-4 outline-none focus:ring-2 focus:ring-blue-500 w-52 transition"
                                />
                                <span className="material-symbols-outlined text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">search</span>
                            </div>
                            <a href={getAppUrl('/login')} className="px-3 py-2 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 text-slate-600 transition">
                                <span className="material-symbols-outlined text-sm">login</span>
                                <span className="hidden sm:inline">Login Staff</span>
                            </a>
                        </div>
                    </div>

                    {/* Center Nav Pills - always centered */}
                    <div className="flex justify-center mt-3">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
                            <a href={getAppUrl('/pembeli/pemesanan')} className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#4361EE] shadow shadow-[#4361EE]/25">Pemesanan Menu</a>
                            <a href={getAppUrl(`/pembeli/antrian?session_id=${sessionId}`)} className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition">Antrean</a>
                            <a href={getAppUrl(`/pembeli/riwayat?session_id=${sessionId}`)} className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition">Riwayat</a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Search */}
            <div className="md:hidden px-4 pt-4">
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari menu..."
                        className="w-full bg-white border border-slate-200 text-xs rounded-xl py-2.5 pl-9 pr-4 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                    <span className="material-symbols-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
                </div>
            </div>

            {toko?.is_active === 0 && (
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-4">
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 font-bold text-xs flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-lg">storefront_off</span>
                        <div>
                            <p className="font-extrabold text-xs">Outlet Sedang Tutup</p>
                            <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Kami mohon maaf, outlet kami sedang tidak menerima pesanan saat ini. Silakan periksa kembali nanti.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Catalog */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Cuplikan Besar Antrean Sedang Berlangsung */}
                    {currentQueue ? (
                        <div className="bg-gradient-to-r from-[#4361EE] to-[#1E3BB3] text-white rounded-[24px] p-5 shadow-md shadow-[#4361EE]/10 flex items-center justify-between gap-4 border-b-4 border-blue-800 animate-pulse">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-14 h-14 rounded-2xl bg-white text-slate-800 flex flex-col items-center justify-center font-black shadow-inner shrink-0">
                                    <span className="text-[8px] font-extrabold text-[#4361EE] uppercase tracking-widest leading-none mb-0.5">Antrean</span>
                                    <span className="text-lg tracking-tight leading-none">{currentQueue.nomor_antrian}</span>
                                </div>
                                <div className="min-w-0">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-extrabold uppercase tracking-wider">
                                        {currentQueue.status_pesanan === 'diproses' ? 'Sedang Disiapkan' : 'Menunggu Antrean'}
                                    </span>
                                    <h4 className="font-extrabold text-sm mt-1 truncate">Atas Nama: {currentQueue.nama_pembeli || 'Pembeli'}</h4>
                                </div>
                            </div>
                            <a 
                                href={getAppUrl(`/pembeli/antrian?session_id=${sessionId}`)}
                                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 transition text-[10px] font-extrabold rounded-xl uppercase tracking-wider flex items-center gap-1 shrink-0"
                            >
                                <span className="material-symbols-outlined text-xs font-bold">live_tv</span> Detail
                            </a>
                        </div>
                    ) : (
                        <div className="bg-slate-100 border border-slate-200/60 rounded-2xl p-4 text-slate-500 text-xs font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-base">notifications_active</span>
                            <span>Belum ada antrean berjalan saat ini. Pesanan Anda akan langsung diproses!</span>
                        </div>
                    )}

                    {/* Category + Layout Toggle */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        {categories.length > 1 && (
                            <div className="flex gap-2 flex-wrap">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition ${category === cat ? 'bg-[#4361EE] text-white shadow shadow-[#4361EE]/20' : 'bg-white text-slate-500 hover:text-[#4361EE] border border-slate-200 shadow-sm'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                            <button
                                onClick={() => setLayoutMode('grid')}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold transition ${layoutMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <span className="material-symbols-outlined text-sm">grid_view</span> Grid
                            </button>
                            <button
                                onClick={() => setLayoutMode('book')}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold transition ${layoutMode === 'book' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <span className="material-symbols-outlined text-sm">auto_stories</span> Catalog
                            </button>
                        </div>
                    </div>

                    {/* Grid Mode */}
                    {layoutMode === 'grid' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {filteredMenus.length === 0 && (
                                <div className="col-span-2 py-16 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                                    <p className="text-sm font-bold">Menu tidak ditemukan</p>
                                </div>
                            )}
                            {filteredMenus.map(menu => (
                                <div key={menu.id} className={`bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group ${!menu.aktif ? 'opacity-60' : ''}`}>
                                    <div className="h-44 bg-slate-100 relative overflow-hidden">
                                        {menu.gambar ? (
                                            <img src={getAppUrl(menu.gambar) + '?v=' + Date.now()} alt={menu.nama_menu} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                <span className="material-symbols-outlined text-5xl">local_cafe</span>
                                                <span className="text-xs">Belum ada gambar</span>
                                            </div>
                                        )}
                                        {!menu.aktif && (
                                            <div className="absolute inset-0 bg-slate-800/70 flex items-center justify-center">
                                                <span className="bg-red-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Stok Habis</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-extrabold text-sm text-slate-800">{menu.nama_menu}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{menu.deskripsi || menu.keterangan || 'Minuman spesial racikan Haltea.'}</p>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="font-extrabold text-base text-blue-600">Rp {Number(menu.harga).toLocaleString('id-ID')}</span>
                                            <button
                                                onClick={() => menu.aktif && (setSelectedProduct(menu), setCustomQty(1))}
                                                disabled={!menu.aktif}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm shadow-blue-500/20 transition"
                                            >
                                                <span className="material-symbols-outlined text-sm font-bold">add</span> Tambah
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Book / Catalog Mode */}
                    {layoutMode === 'book' && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative min-h-[460px] flex items-center justify-center">
                            {filteredMenus.length === 0 ? (
                                <p className="text-slate-400 text-xs">Menu tidak ditemukan.</p>
                            ) : (
                                <div className="w-full max-w-[580px] flex flex-col md:flex-row gap-8 items-center">
                                    <div className="w-full md:w-1/2 h-72 bg-slate-100 rounded-2xl overflow-hidden shadow-md">
                                        {filteredMenus[bookIndex]?.gambar ? (
                                            <img src={getAppUrl(filteredMenus[bookIndex].gambar) + '?v=' + Date.now()} alt={filteredMenus[bookIndex].nama_menu} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <span className="material-symbols-outlined text-5xl">local_cafe</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full md:w-1/2 space-y-4">
                                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-extrabold tracking-widest">PREMIUM</span>
                                        <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">{filteredMenus[bookIndex]?.nama_menu}</h2>
                                        <p className="text-xs text-slate-400 leading-relaxed">{filteredMenus[bookIndex]?.deskripsi || filteredMenus[bookIndex]?.keterangan || 'Sajian menu minuman spesial bernutrisi tinggi.'}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <span className="font-extrabold text-lg text-blue-600">Rp {Number(filteredMenus[bookIndex]?.harga).toLocaleString('id-ID')}</span>
                                            <button
                                                onClick={() => { if (filteredMenus[bookIndex].aktif) { setSelectedProduct(filteredMenus[bookIndex]); setCustomQty(1); } }}
                                                disabled={!filteredMenus[bookIndex]?.aktif}
                                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow shadow-blue-500/20 transition"
                                            >
                                                Order Sekarang
                                            </button>
                                        </div>
                                        {/* Pagination dots */}
                                        <div className="flex gap-1.5 pt-2">
                                            {filteredMenus.map((_, i) => (
                                                <button key={i} onClick={() => setBookIndex(i)} className={`w-2 h-2 rounded-full transition ${i === bookIndex ? 'bg-blue-600 w-6' : 'bg-slate-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {filteredMenus.length > 1 && (
                                <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                                    <button onClick={() => setBookIndex(prev => (prev > 0 ? prev - 1 : filteredMenus.length - 1))} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow hover:bg-slate-50 pointer-events-auto transition">
                                        <span className="material-symbols-outlined text-slate-500">chevron_left</span>
                                    </button>
                                    <button onClick={() => setBookIndex(prev => (prev < filteredMenus.length - 1 ? prev + 1 : 0))} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow hover:bg-slate-50 pointer-events-auto transition">
                                        <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Order Summary */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[500px] sticky top-20 self-start">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-sm text-slate-800">Ringkasan Pesanan</h3>
                            <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">{cartItems.length} Item</span>
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-[11px] text-slate-800 truncate">{item.nama_menu}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Rp {Number(item.harga).toLocaleString('id-ID')} × {item.jumlah}</p>
                                    </div>
                                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 shrink-0">
                                        <button onClick={() => updateCartQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-white rounded text-slate-600 font-bold text-xs shadow-sm hover:bg-red-50 hover:text-red-500 transition">−</button>
                                        <span className="px-2 font-bold text-[11px] text-slate-700">{item.jumlah}</span>
                                        <button onClick={() => updateCartQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-white rounded text-slate-600 font-bold text-xs shadow-sm hover:bg-emerald-50 hover:text-emerald-600 transition">+</button>
                                    </div>
                                </div>
                            ))}
                            {cartItems.length === 0 && (
                                <div className="flex flex-col items-center py-8 text-center gap-2">
                                    <span className="material-symbols-outlined text-3xl text-slate-300">shopping_cart</span>
                                    <p className="text-xs text-slate-400">Keranjang masih kosong</p>
                                    <p className="text-[10px] text-slate-300">Pilih menu untuk mulai memesan</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 mt-4">
                        {/* Name Input for Queue */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pemesan</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">person</span>
                                <input
                                    type="text"
                                    required
                                    value={namaPembeli}
                                    onChange={e => setNamaPembeli(e.target.value)}
                                    placeholder="Masukkan nama Anda..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                        </div>

                        {/* Catatan Khusus */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan (Opsional)</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">description</span>
                                <input
                                    type="text"
                                    value={catatan}
                                    onChange={e => setCatatan(e.target.value)}
                                    placeholder="Contoh: Es sedikit, tanpa gula..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                        </div>

                        {/* Metode Pembayaran Selector */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</label>
                            {isFreePlan ? (
                                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-lg">credit_card</span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-extrabold">Midtrans Payment Gateway</p>
                                        <p className="text-[9px] text-blue-600 font-semibold mt-0.5">Mendukung E-Wallet, QRIS GPN, Virtual Account, & Kartu Debit/Kredit.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCheckoutPaymentMethod('qris')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${checkoutPaymentMethod === 'qris' ? 'bg-[#4361EE]/10 border-[#4361EE] text-[#4361EE]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">qr_code_2</span>
                                        QRIS GPN
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCheckoutPaymentMethod('va')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${checkoutPaymentMethod === 'va' ? 'bg-[#4361EE]/10 border-[#4361EE] text-[#4361EE]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">account_balance</span>
                                        Transfer BCA
                                    </button>
                                </div>
                            )}
                            <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                                {isFreePlan 
                                    ? '💡 Anda akan diarahkan ke gerbang pembayaran aman Midtrans untuk menyelesaikan pemesanan Anda.'
                                    : checkoutPaymentMethod === 'qris' 
                                        ? '💡 Pindai QR Code dinamis langsung menggunakan e-wallet atau m-banking. Pembayaran akan terverifikasi otomatis.' 
                                        : '💡 Transfer ke nomor rekening bank/Virtual Account. Sistem akan mencocokkan pembayaran Anda secara otomatis.'}
                            </p>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-slate-100 pt-4 space-y-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Subtotal</span>
                                <span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-1">
                                <span>Total Pembayaran</span>
                                <span className="text-blue-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {toko?.is_active === 0 ? (
                            <div className="bg-red-50 text-red-650 p-4 rounded-2xl text-[10px] font-bold text-center flex items-center justify-center gap-1.5 border border-red-150">
                                <span className="material-symbols-outlined text-sm">error</span>
                                Toko sedang tutup, tidak menerima pesanan.
                            </div>
                        ) : (
                            <button
                                onClick={handleCheckout}
                                disabled={loading || cartItems.length === 0}
                                className="w-full bg-[#4361EE] hover:bg-[#3A56D4] active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-4 rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-md shadow-[#4361EE]/20"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                                ) : (
                                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                                )}
                                <span>Pesan Sekarang</span>
                            </button>
                        )}

                        {/* WhatsApp Contact Admin Button */}
                        <div className="border-t border-slate-100 pt-3 mt-2">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Hubungi Toko via WhatsApp</p>
                            <div className="flex flex-wrap gap-2">
                                {wa_number && (
                                    <a 
                                        href={`https://wa.me/${wa_number.replace(/[^0-9]/g, '').startsWith('0') ? '62' + wa_number.replace(/[^0-9]/g, '').slice(1) : wa_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo Admin ' + (toko?.nama_toko || '') + ', saya ingin bertanya mengenai pesanan saya...')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-3 py-2.5 rounded-xl shadow-sm transition"
                                    >
                                        <span className="material-symbols-outlined text-xs">chat</span>
                                        WhatsApp Admin Toko
                                    </a>
                                )}
                                {staffs.filter(s => /^[0-9+\-\s]+$/.test(s.username)).map((staff, idx) => (
                                    <a 
                                        key={idx}
                                        href={`https://wa.me/${staff.username.replace(/[^0-9]/g, '').startsWith('0') ? '62' + staff.username.replace(/[^0-9]/g, '').slice(1) : staff.username.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo Kasir ' + staff.nama + ', saya ingin bertanya...')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-3 py-2.5 rounded-xl transition"
                                    >
                                        <span className="material-symbols-outlined text-xs">support_agent</span>
                                        Chat {staff.nama}
                                    </a>
                                ))}
                                {!wa_number && staffs.filter(s => /^[0-9+\-\s]+$/.test(s.username)).length === 0 && (
                                    <p className="text-[10px] text-slate-400 italic w-full text-center py-1">Kontak WhatsApp belum tersedia.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-[560px] p-6 relative flex flex-col md:flex-row gap-6 shadow-2xl">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition">
                            <span className="material-symbols-outlined text-base font-bold">close</span>
                        </button>

                        <div className="w-full md:w-2/5 h-52 md:h-auto bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                            {selectedProduct.gambar ? (
                                <img src={getAppUrl(selectedProduct.gambar)} alt={selectedProduct.nama_menu} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <span className="material-symbols-outlined text-5xl">local_cafe</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col justify-between flex-1">
                            <div>
                                <span className="bg-blue-50 text-blue-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Minuman</span>
                                <h3 className="text-lg font-extrabold text-slate-800 mt-2">{selectedProduct.nama_menu}</h3>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedProduct.deskripsi || selectedProduct.keterangan || 'Sajian racikan minuman lezat.'}</p>

                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold">Harga per item</p>
                                    <p className="font-extrabold text-base text-blue-600">Rp {Number(selectedProduct.harga).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                                        <button onClick={() => setCustomQty(prev => Math.max(1, prev - 1))} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-600 font-bold text-sm shadow-sm">−</button>
                                        <span className="px-3 font-extrabold text-sm text-slate-800">{customQty}</span>
                                        <button onClick={() => setCustomQty(prev => prev + 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-600 font-bold text-sm shadow-sm">+</button>
                                    </div>
                                    <button
                                        onClick={() => { addToCart(selectedProduct, customQty); setSelectedProduct(null); }}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow shadow-blue-500/20 transition active:scale-[0.97]"
                                    >
                                        Tambah ke Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QRIS / VA Payment Modal */}
            {checkoutOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <form onSubmit={handleUploadProof} className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-200/50 space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="font-extrabold text-sm text-slate-850">
                                {checkoutPaymentMethod === 'qris' ? 'Pembayaran QRIS Dinamis' : 'Transfer Virtual Account (BCA)'}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-bold">ID: {checkoutOrder}</span>
                        </div>

                        <div className="space-y-3.5">
                            <div className="text-center space-y-1">
                                <p className="text-xs font-semibold text-slate-750">
                                    {checkoutPaymentMethod === 'qris' 
                                        ? 'Silakan scan QRIS dengan nominal persis di bawah ini:' 
                                        : 'Lakukan transfer ke rekening Virtual Account berikut:'}
                                </p>
                                
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-left space-y-2">
                                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                                        <span className="font-semibold text-slate-500">Metode Pembayaran:</span>
                                        <span className="font-extrabold text-slate-800">
                                            {checkoutPaymentMethod === 'midtrans' ? 'Midtrans Secure Payment' : checkoutPaymentMethod === 'qris' ? 'QRIS GPN' : 'Bank Central Asia (BCA)'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                                        <span className="font-semibold text-slate-500">Atas Nama / Merchant:</span>
                                        <span className="font-extrabold text-slate-800">
                                            {checkoutPaymentMethod === 'midtrans' ? 'Midtrans' : qrisInfo?.merchant_name || qris?.nama_pemilik || 'CuanGO Haltea'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                                        <span className="font-semibold text-slate-500">ID Pesanan / Pembayaran:</span>
                                        <span className="font-black text-slate-800 tracking-wider select-all">
                                            {checkoutOrder}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-500">Total Nominal Wajib Sama:</span>
                                        <span className="font-black text-[#4361EE] text-sm">
                                            Rp {grandTotal ? grandTotal.toLocaleString('id-ID') : '-'}
                                        </span>
                                    </div>
                                    {timeLeft > 0 && (
                                        <p className="font-medium text-amber-600 flex items-center justify-center gap-1 mt-2 bg-amber-50 rounded-lg py-1 border border-amber-100 font-bold text-center">
                                            <span className="material-symbols-outlined text-xs">schedule</span>
                                            <span>Sisa Waktu Pembayaran: <strong className="font-extrabold">{formatTimer(timeLeft)}</strong></span>
                                        </p>
                                    )}
                                </div>

                                {checkoutPaymentMethod === 'midtrans' && isSimulation && midtransRedirectUrl && (
                                    <a 
                                        href={midtransRedirectUrl}
                                        className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-2xl transition shadow-md shadow-blue-500/20 block"
                                    >
                                        Buka Simulasi Gerbang Pembayaran
                                    </a>
                                )}
                            </div>

                            {/* QRIS Barcode if QRIS selected */}
                            {checkoutPaymentMethod === 'qris' && (
                                <div className="flex justify-center p-3 bg-slate-50 border rounded-3xl max-w-[200px] mx-auto">
                                    {qrisPayload ? (
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrisPayload)}`}
                                            alt="QRIS Barcode" 
                                            className="w-40 h-40 object-contain animate-fadeIn"
                                        />
                                    ) : (
                                        <div className="w-40 h-40 flex flex-col items-center justify-center space-y-2 border border-slate-100 rounded-2xl bg-white">
                                            <div className="w-6 h-6 rounded-full border-2 border-[#4361EE] border-t-transparent animate-spin"></div>
                                            <span className="text-[8px] font-bold text-slate-450">Membuat QRIS Dinamis...</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Auto-verify Indicator */}
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-[10px] font-medium leading-relaxed flex items-start gap-1.5">
                                <span className="material-symbols-outlined text-xs text-emerald-600 animate-pulse mt-0.5">sync</span>
                                <p>
                                    <strong>Sistem Otomatis:</strong> Pembayaran dicocokkan otomatis oleh sistem. Jangan tutup halaman ini sebelum status berubah menjadi lunas.
                                </p>
                            </div>

                            {/* Show Receipt Uploader ONLY as optional/fallback for QRIS or standard transfers */}
                            {checkoutPaymentMethod === 'qris' && (
                                <div className="space-y-1.5 pt-1">
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Punya kendala? Upload Bukti Bayar Manual (Opsional)</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => setProofFile(e.target.files[0])}
                                        className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[9px] file:font-bold file:bg-[#4361EE]/10 file:text-[#4361EE] hover:file:bg-[#4361EE]/20 transition"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                            {/* Dev Simpay button */}
                            <button
                                type="button"
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                                        const endpoint = checkoutPaymentMethod === 'midtrans' 
                                            ? '/api/midtrans/simulate-payment' 
                                            : '/api/qris/simulate-pay';
                                        const res = await fetch(getAppUrl(endpoint), {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': csrfToken,
                                                'Accept': 'application/json'
                                            },
                                            body: JSON.stringify({ order_id: checkoutOrder })
                                        });
                                        const resData = await res.json();
                                        if (res.ok && resData.success) {
                                            showToast('Simulasi Pembayaran Berhasil!');
                                        } else {
                                            showToast(resData.message || 'Simulasi Gagal', 'error');
                                        }
                                    } catch (err) {
                                        showToast('Error: ' + err.message, 'error');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1"
                            >
                                <span className="material-symbols-outlined text-xs">bolt</span>
                                Simulasikan Bayar Sukses (Auto-verify)
                            </button>

                            <div className="flex gap-3 mt-1">
                                <button 
                                    type="button"
                                    onClick={() => { setCheckoutOrder(null); setProofFile(null); }}
                                    className="flex-1 border border-slate-200 hover:bg-slate-50 font-bold py-2.5 rounded-xl text-xs text-slate-650 transition"
                                >
                                    Batalkan
                                </button>
                                {checkoutPaymentMethod === 'qris' && proofFile && (
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                                    >
                                        {loading && <span className="material-symbols-outlined animate-spin text-xs">sync</span>}
                                        <span>Konfirmasi Manual</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Store Info & Operating Hours Modal */}
            {isInfoOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#4361EE] text-xl font-bold">storefront</span>
                                <h3 className="font-extrabold text-sm text-slate-850">Informasi Toko / Outlet</h3>
                            </div>
                            <button onClick={() => setIsInfoOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Toko</p>
                                <p className="font-extrabold text-slate-800 text-sm">{toko?.nama_toko || 'CuanGO'}</p>
                            </div>

                            {toko?.deskripsi && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi</p>
                                    <p className="font-medium text-slate-650 leading-relaxed">{toko.deskripsi}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jam Operasional</p>
                                <p className="font-extrabold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    <span>{toko?.jam_buka ? `${toko.jam_buka.substring(0,5)} - ${toko.jam_tutup.substring(0,5)}` : '-'}</span>
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</p>
                                <p className="font-semibold text-slate-700 bg-slate-50 border px-3 py-2.5 rounded-xl leading-relaxed">
                                    {toko?.alamat || '-'}<br />
                                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                                        {toko?.kelurahan ? `${toko.kelurahan}, ` : ''}
                                        {toko?.kecamatan ? `${toko.kecamatan}, ` : ''}
                                        {toko?.kota ? `${toko.kota}, ` : ''}
                                        {toko?.provinsi || ''}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={() => setIsInfoOpen(false)}
                                className="w-full bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-[#4361EE]/15 uppercase tracking-wider"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
