import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function LihatPrediksi({ prediksi, rekomendasi, barang = [], user }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const [activeTab, setActiveTab] = useState('hasil');
    const userName = user?.name || user?.nama || 'User';
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Shopping checklist state - initialize from rekomendasi data
    const [shopItems, setShopItems] = useState(() =>
        rekomendasi.map(r => ({
            id_barang: r.id_barang,
            nama_barang: r.nama_barang,
            satuan_beli: r.satuan_beli || 'pcs',
            faktor_konversi: r.faktor_konversi || 1,
            stok_gudang: r.stok_gudang,
            estimasi_beli: r.estimasi_beli || 0,
            butuh_restock: r.butuh_restock,
            is_checked: r.butuh_restock && r.estimasi_beli > 0,
            jumlah_real: r.estimasi_beli || 0,
            harga_satuan: 0,
            total_kebutuhan: r.total_kebutuhan,
            avg_daily_usage: r.avg_daily_usage,
            total_safety: r.total_safety,
            rop: r.rop,
            satuan: r.satuan,
        }))
    );

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleRunPrediction = async () => {
        setRunning(true);
        try {
            const res = await fetch(getAppUrl('/api/predict/run'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' } });
            const data = await res.json();
            if (res.ok && data.success) { showToast(data.message); setTimeout(() => window.location.reload(), 1500); } else { showToast(data.message || 'Gagal.', 'error'); }
        } catch (e) { showToast('Kesalahan: ' + e.message, 'error'); } finally { setRunning(false); }
    };

    const updateShopItem = (idx, field, value) => {
        setShopItems(prev => {
            const items = [...prev];
            items[idx] = { ...items[idx], [field]: value };
            return items;
        });
    };

    const toggleCheck = (idx) => {
        setShopItems(prev => {
            const items = [...prev];
            items[idx] = { ...items[idx], is_checked: !items[idx].is_checked };
            return items;
        });
    };

    const removeCustomItem = (idx) => {
        setShopItems(prev => prev.filter((_, i) => i !== idx));
    };

    const addCustomItem = () => {
        const select = document.getElementById('custom-barang-select');
        const qtyInput = document.getElementById('custom-barang-qty');
        const priceInput = document.getElementById('custom-barang-price');
        const bId = parseInt(select?.value);
        const qty = parseFloat(qtyInput?.value) || 1;
        const price = parseInt(priceInput?.value) || 0;
        if (!bId) { showToast('Pilih bahan baku terlebih dahulu.', 'error'); return; }
        if (shopItems.some(it => it.id_barang === bId)) { showToast('Barang ini sudah ada di ceklist.', 'error'); return; }
        const sel = barang.find(b => b.id === bId);
        if (!sel) return;
        setShopItems(prev => [...prev, {
            id_barang: sel.id, nama_barang: sel.nama_barang, satuan_beli: sel.satuan_beli || 'pcs',
            faktor_konversi: sel.faktor_konversi || 1, stok_gudang: sel.stok_gudang || 0,
            estimasi_beli: 0, butuh_restock: false, is_checked: true,
            jumlah_real: qty, harga_satuan: price, total_kebutuhan: 0,
            avg_daily_usage: 0, total_safety: 0, rop: 0, satuan: sel.satuan || 'pcs', is_custom: true
        }]);
        showToast(`${sel.nama_barang} ditambahkan ke ceklist`);
        select.value = ''; qtyInput.value = ''; priceInput.value = '';
    };

    const checkedItems = shopItems.filter(it => it.is_checked && it.jumlah_real > 0);
    const totalBelanja = checkedItems.reduce((sum, it) => sum + (it.jumlah_real * it.harga_satuan), 0);

    const handleSaveBelanja = async () => {
        if (checkedItems.length === 0) { showToast('Centang minimal satu barang untuk dicatat.', 'error'); return; }
        const zeroPrice = checkedItems.find(it => it.harga_satuan <= 0);
        if (zeroPrice) { showToast(`Isi harga satuan untuk "${zeroPrice.nama_barang}".`, 'error'); return; }

        setSaving(true);
        try {
            const res = await fetch(getAppUrl('/api/belanja/store-real'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    items: shopItems.map(it => ({
                        id_barang: it.id_barang,
                        jumlah_real: it.jumlah_real,
                        harga_satuan: it.harga_satuan,
                        is_checked: it.is_checked,
                    })),
                    tanggal: new Date().toISOString().split('T')[0],
                    catatan: ''
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message);
                setTimeout(() => window.location.reload(), 1800);
            } else {
                showToast(data.message || 'Gagal menyimpan.', 'error');
            }
        } catch (e) {
            showToast('Kesalahan: ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/lihat-prediksi" />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div className="relative"><input type="text" placeholder="Cari data prediksi..." className="w-80 bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-200 outline-none" /><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span></div>
                    <div className="flex items-center gap-4">
                        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"><span className="material-symbols-outlined text-[18px]">notifications</span></button>
                        <div className="flex items-center gap-2.5"><span className="text-xs font-bold text-slate-700">{userName}</span><div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">{userName.substring(0, 2)}</div></div>
                    </div>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1">
                    {/* Toast */}
                    {toast && (
                        <div className={`fixed top-4 right-4 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                            <span className="material-symbols-outlined text-lg">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                            {toast.message}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div><h1 className="text-2xl font-extrabold text-slate-800">Hasil Prediksi & Ceklist Belanja</h1><p className="text-sm text-slate-400 mt-1">Estimasi penjualan SES & pencatatan belanja bahan baku real.</p></div>
                        {user.role === 'admin' && (
                            <button onClick={handleRunPrediction} disabled={running} className="bg-[#4361EE] hover:bg-[#3A56D4] disabled:bg-[#4361EE]/50 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-[#4361EE]/20 flex items-center gap-2 transition">
                                {running ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-sm">play_arrow</span>}
                                <span>Kalkulasi Prediksi SES</span>
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-6 border-b border-slate-200 pb-0">
                        <button onClick={() => setActiveTab('hasil')} className={`pb-3 text-sm font-bold transition border-b-2 ${activeTab === 'hasil' ? 'text-[#4361EE] border-[#4361EE]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Hasil Prediksi Menu</button>
                        <button onClick={() => setActiveTab('belanja')} className={`pb-3 text-sm font-bold transition border-b-2 ${activeTab === 'belanja' ? 'text-[#4361EE] border-[#4361EE]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Ceklist & Catat Belanja</button>
                    </div>

                    {activeTab === 'hasil' ? (
                        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead><tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Menu Produk</th><th className="px-6 py-4 text-center">Alpha (α)</th><th className="px-6 py-4 text-center">WMAPE (%)</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Prediksi Minggu Depan</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-slate-50 text-[13px]">
                                        {prediksi.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-12 text-slate-400 font-medium">Belum ada data. Klik "Kalkulasi Prediksi SES".</td></tr>
                                        ) : prediksi.map(item => (
                                            <tr key={item.id} className="hover:bg-blue-50/20 transition">
                                                <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#4361EE]/10 text-[#4361EE] flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[16px]">local_cafe</span></div><span className="font-bold text-slate-800">{item.nama_menu}</span></div></td>
                                                <td className="px-6 py-4 text-center font-semibold text-slate-500">{item.alpha_terpilih}</td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700">{item.wmape}%</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${item.is_valid === 1 ? 'bg-[#4361EE]/10 text-[#4361EE]' : 'bg-amber-50 text-amber-600'}`}>{item.is_valid === 1 ? 'Selesai' : 'Rendah'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-extrabold text-[#4361EE] text-base">{item.prediksi_cup} cup</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* ====== CEKLIST BELANJA TAB ====== */
                        <div className="space-y-5">
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-800 font-medium">
                                <span className="material-symbols-outlined text-blue-500 text-base mt-0.5">info</span>
                                <div>Centang bahan baku yang akan dibeli, sesuaikan jumlah & harga satuan real. Klik <strong>"Simpan & Tambah Stok"</strong> untuk mencatat pengeluaran ke laporan keuangan dan menambah stok gudang otomatis.</div>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <th className="px-4 py-4 w-10 text-center">✓</th>
                                                <th className="px-4 py-4">Bahan Baku</th>
                                                <th className="px-4 py-4 text-right">Stok</th>
                                                <th className="px-4 py-4 text-right">ROP</th>
                                                <th className="px-4 py-4 text-center">Status</th>
                                                <th className="px-4 py-4 text-right">Saran Beli</th>
                                                <th className="px-4 py-4 text-center">Jumlah Real</th>
                                                <th className="px-4 py-4 text-center">Harga Satuan (Rp)</th>
                                                <th className="px-4 py-4 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-[13px]">
                                            {shopItems.length === 0 ? (
                                                <tr><td colSpan={9} className="text-center py-12 text-slate-400 font-medium">Belum ada rekomendasi. Jalankan prediksi terlebih dahulu.</td></tr>
                                            ) : shopItems.map((item, idx) => {
                                                const subtotal = item.is_checked ? item.jumlah_real * item.harga_satuan : 0;
                                                return (
                                                    <tr key={item.id_barang} className={`transition ${item.is_checked ? 'bg-blue-50/30' : 'opacity-60'}`}>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.is_checked}
                                                                onChange={() => toggleCheck(idx)}
                                                                className="w-4 h-4 rounded border-slate-300 text-[#4361EE] focus:ring-[#4361EE] cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[16px]">package_2</span></div>
                                                                <div>
                                                                    <span className="font-bold text-slate-800">{item.nama_barang}</span>
                                                                    <span className="text-[10px] text-slate-400 font-medium block">{item.satuan_beli}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-bold text-slate-800">{item.stok_gudang} <span className="text-[10px] text-slate-400">{item.satuan}</span></td>
                                                        <td className="px-4 py-3.5 text-right font-bold text-slate-600">{parseFloat(item.rop).toFixed(1)}</td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            {item.butuh_restock ? (
                                                                <span className="text-[10px] font-extrabold text-red-600 flex items-center gap-1 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Reorder</span>
                                                            ) : (
                                                                <span className="text-[10px] font-extrabold text-green-600 flex items-center gap-1 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Aman</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-extrabold text-[#4361EE]">{item.estimasi_beli > 0 ? `${item.estimasi_beli} ${item.satuan_beli}` : '-'}</td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.1"
                                                                value={item.jumlah_real}
                                                                onChange={e => updateShopItem(idx, 'jumlah_real', parseFloat(e.target.value) || 0)}
                                                                disabled={!item.is_checked}
                                                                className="w-20 text-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] disabled:opacity-40 transition"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="500"
                                                                value={item.harga_satuan}
                                                                onChange={e => updateShopItem(idx, 'harga_satuan', parseInt(e.target.value) || 0)}
                                                                disabled={!item.is_checked}
                                                                placeholder="0"
                                                                className="w-28 text-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] disabled:opacity-40 transition"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right font-bold text-slate-800">{subtotal > 0 ? formatRp(subtotal) : '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add Custom Item */}
                                {barang.length > 0 && (
                                    <div className="border-t border-dashed border-slate-200 px-6 py-4 bg-blue-50/30">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-xs text-[#4361EE]">add_circle</span>
                                            Tambah Bahan Baku Lain (Kustom)
                                        </p>
                                        <div className="flex flex-wrap items-end gap-3">
                                            <div className="flex-1 min-w-[180px]">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pilih Bahan Baku</label>
                                                <select id="custom-barang-select" defaultValue="" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#4361EE] transition">
                                                    <option value="" disabled>-- Pilih --</option>
                                                    {barang.filter(b => !shopItems.some(it => it.id_barang === b.id)).map(b => (
                                                        <option key={b.id} value={b.id}>{b.nama_barang} ({b.satuan_beli || b.satuan || 'pcs'})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Jumlah</label>
                                                <input type="number" id="custom-barang-qty" min="0.1" step="0.1" placeholder="1" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-center focus:outline-none focus:border-[#4361EE] transition" />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Harga Satuan</label>
                                                <input type="number" id="custom-barang-price" min="0" step="500" placeholder="10000" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-center focus:outline-none focus:border-[#4361EE] transition" />
                                            </div>
                                            <button type="button" onClick={addCustomItem} className="px-4 py-2 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-[#4361EE]/20 transition">
                                                <span className="material-symbols-outlined text-sm">add</span> Tambah
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Summary Footer */}
                                <div className="border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pengeluaran Belanja</div>
                                        <div className="text-xl font-black text-slate-800">{formatRp(totalBelanja)}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{checkedItems.length} item dicentang dari {shopItems.length} bahan baku</div>
                                    </div>
                                    {user.role === 'admin' && (
                                        <button
                                            onClick={handleSaveBelanja}
                                            disabled={saving || checkedItems.length === 0}
                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400/50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition uppercase tracking-wider"
                                        >
                                            {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-sm">shopping_cart_checkout</span>}
                                            <span>Simpan & Tambah Stok</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
