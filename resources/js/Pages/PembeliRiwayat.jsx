import React, { useState } from 'react';

export default function PembeliRiwayat({ orders, session_id, qris }) {
    const [loading, setLoading] = useState({});
    const [proofFiles, setProofFiles] = useState({});
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const handleFileChange = (orderId, file) => {
        setProofFiles(prev => ({ ...prev, [orderId]: file }));
    };

    const handleUploadProof = async (orderId) => {
        const file = proofFiles[orderId];
        if (!file) { showToast('Silakan pilih file bukti pembayaran!', 'error'); return; }

        setLoading(prev => ({ ...prev, [orderId]: true }));
        const formData = new FormData();
        formData.append('order_id', orderId);
        formData.append('bukti_qris', file);

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
                setProofFiles(prev => { const next = { ...prev }; delete next[orderId]; return next; });
                setTimeout(() => window.location.reload(), 1200);
            } else {
                showToast(data.message || 'Gagal mengunggah bukti.', 'error');
            }
        } catch (err) {
            showToast('Kesalahan: ' + err.message, 'error');
        } finally {
            setLoading(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const statusColor = (status) => {
        if (status === 'lunas' || status === 'selesai') return 'bg-emerald-50 text-emerald-700 border-emerald-250';
        if (status === 'pending_verifikasi' || status === 'diproses') return 'bg-amber-50 text-amber-750 border-amber-250';
        if (status === 'dipesan') return 'bg-[#4361EE]/10 text-[#4361EE] border-[#4361EE]/20';
        return 'bg-slate-50 text-slate-600 border-slate-200';
    };

    const statusLabel = (status) => {
        const labels = {
            lunas: 'Lunas', selesai: 'Selesai', pending_verifikasi: 'Menunggu Verifikasi',
            diproses: 'Sedang Disiapkan', dipesan: 'Menunggu Antrean', belum_bayar: 'Belum Bayar'
        };
        return labels[status] || status;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans select-none">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    <span className="material-symbols-outlined text-lg">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-[#4361EE] flex items-center justify-center text-white shadow shadow-[#4361EE]/25">
                                <span className="material-symbols-outlined text-lg font-bold">bolt</span>
                            </div>
                            <div>
                                <span className="font-extrabold text-base text-slate-800 leading-tight block">CuanGO</span>
                                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">INTELLIGENCE LAYER</span>
                            </div>
                        </div>

                        <a href={getAppUrl('/login')} className="px-3 py-2 border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 flex items-center gap-1.5 text-slate-600 transition">
                            <span className="material-symbols-outlined text-sm">login</span>
                            <span className="hidden sm:inline">Login Staff</span>
                        </a>
                    </div>

                    {/* Center Nav Pills - always centered */}
                    <div className="flex justify-center mt-3">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
                            <a href={getAppUrl('/pembeli/pemesanan')} className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition">Pemesanan Menu</a>
                            <a href={getAppUrl(`/pembeli/antrian?session_id=${session_id}`)} className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 transition">Antrean</a>
                            <a href={getAppUrl(`/pembeli/riwayat?session_id=${session_id}`)} className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#4361EE] shadow shadow-[#4361EE]/25">Riwayat</a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-screen-md mx-auto px-4 py-8 space-y-6">
                {/* Live Queue Banner Widget */}
                <div className="bg-gradient-to-r from-[#4361EE] to-[#3A56D4] rounded-3xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg shadow-[#4361EE]/20 gap-4">
                    <div>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase">Real-Time FIFO</span>
                        <h3 className="text-xl font-extrabold mt-1">Pantau Antrean Pesanan</h3>
                        <p className="text-[10px] text-blue-100 mt-0.5">Lihat urutan pembuatan kopi Anda secara langsung</p>
                    </div>
                    <a
                        href={getAppUrl(`/pembeli/antrian?session_id=${session_id}`)}
                        className="px-5 py-2.5 bg-white text-[#4361EE] font-extrabold text-xs rounded-2xl shadow hover:shadow-md transition flex items-center gap-1.5 uppercase tracking-wide shrink-0"
                    >
                        <span className="material-symbols-outlined text-sm font-extrabold animate-pulse">live_tv</span>
                        Lihat Antrean Live
                    </a>
                </div>

                {/* Orders Section */}
                <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-850">Pesanan Saya</h3>

                    {orders.length === 0 && (
                        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                            <span className="material-symbols-outlined text-5xl text-slate-350 mb-3 block">receipt_long</span>
                            <p className="font-bold text-slate-400">Belum ada riwayat pesanan</p>
                            <p className="text-xs text-slate-300 mt-1">Ayo buat pesanan kopi pertamamu sekarang!</p>
                            <a href={getAppUrl('/pembeli/pemesanan')} className="mt-4 inline-block px-5 py-2.5 bg-[#4361EE] text-white rounded-xl text-xs font-bold hover:bg-[#3A56D4] transition">Pesan Kopi</a>
                        </div>
                    )}

                    {orders.map((order, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3.5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-extrabold text-sm text-slate-850">{order.order_id}</p>
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400 uppercase">{({'qris': 'QRIS', 'va': 'Virtual Account', 'cash': 'Tunai'})[order.metode_pembayaran] || order.metode_pembayaran}</span>
                                    </div>
                                    <p className="text-[10px] text-[#4361EE] font-bold mt-1">Antrean #{order.nomor_antrian} — Atas Nama: {order.nama_pembeli || 'Pembeli'}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">{order.tanggal}</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-2.5 py-1 border rounded-full text-[9px] font-extrabold uppercase ${statusColor(order.status_pembayaran)}`}>
                                        Pembayaran: {statusLabel(order.status_pembayaran)}
                                    </span>
                                    <span className={`px-2.5 py-1 border rounded-full text-[9px] font-extrabold uppercase ${statusColor(order.status_pesanan)}`}>
                                        Pesanan: {statusLabel(order.status_pesanan)}
                                    </span>
                                </div>
                            </div>

                            {/* Menu Items List */}
                            {order.items && order.items.length > 0 && (
                                <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-slate-600 font-medium">{item.nama_menu} × {item.jumlah}</span>
                                            <span className="font-bold text-slate-800">Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-xs font-extrabold pt-2 border-t border-slate-200">
                                        <span>Total Tagihan</span>
                                        <span className="text-[#4361EE] text-sm">Rp {Number(order.total_biaya || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Payment Required / Receipt Upload Flow */}
                            {order.status_pembayaran === 'belum_bayar' && order.status_pesanan !== 'dibatalkan' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3.5">
                                    <div className="flex items-center gap-1.5 text-amber-800">
                                        <span className="material-symbols-outlined text-base">warning</span>
                                        <p className="text-xs font-bold">Harap Selesaikan Pembayaran</p>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-normal">
                                        Silakan transfer nominal tagihan ke bank <strong>{qris?.bank_name || 'Bank Negara Indonesia (BNI)'} ({qris?.no_rekening || '0982312211'})</strong> a.n. <strong>{qris?.nama_pemilik || 'CuanGO Haltea'}</strong> atau scan barcode QRIS, lalu upload bukti transfer di bawah ini:
                                    </p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                                        <div className="flex-1 w-full">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={e => handleFileChange(order.order_id, e.target.files[0])}
                                                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#4361EE]/10 file:text-[#4361EE] hover:file:bg-[#4361EE]/20 transition"
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleUploadProof(order.order_id)}
                                            disabled={loading[order.order_id] || !proofFiles[order.order_id]}
                                            className="w-full sm:w-auto bg-[#4361EE] hover:bg-[#3A56D4] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-4 py-2 rounded-xl text-[10px] transition shrink-0 uppercase tracking-wider flex items-center justify-center gap-1.5 shadow shadow-[#4361EE]/15"
                                        >
                                            {loading[order.order_id] && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                            <span>Unggah Bukti</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {order.status_pembayaran === 'pending_verifikasi' && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                                    <span className="material-symbols-outlined text-base">hourglass_empty</span>
                                    <span>Bukti pembayaran sedang diverifikasi oleh kasir.</span>
                                </div>
                            )}

                            {order.status_pembayaran === 'lunas' && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                    <span className="material-symbols-outlined text-base">task_alt</span>
                                    <span>Pembayaran Lunas — Masuk Antrean FIFO.</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
