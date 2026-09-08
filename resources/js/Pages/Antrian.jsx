import React, { useState, useEffect } from 'react';

export default function Antrian({ session_id, id_toko, merchant_name }) {
    const [sessionId, setSessionId] = useState(session_id);
    const [queueData, setQueueData] = useState({ active: [], completed: [] });
    const [loading, setLoading] = useState(true);

    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const fetchQueue = async () => {
        try {
            const res = await fetch(getAppUrl(`/api/antrian/live?id_toko=${id_toko || 1}`), {
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setQueueData(data);
            }
        } catch (e) {
            console.error('Gagal mengambil antrean live:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!sessionId) {
            let id = localStorage.getItem('pembeli_session');
            if (!id) {
                id = 'PEMBELI-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
                localStorage.setItem('pembeli_session', id);
            }
            setSessionId(id);
        }
        fetchQueue();
        const interval = setInterval(fetchQueue, 5000);
        return () => clearInterval(interval);
    }, [session_id, id_toko]);

    const getStatusText = (statusPesanan, statusPembayaran) => {
        if (statusPesanan === 'siap') return { text: 'Siap Diambil', color: 'text-emerald-600 bg-emerald-50 border-emerald-250', pulse: true };
        if (statusPesanan === 'diproses') return { text: 'Sedang Disiapkan', color: 'text-blue-600 bg-blue-50 border-blue-200', pulse: true };
        if (statusPembayaran === 'belum_bayar') return { text: 'Menunggu Pembayaran', color: 'text-slate-450 bg-slate-50 border-slate-200', pulse: false };
        if (statusPembayaran === 'pending_verifikasi') return { text: 'Menunggu Verifikasi', color: 'text-amber-600 bg-amber-50 border-amber-200', pulse: true };
        return { text: 'Dalam Antrean', color: 'text-[#4361EE] bg-[#4361EE]/10 border-[#4361EE]/20', pulse: false };
    };

    const readyOrders = queueData.active.filter(ord => ord.status_pesanan === 'siap');
    const preparingOrders = queueData.active.filter(ord => ord.status_pesanan === 'diproses');
    const waitingOrders = queueData.active.filter(ord => ord.status_pesanan === 'dipesan');
    const completedOrders = queueData.completed;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex flex-col select-none">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm py-4">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-[#4361EE] flex items-center justify-center text-white shadow shadow-[#4361EE]/25">
                                <span className="material-symbols-outlined text-lg font-bold">bolt</span>
                            </div>
                            <div>
                                <span className="font-extrabold text-base text-slate-850 leading-tight block">{merchant_name || 'Toko UMKM'}</span>
                                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">FIFO Live Queue Monitor</span>
                            </div>
                        </div>

                        {/* Right: Live Sync */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Live</span>
                        </div>
                    </div>

                    {/* Center Nav Pills - always centered */}
                    <div className="flex justify-center mt-3">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
                            <a href={getAppUrl(`/pembeli/pemesanan?id_toko=${id_toko || 1}`)} className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition">Pemesanan Menu</a>
                            <a href={getAppUrl(`/pembeli/antrian?id_toko=${id_toko || 1}&session_id=${sessionId || ''}`)} className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#4361EE] shadow shadow-[#4361EE]/25">Antrean</a>
                            <a href={getAppUrl(`/pembeli/riwayat?session_id=${sessionId || ''}`)} className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition">Riwayat</a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Clean vertical stack */}
            <main className="max-w-screen-md mx-auto px-4 py-8 flex-1 w-full space-y-10">
                {/* 1. SIAP DIAMBIL (Ready for Pickup - Big Banner) */}
                <div className="space-y-4">
                    <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 animate-bounce">check_circle</span>
                        <span>Siap Diambil (Ready for Pickup)</span>
                    </h2>

                    {readyOrders.length > 0 ? (
                        <div className="space-y-4">
                            {readyOrders.map(ord => (
                                <div key={ord.order_id} className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-[32px] p-8 shadow-xl shadow-emerald-500/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 border-b-8 border-emerald-800">
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                                    <div className="flex items-center gap-6 text-center sm:text-left flex-col sm:flex-row">
                                        <div className="w-28 h-28 rounded-3xl bg-white text-slate-900 flex flex-col items-center justify-center font-black shadow-lg">
                                            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest leading-none mb-1">Antrean</span>
                                            <span className="text-4xl tracking-tight leading-none">{ord.nomor_antrian}</span>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest border border-white/10">
                                                Siap Diambil
                                            </span>
                                            <h3 className="font-black text-2xl mt-3 tracking-tight">{ord.nama_pembeli || 'Pembeli'}</h3>
                                            <p className="text-xs text-emerald-100 mt-1 font-semibold">Silakan tunjukkan bukti transaksi di kasir.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center sm:items-end justify-center shrink-0">
                                        <span className="material-symbols-outlined text-5xl text-white/90 animate-bounce">handshake</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 bg-white border border-slate-100 rounded-2xl text-center text-slate-400 shadow-sm text-xs font-bold">
                            Belum ada pesanan yang siap diambil saat ini.
                        </div>
                    )}
                </div>

                {/* 2. SEDANG DISIAPKAN (Preparing - Big Blue Card) */}
                <div className="space-y-4">
                    <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#4361EE] animate-pulse">coffee</span>
                        <span>Sedang Disiapkan (Preparing)</span>
                    </h2>
                    
                    {loading ? (
                        <div className="py-12 text-center text-slate-400 bg-white border border-slate-200 rounded-3xl shadow-sm">
                            <span className="w-8 h-8 border-3 border-[#4361EE] border-t-transparent rounded-full animate-spin block mx-auto mb-3"></span>
                            <p className="text-xs font-bold">Menghubungkan ke server antrean...</p>
                        </div>
                    ) : preparingOrders.length > 0 ? (
                        <div className="space-y-4">
                            {preparingOrders.map(ord => (
                                <div key={ord.order_id} className="bg-gradient-to-br from-[#4361EE] to-[#1E3BB3] text-white rounded-[32px] p-8 shadow-xl shadow-[#4361EE]/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 border-b-8 border-blue-800">
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                                    <div className="flex items-center gap-6 text-center sm:text-left flex-col sm:flex-row">
                                        <div className="w-28 h-28 rounded-3xl bg-white text-slate-900 flex flex-col items-center justify-center font-black shadow-lg">
                                            <span className="text-[10px] font-extrabold text-[#4361EE] uppercase tracking-widest leading-none mb-1">Antrean</span>
                                            <span className="text-4xl tracking-tight leading-none">{ord.nomor_antrian}</span>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest animate-pulse border border-white/10">
                                                Sedang Dibuat
                                            </span>
                                            <h3 className="font-black text-2xl mt-3 tracking-tight">{ord.nama_pembeli || 'Pembeli'}</h3>
                                            <p className="text-xs text-blue-200 mt-1 uppercase tracking-wider font-semibold">Nomor Transaksi: {ord.order_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center sm:items-end justify-center shrink-0">
                                        <span className="material-symbols-outlined text-5xl text-white/30 animate-spin" style={{ animationDuration: '3s' }}>sync</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 bg-white border border-slate-200 rounded-[32px] text-center text-slate-400 shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-slate-350 mb-2 block">hourglass_empty</span>
                            <p className="text-xs font-extrabold">Tidak ada pesanan yang sedang disiapkan.</p>
                        </div>
                    )}
                </div>

                {/* 3. ANTRIAN BERIKUTNYA (Waiting / Upcoming) */}
                <div className="space-y-4">
                    <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                        <span className="material-symbols-outlined text-slate-500">list_alt</span>
                        <span>Antrean Berikutnya (Waiting)</span>
                        {!loading && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold">{waitingOrders.length}</span>}
                    </h2>

                    {waitingOrders.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {waitingOrders.map(ord => (
                                <div key={ord.order_id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow transition">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex flex-col items-center justify-center font-extrabold shrink-0 shadow-inner">
                                            <span className="text-[8px] opacity-80 uppercase leading-none mb-0.5">No</span>
                                            <span className="text-sm leading-none">{ord.nomor_antrian}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-xs text-slate-850 truncate max-w-[150px]">{ord.nama_pembeli || 'Pembeli'}</h4>
                                            <p className="text-[9px] text-slate-400 mt-0.5 uppercase">Status: {ord.status_pembayaran === 'belum_bayar' ? 'Belum Bayar' : 'Menunggu Antrean'}</p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 bg-[#4361EE]/10 text-[#4361EE] rounded-lg text-[9px] font-extrabold uppercase">Antre</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-350 shadow-sm text-xs font-bold">
                            Belum ada antrean berikutnya.
                        </div>
                    )}
                </div>

                {/* 4. SELESAI (Completed - History) */}
                <div className="space-y-4">
                    <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                        <span className="material-symbols-outlined text-slate-450">history</span>
                        <span>Sudah Diserahkan (Selesai)</span>
                        {!loading && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold">{completedOrders.length}</span>}
                    </h2>

                    {completedOrders.length > 0 ? (
                        <div className="space-y-2.5">
                            {completedOrders.map(ord => (
                                <div key={ord.order_id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-550 flex flex-col items-center justify-center font-extrabold shrink-0">
                                            <span className="text-[8px] opacity-90 uppercase leading-none mb-0.5">No</span>
                                            <span className="text-sm leading-none">{ord.nomor_antrian}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-xs text-slate-600 line-through">{ord.nama_pembeli || 'Pembeli'}</h4>
                                            <p className="text-[9px] text-slate-400 font-medium mt-0.5 uppercase flex items-center gap-1">
                                                Selesai
                                            </p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 text-lg">check</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 bg-white border border-slate-100 rounded-2xl text-center text-slate-350 shadow-sm text-xs font-bold">
                            Belum ada riwayat pesanan selesai hari ini.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
