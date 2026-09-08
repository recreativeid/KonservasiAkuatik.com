import React, { useState } from 'react';

export default function DevLogin() {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(getAppUrl('/developer/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                window.location.href = getAppUrl('/developer');
            } else {
                setError(data.message || 'Kredensial salah.');
            }
        } catch (err) {
            setError('Kesalahan koneksi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden select-none font-sans">
            {/* Glowing background circles for modern tech vibe */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-[420px] mx-4 relative z-10">
                <form onSubmit={handleLogin} className="bg-white/80 border border-blue-100 rounded-3xl p-8 shadow-2xl space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-2">
                            <span className="material-symbols-outlined text-2xl font-bold">terminal</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Developer Portal</h1>
                        <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest">Sistem POS Haltea & Langganan</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-150 rounded-2xl p-4 text-[11px] font-bold text-rose-600 text-center flex items-center justify-center gap-1.5">
                            <span className="material-symbols-outlined text-xs">error</span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider pl-1">Username</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 text-[18px]">person</span>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Username portal developer"
                                    required
                                    className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-blue-300 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider pl-1">Password</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 text-[18px]">lock</span>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-blue-300 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
                    >
                        {loading && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                        Masuk Ke Portal
                    </button>
                </form>

                {/* Kembali ke Beranda Link */}
                <div className="text-center pt-4">
                    <a 
                        href={getAppUrl('/')}
                        className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 hover:text-blue-600 transition"
                    >
                        <span className="material-symbols-outlined text-[14px]">home</span>
                        <span>Kembali ke Beranda</span>
                    </a>
                </div>

                <p className="text-center text-[10px] text-blue-450 font-bold mt-4">
                    &copy; 2026 CuanGO. Semua hak dilindungi.
                </p>
            </div>
        </div>
    );
}
