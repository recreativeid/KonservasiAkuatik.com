import React from 'react';

export default function PembeliTokoProfile({ toko, wa_number, staffs = [] }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12 select-none">
            {/* Header Navbar */}
            <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <a href={getAppUrl('/pembeli/explore')} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span> Kembali Cari Toko
                    </a>
                    <span className="font-extrabold text-sm text-slate-800 tracking-tight">Profil Merchant</span>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 mt-6">
                <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                    {/* Cover Image */}
                    <div className="h-48 md:h-64 bg-slate-150 relative">
                        {toko.foto_sampul ? (
                            <img src={getAppUrl(toko.foto_sampul)} alt="Sampul Toko" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-650 flex items-center justify-center text-white/20">
                                <span className="material-symbols-outlined text-7xl font-light">storefront</span>
                            </div>
                        )}

                        {/* Overlapping Logo */}
                        <div className="absolute -bottom-10 left-8 w-24 h-24 rounded-3xl bg-white border border-slate-100 p-1.5 shadow-md flex items-center justify-center overflow-hidden">
                            {toko.logo ? (
                                <img src={getAppUrl(toko.logo)} alt="Logo Toko" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-450">
                                    <span className="material-symbols-outlined text-3xl">store</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Store Profile Info */}
                    <div className="pt-16 pb-8 px-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-850 tracking-tight">{toko.nama_toko}</h1>
                                <p className="text-xs text-blue-600 font-bold mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                    {toko.kelurahan ? `${toko.kelurahan}, ` : ''}
                                    {toko.kecamatan ? `${toko.kecamatan}, ` : ''}
                                    {toko.kota}, {toko.provinsi}
                                </p>
                            </div>
                            
                            <a 
                                href={getAppUrl(`/pembeli/pemesanan?id_toko=${toko.id}`)}
                                className="px-7 py-3 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-extrabold rounded-2xl text-xs shadow-md shadow-[#4361EE]/25 transition-all text-center flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                <span className="material-symbols-outlined text-sm">shopping_cart</span> Pesan Sekarang
                            </a>
                        </div>

                        <div className="border-t border-slate-100 pt-6 space-y-4">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tentang Toko</h3>
                                <p className="text-xs text-slate-650 leading-relaxed font-medium">{toko.deskripsi || 'Belum ada deskripsi profil toko.'}</p>
                            </div>

                            {/* WhatsApp Contacts */}
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-1.5 text-emerald-800">
                                    <span className="material-symbols-outlined text-lg">chat</span>
                                    <h4 className="text-xs font-bold">Hubungi WhatsApp Kasir / Karyawan</h4>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">Jika Anda memiliki pertanyaan tentang menu, pesanan, atau konfirmasi pembayaran, silakan hubungi tim kami:</p>
                                
                                <div className="flex flex-wrap gap-2.5 pt-1.5">
                                    {wa_number && (
                                        <a 
                                            href={`https://wa.me/${wa_number.replace(/[^0-9]/g, '').startsWith('0') ? '62' + wa_number.replace(/[^0-9]/g, '').slice(1) : wa_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo Admin, saya ingin bertanya...')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-4 py-2 rounded-xl shadow-sm transition"
                                        >
                                            <span className="material-symbols-outlined text-xs">storefront</span>
                                            <span>WhatsApp Toko (Admin)</span>
                                        </a>
                                    )}

                                    {staffs.map((staff, idx) => {
                                        const isPhone = /^[0-9+-\s]+$/.test(staff.username);
                                        if (!isPhone) return null;
                                        return (
                                            <a 
                                                key={idx}
                                                href={`https://wa.me/${staff.username.replace(/[^0-9]/g, '').startsWith('0') ? '62' + staff.username.replace(/[^0-9]/g, '').slice(1) : staff.username.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo Kasir ' + staff.nama + ', saya ingin bertanya...')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 bg-emerald-550 hover:bg-emerald-650 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold px-4 py-2 rounded-xl transition"
                                            >
                                                <span className="material-symbols-outlined text-xs">support_agent</span>
                                                <span>Chat Kasir: {staff.nama}</span>
                                            </a>
                                        );
                                    })}

                                    {!wa_number && staffs.filter(s => /^[0-9+-\s]+$/.test(s.username)).length === 0 && (
                                        <p className="text-[10px] text-slate-400 italic">Nomor kontak WhatsApp belum disediakan oleh merchant.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">🕒 Jam Operasional</h3>
                                    <p className="text-xs text-slate-700 font-bold">{toko.jam_buka.substring(0,5)} - {toko.jam_tutup.substring(0,5)} WIB</p>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📍 Alamat Lengkap</h3>
                                    <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                                        {toko.alamat || 'Alamat belum diatur.'}
                                        {(toko.kelurahan || toko.kecamatan) && (
                                            <span className="block text-[11px] text-slate-450 mt-1">
                                                Kel. {toko.kelurahan || '-'}, Kec. {toko.kecamatan || '-'}, {toko.kota}, {toko.provinsi}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
