import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';

export default function Login({ dev_payment }) {
    const [step, setStep] = useState('select_role'); // 'select_role', 'login_form', or 'register_form'
    const [selectedRole, setSelectedRole] = useState(null); // 'karyawan' or 'admin'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nama, setNama] = useState('');
    const [namaToko, setNamaToko] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const handleRoleSelect = (role) => {
        if (role === 'pembeli') {
            window.location.href = getAppUrl('/pembeli/explore');
        } else {
            setSelectedRole(role);
            setStep('login_form');
            setError(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(getAppUrl('/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ username, password, role: selectedRole })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                if (data.role === 'admin') {
                    window.location.href = getAppUrl('/dashboard');
                } else {
                    window.location.href = getAppUrl('/verifikasi');
                }
                return;
            } else {
                setError(data.message || 'Username atau password salah.');
                setLoading(false);
            }
        } catch (err) {
            setError('Terjadi kesalahan jaringan.');
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(getAppUrl('/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ nama, username, password, nama_toko: namaToko })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                window.location.href = getAppUrl('/dashboard');
            } else {
                setError(data.message || 'Gagal melakukan registrasi.');
                setLoading(false);
            }
        } catch (err) {
            setError('Terjadi kesalahan jaringan.');
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none font-sans"
            style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: "radial-gradient(circle at 50% 50%, rgba(219, 234, 254, 0.3) 0%, rgba(248, 250, 252, 1) 100%)"
            }}
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-100/30 blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-4xl flex flex-col items-center justify-center relative z-10 space-y-10">
                {/* Logo & Headline */}
                <div className="flex flex-col items-center text-center space-y-3.5">
                    <img 
                        src={getAppUrl('/images/logo-cuango.png')} 
                        alt="CuanGO Logo" 
                        className="w-20 h-20 object-contain"
                    />
                    <div className="space-y-0.5 text-slate-500 font-semibold text-xs sm:text-[13px] tracking-wide">
                        <p>Sistem Manajemen Inventory & POS</p>
                        <p>Tercanggih untuk Bisnis Anda</p>
                    </div>
                </div>

                {step === 'select_role' && (
                    <div className="w-full space-y-8">
                        {/* Title */}
                        <div className="text-center">
                            <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase">
                                PILIH AKSES MASUK
                            </span>
                        </div>

                        {/* Cards Selection Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
                            {/* Card 1: Pembeli */}
                            <button
                                onClick={() => handleRoleSelect('pembeli')}
                                className="bg-white border border-slate-100 rounded-3xl p-7 flex flex-col items-center text-center space-y-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-extrabold text-sm text-slate-800">Login sebagai Pembeli</h3>
                                    <p className="text-[11px] text-slate-450 font-medium leading-relaxed">
                                        Akses katalog dan lacak pesanan Anda
                                    </p>
                                </div>
                            </button>

                            {/* Card 2: Karyawan */}
                            <button
                                onClick={() => handleRoleSelect('karyawan')}
                                className="bg-white border border-slate-100 rounded-3xl p-7 flex flex-col items-center text-center space-y-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined text-xl">point_of_sale</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-extrabold text-sm text-slate-800">Login sebagai Karyawan</h3>
                                    <p className="text-[11px] text-slate-455 font-medium leading-relaxed">
                                        Buka terminal kasir dan kelola stok harian
                                    </p>
                                </div>
                            </button>

                            {/* Card 3: Admin */}
                            <button
                                onClick={() => handleRoleSelect('admin')}
                                className="bg-white border border-slate-100 rounded-3xl p-7 flex flex-col items-center text-center space-y-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                    <span className="material-symbols-outlined text-xl">shield</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-extrabold text-sm text-slate-800">Login sebagai Admin</h3>
                                    <p className="text-[11px] text-slate-455 font-medium leading-relaxed">
                                        Analisis performa dan konfigurasi sistem
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="w-full max-w-[480px] h-[1px] bg-slate-200/50 mx-auto pt-4"></div>

                        {/* UMKM Trust Banner */}
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex -space-x-1.5">
                                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm" alt="Owner 1" />
                                <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop" className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm" alt="Owner 2" />
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop" className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm" alt="Owner 3" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">
                                Dipercaya oleh <span className="text-blue-600 font-extrabold">500+ UMKM</span> di Indonesia
                            </span>
                        </div>
                        {/* Kembali ke Beranda Link */}
                        <div className="text-center pt-5">
                            <a 
                                href={getAppUrl('/')}
                                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 hover:text-blue-600 transition"
                            >
                                <span className="material-symbols-outlined text-[14px]">home</span>
                                <span>Kembali ke Beranda</span>
                            </a>
                        </div>
                    </div>
                )}

                {(step === 'login_form' || step === 'register_form') && (
                    <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl p-8 relative">
                        {/* Back Button */}
                        <button
                            onClick={() => { setStep(step === 'register_form' ? 'login_form' : 'select_role'); setError(null); }}
                            className="absolute left-6 top-6 w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                        >
                            <span className="material-symbols-outlined text-sm font-black">arrow_back</span>
                        </button>

                        {step === 'login_form' && (
                            <div className="space-y-6 pt-4">
                                <div className="text-center">
                                    <h2 className="text-lg font-black text-slate-800 capitalize">Login {selectedRole}</h2>
                                    <p className="text-[11px] text-slate-400 font-semibold mt-1">Masukkan kredensial akun untuk melanjutkan</p>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-2.5">
                                        <span className="material-symbols-outlined text-rose-500 text-base">error</span>
                                        <span className="text-xs text-rose-700 font-bold leading-relaxed">{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Username / Email</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Masukkan username..."
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-450 rounded-2xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Masukkan password..."
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-455 rounded-2xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition text-xs font-semibold"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2"
                                    >
                                        {loading ? 'Memproses...' : 'Masuk ke Sistem'}
                                    </button>

                                    {selectedRole === 'admin' && (
                                        <div className="text-center pt-2">
                                            <button
                                                type="button"
                                                onClick={() => { setStep('register_form'); setError(null); }}
                                                className="text-xs text-blue-600 font-bold hover:underline"
                                            >
                                                Belum punya akun? Daftar Merchant CuanGO
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}

                        {step === 'register_form' && (
                            <div className="space-y-6 pt-4">
                                <div className="text-center">
                                    <h2 className="text-lg font-black text-slate-800">Daftar Merchant CuanGO</h2>
                                    <p className="text-[11px] text-slate-400 font-semibold mt-1">Registrasi untuk memulai sistem POS & AI</p>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-2.5">
                                        <span className="material-symbols-outlined text-rose-500 text-base">error</span>
                                        <span className="text-xs text-rose-700 font-bold leading-relaxed">{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Nama Lengkap Owner</label>
                                        <input
                                            type="text"
                                            value={nama}
                                            onChange={(e) => setNama(e.target.value)}
                                            placeholder="Contoh: Rian Pratama"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-450 rounded-2xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Username / Email</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Contoh: rian_owner"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-450 rounded-2xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Nama Toko / Outlet</label>
                                        <input
                                            type="text"
                                            value={namaToko}
                                            onChange={(e) => setNamaToko(e.target.value)}
                                            placeholder="Contoh: Kedai Kopi Rian"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-450 rounded-2xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Minimal 6 karakter..."
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-450 rounded-2xl py-3 px-4 outline-none focus:bg-white focus:border-blue-500 transition text-xs font-semibold"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-2"
                                    >
                                        {loading ? 'Mendaftarkan...' : 'Daftar Merchant Baru'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
