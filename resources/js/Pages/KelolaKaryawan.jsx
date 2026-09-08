import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function KelolaKaryawan({ user, staffs = [] }) {
    const [nama, setNama] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await fetch(getAppUrl('/api/staff/store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ nama, username, password })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSuccessMsg('Akun Karyawan berhasil dibuat!');
                setNama('');
                setUsername('');
                setPassword('');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setError(data.message || 'Gagal menambahkan karyawan.');
            }
        } catch (e) {
            setError('Terjadi kesalahan jaringan: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus akun karyawan ini?')) return;
        
        try {
            const res = await fetch(getAppUrl(`/api/staff/delete/${id}`), {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert('Karyawan berhasil dihapus.');
                window.location.reload();
            } else {
                alert(data.message || 'Gagal menghapus karyawan.');
            }
        } catch (e) {
            alert('Kesalahan jaringan: ' + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/kelola-karyawan" />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <h2 className="font-extrabold text-base text-slate-850">Kelola Akun Karyawan / Kasir</h2>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1 max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Kiri */}
                    <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm h-fit">
                        <h3 className="font-extrabold text-sm text-slate-850 mb-1">Tambah Karyawan Baru</h3>
                        <p className="text-[10px] text-slate-400 font-medium mb-5">Kasir akan menggunakan username & password ini untuk masuk.</p>

                        {error && (
                            <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-650 text-xs font-bold border border-red-100 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span> {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-650 text-xs font-bold border border-emerald-100 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">check_circle</span> {successMsg}
                            </div>
                        )}

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    value={nama} 
                                    onChange={e => setNama(e.target.value)} 
                                    required 
                                    placeholder="Contoh: Rian Pratama"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Username / Email</label>
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)} 
                                    required 
                                    placeholder="Contoh: rian_kasir"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Password</label>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required 
                                    placeholder="Minimal 6 karakter"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-3 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#4361EE]/20 transition flex items-center justify-center gap-2 mt-4"
                            >
                                <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'add_circle'}</span>
                                {loading ? 'Menyimpan...' : 'Tambah Karyawan'}
                            </button>
                        </form>
                    </div>

                    {/* Tabel Kanan */}
                    <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col min-h-[400px]">
                        <h3 className="font-extrabold text-sm text-slate-850 mb-4">Daftar Akun Karyawan Aktif</h3>
                        
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama</th>
                                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</th>
                                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daftar Pada</th>
                                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {staffs.map(st => (
                                        <tr key={st.id} className="hover:bg-slate-50/50 transition">
                                            <td className="py-4 text-xs font-bold text-slate-850 flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 border flex items-center justify-center text-slate-500 font-extrabold text-[10px] uppercase">
                                                    {st.nama.substring(0, 2)}
                                                </div>
                                                {st.nama}
                                            </td>
                                            <td className="py-4 text-xs font-semibold text-slate-500">{st.username}</td>
                                            <td className="py-4 text-[10px] font-bold text-slate-400">
                                                {st.created_at ? new Date(st.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'}) : '-'}
                                            </td>
                                            <td className="py-4 text-right">
                                                <button 
                                                    onClick={() => handleDelete(st.id)}
                                                    className="w-8 h-8 rounded-xl border border-red-100 hover:bg-red-50 text-red-650 flex items-center justify-center transition"
                                                >
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {staffs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-20 text-slate-400">
                                                <span className="material-symbols-outlined text-3xl mb-2 block">group</span>
                                                <p className="text-xs font-bold">Belum ada akun karyawan yang terdaftar.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
