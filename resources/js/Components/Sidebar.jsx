import React from 'react';
import { Inertia } from '@inertiajs/inertia';

export default function Sidebar({ user, activePage }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const userName = user?.name || user?.nama || 'User';

    const isLinkActive = (path) => {
        return activePage === path;
    };

    const handleLogout = (e) => {
        e.preventDefault();
        Inertia.post(getAppUrl('/logout'));
    };

    const navLink = (path, icon, label) => (
        <a 
            href={getAppUrl(path)} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                isLinkActive(path) 
                    ? 'bg-[#4361EE] text-white shadow-md shadow-[#4361EE]/25' 
                    : 'text-slate-500 hover:bg-[#4361EE]/5 hover:text-[#4361EE]'
            }`}
        >
            <span className={`material-symbols-outlined text-[18px] ${isLinkActive(path) ? '' : 'text-slate-400'}`}>{icon}</span>
            <span>{label}</span>
        </a>
    );

    return (
        <aside className="w-[260px] bg-white flex flex-col justify-between border-r border-slate-100 shrink-0 h-screen sticky top-0">
            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-6">
                {/* Logo Section */}
                <div className="flex items-center px-1 pb-4 border-b border-slate-100">
                    <img 
                        src={getAppUrl('/images/logo-cuango-landscape.png')} 
                        alt="CuanGO Logo" 
                        className="h-10 object-contain"
                    />
                </div>

                {/* Nav Links */}
                <nav className="space-y-5">
                    {/* SECTION: UTAMA */}
                    {user.role === 'admin' && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-4 mb-2">Utama</p>
                            <div className="space-y-1">
                                {navLink('/dashboard', 'dashboard', 'Dashboard')}
                            </div>
                        </div>
                    )}

                    {/* SECTION: TRANSAKSI & OPERASIONAL */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-4 mb-2">Transaksi</p>
                        <div className="space-y-1">
                            {navLink('/pos-terminal', 'point_of_sale', 'Transaksi')}
                            {navLink('/verifikasi', 'verified', 'Verifikasi Pesanan')}
                            {navLink('/data-transaksi', 'receipt_long', 'Riwayat Transaksi')}
                            {navLink('/absensi', 'badge', 'Absensi Staff')}
                        </div>
                    </div>

                    {/* SECTION: MANAJEMEN GUDANG (Admin Only) */}
                    {user.role === 'admin' && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-4 mb-2">Manajemen Gudang</p>
                            <div className="space-y-1">
                                {navLink('/kelola-menu', 'restaurant_menu', 'Daftar Menu')}
                                {navLink('/stok-bahan-baku', 'inventory_2', 'Stok Bahan Baku')}
                                {navLink('/sop-takaran', 'menu_book', 'SOP & Takaran')}
                            </div>
                        </div>
                    )}

                    {/* SECTION: PREDIKSI & BELANJA */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-4 mb-2">Analisis Prediksi</p>
                        <div className="space-y-1">
                            {navLink('/lihat-prediksi', 'show_chart', 'Analisis Prediksi')}
                        </div>
                    </div>

                    {/* SECTION: LAPORAN KEUANGAN (Admin Only) */}
                    {user.role === 'admin' && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-4 mb-2">Keuangan</p>
                            <div className="space-y-1">
                                {navLink('/keuangan', 'payments', 'Laporan Keuangan')}
                            </div>
                        </div>
                    )}

                    {/* SECTION: MANAJEMEN TOKO (Admin Only) */}
                    {user.role === 'admin' && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-4 mb-2">Manajemen Toko</p>
                            <div className="space-y-1">
                                {navLink('/profil-toko', 'store', 'Profil Toko')}
                                {navLink('/kelola-karyawan', 'group', 'Kelola Karyawan')}
                            </div>
                        </div>
                    )}

                    {/* SECTION: PENGATURAN */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-4 mb-2">Pengaturan & Lisensi</p>
                        <div className="space-y-1">
                            {navLink('/pengaturan', 'settings', 'Pengaturan')}
                            {user.role === 'admin' && navLink('/berlangganan', 'card_membership', 'Paket Berlangganan')}
                        </div>
                    </div>
                </nav>
            </div>

            {/* Profile & Logout Section */}
            <div className="px-4 py-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">
                        {userName.substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-800 truncate">{userName}</p>
                        <p className="text-[10px] text-slate-400 capitalize font-medium">{user.role === 'admin' ? 'Store Manager' : 'Kasir'}</p>
                    </div>
                </div>
                <a 
                    href={getAppUrl('/logout')} 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 font-semibold text-xs transition"
                >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Keluar Sistem</span>
                </a>
            </div>
        </aside>
    );
}
