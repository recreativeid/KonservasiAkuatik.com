import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function Verifikasi({ user, pending_orders = [], active_orders = [], history_orders = [] }) {
    const [activeTab, setActiveTab] = useState('verification'); // 'verification' | 'cooking' | 'history'
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };
    const userName = user?.name || user?.nama || 'User';
    const [selectedProof, setSelectedProof] = useState(null);
    const [loadingAction, setLoadingAction] = useState(null);

    const handleVerifyOrder = async (orderId, statusPesanan, statusPembayaran) => {
        setLoadingAction(orderId);
        try {
            const response = await fetch(getAppUrl('/api/order/verify'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    order_id: orderId,
                    status_pesanan: statusPesanan,
                    status_pembayaran: statusPembayaran
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                window.location.reload();
            } else {
                alert(data.message || 'Gagal memperbarui status.');
            }
        } catch (e) {
            alert('Koneksi gagal: ' + e.message);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        setLoadingAction(orderId);
        try {
            const response = await fetch(getAppUrl(`/api/order/accept/${orderId}`), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                window.location.reload();
            } else {
                alert(data.message || 'Gagal menerima pesanan.');
            }
        } catch (e) {
            alert('Kesalahan jaringan: ' + e.message);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleCompleteOrder = async (orderId) => {
        setLoadingAction(orderId);
        try {
            const response = await fetch(getAppUrl(`/api/order/complete/${orderId}`), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                window.location.reload();
            } else {
                alert(data.message || 'Gagal memperbarui status.');
            }
        } catch (e) {
            alert('Kesalahan jaringan: ' + e.message);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (confirm(`Apakah Anda yakin ingin menghapus permanen pesanan #${orderId} dari database?`)) {
            setLoadingAction(orderId);
            try {
                const response = await fetch(getAppUrl(`/api/order/delete/${orderId}`), {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    }
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    window.location.reload();
                } else {
                    alert(data.message || 'Gagal menghapus pesanan.');
                }
            } catch (e) {
                alert('Kesalahan jaringan: ' + e.message);
            } finally {
                setLoadingAction(null);
            }
        }
    };

    const handlePrintOrder = (ord) => {
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        const itemsHtml = ord.items.map(it => `
            <div style="display:flex; justify-content:space-between; margin: 4px 0;">
                <span>${it.nama_menu} x${it.jumlah}</span>
                <span>Rp ${(it.harga * it.jumlah).toLocaleString('id-ID')}</span>
            </div>
        `).join('');

        printWindow.document.write(`
            <html><head><title>Nota #${ord.order_id}</title>
            <style>
                body { font-family: monospace; font-size: 11px; width: 280px; margin: 0 auto; padding: 10px; color: #000; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .line { border-top: 1px dashed #000; margin: 8px 0; }
                .header-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
                .footer { font-size: 10px; text-align: center; margin-top: 15px; }
            </style></head>
            <body>
                <div class="center header-title">CUANGO MERCHANT</div>
                <div class="center">Nota Transaksi Terverifikasi</div>
                <div class="line"></div>
                <div>ID Order : ${ord.order_id}</div>
                <div>Antrean  : #${ord.nomor_antrian}</div>
                <div>Customer : ${ord.nama_pembeli || 'Pembeli'}</div>
                <div>Tanggal  : ${ord.tanggal}</div>
                <div class="line"></div>
                <div class="bold">ITEMS:</div>
                ${itemsHtml}
                <div class="line"></div>
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:12px;">
                    <span>TOTAL</span>
                    <span>Rp ${ord.total_biaya.toLocaleString('id-ID')}</span>
                </div>
                <div class="line"></div>
                <div class="footer">
                    * Terima Kasih atas Kunjungan Anda *<br>
                    CuanGO - bantu scale up umkm naik kelas
                </div>
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 500);
                </script>
            </body></html>
        `);
        printWindow.document.close();
    };

    // Filter display orders based on active tab
    let displayOrders = [];
    if (activeTab === 'verification') {
        displayOrders = [...pending_orders];
    } else if (activeTab === 'cooking') {
        displayOrders = active_orders.filter(o => o.status_pesanan === 'diproses');
    } else if (activeTab === 'history') {
        displayOrders = [
            ...active_orders.filter(o => o.status_pesanan === 'siap'),
            ...history_orders
        ];
    }

    const sortedOrders = displayOrders.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Sidebar user={user} activePage="/verifikasi" />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="font-extrabold text-sm text-slate-850">Pemesanan Masuk & Antrean</h2>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Kelola seluruh verifikasi transaksi pembayaran & antrean dapur dalam satu layar terpadu.</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700">{userName}</span>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">{userName.substring(0, 2)}</div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="p-8 space-y-6 overflow-y-auto flex-1 max-w-4xl w-full">
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-3 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-200/40">
                        <button
                            onClick={() => setActiveTab('verification')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                activeTab === 'verification'
                                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                                    : 'text-slate-500 hover:text-slate-850 font-semibold'
                            }`}
                        >
                            Minta Verifikasi
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                activeTab === 'verification' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200/50 text-slate-500'
                            }`}>{pending_orders.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('cooking')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                activeTab === 'cooking'
                                    ? 'bg-white text-amber-600 shadow-sm font-bold'
                                    : 'text-slate-500 hover:text-slate-850 font-semibold'
                            }`}
                        >
                            Sedang Dibuat
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                activeTab === 'cooking' ? 'bg-amber-50 text-amber-600' : 'bg-slate-200/50 text-slate-500'
                            }`}>{active_orders.filter(o => o.status_pesanan === 'diproses').length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                                activeTab === 'history'
                                    ? 'bg-white text-emerald-600 shadow-sm font-bold'
                                    : 'text-slate-500 hover:text-slate-850 font-semibold'
                            }`}
                        >
                            Siap Diambil & Riwayat
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                activeTab === 'history' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200/50 text-slate-500'
                            }`}>
                                {active_orders.filter(o => o.status_pesanan === 'siap').length + history_orders.length}
                            </span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {sortedOrders.map(ord => {
                            const isPending = ord.status_pesanan === 'dipesan';
                            const isProcessing = ord.status_pesanan === 'diproses';
                            const isReady = ord.status_pesanan === 'siap';

                            return (
                                <div key={ord.order_id} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                                    {/* Order header */}
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3 text-xs">
                                        <div>
                                            <p className="font-extrabold text-slate-800 text-[13px]">{ord.order_id}</p>
                                            <p className="text-xs font-bold text-[#2563EB] mt-1">Antrean #{ord.nomor_antrian} — Atas Nama: {ord.nama_pembeli || 'Pembeli'}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{ord.tanggal}</p>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-[#2563EB] uppercase">
                                                {({'qris': 'QRIS', 'va': 'Virtual Account', 'cash': 'Tunai'})[ord.metode_pembayaran] || ord.metode_pembayaran}
                                            </span>
                                            {isPending && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-600 uppercase">
                                                    Menunggu Verifikasi
                                                </span>
                                            )}
                                            {isProcessing && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100/60 text-[#2563EB] uppercase animate-pulse">
                                                    🔥 Sedang Dibuat
                                                </span>
                                            )}
                                            {isReady && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-600 uppercase">
                                                    ✅ Siap Diambil
                                                </span>
                                            )}
                                            {ord.bukti_pembayaran && (
                                                <button onClick={() => setSelectedProof(ord.bukti_pembayaran)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/25 transition flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">image</span> Bukti QRIS
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items & Images Grid (Enak dipandang & informatif) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                                        <div className="space-y-2">
                                            {ord.items.map(it => (
                                                <div key={it.id} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                                                    <img 
                                                        src={it.gambar ? getAppUrl(it.gambar) : getAppUrl('uploads/menu_default.png')} 
                                                        alt={it.nama_menu} 
                                                        className="w-11 h-11 object-cover rounded-xl border border-slate-100 shadow-sm shrink-0"
                                                        onError={(e) => { e.target.src = getAppUrl('uploads/menu_default.png'); }}
                                                    />
                                                    <div>
                                                        <p className="font-bold text-xs text-slate-800">{it.nama_menu}</p>
                                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Rp {it.harga.toLocaleString('id-ID')} × {it.jumlah}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col justify-between items-end text-right border-l border-slate-50 pl-4 h-full">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Pembayaran</p>
                                                <p className="font-extrabold text-base text-slate-800 mt-1">Rp {ord.total_biaya.toLocaleString('id-ID')}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Sumber: <span className="capitalize font-bold text-slate-650">{ord.sumber}</span></span>
                                        </div>
                                    </div>

                                    {/* Action Buttons (Merged Pipeline) */}
                                    <div className="flex gap-3 justify-end pt-3 border-t border-slate-50">
                                        {!isPending && (
                                            <button
                                                onClick={() => handlePrintOrder(ord)}
                                                className="mr-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-xs">print</span> Cetak Struk
                                            </button>
                                        )}

                                        {user?.role === 'admin' && (
                                            <button
                                                disabled={loadingAction === ord.order_id}
                                                onClick={() => handleDeleteOrder(ord.order_id)}
                                                className="px-3.5 py-2 border border-rose-200 hover:bg-rose-55 hover:border-rose-350 text-rose-650 rounded-xl text-[10px] font-extrabold transition flex items-center gap-1.5"
                                                title="Hapus Permanen Pesanan"
                                            >
                                                <span className="material-symbols-outlined text-xs">delete</span>
                                                Hapus
                                            </button>
                                        )}

                                        {isPending && (
                                            <>
                                                <button
                                                    disabled={loadingAction === ord.order_id}
                                                    onClick={() => handleVerifyOrder(ord.order_id, 'dibatalkan', 'belum_bayar')}
                                                    className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-650 rounded-xl text-[10px] font-bold transition"
                                                >
                                                    Tolak / Batal
                                                </button>
                                                <button
                                                    disabled={loadingAction === ord.order_id}
                                                    onClick={() => handleVerifyOrder(ord.order_id, 'diproses', 'lunas')}
                                                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-750 text-white rounded-xl text-[10px] font-bold shadow-md shadow-blue-500/20 transition"
                                                >
                                                    Terima & Sedang Dibuat
                                                </button>
                                            </>
                                        )}

                                        {isProcessing && (
                                            <button
                                                disabled={loadingAction === ord.order_id}
                                                onClick={() => handleCompleteOrder(ord.order_id)}
                                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">check</span> Tandai Pesanan Sudah Siap
                                            </button>
                                        )}

                                        {isReady && (
                                            <button
                                                disabled={loadingAction === ord.order_id}
                                                onClick={() => handleVerifyOrder(ord.order_id, 'selesai', 'lunas')}
                                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">done_all</span> Tandai Selesai / Serahkan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {sortedOrders.length === 0 && (
                            <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block text-slate-300">task_alt</span>
                                <p className="text-xs font-bold">Tidak ada antrean pesanan aktif saat ini.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Proof Modal */}
            {selectedProof && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-[480px] p-6 relative flex flex-col items-center">
                        <h3 className="font-extrabold text-sm text-slate-800 mb-4">Bukti Transaksi</h3>
                        <div className="w-full h-80 bg-slate-100 rounded-2xl overflow-hidden border">
                            <img src={getAppUrl(selectedProof)} alt="Bukti Transfer" className="w-full h-full object-contain" />
                        </div>
                        <button onClick={() => setSelectedProof(null)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-450 hover:bg-slate-200 transition">
                            <span className="material-symbols-outlined text-sm font-bold">close</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
