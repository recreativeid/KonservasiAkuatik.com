import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function DataTransaksi({ transaksi, menus, user }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const [transaksiList, setTransaksiList] = useState(transaksi);
    const userName = user?.name || user?.nama || 'User';
    const [filterDate, setFilterDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMenuId, setSelectedMenuId] = useState('');
    const [jumlah, setJumlah] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [potongStok, setPotongStok] = useState(false);

    const fetchData = async (date) => {
        try {
            const url = date ? getAppUrl(`/data-transaksi?tanggal=${date}`) : getAppUrl('/data-transaksi');
            const res = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (res.ok) { const data = await res.json(); setTransaksiList(data); }
        } catch (e) { console.error(e); }
    };

    const handleFilterDateChange = (e) => { const d = e.target.value; setFilterDate(d); fetchData(d); };
    const handleClearFilter = () => { setFilterDate(''); fetchData(''); };

    const handleSaveManual = async (e) => {
        e.preventDefault(); if (!selectedMenuId) return; setLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/transaksi/store'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }, body: JSON.stringify({ tanggal, items: [{ id_menu: parseInt(selectedMenuId), jumlah: parseInt(jumlah) }] }) });
            const data = await res.json();
            if (res.ok && data.success) { alert(data.message); setIsAddOpen(false); fetchData(filterDate); } else { alert(data.message || 'Gagal.'); }
        } catch (err) { alert('Kesalahan: ' + err.message); } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus transaksi ini?')) return;
        try {
            const res = await fetch(getAppUrl(`/api/transaksi/delete/${id}`), { method: 'DELETE', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' } });
            const data = await res.json();
            if (res.ok && data.success) { fetchData(filterDate); } else { alert(data.message || 'Gagal.'); }
        } catch (e) { alert('Kesalahan: ' + e.message); }
    };

    const processCsvContent = async (text) => {
        setLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/transaksi/import'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' }, body: JSON.stringify({ csv: text, potongStok }) });
            const data = await res.json();
            if (res.ok && data.success) { alert(data.message); fetchData(filterDate); } else {
                if (data.errors) { alert(`${data.message}\n` + data.errors.slice(0, 5).map(e => `Baris ${e.row}: ${e.error}`).join('\n')); } else { alert(data.message || 'Gagal.'); }
            }
        } catch (err) { alert('Kesalahan: ' + err.message); } finally { setLoading(false); }
    };

    const onDrop = (e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) { const r = new FileReader(); r.onload = (ev) => processCsvContent(ev.target.result); r.readAsText(file); } else { alert('Upload file CSV.'); } };
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { const r = new FileReader(); r.onload = (ev) => processCsvContent(ev.target.result); r.readAsText(file); } };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/data-transaksi" />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div className="relative"><input type="text" placeholder="Cari data transaksi..." className="w-80 bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-200 outline-none" /><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span></div>
                    <div className="flex items-center gap-4">
                        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"><span className="material-symbols-outlined text-[18px]">notifications</span></button>
                        <div className="flex items-center gap-2.5"><span className="text-xs font-bold text-slate-700">{userName}</span><div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">{userName.substring(0, 2)}</div></div>
                    </div>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div><h1 className="text-2xl font-extrabold text-slate-800">Data Transaksi Penjualan</h1><p className="text-sm text-slate-400 mt-1">Kelola pencatatan transaksi manual atau impor laporan eksternal.</p></div>
                        <button onClick={() => setIsAddOpen(true)} className="bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-[#4361EE]/20 flex items-center gap-2 transition">
                            <span className="material-symbols-outlined text-sm font-bold">add</span><span>Tambah Transaksi Manual</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* Left: Filter & Import */}
                        <div className="space-y-4">
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Filter Tanggal</h3>
                                <div className="flex items-center gap-2">
                                    <input type="date" value={filterDate} onChange={handleFilterDateChange} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-200 outline-none w-full" />
                                    {filterDate && <button onClick={handleClearFilter} className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap">Reset</button>}
                                </div>
                            </div>

                            {user.role === 'admin' && (
                                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                                    <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Impor Data CSV</h3>
                                    <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop} onClick={() => document.getElementById('csv-file').click()}
                                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${isDragging ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-white'}`}>
                                        <span className="material-symbols-outlined text-3xl text-blue-400 mb-2">cloud_upload</span>
                                        <p className="text-xs font-bold text-slate-700">Seret file CSV ke sini</p>
                                        <p className="text-[10px] text-slate-400 mt-1">atau klik untuk pilih file</p>
                                        <p className="text-[9px] text-slate-400 mt-2 italic">Format: Tanggal, Nama Menu, Jumlah</p>
                                        <input type="file" id="csv-file" accept=".csv" onChange={handleFileChange} className="hidden" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="potong-stok" checked={potongStok} onChange={(e) => setPotongStok(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-400 w-4 h-4" />
                                            <label htmlFor="potong-stok" className="text-[11px] text-slate-600 font-medium">Potong stok berdasarkan SOP</label>
                                        </div>
                                        <a href={getAppUrl('/api/transaksi/template')} className="text-[11px] text-blue-500 font-bold hover:underline flex items-center gap-1 w-fit">
                                            <span className="material-symbols-outlined text-xs">download</span><span>Unduh Template CSV</span>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Data Table */}
                        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Riwayat Transaksi</h3>
                                <span className="text-[10px] text-slate-400 font-bold">Maks 100 data terbaru</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead><tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Menu</th><th className="px-6 py-4 text-center">Qty</th><th className="px-6 py-4 text-right">Harga</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Sumber</th>
                                        {user.role === 'admin' && <th className="px-6 py-4 text-center w-12"></th>}
                                    </tr></thead>
                                    <tbody className="divide-y divide-slate-50 text-[13px]">
                                        {transaksiList.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-medium">Belum ada data transaksi.</td></tr>
                                        ) : transaksiList.map(item => (
                                            <tr key={item.id} className="hover:bg-blue-50/20 transition">
                                                <td className="px-6 py-4 font-medium text-slate-500 text-xs">{new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                                <td className="px-6 py-4 font-bold text-slate-800">{item.nama_menu}</td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-800">{item.jumlah}</td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-500">Rp {item.harga?.toLocaleString('id-ID') || '0'}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-800">Rp {((item.harga || 0) * (item.jumlah || 0)).toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${item.sumber === 'import' ? 'bg-green-50 text-green-600' : item.sumber === 'kasir' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{item.sumber || 'online'}</span>
                                                </td>
                                                {user.role === 'admin' && (
                                                    <td className="px-6 py-4 text-center"><button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition"><span className="material-symbols-outlined text-[16px]">delete</span></button></td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium">Menampilkan {transaksiList.length} transaksi</div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Manual Transaction Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-sm shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-extrabold text-sm text-slate-800">Catat Transaksi Manual</h3>
                            <button onClick={() => setIsAddOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        <form onSubmit={handleSaveManual} className="space-y-4">
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Tanggal</label><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Menu</label>
                                <select value={selectedMenuId} onChange={(e) => setSelectedMenuId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required>
                                    <option value="">Pilih menu...</option>{menus.map(m => <option key={m.id} value={m.id}>{m.nama_menu} (Rp {m.harga?.toLocaleString('id-ID')})</option>)}
                                </select>
                            </div>
                            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Jumlah Cup</label><input type="number" min="1" value={jumlah} onChange={(e) => setJumlah(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none" required /></div>
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition">Batal</button>
                                <button type="submit" disabled={loading} className="bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#4361EE]/20 flex items-center gap-1.5 transition">
                                    {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}<span>Simpan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
