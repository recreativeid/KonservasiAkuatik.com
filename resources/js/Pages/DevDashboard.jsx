import React, { useState } from 'react';

export default function DevDashboard({ dev_payment, tokos = [], bukti_transfers = [] }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const [form, setForm] = useState({
        qris_string: dev_payment?.qris_string || '',
        bank_name: dev_payment?.bank_name || '',
        no_rekening: dev_payment?.no_rekening || '',
        nama_pemilik: dev_payment?.nama_pemilik || '',
        price_monthly: dev_payment?.prices?.monthly ?? 99000,
        price_3months: dev_payment?.prices?.['3months'] ?? 250000,
        price_yearly: dev_payment?.prices?.yearly ?? 830000,
        free_plan_fee: dev_payment?.free_plan_fee ?? 500,
        domain_price_yearly: dev_payment?.domain_price_yearly ?? 150000,
        hosting_price_yearly: dev_payment?.hosting_price_yearly ?? 1200000,
        midtrans_bank_transfer_fee: dev_payment?.midtrans_bank_transfer_fee ?? 4000
    });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [storeSubTab, setStoreSubTab] = useState('free'); // 'free' | 'premium'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProofImg, setSelectedProofImg] = useState(null);
    const [verifyingProofId, setVerifyingProofId] = useState(null);
    const [devPass, setDevPass] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ id_toko: '', nominal: '', tanggal: new Date().toISOString().split('T')[0], gambar_file: null });
    const [payoutLoading, setPayoutLoading] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/settings/update-dev-payment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message || 'Konfigurasi developer berhasil disimpan!');
            } else {
                showToast(data.message || 'Gagal menyimpan.', 'error');
            }
        } catch (err) {
            showToast('Kesalahan: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyProof = async (id, status) => {
        setVerifyingProofId(id);
        try {
            const res = await fetch(getAppUrl(`/api/developer/verify-transfer/${id}`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message);
                window.location.reload();
            } else {
                showToast(data.message || 'Gagal mengubah status transfer.', 'error');
            }
        } catch (err) {
            showToast('Kesalahan jaringan: ' + err.message, 'error');
        } finally {
            setVerifyingProofId(null);
        }
    };

    const handleDevPasswordChange = async (e) => {
        e.preventDefault();
        if (devPass.new_password !== devPass.confirm_password) {
            showToast('Konfirmasi password tidak cocok.', 'error');
            return;
        }
        setPassLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/developer/change-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    old_password: devPass.old_password,
                    new_password: devPass.new_password
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message);
                setDevPass({ old_password: '', new_password: '', confirm_password: '' });
            } else {
                showToast(data.message || 'Gagal mengubah password.', 'error');
            }
        } catch (err) {
            showToast('Kesalahan: ' + err.message, 'error');
        } finally {
            setPassLoading(false);
        }
    };

    const handlePayoutUpload = async (e) => {
        e.preventDefault();
        if (!payoutForm.id_toko || !payoutForm.nominal || !payoutForm.gambar_file) {
            showToast('Semua field wajib diisi termasuk file bukti transfer.', 'error');
            return;
        }
        setPayoutLoading(true);
        try {
            const fd = new FormData();
            fd.append('id_toko', payoutForm.id_toko);
            fd.append('nominal', payoutForm.nominal);
            fd.append('tanggal', payoutForm.tanggal);
            fd.append('gambar_file', payoutForm.gambar_file);
            const res = await fetch(getAppUrl('/api/developer/upload-payout'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: fd
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message || 'Bukti pencairan berhasil diunggah!');
                setPayoutForm({ id_toko: '', nominal: '', tanggal: new Date().toISOString().split('T')[0], gambar_file: null });
                setTimeout(() => window.location.reload(), 1200);
            } else {
                showToast(data.message || 'Gagal mengunggah bukti pencairan.', 'error');
            }
        } catch (err) {
            showToast('Kesalahan: ' + err.message, 'error');
        } finally {
            setPayoutLoading(false);
        }
    };

    const handleLogout = async () => {
        if (confirm('Apakah Anda yakin ingin keluar dari Portal Developer?')) {
            const formEl = document.createElement('form');
            formEl.method = 'POST';
            formEl.action = getAppUrl('/developer/logout');
            
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            formEl.appendChild(csrfInput);
            document.body.appendChild(formEl);
            formEl.submit();
        }
    };

    const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
    const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition";

    // --- Financial Calculations ---
    // Server costs (global, NOT per-store)
    const dailyDomain = Number(form.domain_price_yearly || 0) / 360;
    const dailyHosting = Number(form.hosting_price_yearly || 0) / 360;
    const dailyMidtrans = Number(form.midtrans_bank_transfer_fee || 0);
    const totalBebanServerHarian = dailyDomain + dailyHosting + dailyMidtrans;

    // Free stores metrics
    const freeTokos = tokos.filter(t => t.tier === 'free');
    const premiumTokos = tokos.filter(t => t.tier !== 'free');
    const totalTransactionsFree = freeTokos.reduce((acc, t) => acc + t.total_transactions, 0);
    const totalKomisiFreeKotor = totalTransactionsFree * Number(form.free_plan_fee);

    // Premium stores: daily revenue contribution
    const totalPendapatanLanggananHarian = premiumTokos.reduce((acc, toko) => {
        let subPrice = 0;
        let durationDays = 30;
        if (toko.tier === 'monthly') {
            subPrice = Number(form.price_monthly);
            durationDays = 30;
        } else if (toko.tier === '3months') {
            subPrice = Number(form.price_3months);
            durationDays = 90;
        } else if (toko.tier === 'yearly') {
            subPrice = Number(form.price_yearly);
            durationDays = 360;
        }
        return acc + (subPrice / durationDays);
    }, 0);

    // Global daily totals
    const totalPendapatanKotorHarian = totalKomisiFreeKotor + totalPendapatanLanggananHarian;
    const estimasiLabaBersihHarian = totalPendapatanKotorHarian - totalBebanServerHarian;

    // Search filter for stores
    const getFilteredStores = (tierType) => {
        return tokos.filter(t => {
            const matchesQuery =
                t.nama_toko.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.nama_admin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.wa_toko.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.bank_name.toLowerCase().includes(searchQuery.toLowerCase());

            if (tierType === 'free') {
                return matchesQuery && t.tier === 'free';
            } else {
                return matchesQuery && t.tier !== 'free';
            }
        });
    };

    const filteredFreeTokos = getFilteredStores('free');
    const filteredPremiumTokos = getFilteredStores('premium');

    // Header title
    const getHeaderTitle = () => {
        if (activeTab === 'summary') return 'Ringkasan & Dashboard';
        if (activeTab === 'stores') return storeSubTab === 'free' ? 'Daftar Toko Gratis (Harian)' : 'Daftar Toko Langganan Premium';
        if (activeTab === 'beban') return 'Beban Operasional Server';
        if (activeTab === 'developer_info') return 'Informasi Rekening & QRIS Developer';
        if (activeTab === 'notifications') return 'Notifikasi & Bukti Transfer Harian';
        if (activeTab === 'pencairan') return 'Pencairan Dana ke Toko';
        if (activeTab === 'settings') return 'Pengaturan Sistem Developer';
        return 'CuanGO Developer';
    };

    // Sidebar menu items
    const sidebarMenus = [
        { id: 'summary', icon: 'analytics', label: 'Ringkasan & Dashboard' },
        { id: 'stores', icon: 'storefront', label: 'Daftar Toko & Komisi' },
        { id: 'beban', icon: 'account_balance_wallet', label: 'Beban Operasional' },
        { id: 'developer_info', icon: 'contact_page', label: 'Informasi Developer' },
        { id: 'notifications', icon: 'notifications', label: 'Notifikasi & Bukti Transfer' },
        { id: 'pencairan', icon: 'payments', label: 'Pencairan Dana' },
        { id: 'settings', icon: 'settings', label: 'Pengaturan Sistem' },
    ];

    return (
        <div
            className="min-h-screen bg-slate-50 text-slate-700 font-sans flex select-none relative overflow-hidden"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[999] px-5 py-3 rounded-2xl text-xs font-bold shadow-xl border transition-all animate-pulse ${
                    toast.type === 'error'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Left Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 relative z-20">
                {/* Logo Area with CuanGO branding */}
                <div className="p-5 border-b border-slate-100 flex items-center">
                    <img
                        src={getAppUrl('/images/logo-cuango-landscape.png')}
                        alt="CuanGO Logo"
                        className="h-10 object-contain"
                    />
                </div>

                {/* Navigation Menus */}
                <nav className="flex-1 p-4 space-y-1">
                    {sidebarMenus.map((menu) => (
                        <button
                            key={menu.id}
                            onClick={() => setActiveTab(menu.id)}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === menu.id
                                    ? 'bg-blue-50/60 text-blue-600 font-bold border-l-4 border-blue-600'
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">{menu.icon}</span>
                            {menu.label}
                        </button>
                    ))}
                </nav>

                {/* Bottom Menus */}
                <div className="p-4 border-t border-slate-100 space-y-1">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition"
                    >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Right Pane */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Top Header */}
                <header className="bg-white border-b border-slate-100 px-8 py-4.5 flex items-center justify-between relative z-10 shrink-0 shadow-sm">
                    <div>
                        <h1 className="font-extrabold text-xs text-slate-800 tracking-tight">{getHeaderTitle()}</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative w-60">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[14px] text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Cari data..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-4 text-[11px] font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition"
                            />
                        </div>

                        <div className="flex items-center gap-4 text-slate-400">
                            <span 
                                onClick={() => setActiveTab('notifications')}
                                className={`material-symbols-outlined text-base cursor-pointer hover:text-slate-600 transition ${activeTab === 'notifications' ? 'text-blue-600 font-bold' : ''}`}
                            >
                                notifications
                            </span>
                            <span 
                                onClick={() => setActiveTab('settings')}
                                className={`material-symbols-outlined text-base cursor-pointer hover:text-slate-600 transition ${activeTab === 'settings' ? 'text-blue-600 font-bold' : ''}`}
                            >
                                settings
                            </span>
                            <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 overflow-hidden flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-blue-600 text-sm">person</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Pane */}
                <div className="flex-1 p-8 overflow-y-auto min-w-0 relative z-10 space-y-6">

                    {/* ========================= */}
                    {/* TAB: Ringkasan & Dashboard */}
                    {/* ========================= */}
                    {activeTab === 'summary' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Ringkasan Performa Platform</h2>
                                <p className="text-[10px] text-slate-400">Metrik global dan estimasi laba bersih harian seluruh toko.</p>
                            </div>

                            {/* Summary Cards Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {/* Card 1: Total Toko */}
                                <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">TOTAL TOKO AKTIF</span>
                                        <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xs">store</span>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-slate-850 tracking-tight">{tokos.length}</p>
                                    <div className="flex gap-2">
                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 rounded-lg px-2 py-0.5">Gratis: {freeTokos.length}</span>
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 rounded-lg px-2 py-0.5">Premium: {premiumTokos.length}</span>
                                    </div>
                                </div>

                                {/* Card 2: Pendapatan Kotor Harian */}
                                <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">PENDAPATAN KOTOR HARIAN</span>
                                        <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xs">account_balance_wallet</span>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-slate-850 tracking-tight">{fmt(totalPendapatanKotorHarian)}</p>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-semibold text-slate-400">Komisi Free: {fmt(totalKomisiFreeKotor)}</span>
                                        <span className="text-[9px] font-semibold text-slate-400">Langganan/hari: {fmt(totalPendapatanLanggananHarian)}</span>
                                    </div>
                                </div>

                                {/* Card 3: Beban Server Harian */}
                                <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider">BEBAN SERVER HARIAN</span>
                                        <div className="w-7 h-7 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xs">trending_down</span>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-rose-600 tracking-tight">{fmt(totalBebanServerHarian)}</p>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-semibold text-slate-400">Domain + Hosting + Midtrans</span>
                                    </div>
                                </div>

                                {/* Card 4: Estimasi Laba Bersih */}
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-3xl shadow-lg shadow-blue-500/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-extrabold text-blue-100 uppercase tracking-wider">ESTIMASI LABA BERSIH / HARI</span>
                                        <div className="w-7 h-7 bg-white/20 text-white rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xs">monetization_on</span>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight">{fmt(estimasiLabaBersihHarian)}</p>
                                    <div className="text-[9px] font-bold text-blue-200 bg-white/10 rounded-lg px-2.5 py-0.5 w-fit">
                                        Pendapatan Kotor − Beban Server
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown Table */}
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Rincian Perhitungan Laba Bersih Harian</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Total akumulasi pendapatan semua toko dikurangi biaya server global.</p>
                                </div>

                                <div className="space-y-3 text-xs">
                                    {/* Revenue breakdown */}
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Pendapatan Kotor</span>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-semibold">Komisi Toko Gratis ({totalTransactionsFree} trx × {fmt(form.free_plan_fee)})</span>
                                            <span className="font-black text-emerald-700">{fmt(totalKomisiFreeKotor)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-semibold">Pendapatan Langganan Harian ({premiumTokos.length} toko)</span>
                                            <span className="font-black text-emerald-700">{fmt(totalPendapatanLanggananHarian)}</span>
                                        </div>
                                        <div className="border-t border-emerald-200 pt-2 flex justify-between items-center">
                                            <span className="font-black text-emerald-800">Total Pendapatan Kotor Harian</span>
                                            <span className="font-black text-emerald-800 text-sm">{fmt(totalPendapatanKotorHarian)}</span>
                                        </div>
                                    </div>

                                    {/* Cost breakdown */}
                                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2">
                                        <span className="text-[9px] font-black text-rose-700 uppercase tracking-wider">Beban Server Global</span>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-semibold">Domain ({fmt(form.domain_price_yearly)} / 360 hari)</span>
                                            <span className="font-black text-rose-600">{fmt(dailyDomain)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-semibold">Hosting ({fmt(form.hosting_price_yearly)} / 360 hari)</span>
                                            <span className="font-black text-rose-600">{fmt(dailyHosting)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-600 font-semibold">Midtrans Fee Harian</span>
                                            <span className="font-black text-rose-600">{fmt(dailyMidtrans)}</span>
                                        </div>
                                        <div className="border-t border-rose-200 pt-2 flex justify-between items-center">
                                            <span className="font-black text-rose-800">Total Beban Server Harian</span>
                                            <span className="font-black text-rose-800 text-sm">{fmt(totalBebanServerHarian)}</span>
                                        </div>
                                    </div>

                                    {/* Net profit */}
                                    <div className={`${estimasiLabaBersihHarian >= 0 ? 'bg-blue-50/60 border-blue-100' : 'bg-rose-50/60 border-rose-100'} border rounded-2xl p-4`}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-black text-slate-800 text-sm">Estimasi Laba Bersih Harian Platform</span>
                                            <span className={`font-black text-lg ${estimasiLabaBersihHarian >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>{fmt(estimasiLabaBersihHarian)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart & Distribution Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Chart */}
                                <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-855 uppercase tracking-wider">Analisis Performa Platform</h3>
                                            <p className="text-[10px] text-slate-400">Tren laba bersih harian.</p>
                                        </div>
                                        <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 text-[9px] font-bold text-slate-500 space-x-1">
                                            <button className="px-2.5 py-1 rounded-md">7 Hari</button>
                                            <button className="px-2.5 py-1 bg-white text-blue-600 shadow-sm rounded-md">30 Hari</button>
                                        </div>
                                    </div>

                                    {/* SVG Area Chart */}
                                    <div className="relative pt-4">
                                        <svg viewBox="0 0 500 200" className="w-full h-56 overflow-visible">
                                            <defs>
                                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22"/>
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00"/>
                                                </linearGradient>
                                            </defs>
                                            <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                            <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                            <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                                            <path d="M 0 170 Q 120 160 220 150 T 380 120 T 500 130" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4 4" />
                                            <path d="M 0 150 Q 100 120 180 130 T 320 80 T 420 50 T 500 65 L 500 200 L 0 200 Z" fill="url(#chartGrad)" />
                                            <path d="M 0 150 Q 100 120 180 130 T 320 80 T 420 50 T 500 65" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                            <circle cx="180" cy="130" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                                            <circle cx="320" cy="80" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                                            <circle cx="420" cy="50" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                                            <circle cx="500" cy="65" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Right Distribution */}
                                <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                        <h3 className="text-xs font-black text-slate-855 uppercase tracking-wider">Distribusi Pendapatan</h3>
                                        <p className="text-[10px] text-slate-400">Proporsi sumber pendapatan hari ini.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded bg-blue-600"></span> Komisi Toko Gratis
                                                </span>
                                                <span>{totalPendapatanKotorHarian > 0 ? Math.round((totalKomisiFreeKotor / totalPendapatanKotorHarian) * 100) : 0}%</span>
                                            </div>
                                            <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                                                <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${totalPendapatanKotorHarian > 0 ? (totalKomisiFreeKotor / totalPendapatanKotorHarian) * 100 : 0}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded bg-emerald-500"></span> Langganan Premium
                                                </span>
                                                <span>{totalPendapatanKotorHarian > 0 ? Math.round((totalPendapatanLanggananHarian / totalPendapatanKotorHarian) * 100) : 0}%</span>
                                            </div>
                                            <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${totalPendapatanKotorHarian > 0 ? (totalPendapatanLanggananHarian / totalPendapatanKotorHarian) * 100 : 0}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded bg-rose-500"></span> Beban Server
                                                </span>
                                                <span>−{fmt(totalBebanServerHarian)}</span>
                                            </div>
                                            <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                                                <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${totalPendapatanKotorHarian > 0 ? Math.min((totalBebanServerHarian / totalPendapatanKotorHarian) * 100, 100) : 0}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =============================== */}
                    {/* TAB: Daftar Toko & Komisi       */}
                    {/* =============================== */}
                    {activeTab === 'stores' && (
                        <div className="space-y-5">
                            {/* Sub-Tab Toggle Buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setStoreSubTab('free')}
                                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                                        storeSubTab === 'free'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">storefront</span>
                                    Toko Gratis (Trx Harian)
                                    <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black ${
                                        storeSubTab === 'free' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>{freeTokos.length}</span>
                                </button>
                                <button
                                    onClick={() => setStoreSubTab('premium')}
                                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                                        storeSubTab === 'premium'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                            : 'bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">workspace_premium</span>
                                    Toko Langganan (Premium)
                                    <span className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] font-black ${
                                        storeSubTab === 'premium' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>{premiumTokos.length}</span>
                                </button>
                            </div>

                            {/* Sub-Tab: Toko Gratis */}
                            {storeSubTab === 'free' && (
                                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 flex items-center gap-1.5 transition">
                                                <span className="material-symbols-outlined text-[14px]">filter_list</span>
                                                Filter
                                            </button>
                                            <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 flex items-center gap-1.5 transition">
                                                <span className="material-symbols-outlined text-[14px]">download</span>
                                                Export
                                            </button>
                                        </div>
                                        <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">Mode Komisi Transaksi Harian</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
                                            <thead>
                                                <tr className="bg-slate-50/40 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                                                    <th className="py-4 px-6 w-52">NAMA TOKO</th>
                                                    <th className="py-4 px-6 w-44">NAMA PEMILIK</th>
                                                    <th className="py-4 px-6 w-36">NOMOR HP</th>
                                                    <th className="py-4 px-6 w-60">NOMOR REKENING</th>
                                                    <th className="py-4 px-6 text-right w-36">OMSET TOKO (HARI)</th>
                                                    <th className="py-4 px-6 text-right w-32">KOMISI DEV (HARI)</th>
                                                    <th className="py-4 px-6 text-right w-36">PROFIT DEV (HARIAN)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredFreeTokos.length > 0 ? (
                                                    filteredFreeTokos.map((toko) => {
                                                        const commissionToday = toko.total_transactions * Number(form.free_plan_fee);

                                                        return (
                                                            <tr key={toko.id} className="hover:bg-blue-50/10 transition-all font-semibold text-slate-700">
                                                                <td className="py-4 px-6 font-extrabold text-slate-800">{toko.nama_toko}</td>
                                                                <td className="py-4 px-6 text-slate-700 font-medium">{toko.nama_admin}</td>
                                                                <td className="py-4 px-6 text-slate-600 font-mono">{toko.wa_toko}</td>
                                                                <td className="py-4 px-6 text-[10px] leading-relaxed">
                                                                    <span className="font-extrabold text-slate-850 block">{toko.bank_name}</span>
                                                                    <span className="text-slate-500 font-mono block">{toko.no_rekening}</span>
                                                                    <span className="text-[9px] text-slate-400 block font-bold">A.n: {toko.nama_pemilik}</span>
                                                                </td>
                                                                <td className="py-4 px-6 text-right font-black text-slate-800">{fmt(toko.total_revenue)}</td>
                                                                <td className="py-4 px-6 text-right font-black text-blue-600">{fmt(commissionToday)}</td>
                                                                <td className="py-4 px-6 text-right font-black text-emerald-600">{fmt(commissionToday)}</td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="py-12 text-center font-bold text-slate-400 text-xs">Toko gratis tidak ditemukan.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Total footer for free stores */}
                                    {filteredFreeTokos.length > 0 && (
                                        <div className="px-6 py-4 bg-blue-50/30 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Total Komisi Harian (Kotor)</span>
                                            <span className="text-sm font-black text-blue-700">{fmt(totalKomisiFreeKotor)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sub-Tab: Toko Langganan Premium */}
                            {storeSubTab === 'premium' && (
                                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 flex items-center gap-1.5 transition">
                                                <span className="material-symbols-outlined text-[14px]">filter_list</span>
                                                Filter
                                            </button>
                                            <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-650 flex items-center gap-1.5 transition">
                                                <span className="material-symbols-outlined text-[14px]">download</span>
                                                Export
                                            </button>
                                        </div>
                                        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">Mode Langganan Berbayar</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
                                            <thead>
                                                <tr className="bg-slate-50/40 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                                                    <th className="py-4 px-6 w-48">NAMA TOKO</th>
                                                    <th className="py-4 px-6 w-40">NAMA PEMILIK</th>
                                                    <th className="py-4 px-6 w-32">NOMOR HP</th>
                                                    <th className="py-4 px-6 w-52">NOMOR REKENING</th>
                                                    <th className="py-4 px-6 text-center w-28">PLAN</th>
                                                    <th className="py-4 px-6 text-right w-36">HARGA PAKET</th>
                                                    <th className="py-4 px-6 text-right w-36">PROFIT DEV (PAKET)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredPremiumTokos.length > 0 ? (
                                                    filteredPremiumTokos.map((toko) => {
                                                        let subPrice = 0;
                                                        let planLabel = '';

                                                        if (toko.tier === 'monthly') {
                                                            subPrice = Number(form.price_monthly);
                                                            planLabel = 'Bulanan';
                                                        } else if (toko.tier === '3months') {
                                                            subPrice = Number(form.price_3months);
                                                            planLabel = '3 Bulan';
                                                        } else if (toko.tier === 'yearly') {
                                                            subPrice = Number(form.price_yearly);
                                                            planLabel = 'Tahunan';
                                                        }

                                                        return (
                                                            <tr key={toko.id} className="hover:bg-emerald-50/10 transition-all font-semibold text-slate-700">
                                                                <td className="py-4 px-6 font-extrabold text-slate-800">{toko.nama_toko}</td>
                                                                <td className="py-4 px-6 text-slate-750 font-medium">{toko.nama_admin}</td>
                                                                <td className="py-4 px-6 text-slate-600 font-mono">{toko.wa_toko}</td>
                                                                <td className="py-4 px-6 text-[10px] leading-relaxed">
                                                                    <span className="font-extrabold text-slate-850 block">{toko.bank_name}</span>
                                                                    <span className="text-slate-500 font-mono block">{toko.no_rekening}</span>
                                                                    <span className="text-[9px] text-slate-400 block font-bold">A.n: {toko.nama_pemilik}</span>
                                                                </td>
                                                                <td className="py-4 px-6 text-center">
                                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${
                                                                        toko.tier === 'yearly' ? 'bg-amber-50 text-amber-700' :
                                                                        toko.tier === '3months' ? 'bg-purple-50 text-purple-700' :
                                                                        'bg-emerald-50 text-emerald-700'
                                                                    }`}>
                                                                        {planLabel}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 px-6 text-right font-black text-slate-850">{fmt(subPrice)}</td>
                                                                <td className="py-4 px-6 text-right font-black text-emerald-600">{fmt(subPrice)}</td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" className="py-12 text-center font-bold text-slate-400 text-xs">Toko langganan premium tidak ditemukan.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Total footer for premium stores */}
                                    {filteredPremiumTokos.length > 0 && (
                                        <div className="px-6 py-4 bg-emerald-50/30 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Pendapatan Langganan Harian (Prorata)</span>
                                            <span className="text-sm font-black text-emerald-700">{fmt(totalPendapatanLanggananHarian)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================= */}
                    {/* TAB: Beban Operasional     */}
                    {/* ========================= */}
                    {activeTab === 'beban' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
                                <div>
                                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-600 text-sm">account_balance_wallet</span>
                                        Input Biaya Operasional Server & Gateway
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Biaya ini disisihkan harian dari total profit platform, bukan dibebankan ke masing-masing toko.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider pl-1">Biaya Domain Tahunan (Rp)</label>
                                        <input type="number" name="domain_price_yearly" value={form.domain_price_yearly} onChange={handleChange} min="0" required className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider pl-1">Biaya Hosting Tahunan (Rp)</label>
                                        <input type="number" name="hosting_price_yearly" value={form.hosting_price_yearly} onChange={handleChange} min="0" required className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider pl-1">Fee Transfer Midtrans Harian (Rp)</label>
                                        <input type="number" name="midtrans_bank_transfer_fee" value={form.midtrans_bank_transfer_fee} onChange={handleChange} min="0" required className={inputCls} />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">save</span>
                                        Simpan Beban Harian
                                    </button>
                                </div>
                            </form>

                            <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">Rincian Beban</h3>
                                    <p className="text-[10px] text-slate-400">Biaya harian server yang disisihkan dari laba global.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-semibold">Beban Domain Harian</span>
                                        <span className="font-extrabold text-slate-800">{fmt(dailyDomain)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-semibold">Beban Hosting Harian</span>
                                        <span className="font-extrabold text-slate-800">{fmt(dailyHosting)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-semibold">Biaya Midtrans Harian</span>
                                        <span className="font-extrabold text-slate-800">{fmt(dailyMidtrans)}</span>
                                    </div>

                                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs font-bold text-rose-700 space-y-1">
                                        <span className="text-[9px] font-black text-rose-650 uppercase">TOTAL BEBAN SERVER HARIAN</span>
                                        <p className="text-base font-black text-rose-800">{fmt(totalBebanServerHarian)} / hari</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================= */}
                    {/* TAB: Informasi Developer   */}
                    {/* ========================= */}
                    {activeTab === 'developer_info' && (
                        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6">
                            <div>
                                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600 text-sm">contact_page</span>
                                    Pengaturan Rekening, QRIS & Tarif Platform
                                </h2>
                                <p className="text-[10px] text-slate-400 mt-1">Kelola data rekening bank dan harga paket untuk penagihan admin toko.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider pl-1">Nama Bank / E-Wallet Rekening Developer</label>
                                    <input type="text" name="bank_name" value={form.bank_name} onChange={handleChange} required className={inputCls} placeholder="Bank Central Asia (BCA)" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider pl-1">Nomor Rekening</label>
                                    <input type="text" name="no_rekening" value={form.no_rekening} onChange={handleChange} required className={inputCls} placeholder="7310xxxxxx" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider pl-1">Atas Nama Pemilik Rekening</label>
                                <input type="text" name="nama_pemilik" value={form.nama_pemilik} onChange={handleChange} required className={inputCls} placeholder="Atas nama lengkap developer" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider pl-1">String QRIS Statis Platform</label>
                                <textarea
                                    name="qris_string"
                                    value={form.qris_string}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Format string QRIS statis (000201...)"
                                    className={inputCls + " font-mono text-[10px]"}
                                />
                            </div>

                            <div className="border-t border-slate-100 pt-6 space-y-4">
                                <h3 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider pl-1">Tarif Paket & Komisi Transaksi</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Bulanan</label>
                                        <input type="number" name="price_monthly" value={form.price_monthly} onChange={handleChange} min="0" required className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase">3 Bulan</label>
                                        <input type="number" name="price_3months" value={form.price_3months} onChange={handleChange} min="0" required className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-bold text-slate-400 uppercase">Tahunan</label>
                                        <input type="number" name="price_yearly" value={form.price_yearly} onChange={handleChange} min="0" required className={inputCls} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-bold text-blue-600 uppercase">Komisi / Transaksi</label>
                                        <input type="number" name="free_plan_fee" value={form.free_plan_fee} onChange={handleChange} min="0" required className={inputCls} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition"
                                >
                                    <span className="material-symbols-outlined text-[16px]">save</span>
                                    Simpan Informasi
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ========================= */}
                    {/* TAB: Notifikasi & Transfer */}
                    {/* ========================= */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Daftar Bukti Transfer Harian & Aktivitas</h2>
                                <p className="text-[10px] text-slate-400">Verifikasi laporan bukti transfer uang/pendapatan harian dari seluruh outlet toko.</p>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                <th className="px-6 py-4">Nama Toko</th>
                                                <th className="px-6 py-4">Tanggal Penjualan</th>
                                                <th className="px-6 py-4">Nominal Transfer</th>
                                                <th className="px-6 py-4">Status Verifikasi</th>
                                                <th className="px-6 py-4 text-center">Bukti / Receipt</th>
                                                <th className="px-6 py-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-xs">
                                            {bukti_transfers.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-6 py-4 font-extrabold text-slate-800">{item.nama_toko}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-500">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                                    <td className="px-6 py-4 font-black text-slate-800">{fmt(item.nominal)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                            item.status === 'approved' 
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : item.status === 'rejected'
                                                                ? 'bg-rose-50 text-rose-600'
                                                                : 'bg-amber-50 text-amber-600 animate-pulse'
                                                        }`}>
                                                            {item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {item.gambar ? (
                                                            <button 
                                                                onClick={() => setSelectedProofImg(item.gambar)}
                                                                className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-extrabold rounded-lg hover:bg-blue-100 transition inline-flex items-center gap-1"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">visibility</span> Lihat Bukti
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 font-bold">Terhapus (Auto 7 Hari)</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleVerifyProof(item.id, 'approved')}
                                                                disabled={verifyingProofId !== null || item.status === 'approved'}
                                                                className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-650 hover:bg-emerald-100 flex items-center justify-center transition disabled:opacity-40"
                                                                title="Setujui Transfer"
                                                            >
                                                                <span className="material-symbols-outlined text-sm font-black">check</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleVerifyProof(item.id, 'rejected')}
                                                                disabled={verifyingProofId !== null || item.status === 'rejected'}
                                                                className="w-7 h-7 rounded-lg bg-rose-50 text-rose-650 hover:bg-rose-100 flex items-center justify-center transition disabled:opacity-40"
                                                                title="Tolak / Minta Ulang"
                                                            >
                                                                <span className="material-symbols-outlined text-sm font-black">close</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {bukti_transfers.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-12 text-slate-400 font-bold">Belum ada laporan bukti transfer yang masuk harian.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================= */}
                    {/* TAB: Pencairan Dana        */}
                    {/* ========================= */}
                    {activeTab === 'pencairan' && (
                        <div className="space-y-6">
                            {/* Upload Payout Form */}
                            <form onSubmit={handlePayoutUpload} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-5">
                                <div>
                                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-600 text-sm">upload</span>
                                        Unggah Bukti Pencairan Dana ke Toko
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Transfer dana hasil transaksi ke rekening toko dan unggah buktinya di sini.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Pilih Toko Tujuan</label>
                                        <select
                                            value={payoutForm.id_toko}
                                            onChange={(e) => setPayoutForm(prev => ({...prev, id_toko: e.target.value}))}
                                            className={inputCls}
                                            required
                                        >
                                            <option value="">-- Pilih Toko --</option>
                                            {tokos.filter(t => t.tier === 'free').map(t => (
                                                <option key={t.id} value={t.id}>{t.nama_toko} ({t.nama_admin})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nominal Pencairan (Rp)</label>
                                        <input
                                            type="number"
                                            value={payoutForm.nominal}
                                            onChange={(e) => setPayoutForm(prev => ({...prev, nominal: e.target.value}))}
                                            className={inputCls}
                                            placeholder="Contoh: 150000"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tanggal Transfer</label>
                                        <input
                                            type="date"
                                            value={payoutForm.tanggal}
                                            onChange={(e) => setPayoutForm(prev => ({...prev, tanggal: e.target.value}))}
                                            className={inputCls}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Bukti Transfer (Foto)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setPayoutForm(prev => ({...prev, gambar_file: e.target.files[0]}))}
                                            className={inputCls + ' py-2'}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={payoutLoading}
                                        className="px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black rounded-xl hover:bg-emerald-700 shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-sm">send</span>
                                        {payoutLoading ? 'Mengunggah...' : 'Kirim Bukti Pencairan'}
                                    </button>
                                </div>
                            </form>

                            {/* Payout History */}
                            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                                <div className="px-8 py-5 border-b border-slate-100">
                                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-600 text-sm">history</span>
                                        Riwayat Pencairan ke Toko
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Daftar semua bukti pencairan yang telah diunggah.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                                <th className="px-6 py-3">Toko</th>
                                                <th className="px-4 py-3">Tanggal</th>
                                                <th className="px-4 py-3">Nominal</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-center">Bukti</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {bukti_transfers.map((b) => {
                                                const tokoInfo = tokos.find(t => t.id === b.id_toko);
                                                return (
                                                    <tr key={b.id} className="hover:bg-slate-50/50 transition text-[11px] font-medium text-slate-600">
                                                        <td className="px-6 py-3 font-bold text-slate-800">{tokoInfo ? tokoInfo.nama_toko : ('Toko #' + b.id_toko)}</td>
                                                        <td className="px-4 py-3">{new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-800">Rp {parseInt(b.nominal).toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                                                                {b.status === 'approved' ? 'Dikirim' : 'Proses'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {b.gambar ? (
                                                                <button onClick={() => setSelectedProofImg(b.gambar)} className="text-blue-600 hover:underline text-[10px] font-bold">Lihat</button>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 font-bold">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {bukti_transfers.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-12 text-slate-400 font-bold">Belum ada riwayat pencairan.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================= */}
                    {/* TAB: Pengaturan Sistem     */}
                    {/* ========================= */}
                    {activeTab === 'settings' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* Panel 1: Password System */}
                            <form onSubmit={handleDevPasswordChange} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-5">
                                <div>
                                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-600 text-sm">lock</span>
                                        Ubah Password Developer Portal
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Ubah password default login developer demi keamanan platform.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Password Lama</label>
                                    <input 
                                        type="password" 
                                        required 
                                        className={inputCls} 
                                        value={devPass.old_password} 
                                        onChange={e => setDevPass({ ...devPass, old_password: e.target.value })} 
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Password Baru</label>
                                    <input 
                                        type="password" 
                                        required 
                                        className={inputCls} 
                                        value={devPass.new_password} 
                                        onChange={e => setDevPass({ ...devPass, new_password: e.target.value })} 
                                        placeholder="Min. 6 Karakter"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Konfirmasi Password Baru</label>
                                    <input 
                                        type="password" 
                                        required 
                                        className={inputCls} 
                                        value={devPass.confirm_password} 
                                        onChange={e => setDevPass({ ...devPass, confirm_password: e.target.value })} 
                                        placeholder="Ulangi password baru"
                                    />
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={passLoading}
                                        className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-750 shadow-md transition"
                                    >
                                        Ubah Password
                                    </button>
                                </div>
                            </form>

                            {/* Panel 2: System Health Status */}
                            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-5">
                                <div>
                                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-600 text-sm">settings_suggest</span>
                                        Informasi Status Sistem
                                    </h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Status dan konfigurasi server portal CuanGO.</p>
                                </div>
                                <div className="space-y-3.5 text-xs text-slate-600 font-semibold">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <span>PHP Version:</span>
                                        <span className="font-extrabold text-slate-800">8.2.0 (XAMPP Local)</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <span>Database MySQL:</span>
                                        <span className="text-emerald-600 font-extrabold flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Terhubung</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                        <span>Storage Uploads Older than 7 Days:</span>
                                        <span className="text-blue-600 font-extrabold">Auto-Cleanup Active</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Mode Aplikasi:</span>
                                        <span className="bg-emerald-50 text-emerald-650 px-2 py-0.5 rounded text-[10px] font-black">PRODUCTION READY</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Zoom Bukti Transfer */}
            {selectedProofImg && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4" onClick={() => setSelectedProofImg(null)}>
                    <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full p-4 relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-100">
                            <span className="text-[10px] font-black text-slate-800 uppercase">Preview Bukti Transfer</span>
                            <button onClick={() => setSelectedProofImg(null)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        <img src={getAppUrl(selectedProofImg)} alt="Bukti Transfer" className="w-full max-h-[70vh] object-contain rounded-2xl bg-slate-50 shadow-sm" />
                    </div>
                </div>
            )}
        </div>
    );
}
