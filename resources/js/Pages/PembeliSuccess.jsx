import React from 'react';

export default function PembeliSuccess({ order, items }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex items-center justify-center p-4">
            <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col items-center border-b pb-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                        <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-850">Pesanan Berhasil Dibuat</h2>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Order ID: #{order.order_id}</p>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Tanggal Pesanan</span>
                        <span className="font-bold">{order.tanggal}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Metode Pembayaran</span>
                        <span className="font-bold uppercase">{({'qris': 'QRIS', 'va': 'Virtual Account (BCA)', 'cash': 'Tunai'})[order.metode_pembayaran] || order.metode_pembayaran}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Status Pembayaran</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${order.status_pembayaran === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.status_pembayaran === 'lunas' ? 'Lunas' : 'Menunggu Verifikasi'}
                        </span>
                    </div>
                </div>

                {/* Items Box */}
                <div className="bg-slate-50 border rounded-2xl p-4 divide-y space-y-3">
                    {items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs pt-3 first:pt-0">
                            <div>
                                <p className="font-bold text-slate-800">{item.nama_menu}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{item.jumlah}x @ Rp {item.harga.toLocaleString('id-ID')}</p>
                            </div>
                            <span className="font-bold text-slate-800">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                    ))}
                    <div className="flex justify-between font-extrabold text-xs pt-3 text-slate-850">
                        <span>Total Biaya</span>
                        <span className="text-blue-600">Rp {order.total_biaya.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                <div className="pt-2">
                    <a href={getAppUrl('/pembeli/pemesanan')} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-bold py-3.5 rounded-2xl transition-all shadow block text-xs">
                        Kembali Ke Halaman Utama
                    </a>
                </div>
            </div>
        </div>
    );
}
