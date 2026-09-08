import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function StokBahanBaku({ barang, user }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const [barangList, setBarangList] = useState(barang);
    const userName = user?.name || user?.nama || 'User';
    const [activeTab, setActiveTab] = useState('umum');
    const [search, setSearch] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [kodeBarang, setKodeBarang] = useState('');
    const [namaBarang, setNamaBarang] = useState('');
    const [satuanBeli, setSatuanBeli] = useState('Pack');
    const [satuanResep, setSatuanResep] = useState('gram');
    const [faktorKonversi, setFaktorKonversi] = useState(1);
    const [stokGudang, setStokGudang] = useState(0);
    const [safetyStockHari, setSafetyStockHari] = useState(1);
    const [leadTimeHari, setLeadTimeHari] = useState(2);
    const [hargaBeli, setHargaBeli] = useState(0);

    const refreshData = async () => {
        try {
            const res = await fetch(getAppUrl('/stok-bahan-baku'), { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (res.ok) { const data = await res.json(); setBarangList(data); }
        } catch (e) { console.error(e); }
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item); setKodeBarang(item.kode_barang); setNamaBarang(item.nama_barang);
        setSatuanBeli(item.satuan_beli || 'Pack'); setSatuanResep(item.satuan_resep || 'gram');
        setFaktorKonversi(item.faktor_konversi); setStokGudang(item.stok_gudang);
        setSafetyStockHari(item.safety_stock_hari); setLeadTimeHari(item.lead_time_hari); setHargaBeli(item.harga_beli || 0);
    };

    const handleOpenAdd = () => {
        setEditingItem(null); setKodeBarang('BRG-' + Date.now().toString().slice(-4)); setNamaBarang('');
        setSatuanBeli('Pack'); setSatuanResep('gram'); setFaktorKonversi(1000); setStokGudang(0);
        setSafetyStockHari(1); setLeadTimeHari(2); setHargaBeli(0); setIsAddOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault(); setLoading(true);
        const url = editingItem ? getAppUrl(`/api/barang/update/${editingItem.id}`) : getAppUrl('/api/barang/store');
        const payload = { kode_barang: kodeBarang, nama_barang: namaBarang, satuan_beli: satuanBeli, satuan_resep: satuanResep, faktor_konversi: parseFloat(faktorKonversi), stok_gudang: parseFloat(stokGudang), safety_stock_hari: parseInt(safetyStockHari), lead_time_hari: parseInt(leadTimeHari), harga_beli: parseFloat(hargaBeli) };
        try {
            const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }, body: JSON.stringify(payload) });
            const data = await response.json();
            if (response.ok && data.success) { alert(data.message); setIsAddOpen(false); setEditingItem(null); refreshData(); } else { alert(data.message || 'Gagal menyimpan.'); }
        } catch (err) { alert('Kesalahan: ' + err.message); } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus bahan baku ini beserta data SOP dan rekomendasi terkait?')) return;
        try {
            const response = await fetch(getAppUrl(`/api/barang/delete/${id}`), { method: 'DELETE', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' } });
            const data = await response.json();
            if (response.ok && data.success) { alert(data.message); refreshData(); } else { alert(data.message || 'Gagal menghapus.'); }
        } catch (err) { alert('Kesalahan: ' + err.message); }
    };

    const filteredList = barangList.filter(item => 
        item.nama_barang.toLowerCase().includes(search.toLowerCase()) || item.kode_barang.toLowerCase().includes(search.toLowerCase())
    );

    const totalItems = barangList.length;
    const stokMenipis = barangList.filter(i => i.butuh_restock && i.stok_gudang > 0).length;
    const stokHabis = barangList.filter(i => i.stok_gudang <= 0).length;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/stok-bahan-baku" />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div className="relative">
                        <input type="text" placeholder="Cari bahan baku..." className="w-80 bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
                            <span className="material-symbols-outlined text-[18px]">notifications</span>
                        </button>
                        <div className="flex items-center gap-2.5">
                            <div className="text-right">
                                <span className="text-xs font-bold text-slate-700 block">{userName}</span>
                                <span className="text-[10px] text-slate-400 font-medium capitalize">{user.role === 'admin' ? 'Admin Gudang' : 'Kasir'}</span>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">
                                {userName.substring(0, 2)}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1">
                    {/* Title + CTA */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800">Kelola Stok Gudang</h1>
                            <p className="text-sm text-slate-400 mt-1">Monitor dan atur ketersediaan bahan baku secara real-time.</p>
                        </div>
                        <button onClick={handleOpenAdd} className="bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-[#4361EE]/20 flex items-center gap-2 transition">
                            <span className="material-symbols-outlined text-sm font-bold">add</span>
                            <span>Tambah Bahan Baku</span>
                        </button>
                    </div>

                    {/* Stats Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                             <div className="w-11 h-11 rounded-xl bg-[#4361EE]/10 text-[#4361EE] flex items-center justify-center"><span className="material-symbols-outlined text-xl">inventory_2</span></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Total Item</p>
                                <h3 className="text-2xl font-extrabold text-slate-800">{totalItems}</h3>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><span className="material-symbols-outlined text-xl">warning</span></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Stok Menipis</p>
                                <h3 className="text-2xl font-extrabold text-amber-600">{stokMenipis}</h3>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><span className="material-symbols-outlined text-xl">error</span></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Stok Habis</p>
                                <h3 className="text-2xl font-extrabold text-red-600">{stokHabis}</h3>
                            </div>
                        </div>
                        <div className="bg-[#4361EE] rounded-2xl p-5 flex items-center gap-4 text-white shadow-lg shadow-[#4361EE]/20">
                            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"><span className="material-symbols-outlined text-xl">update</span></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-blue-100 tracking-wide">Update Terakhir</p>
                                <h3 className="text-sm font-extrabold">{new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} WIB</h3>
                            </div>
                        </div>
                    </div>

                    {/* Tab + Helper */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-6 border-b border-slate-200 pb-0">
                            <button onClick={() => setActiveTab('umum')} className={`pb-3 text-sm font-bold transition border-b-2 ${activeTab === 'umum' ? 'text-[#4361EE] border-[#4361EE]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                                <span className="material-symbols-outlined text-[14px] mr-1 align-middle">table_chart</span> Daftar Bahan Baku
                            </button>
                            <button onClick={() => setActiveTab('teknis')} className={`pb-3 text-sm font-bold transition border-b-2 ${activeTab === 'teknis' ? 'text-[#4361EE] border-[#4361EE]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                                <span className="material-symbols-outlined text-[14px] mr-1 align-middle">tune</span> Detail Konversi
                            </button>
                        </div>
                        {activeTab === 'teknis' && (
                            <div className="bg-[#4361EE]/10 border border-[#4361EE]/20 rounded-xl px-4 py-2 text-[11px] text-[#4361EE] font-bold flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">help</span>
                                Bantuan: 1 Dus = 2.000 pcs
                            </div>
                        )}
                    </div>

                    {/* Data Table */}
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Nama Bahan</th>
                                        {activeTab === 'umum' ? (<>
                                            <th className="px-6 py-4">Satuan Beli</th>
                                            <th className="px-6 py-4">Stok Saat Ini</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-center">Aksi</th>
                                        </>) : (<>
                                            <th className="px-6 py-4">Satuan Resep</th>
                                            <th className="px-6 py-4">Faktor Konversi</th>
                                            <th className="px-6 py-4">Harga Beli</th>
                                            <th className="px-6 py-4">Lead Time</th>
                                            <th className="px-6 py-4">Safety Stock</th>
                                            <th className="px-6 py-4 text-center">Aksi</th>
                                        </>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[13px]">
                                    {filteredList.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-medium">Bahan baku tidak ditemukan.</td></tr>
                                    ) : filteredList.map(item => (
                                        <tr key={item.id} className="hover:bg-blue-50/30 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                        <span className="material-symbols-outlined text-[16px]">package_2</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{item.nama_barang}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{item.kode_barang}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {activeTab === 'umum' ? (<>
                                                <td className="px-6 py-4 font-medium text-slate-500">{item.satuan_beli}</td>
                                                <td className="px-6 py-4">
                                                    <span className="font-extrabold text-slate-800">{item.stok_gudang}</span>
                                                    <span className="text-slate-400 text-xs ml-1">({(item.stok_gudang * item.faktor_konversi).toLocaleString('id-ID')} {item.satuan_resep})</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.stok_gudang <= 0 ? (
                                                        <span className="text-[10px] font-extrabold text-red-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span> HABIS</span>
                                                    ) : item.butuh_restock ? (
                                                        <span className="text-[10px] font-extrabold text-amber-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span> MENIPIS</span>
                                                    ) : (
                                                        <span className="text-[10px] font-extrabold text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> AMAN</span>
                                                    )}
                                                </td>
                                            </>) : (<>
                                                <td className="px-6 py-4 font-medium text-slate-500">{item.satuan_resep}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">1 {item.satuan_beli} = {item.faktor_konversi} {item.satuan_resep}</td>
                                                <td className="px-6 py-4 font-medium text-slate-700">Rp {item.harga_beli.toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{item.lead_time_hari} hari</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{item.safety_stock_hari} hari</td>
                                            </>)}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => handleOpenEdit(item)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition">
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition">
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                            Menampilkan {filteredList.length} dari {barangList.length} bahan baku
                        </div>
                    </div>
                </main>
            </div>

            {/* Add / Edit Modal */}
            {(isAddOpen || editingItem) && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-extrabold text-lg text-slate-800">{editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}</h3>
                            <button onClick={() => { setIsAddOpen(false); setEditingItem(null); }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Kode Bahan</label><input type="text" value={kodeBarang} onChange={(e) => setKodeBarang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required disabled={!!editingItem} /></div>
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nama Bahan</label><input type="text" value={namaBarang} onChange={(e) => setNamaBarang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Satuan Beli</label><input type="text" value={satuanBeli} onChange={(e) => setSatuanBeli(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Satuan Resep</label><input type="text" value={satuanResep} onChange={(e) => setSatuanResep(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Faktor Konversi</label><input type="number" step="0.01" value={faktorKonversi} onChange={(e) => setFaktorKonversi(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Stok Gudang ({satuanBeli})</label><input type="number" step="0.01" value={stokGudang} onChange={(e) => setStokGudang(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Harga Beli / {satuanBeli}</label><input type="number" value={hargaBeli} onChange={(e) => setHargaBeli(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Lead Time (Hari)</label><input type="number" value={leadTimeHari} onChange={(e) => setLeadTimeHari(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                                <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Safety Stock (Hari)</label><input type="number" value={safetyStockHari} onChange={(e) => setSafetyStockHari(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => { setIsAddOpen(false); setEditingItem(null); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-xl transition">Batal</button>
                                <button type="submit" disabled={loading} className="bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-[#4361EE]/20 flex items-center gap-1.5 transition">
                                    {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                    <span>Simpan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
