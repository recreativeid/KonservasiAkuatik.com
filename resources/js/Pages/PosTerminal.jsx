import React, { useState, useEffect } from 'react';
import Sidebar from '../Components/Sidebar';

export default function PosTerminal({ menus, qris, user, cashier_revenue, recent_transactions }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [checkoutOrder, setCheckoutOrder] = useState(null);
    const [qrisPayload, setQrisPayload] = useState(null);
    const [qrisInfo, setQrisInfo] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(false);

    // QRIS Expiration Countdown Timer
    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    // QRIS Status Polling
    useEffect(() => {
        if (!checkoutOrder || paymentMethod !== 'qris') return;
        
        let intervalId = setInterval(async () => {
            try {
                const res = await fetch(getAppUrl(`/api/order/status/${checkoutOrder}`));
                const data = await res.json();
                if (res.ok && data.success) {
                    if (data.status_pembayaran === 'lunas') {
                        clearInterval(intervalId);
                        alert('Pembayaran QRIS Berhasil Diterima & Pesanan Masuk Antrean!');
                        setCart([]);
                        setCustomerName('');
                        setCheckoutOrder(null);
                        window.location.reload();
                    }
                }
            } catch (err) {
                console.error("Error polling order status:", err);
            }
        }, 3000); // check every 3 seconds
        
        return () => clearInterval(intervalId);
    }, [checkoutOrder]);

    const addToCart = (menu) => {
        if (menu.aktif === 0) return; // Stok habis
        const existing = cart.find(item => item.id === menu.id);
        if (existing) {
            setCart(cart.map(item => item.id === menu.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { ...menu, qty: 1 }]);
        }
    };

    const updateQty = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const nextQty = item.qty + delta;
                return nextQty > 0 ? { ...item, qty: nextQty } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const totalBiaya = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);

    const [customerName, setCustomerName] = useState('');

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) {
            alert('Keranjang belanja kosong.');
            return;
        }
        const finalCustomerName = customerName.trim() || 'Pelanggan Kasir';

        setLoading(true);
        const orderId = 'HT-' + Date.now();
        const sessionId = 'kasir-' + user.id;

        try {
            // 1. Create Order
            const orderRes = await fetch(getAppUrl('/api/order/create'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    order_id: orderId,
                    total_biaya: totalBiaya,
                    items: cart.map(item => ({ id_menu: item.id, qty: item.qty })),
                    metode_pembayaran: paymentMethod,
                    nama_pembeli: finalCustomerName,
                    sumber: 'kasir'
                })
            });
            const orderData = await orderRes.json();
            
            if (!orderRes.ok || !orderData.success) {
                alert(orderData.message || 'Gagal membuat pesanan.');
                setLoading(false);
                return;
            }

            if (paymentMethod === 'cash') {
                alert('Pesanan Tunai Berhasil Dibuat & Masuk Antrean!');
                setCart([]);
                setCustomerName('');
                window.location.reload();
            } else {
                // Open payment modal for QRIS
                setCheckoutOrder(orderData.order_id);
                setLoading(true);
                const qrisRes = await fetch(getAppUrl('/api/qris/generate'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        order_id: orderData.order_id,
                        amount: orderData.total_biaya
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
                } else {
                    alert(qrisData.message || 'Gagal membuat QRIS dinamis.');
                }
            }
        } catch (err) {
            alert('Kesalahan jaringan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDirectApprove = async () => {
        if (!checkoutOrder) return;
        setLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/order/verify'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    order_id: checkoutOrder,
                    status_pesanan: 'diproses',
                    status_pembayaran: 'lunas'
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Transaksi Berhasil Disetujui & Masuk Antrean!');
                setCart([]);
                setCustomerName('');
                setCheckoutOrder(null);
                window.location.reload();
            } else {
                alert(data.message || 'Gagal menyetujui transaksi.');
            }
        } catch (err) {
            alert('Kesalahan jaringan: ' + err.message);
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
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/pos-terminal" />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="font-extrabold text-lg text-slate-850">Transaksi & Daftar Menu</h2>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Input pemesanan pelanggan secara manual di kasir.</p>
                    </div>
                    <div className="bg-[#4361EE]/10 text-[#4361EE] font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">payments</span>
                        <span>Kas Masuk Hari Ini (Cash): Rp {cashier_revenue.toLocaleString('id-ID')}</span>
                    </div>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Menu Selection (Left 2 cols) */}
                    <div className="lg:col-span-2 space-y-5">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Daftar Menu Produk</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {menus.map(menu => (
                                <div 
                                    key={menu.id} 
                                    onClick={() => addToCart(menu)}
                                    className={`bg-white border border-slate-200 rounded-3xl p-4 flex flex-col justify-between shadow-sm cursor-pointer hover:border-[#4361EE] hover:shadow-md transition relative overflow-hidden select-none ${
                                        menu.aktif === 0 ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                                    }`}
                                >
                                    {menu.aktif === 0 && (
                                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center">
                                            <span className="bg-amber-600 text-white font-extrabold text-[9px] px-3 py-1 rounded-full uppercase shadow">Sold Out</span>
                                        </div>
                                    )}
                                    <img 
                                        src={menu.gambar ? getAppUrl(menu.gambar) + '?v=' + Date.now() : getAppUrl('haltea-logo.png')} 
                                        alt={menu.nama_menu} 
                                        className="w-full h-32 object-cover rounded-2xl bg-slate-50"
                                        onError={(e) => { e.target.src = getAppUrl('haltea-logo.png'); }}
                                    />
                                    <div className="mt-3">
                                        <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1">{menu.nama_menu}</h4>
                                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{menu.keterangan}</p>
                                        <h5 className="font-bold text-xs text-[#4361EE] mt-2">Rp {menu.harga.toLocaleString('id-ID')}</h5>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart & Checkout (Right 1 col) */}
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 min-h-[400px] flex flex-col justify-between">
                            <div>
                                <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center justify-between">
                                    <span>Keranjang Belanja</span>
                                    <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full text-[9px]">{cart.length} Item</span>
                                </h3>

                                <div className="space-y-3.5 mt-4 max-h-72 overflow-y-auto pr-1">
                                    {cart.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 space-y-2">
                                            <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                                            <p className="text-[10px] font-bold">Keranjang masih kosong</p>
                                        </div>
                                    ) : (
                                        cart.map(item => (
                                            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-slate-800 truncate">{item.nama_menu}</p>
                                                    <p className="text-[10px] text-slate-400">Rp {item.harga.toLocaleString('id-ID')}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-slate-100 font-bold flex items-center justify-center hover:bg-slate-200">-</button>
                                                    <span className="font-bold text-xs w-4 text-center">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-slate-100 font-bold flex items-center justify-center hover:bg-slate-200">+</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="flex justify-between text-xs font-extrabold text-slate-800">
                                    <span>Total Pembayaran:</span>
                                    <span className="text-[#4361EE] text-sm">Rp {totalBiaya.toLocaleString('id-ID')}</span>
                                </div>

                                <div className="space-y-3.5">
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide">Nama Pelanggan (Opsional)</label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            placeholder="Nama untuk antrean (Pelanggan Kasir)..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#4361EE]/10 focus:bg-white transition"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide">Metode Pembayaran</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('cash')}
                                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${paymentMethod === 'cash' ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">payments</span>
                                                Cash / Tunai
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('qris')}
                                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${paymentMethod === 'qris' ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">qr_code_2</span>
                                                QRIS Dinamik
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleCheckout}
                                    disabled={loading || cart.length === 0}
                                    className="w-full bg-[#4361EE] hover:bg-[#3A56D4] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-3.5 rounded-2xl transition shadow-md shadow-[#4361EE]/20 flex items-center justify-center gap-1.5 text-xs mt-2"
                                >
                                    {loading && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                                    <span>Buat Pesanan & Bayar</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Transactions List */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">Riwayat Shift Kasir Hari Ini</h3>
                            <div className="space-y-3.5 max-h-56 overflow-y-auto">
                                {recent_transactions.map(trx => (
                                    <div key={trx.order_id} className="flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-slate-800">{trx.order_id}</p>
                                            <p className="text-[9px] text-slate-400 mt-0.5 capitalize">{({'qris': 'QRIS', 'va': 'Virtual Account', 'cash': 'Tunai'})[trx.metode_pembayaran] || trx.metode_pembayaran} • {trx.sumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800">Rp {parseInt(trx.total_biaya).toLocaleString('id-ID')}</p>
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                                trx.status_pembayaran === 'lunas' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                {trx.status_pembayaran}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* QRIS Manual Scanner for Cashier */}
            {checkoutOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-200/50 space-y-4 text-center">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="font-extrabold text-sm text-slate-850">Pembayaran QRIS Pelanggan</h3>
                            <span className="text-[10px] text-slate-400 font-bold">Ref: {checkoutOrder}</span>
                        </div>

                        <div className="space-y-3.5">
                            <p className="text-xs font-semibold text-slate-700">Tunjukkan Barcode QRIS di bawah ke pelanggan:</p>
                                                        <div className="bg-slate-50 border rounded-xl p-3 text-xs text-left space-y-1">
                                <p className="font-medium text-slate-500">Bank / E-Wallet: <span className="font-extrabold text-slate-850">{qrisInfo?.bank_name || qris?.bank_name || 'BCA/GPN'}</span></p>
                                <p className="font-medium text-slate-500">No. Rekening / No. HP: <span className="font-extrabold text-slate-850">{qrisInfo?.no_rekening || qris?.no_rekening || '-'}</span></p>
                                <p className="font-medium text-slate-500">Atas Nama: <span className="font-extrabold text-slate-850">{qrisInfo?.merchant_name || qris?.nama_pemilik || 'Merchant'}</span></p>
                                {timeLeft > 0 && (
                                    <p className="font-medium text-amber-600 flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-xs">schedule</span>
                                        <span>Kedaluwarsa dalam: <strong className="font-black">{formatTimer(timeLeft)}</strong></span>
                                    </p>
                                )}
                            </div>

                            {/* QR Code Container */}
                            <div className="flex justify-center p-3 bg-slate-50 border rounded-3xl max-w-[200px] mx-auto">
                                {qrisPayload ? (
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrisPayload)}`}
                                        alt="QRIS Barcode" 
                                        className="w-40 h-40 object-contain animate-fadeIn"
                                    />
                                ) : (
                                    <div className="w-40 h-40 flex flex-col items-center justify-center space-y-2 border border-slate-100 rounded-2xl bg-white">
                                        <div className="w-6 h-6 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin"></div>
                                        <span className="text-[8px] font-bold text-slate-450">Membuat QRIS Dinamis...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => setCheckoutOrder(null)}
                                className="flex-1 border border-slate-200 hover:bg-slate-50 font-bold py-2.5 rounded-xl text-xs text-slate-650 transition"
                            >
                                Batalkan / Tutup
                            </button>
                            <button 
                                onClick={handleDirectApprove}
                                disabled={loading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                            >
                                {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                <span>Setujui (Lunas)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
