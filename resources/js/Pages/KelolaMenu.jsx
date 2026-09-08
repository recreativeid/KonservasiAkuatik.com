import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function KelolaMenu({ menus, user }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };
    const [menuList, setMenuList] = useState(menus);
    const userName = user?.name || user?.nama || 'User';
    const [search, setSearch] = useState('');
    const [editingMenu, setEditingMenu] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [namaMenu, setNamaMenu] = useState('');
    const [harga, setHarga] = useState(0);
    const [keterangan, setKeterangan] = useState('');
    const [kategori, setKategori] = useState('');
    const [aktif, setAktif] = useState(1);
    const [gambarFile, setGambarFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const filteredMenus = menuList.filter(m => m.nama_menu.toLowerCase().includes(search.toLowerCase()));
    const totalPages = Math.ceil(filteredMenus.length / perPage);
    const paginatedMenus = filteredMenus.slice((currentPage - 1) * perPage, currentPage * perPage);

    const totalAktif = menuList.filter(m => m.aktif === 1).length;
    const totalNonAktif = menuList.filter(m => m.aktif === 0).length;

    const handleToggleStatus = async (id) => {
        try {
            const response = await fetch(getAppUrl(`/api/menu/toggle/${id}`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setMenuList(menuList.map(m => m.id === id ? { ...m, aktif: data.aktif } : m));
            } else {
                alert(data.message || 'Gagal mengubah status.');
            }
        } catch (e) {
            alert('Kesalahan: ' + e.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus menu ini secara permanen?')) return;
        try {
            const response = await fetch(getAppUrl(`/api/menu/delete/${id}`), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setMenuList(menuList.filter(m => m.id !== id));
            } else {
                alert(data.message || 'Gagal menghapus menu.');
            }
        } catch (e) {
            alert('Kesalahan: ' + e.message);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        const formData = new FormData();
        formData.append('nama_menu', namaMenu); formData.append('harga', harga); formData.append('keterangan', keterangan); formData.append('kategori', kategori); formData.append('aktif', aktif);
        if (gambarFile) formData.append('gambar_file', gambarFile);
        try {
            const response = await fetch(getAppUrl('/api/menu/store'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: formData
            });
            const data = await response.json();
            if (response.ok && data.success) {
                if (data.menu) {
                    setMenuList(prev => [...prev, data.menu]);
                }
                setIsAddOpen(false);
                setNamaMenu(''); setHarga(0); setKeterangan(''); setKategori(''); setAktif(1); setGambarFile(null);
                alert(data.message);
            } else {
                let errMsg = data.message || 'Gagal menambahkan menu.';
                if (data.errors) {
                    const firstErr = Object.values(data.errors)[0];
                    if (Array.isArray(firstErr) && firstErr.length > 0) {
                        errMsg = firstErr[0];
                    }
                }
                alert(errMsg);
            }
        } catch (err) {
            alert('Kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        const formData = new FormData();
        formData.append('nama_menu', editingMenu.nama_menu); formData.append('harga', editingMenu.harga); formData.append('keterangan', editingMenu.keterangan || ''); formData.append('kategori', editingMenu.kategori || ''); formData.append('aktif', editingMenu.aktif);
        if (gambarFile) formData.append('gambar_file', gambarFile);
        try {
            const response = await fetch(getAppUrl(`/api/menu/update/${editingMenu.id}`), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: formData
            });
            const data = await response.json();
            if (response.ok && data.success) {
                if (data.menu) {
                    setMenuList(prev => prev.map(m => m.id === data.menu.id ? data.menu : m));
                }
                setEditingMenu(null);
                setGambarFile(null);
                alert(data.message);
            } else {
                let errMsg = data.message || 'Gagal memperbarui menu.';
                if (data.errors) {
                    const firstErr = Object.values(data.errors)[0];
                    if (Array.isArray(firstErr) && firstErr.length > 0) {
                        errMsg = firstErr[0];
                    }
                }
                alert(errMsg);
            }
        } catch (err) {
            alert('Kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/kelola-menu" />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div className="relative">
                        <input type="text" placeholder="Search product name or ID..." className="w-80 bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"><span className="material-symbols-outlined text-[18px]">notifications</span></button>
                        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"><span className="material-symbols-outlined text-[18px]">help</span></button>
                        <div className="flex items-center gap-2.5">
                            <div className="text-right"><span className="text-xs font-bold text-slate-700 block">{userName}</span><span className="text-[10px] text-slate-400 font-medium">Admin Terminal</span></div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">{userName.substring(0, 2)}</div>
                        </div>
                    </div>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1">
                    {/* Title + CTA */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800">Daftar Menu</h1>
                            <p className="text-sm text-slate-400 mt-1">Kelola data master produk dan ketersediaan menu.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="border border-slate-200 bg-white text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition">
                                <span className="material-symbols-outlined text-sm">tune</span><span>Filter</span>
                            </button>
                            <button onClick={() => setIsAddOpen(true)} className="bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#4361EE]/20 flex items-center gap-2 transition">
                                <span className="material-symbols-outlined text-sm font-bold">add</span><span>Tambah Menu</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab + Count */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-[#4361EE] border-b-2 border-[#4361EE] pb-2">Semua Menu</span>
                        <span className="bg-[#4361EE]/10 text-[#4361EE] font-bold text-[10px] px-2.5 py-1 rounded-full">{menuList.length} Item</span>
                        <div className="flex-1"></div>
                        <div className="relative w-56">
                            <input type="text" placeholder="Cari menu..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-blue-200 outline-none" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">search</span>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Foto & Nama</th>
                                        <th className="px-6 py-4">Deskripsi</th>
                                        <th className="px-6 py-4">Harga</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[13px]">
                                    {paginatedMenus.map(m => (
                                        <tr key={m.id} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={m.gambar ? getAppUrl(m.gambar) + '?v=' + Date.now() : getAppUrl('haltea-logo.png')} alt={m.nama_menu} className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-100" onError={(e) => { e.target.src = getAppUrl('haltea-logo.png'); }} />
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="font-bold text-slate-800">{m.nama_menu}</p>
                                                            {m.kategori && (
                                                                <span className="bg-[#4361EE]/10 text-[#4361EE] text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">
                                                                    {m.kategori}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-medium">BEV-{String(m.id).padStart(3, '0')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate font-medium">{m.keterangan || '-'}</td>
                                            <td className="px-6 py-4 font-bold text-slate-800">Rp {m.harga.toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleToggleStatus(m.id)} className="flex items-center gap-2 group">
                                                    <div className={`w-9 h-5 rounded-full transition relative ${m.aktif === 1 ? 'bg-[#4361EE]' : 'bg-slate-200'}`}>
                                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${m.aktif === 1 ? 'left-[18px]' : 'left-0.5'}`}></div>
                                                    </div>
                                                    <span className={`text-[11px] font-bold ${m.aktif === 1 ? 'text-[#4361EE]' : 'text-slate-400'}`}>{m.aktif === 1 ? 'Aktif' : 'Nonaktif'}</span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => { setEditingMenu(m); setGambarFile(null); }} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                                    <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedMenus.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-medium">Menu tidak ditemukan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Menampilkan {paginatedMenus.length} dari {filteredMenus.length} menu</span>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-40 transition"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setCurrentPage(p)} className={`w-7 h-7 rounded-lg text-[11px] font-bold transition ${currentPage === p ? 'bg-[#4361EE] text-white shadow-md shadow-[#4361EE]/20' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}>{p}</button>
                                    ))}
                                    {totalPages > 5 && <span className="text-slate-400 mx-1">...</span>}
                                    {totalPages > 5 && <button onClick={() => setCurrentPage(totalPages)} className={`w-7 h-7 rounded-lg text-[11px] font-bold ${currentPage === totalPages ? 'bg-[#4361EE] text-white' : 'bg-slate-50 text-slate-500'}`}>{totalPages}</button>}
                                    <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-40 transition"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><span className="material-symbols-outlined text-xl">restaurant_menu</span></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Total Menu Aktif</p>
                                <h3 className="text-2xl font-extrabold text-slate-800">{totalAktif} <span className="text-sm font-semibold text-slate-400">items</span></h3>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-500 flex items-center justify-center"><span className="material-symbols-outlined text-xl">trending_up</span></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Top Selling Menu</p>
                                <h3 className="text-sm font-extrabold text-slate-800">{menuList[0]?.nama_menu || '-'}</h3>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><span className="material-symbols-outlined text-xl">warning</span></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Stok Habis</p>
                                <h3 className="text-2xl font-extrabold text-red-600">{totalNonAktif} <span className="text-sm font-semibold text-slate-400">items</span></h3>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-sm text-slate-800">Tambah Menu Baru</h3>
                            <button onClick={() => setIsAddOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="space-y-3.5">
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nama Menu</label><input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" placeholder="Es Teh Manis" value={namaMenu} onChange={(e) => setNamaMenu(e.target.value)} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Harga (Rp)</label><input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" value={harga} onChange={(e) => setHarga(parseInt(e.target.value))} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Deskripsi</label><textarea rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Kategori Menu (Contoh: Makanan, Minuman, Snack)</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" placeholder="Masukkan kategori custom" value={kategori} onChange={(e) => setKategori(e.target.value)} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Status</label><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" value={aktif} onChange={(e) => setAktif(parseInt(e.target.value))}><option value={1}>Aktif</option><option value={0}>Nonaktif</option></select></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Foto Produk</label><input type="file" accept="image/*" onChange={(e) => setGambarFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#4361EE]/10 file:text-[#4361EE] hover:file:bg-[#4361EE]/20" /></div>
                            <button type="submit" disabled={loading} className="w-full bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-[#4361EE]/20 flex justify-center items-center gap-1.5 mt-2">
                                {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                <span>Simpan Produk</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingMenu && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-sm text-slate-800">Edit Menu</h3>
                            <button onClick={() => setEditingMenu(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className="space-y-3.5">
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nama Menu</label><input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" value={editingMenu.nama_menu} onChange={(e) => setEditingMenu({ ...editingMenu, nama_menu: e.target.value })} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Harga (Rp)</label><input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" value={editingMenu.harga} onChange={(e) => setEditingMenu({ ...editingMenu, harga: parseInt(e.target.value) })} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Deskripsi</label><textarea rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" value={editingMenu.keterangan || ''} onChange={(e) => setEditingMenu({ ...editingMenu, keterangan: e.target.value })} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Kategori Menu</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" placeholder="Masukkan kategori custom" value={editingMenu.kategori || ''} onChange={(e) => setEditingMenu({ ...editingMenu, kategori: e.target.value })} /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Status</label><select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#4361EE]/20 outline-none" value={editingMenu.aktif} onChange={(e) => setEditingMenu({ ...editingMenu, aktif: parseInt(e.target.value) })}><option value={1}>Aktif</option><option value={0}>Nonaktif</option></select></div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Foto Saat Ini</label>
                                {editingMenu.gambar && (
                                    <div className="mb-2">
                                        <img src={getAppUrl(editingMenu.gambar) + '?v=' + Date.now()} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                                    </div>
                                )}
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Ganti Foto</label><input type="file" accept="image/*" onChange={(e) => setGambarFile(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-[#4361EE]/10 file:text-[#4361EE] hover:file:bg-[#4361EE]/20" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-[#4361EE]/20 flex justify-center items-center gap-1.5 mt-2">
                                {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                <span>Perbarui Produk</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
