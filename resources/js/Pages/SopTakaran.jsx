import React, { useState, useEffect } from 'react';
import Sidebar from '../Components/Sidebar';

export default function SopTakaran({ menus, barang, user }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const [selectedMenu, setSelectedMenu] = useState(null);
    const [sopItems, setSopItems] = useState([]);
    const [menuHarga, setMenuHarga] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [menuSearch, setMenuSearch] = useState('');
    const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
    const [newBarangId, setNewBarangId] = useState('');
    const userName = user?.name || user?.nama || 'User';
    const [newGramasi, setNewGramasi] = useState('');

    const filteredMenus = menus.filter(m => m.nama_menu.toLowerCase().includes(menuSearch.toLowerCase()));

    useEffect(() => {
        if (menus && menus.length > 0) handleSelectMenu(menus[0]);
    }, [menus]);

    const handleSelectMenu = async (menu) => {
        setSelectedMenu(menu); setLoading(true);
        try {
            const res = await fetch(getAppUrl(`/api/sop/menu/${menu.id}`), { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (res.ok) { const data = await res.json(); setSopItems(data.items || []); setMenuHarga(data.harga || 0); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleUpdateGramasi = (idBarang, value) => {
        setSopItems(sopItems.map(item => item.id_barang === idBarang ? { ...item, gramasi: parseFloat(value) || 0 } : item));
    };

    const handleRemoveIngredient = (idBarang) => { setSopItems(sopItems.filter(item => item.id_barang !== idBarang)); };

    const handleAddIngredient = (e) => {
        e.preventDefault();
        if (!newBarangId) return;
        if (sopItems.some(item => item.id_barang === parseInt(newBarangId))) { alert('Bahan sudah ada di SOP.'); return; }
        const sel = barang.find(b => b.id === parseInt(newBarangId));
        if (!sel) return;
        setSopItems([...sopItems, { id_barang: sel.id, nama_barang: sel.nama_barang, kode_barang: sel.kode_barang, satuan: sel.satuan_resep || 'gram', gramasi: parseFloat(newGramasi) || 0, jml_per_beli: 0, produk_per_beli: 0 }]);
        setIsAddIngredientOpen(false); setNewBarangId(''); setNewGramasi('');
    };

    const handleSave = async () => {
        if (!selectedMenu) return; setSaving(true);
        const payload = { id_menu: selectedMenu.id, harga: parseInt(menuHarga) || 0, items: sopItems.map(item => ({ id_barang: item.id_barang, gramasi: item.gramasi, jml_per_beli: item.jml_per_beli || 0, produk_per_beli: item.produk_per_beli || 0 })) };
        try {
            const res = await fetch(getAppUrl('/api/sop/save'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (res.ok && data.success) { alert(data.message); selectedMenu.harga = menuHarga; } else { alert(data.message || 'Gagal.'); }
        } catch (e) { alert('Kesalahan: ' + e.message); } finally { setSaving(false); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/sop-takaran" />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div className="relative">
                        <input type="text" placeholder="Cari data, menu, atau laporan..." className="w-80 bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-200 outline-none transition" />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"><span className="material-symbols-outlined text-[18px]">notifications</span></button>
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-700">{userName}</span>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">{userName.substring(0, 2)}</div>
                        </div>
                    </div>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800">SOP & Takaran Menu</h1>
                        <p className="text-sm text-slate-400 mt-1">Sesuaikan takaran/gramasi bahan baku untuk setiap menu produk.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Left: Menu List */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Daftar Menu</h3>
                                <span className="bg-[#4361EE]/10 text-[#4361EE] font-bold text-[10px] px-2 py-0.5 rounded-full">{menus.length}</span>
                            </div>
                            <div className="relative">
                                <input type="text" placeholder="Filter menu..." value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-blue-200 outline-none" />
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[14px]">search</span>
                            </div>
                            <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
                                {filteredMenus.map(menu => (
                                    <button key={menu.id} onClick={() => handleSelectMenu(menu)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${selectedMenu?.id === menu.id ? 'bg-[#4361EE]/10 border border-[#4361EE]/20 text-[#4361EE]' : 'hover:bg-slate-50 text-slate-600'}`}>
                                        <div className="min-w-0">
                                            <p className="font-bold text-[13px] truncate">{menu.nama_menu}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Rp {menu.harga?.toLocaleString('id-ID') || '0'}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-sm text-slate-300">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: SOP Editor */}
                        <div className="lg:col-span-2 space-y-4">
                            {selectedMenu ? (
                                <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-lg font-extrabold text-slate-800 truncate">{selectedMenu.nama_menu}</h2>
                                            <div className="flex items-center gap-3 mt-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Harga Jual</label>
                                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                                                    <span className="text-xs text-slate-400 font-bold">Rp</span>
                                                    <input type="number" value={menuHarga} onChange={(e) => setMenuHarga(e.target.value)} className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none w-24" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setIsAddIngredientOpen(true)} className="border border-slate-200 bg-white text-slate-600 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-slate-50 transition">
                                                <span className="material-symbols-outlined text-sm">add</span><span>Tambah Bahan</span>
                                            </button>
                                            <button onClick={handleSave} disabled={saving} className="bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#4361EE]/20 flex items-center gap-1.5 transition">
                                                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                                <span>Simpan Resep</span>
                                            </button>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="text-center py-12 text-slate-400">Memuat data resep...</div>
                                    ) : sopItems.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400 font-medium">Belum ada bahan baku. Klik "+ Tambah Bahan".</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <th className="pb-3">Kode</th><th className="pb-3">Bahan Baku</th><th className="pb-3 text-right">Takaran</th><th className="pb-3 text-center">Satuan</th><th className="pb-3 text-center w-14">Hapus</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 text-[13px]">
                                                    {sopItems.map(item => (
                                                        <tr key={item.id_barang} className="hover:bg-blue-50/20 transition">
                                                            <td className="py-3.5 font-bold text-slate-500 text-xs">{item.kode_barang}</td>
                                                            <td className="py-3.5 font-semibold text-slate-700">{item.nama_barang}</td>
                                                            <td className="py-3.5 text-right">
                                                                <input type="number" step="0.01" value={item.gramasi} onChange={(e) => handleUpdateGramasi(item.id_barang, e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:ring-2 focus:ring-blue-200 outline-none w-24" />
                                                            </td>
                                                            <td className="py-3.5 text-center font-medium text-slate-400 text-xs">{item.satuan}</td>
                                                            <td className="py-3.5 text-center">
                                                                <button onClick={() => handleRemoveIngredient(item.id_barang)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition mx-auto">
                                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-medium">Pilih menu di panel kiri untuk mengedit resep/SOP.</div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Ingredient Modal */}
            {isAddIngredientOpen && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-extrabold text-sm text-slate-800">Tambah Bahan Resep</h3>
                            <button onClick={() => setIsAddIngredientOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        <form onSubmit={handleAddIngredient} className="space-y-4">
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Bahan Baku</label>
                                <select value={newBarangId} onChange={(e) => setNewBarangId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required>
                                    <option value="">Pilih bahan baku...</option>
                                    {barang.map(b => <option key={b.id} value={b.id}>{b.kode_barang} - {b.nama_barang}</option>)}
                                </select>
                            </div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Gramasi / Takaran</label>
                                <input type="number" step="0.01" value={newGramasi} onChange={(e) => setNewGramasi(e.target.value)} placeholder="15.5" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required />
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAddIngredientOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition">Batal</button>
                                <button type="submit" className="bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#4361EE]/20 transition">Tambahkan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
