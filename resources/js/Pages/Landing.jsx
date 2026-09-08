import React, { useState, useEffect } from 'react';

export default function Landing({ dev_payment }) {
    const [showSplash, setShowSplash] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [degAdmin, setDegAdmin] = useState(0);
    const [degStaff, setDegStaff] = useState(0);

    const featureMatrix = [
        {
            icon: 'storefront',
            category: 'Marketplace UMKM',
            menuName: 'Explore & Peta Toko',
            contentDetails: 'GPS lokasi terdekat 1–10km, peta Leaflet interaktif, filter toko & WhatsApp direct order.',
            solution: 'Jangkauan Pelanggan Luas'
        },
        {
            icon: 'analytics',
            category: 'Dashboard & Analitik',
            menuName: 'Monitoring Real-time',
            contentDetails: 'Grafik omset harian, total transaksi, mutasi saldo & alert notifikasi langganan toko.',
            solution: 'Visibilitas Bisnis Real-Time'
        },
        {
            icon: 'point_of_sale',
            category: 'POS Kasir Terminal',
            menuName: 'Terminal Penjualan',
            contentDetails: 'Kasir kilat <3 detik, Cash/QRIS/E-Wallet, cetak struk thermal & potong stok otomatis.',
            solution: 'Antrean Cepat & Bebas Error'
        },
        {
            icon: 'inventory_2',
            category: 'Manajemen Gudang',
            menuName: 'Stok Bahan & SOP',
            contentDetails: 'Lacak bahan masuk/keluar, takaran resep per porsi menu, konversi unit & alert stok.',
            solution: 'Kontrol HPP & Minimalisir Waste'
        },
        {
            icon: 'psychology',
            category: 'Prediksi AI (SES)',
            menuName: 'AI Demand Forecast',
            contentDetails: 'Prediksi kebutuhan stok 7 hari ke depan dengan algoritma SES & auto-generate belanja.',
            solution: 'Efisiensi Modal Belanja AI'
        },
        {
            icon: 'payments',
            category: 'Keuangan & Payout',
            menuName: 'Keuangan & Pencairan',
            contentDetails: 'Laporan arus kas, margin profit per menu, pencairan harian otomatis oleh developer 24 jam.',
            solution: 'Transparansi Payout Harian'
        },
        {
            icon: 'badge',
            category: 'Manajemen Staf',
            menuName: 'Kelola Staf & GPS',
            contentDetails: 'Role access control Admin vs Kasir, absensi selfie berbasis lokasi GPS & rekap jam kerja.',
            solution: 'Disiplin Staf & Akses Aman'
        },
        {
            icon: 'chat',
            category: 'Portal Pelanggan',
            menuName: 'Pemesanan & Chat WA',
            contentDetails: 'Checkout mandiri QR meja/URL, riwayat transaksi pembeli & chat WhatsApp toko langsung.',
            solution: 'Pemesanan Mandiri Praktis'
        }
    ];

    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    useEffect(() => {
        const t1 = setTimeout(() => setFadeOut(true), 1500);
        const t2 = setTimeout(() => setShowSplash(false), 2000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Get dynamic config values or use fallbacks
    const priceMonthly = dev_payment?.prices?.monthly ?? 99000;
    const price3Months = dev_payment?.prices?.['3months'] ?? 250000;
    const priceYearly = dev_payment?.prices?.yearly ?? 830000;
    const freePlanFee = dev_payment?.free_plan_fee ?? 500;

    const fmt = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

    if (showSplash) {
        return (
            <div 
                className={`fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
                <div className="text-center space-y-6">
                    <img 
                        src={getAppUrl('/images/logo-cuango.png')} 
                        alt="CuanGO Logo" 
                        className="w-36 h-36 object-contain mx-auto animate-pulse"
                    />
                    <p className="text-[11px] text-blue-650 font-bold uppercase tracking-widest">
                        Bantu Scale Up UMKM Naik Kelas
                    </p>
                </div>
            </div>
        );
    }

    const faqs = [
        { q: 'Apakah bisa dicoba gratis?', a: `Ya! Anda bisa menggunakan CuanGO secara gratis tanpa batas waktu. Paket Gratis dikenakan biaya ${fmt(freePlanFee)} per transaksi. Untuk menghilangkan biaya per-transaksi, upgrade ke paket berbayar kapan saja.` },
        { q: 'Apakah data aman?', a: 'Tentu saja. Data Anda disimpan dengan enkripsi standar industri dan backup otomatis setiap hari. Privasi dan keamanan data pelanggan adalah prioritas utama kami.' },
        { q: 'Apakah mendukung QRIS?', a: 'Ya! CuanGO mendukung pembayaran QRIS statis dan dinamis. Pelanggan bisa scan dan bayar langsung dari handphone mereka.' },
        { q: 'Bagaimana prediksi AI bekerja?', a: 'CuanGO menggunakan metode Single Exponential Smoothing (SES) untuk menganalisis tren penjualan historis dan memprediksi kebutuhan bahan baku 7 hari ke depan secara otomatis.' },
    ];

    const features = [
        { 
            icon: 'point_of_sale', 
            title: 'POS Terminal Modern', 
            bullets: [
                'Transaksi instan < 3 detik dengan interface kasir modern & responsif',
                'Mendukung pembayaran Cash, QRIS Statis, & QRIS Dinamis dalam satu layar',
                'Cetak struk belanja thermal secara nirkabel Bluetooth atau via USB POS'
            ]
        },
        { 
            icon: 'show_chart', 
            title: 'AI Demand Forecasting', 
            bullets: [
                'Prediksi kebutuhan stok & bahan baku 7 hari ke depan secara akurat',
                'Menggunakan algoritma Single Exponential Smoothing (SES) adaptif harian',
                'Mencegah penumpukan barang busuk & meminimalisir food waste'
            ]
        },
        { 
            icon: 'inventory_2', 
            title: 'Manajemen Stok Gudang', 
            bullets: [
                'Lacak stok masuk, keluar, & sisa bahan baku secara real-time',
                'SOP takaran bahan baku per menu memastikan konsistensi rasa',
                'Pengurangan stok otomatis setiap kali transaksi kasir diselesaikan'
            ]
        },
        { 
            icon: 'receipt_long', 
            title: 'Laporan Keuangan Otomatis', 
            bullets: [
                'Dashboard grafik performa omset, belanja, & laba bersih harian',
                'Analisis menu paling menguntungkan berdasarkan margin HPP produk',
                'Pencatatan mutasi kas masuk/keluar otomatis & terverifikasi sistem'
            ]
        },
        { 
            icon: 'shopping_cart', 
            title: 'Belanja Otomatis AI', 
            bullets: [
                'Rekomendasi daftar belanja bahan baku otomatis berbasis prediksi AI',
                'Tombol import belanja langsung menjadi mutasi pengeluaran kas',
                'Optimalisasi modal belanja harian untuk efisiensi cashflow UMKM'
            ]
        },
        { 
            icon: 'group', 
            title: 'Multi-Staff & Absensi', 
            bullets: [
                'Manajemen akun staff dengan hak akses kasir/karyawan aman',
                'Sistem absensi selfie karyawan terintegrasi koordinat GPS lokal',
                'Pantau jam kerja, izin cuti, & riwayat kehadiran staff real-time'
            ]
        },
    ];

    return (
        <div 
            className="min-h-screen bg-slate-50 text-slate-700 font-sans flex flex-col relative overflow-hidden"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
            {/* Header / Navbar */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <img 
                            src={getAppUrl('/images/logo-cuango-landscape.png')} 
                            alt="CuanGO Logo" 
                            className="h-10 sm:h-12 object-contain"
                        />
                    </div>
                    <nav className="hidden sm:flex items-center gap-8 text-[12px] font-semibold text-slate-500">
                        <a href="#features" className="hover:text-blue-600 transition">Features</a>
                        <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
                        <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
                        <a href={getAppUrl('/pembeli/explore')} className="hover:text-blue-600 transition">Eksplorasi Toko</a>
                    </nav>
                    <a href={getAppUrl('/login')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[12px] font-bold transition shadow-md shadow-blue-500/25">
                        Masuk / Daftar
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-16 pb-8 text-center bg-gradient-to-b from-blue-50/50 to-slate-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-650 text-[11px] font-bold mb-6">
                        <span className="material-symbols-outlined text-xs">bolt</span>
                        Sistem POS Bertenaga AI
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight max-w-3xl mx-auto">
                        Sistem POS & Inventaris Tercanggih untuk UMKM
                    </h1>

                    <p className="text-[14px] text-slate-450 font-medium leading-relaxed max-w-xl mx-auto mt-5">
                        Tingkatkan efisiensi bisnis Anda dengan prediksi stok bertenaga AI. Kelola penjualan, inventaris, dan pelanggan dalam satu platform modern yang mudah digunakan.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        <a href={getAppUrl('/login')} className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[13px] font-bold transition shadow-lg shadow-blue-500/25 flex items-center gap-2">
                            Coba Sekarang <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </a>
                        <a href="#features" className="px-7 py-3.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-650 hover:text-slate-900 rounded-2xl text-[13px] font-bold transition shadow-sm">
                            Pelajari Fitur
                        </a>
                    </div>

                    {/* Dashboard Preview synced with Admin Haltea Dashboard */}
                    <div className="mt-12 max-w-4xl mx-auto relative">
                        <div className="absolute -inset-4 bg-gradient-to-b from-blue-100/30 to-transparent rounded-3xl blur-2xl pointer-events-none"></div>
                        <div className="relative bg-slate-900 rounded-t-3xl pt-3 px-3 shadow-2xl shadow-slate-300/40">
                            {/* Browser Header */}
                            <div className="flex items-center gap-3 pb-2.5 px-1">
                                <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></span>
                                </div>
                                <div className="flex-1 bg-slate-800/80 rounded-lg py-1 px-3 text-[9px] text-slate-400 font-mono text-left">
                                    https://app.cuango.id/dashboard - Admin Haltea Preview
                                </div>
                            </div>
                            {/* Inner Dashboard View */}
                            <div className="bg-slate-50 rounded-t-xl overflow-hidden border border-slate-100 text-left text-xs font-sans text-slate-700">
                                <div className="flex">
                                    {/* Sidebar Mockup */}
                                    <div className="w-[180px] bg-slate-900 text-slate-400 p-4 hidden sm:flex flex-col space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">H</div>
                                            <span className="text-[11px] font-bold text-white">Haltea Admin</span>
                                        </div>
                                        <div className="space-y-1">
                                            {['Dashboard', 'Transaksi', 'Kelola Karyawan', 'Kelola Menu', 'Stok Bahan Baku', 'SOP & Takaran', 'Keuangan'].map((item, idx) => (
                                                <div key={idx} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 ${idx === 0 ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Main Workspace Mockup */}
                                    <div className="flex-1 p-4 space-y-4 bg-slate-50">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-extrabold text-xs text-slate-850">Dashboard Penjualan Haltea</h3>
                                                <p className="text-[9px] text-slate-450 font-bold">Ringkasan performa toko hari ini.</p>
                                            </div>
                                            <div className="h-5 w-24 bg-white border rounded-lg"></div>
                                        </div>
                                        {/* Cards Row */}
                                        <div className="grid grid-cols-4 gap-3">
                                            {[
                                                { label: 'OMSET HARIAN', val: 'Rp 2.450.000', color: 'text-blue-600' },
                                                { label: 'TRANSAKSI', val: '48 Trx', color: 'text-slate-800' },
                                                { label: 'BIAYA BAHAN BAKU', val: 'Rp 980.000', color: 'text-rose-600' },
                                                { label: 'ESTIMASI UNTUNG', val: 'Rp 1.470.000', color: 'text-emerald-600' }
                                            ].map((c, i) => (
                                                <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                                                    <span className="text-[7px] font-black text-slate-400 block">{c.label}</span>
                                                    <span className={`text-[11px] font-black block mt-1 ${c.color}`}>{c.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Dual Graphs Mockup */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
                                                <span className="text-[8px] font-bold text-slate-450 block">PERFORMA PENJUALAN</span>
                                                <div className="h-16 mt-2 flex items-end">
                                                    <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                                                        <path d="M0,40 Q50,20 100,30 T200,10 L200,50 L0,50 Z" fill="#eff6ff" />
                                                        <path d="M0,40 Q50,20 100,30 T200,10" fill="none" stroke="#2563eb" strokeWidth="2" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm">
                                                <span className="text-[8px] font-bold text-slate-450 block">PREDIKSI KEBUTUHAN SES</span>
                                                <div className="h-16 mt-2 flex items-end gap-1">
                                                    {[40, 70, 50, 90, 65, 80].map((h, i) => (
                                                        <div key={i} className="flex-1 flex gap-[1px] items-end h-full">
                                                            <div className="flex-1 bg-indigo-500 rounded-t" style={{ height: `${h}%` }}></div>
                                                            <div className="flex-1 bg-emerald-500 rounded-t" style={{ height: `${h * 0.7}%` }}></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Banner with Smooth Fade-In Animation */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-3 text-white text-center text-xs font-bold tracking-wide shadow-inner flex items-center justify-center gap-2 transition-all duration-700">
                <span className="material-symbols-outlined text-sm animate-pulse text-amber-300">verified</span>
                <span>Dipercaya oleh <strong className="text-amber-300 font-extrabold underline decoration-amber-300 decoration-2 underline-offset-2">500+ UMKM F&B</strong> se-Indonesia untuk Efisiensi Kasir & Prediksi Stok AI</span>
            </div>

            {/* Interactive 3D Premium Metallic Cards Section */}
            <section className="py-14 bg-slate-900 text-white relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                    <div className="text-center mb-10 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/30 shadow-inner">
                            ✦ Premium Multi-Role Privilege ✦
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            2 Mode Fitur Khusus dalam 1 Akun Berlangganan
                        </h2>
                        <p className="text-xs text-slate-400 font-medium max-w-xl mx-auto">
                            Sentuh atau klik kartu di bawah untuk memutar kartu 360° secara interaktif.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto" style={{ perspective: '1200px' }}>
                        {/* Metallic Card 1: Admin / Owner (Gold Obsidian Metallic) */}
                        <div 
                            onClick={() => setDegAdmin(prev => prev + 360)}
                            className="relative h-64 w-full rounded-[28px] cursor-pointer shadow-2xl transition-transform duration-1000 ease-out hover:scale-[1.03] active:scale-[0.98]"
                            style={{ 
                                transform: `rotateY(${degAdmin}deg)`,
                                transformStyle: 'preserve-3d',
                                background: 'linear-gradient(135deg, #110e08 0%, #2a2212 35%, #59471d 70%, #110e08 100%)',
                                border: '1.5px solid rgba(234, 179, 8, 0.45)',
                                boxShadow: '0 20px 40px -15px rgba(234, 179, 8, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            {/* Metallic Shimmer Reflection */}
                            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-transparent via-amber-200/10 to-transparent pointer-events-none"></div>

                            <div className="p-7 h-full flex flex-col justify-between relative z-10">
                                {/* Card Top Row */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        {/* Golden SIM Chip Mockup */}
                                        <div className="w-11 h-9 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 p-[1px] shadow-md flex items-center justify-center relative overflow-hidden">
                                            <div className="w-full h-full bg-amber-400/90 rounded-[7px] border border-amber-200/80 grid grid-cols-2 gap-[2px] p-1">
                                                <div className="border border-amber-600/40 rounded-[2px]"></div>
                                                <div className="border border-amber-600/40 rounded-[2px]"></div>
                                                <div className="border border-amber-600/40 rounded-[2px]"></div>
                                                <div className="border border-amber-600/40 rounded-[2px]"></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">GOLD VIP PASS</span>
                                    </div>
                                    <span className="material-symbols-outlined text-amber-400 text-2xl animate-pulse">contactless</span>
                                </div>

                                {/* Card Center Info */}
                                <div className="space-y-1">
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-300/80">Fitur Khusus 01</span>
                                    <h3 className="text-2xl font-black text-amber-100 tracking-tight flex items-center gap-2">
                                        Mode Admin / Owner
                                    </h3>
                                    <p className="text-xs text-amber-200/70 font-medium">
                                        Hak Akses Kontrol Penuh Operasional Toko & Laporan Keuangan
                                    </p>
                                </div>

                                {/* Card Bottom Row */}
                                <div className="flex justify-between items-center border-t border-amber-500/20 pt-3 text-[10px] font-bold text-amber-400/80">
                                    <span className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">3d_rotation</span> Sentuh / Klik untuk Putar 360°
                                    </span>
                                    <span className="font-mono text-amber-300">ADMIN-VIP-PASS</span>
                                </div>
                            </div>
                        </div>

                        {/* Metallic Card 2: Karyawan / Staff (Platinum Titanium Metallic) */}
                        <div 
                            onClick={() => setDegStaff(prev => prev + 360)}
                            className="relative h-64 w-full rounded-[28px] cursor-pointer shadow-2xl transition-transform duration-1000 ease-out hover:scale-[1.03] active:scale-[0.98]"
                            style={{ 
                                transform: `rotateY(${degStaff}deg)`,
                                transformStyle: 'preserve-3d',
                                background: 'linear-gradient(135deg, #0b1329 0%, #1e293b 35%, #3b82f6 70%, #090d16 100%)',
                                border: '1.5px solid rgba(148, 163, 184, 0.45)',
                                boxShadow: '0 20px 40px -15px rgba(59, 130, 246, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            {/* Metallic Shimmer Reflection */}
                            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-transparent via-blue-200/10 to-transparent pointer-events-none"></div>

                            <div className="p-7 h-full flex flex-col justify-between relative z-10">
                                {/* Card Top Row */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        {/* Silver SIM Chip Mockup */}
                                        <div className="w-11 h-9 rounded-lg bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 p-[1px] shadow-md flex items-center justify-center relative overflow-hidden">
                                            <div className="w-full h-full bg-slate-300/90 rounded-[7px] border border-slate-100/80 grid grid-cols-2 gap-[2px] p-1">
                                                <div className="border border-slate-600/40 rounded-[2px]"></div>
                                                <div className="border border-slate-600/40 rounded-[2px]"></div>
                                                <div className="border border-slate-600/40 rounded-[2px]"></div>
                                                <div className="border border-slate-600/40 rounded-[2px]"></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PLATINUM PASS</span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-300 text-2xl animate-pulse">contactless</span>
                                </div>

                                {/* Card Center Info */}
                                <div className="space-y-1">
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-300/80">Fitur Khusus 02</span>
                                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                        Mode Karyawan / Kasir
                                    </h3>
                                    <p className="text-xs text-slate-300/70 font-medium">
                                        Hak Akses Terminal POS Penjualan & Absensi GPS Staf
                                    </p>
                                </div>

                                {/* Card Bottom Row */}
                                <div className="flex justify-between items-center border-t border-slate-700/60 pt-3 text-[10px] font-bold text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">3d_rotation</span> Sentuh / Klik untuk Putar 360°
                                    </span>
                                    <span className="font-mono text-slate-300">STAFF-POS-PASS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section with Ultra-Premium Light Matrix Table */}
            <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-blue-50/30 to-white text-slate-800 relative overflow-hidden border-b border-slate-100">
                {/* Background Ambient Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-400/10 via-indigo-400/10 to-amber-300/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 relative z-10">
                    <div className="text-center max-w-2xl mx-auto space-y-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 bg-blue-100/70 px-4 py-1.5 rounded-full border border-blue-200/80 shadow-sm inline-block">
                            ✦ Architecture & Feature Matrix ✦
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            Matriks Solusi & Fitur Platform CuanGO
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                            Ringkasan fungsi utama, menu, dan solusi bisnis terintegrasi dalam satu sistem POS cerdas.
                        </p>
                    </div>

                    {/* Ultra-Premium Light Table */}
                    <div className="overflow-x-auto border border-slate-200/90 rounded-[28px] shadow-xl shadow-slate-200/50 bg-white/90 backdrop-blur-md">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                                    <th className="px-6 py-4.5 w-1/4">Kategori Fitur</th>
                                    <th className="px-5 py-4.5 w-1/5">Menu Utama</th>
                                    <th className="px-6 py-4.5 w-2/5">Informasi & Akses</th>
                                    <th className="px-5 py-4.5 w-1/4">Solusi Bisnis Utama</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {featureMatrix.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors duration-200">
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                                                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                                                </div>
                                                <span className="text-xs font-black tracking-tight">{item.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-extrabold text-blue-600">
                                            <span className="bg-blue-50 px-3 py-1 rounded-xl border border-blue-150 text-[11px] shadow-2xs">
                                                {item.menuName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs leading-relaxed font-normal">
                                            {item.contentDetails}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200/80 text-[11px] font-extrabold tracking-tight shadow-xs">
                                                <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                                                {item.solution}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Pricing Section with Dynamic Fees */}
            <section id="pricing" className="py-16 sm:py-20 bg-slate-50/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Pilih Paket yang Sesuai untuk Bisnis Anda</h2>
                        <p className="text-[14px] text-slate-450 font-medium mt-3 max-w-md mx-auto">Mulai dari usaha kecil hingga besar, kami memiliki paket yang dirancang untuk mendukung pertumbuhan bisnis Anda.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
                        {/* Gratis */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col hover:shadow-lg transition-all duration-300">
                            <div className="mb-4">
                                <h3 className="text-base font-extrabold text-slate-800">Gratis</h3>
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Tanpa biaya langganan</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-[11px] text-slate-400 font-semibold">Rp</span>
                                <span className="text-3xl font-black text-slate-900">0</span>
                                <span className="text-[12px] text-slate-400 font-medium">/bulan</span>
                            </div>
                            <p className="text-[11px] text-blue-600 font-bold mb-5">+ {fmt(freePlanFee)} fee / transaksi</p>
                            <ul className="space-y-2.5 flex-1 mb-5">
                                {['Basic POS Terminal', 'QRIS & Cash', 'Stok Management', 'SES Prediction'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[12px] text-slate-650 font-medium">
                                        <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>{f}
                                    </li>
                                ))}
                            </ul>
                            <a href={getAppUrl('/login')} className="block text-center py-2.5 rounded-2xl text-[12px] font-bold transition border border-slate-200 text-slate-600 hover:bg-slate-50">
                                Mulai Gratis
                            </a>
                        </div>

                        {/* Bulanan */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col hover:shadow-lg transition-all duration-300">
                            <div className="mb-4">
                                <h3 className="text-base font-extrabold text-slate-800">Bulanan</h3>
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Satu Toko</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-[11px] text-slate-400 font-semibold">Rp</span>
                                <span className="text-3xl font-black text-slate-900">{Number(priceMonthly).toLocaleString('id-ID')}</span>
                                <span className="text-[12px] text-slate-400 font-medium">/bulan</span>
                            </div>
                            <ul className="space-y-2.5 flex-1 mb-5">
                                {['Semua Fitur Gratis', 'Tanpa Fee Transaksi', 'Priority Support', 'Laporan Keuangan'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[12px] text-slate-650 font-medium">
                                        <span className="material-symbols-outlined text-blue-600 text-sm">check_circle</span>{f}
                                    </li>
                                ))}
                            </ul>
                            <a href={getAppUrl('/login')} className="block text-center py-2.5 rounded-2xl text-[12px] font-bold transition border border-blue-500 text-blue-600 hover:bg-blue-50">
                                Pilih Paket
                            </a>
                        </div>

                        {/* 3 Bulan */}
                        <div className="relative bg-white border border-blue-500 rounded-3xl p-6 flex flex-col shadow-lg shadow-blue-500/10">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[9px] font-extrabold rounded-full uppercase tracking-wider">
                                Paling Populer ✦
                            </div>
                            <div className="mb-4">
                                <h3 className="text-base font-extrabold text-slate-800">3 Bulan</h3>
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Satu Toko</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-[11px] text-slate-400 font-semibold">Rp</span>
                                <span className="text-3xl font-black text-slate-900">{Number(price3Months).toLocaleString('id-ID')}</span>
                                <span className="text-[12px] text-slate-400 font-medium">/3 bulan</span>
                            </div>
                            <ul className="space-y-2.5 flex-1 mb-5">
                                {['Semua Fitur Bulanan', 'Tanpa Fee Transaksi', 'Custom Reports', 'QRIS Integration'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[12px] text-slate-650 font-medium">
                                        <span className="material-symbols-outlined text-blue-600 text-sm">check_circle</span>{f}
                                    </li>
                                ))}
                            </ul>
                            <a href={getAppUrl('/login')} className="block text-center py-2.5 rounded-2xl text-[12px] font-bold transition bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                Pilih Paket
                            </a>
                        </div>

                        {/* Tahunan */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col hover:shadow-lg transition-all duration-300">
                            <div className="mb-4">
                                <h3 className="text-base font-extrabold text-slate-800">Tahunan</h3>
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Hemat Besar</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-[11px] text-slate-400 font-semibold">Rp</span>
                                <span className="text-3xl font-black text-slate-900">{Number(priceYearly).toLocaleString('id-ID')}</span>
                                <span className="text-[12px] text-slate-400 font-medium">/tahun</span>
                            </div>
                            <ul className="space-y-2.5 flex-1 mb-5">
                                {['Semua Fitur 3 Bulan', 'Priority Support', 'Custom Reports', 'Multi-Outlet Ready'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-[12px] text-slate-650 font-medium">
                                        <span className="material-symbols-outlined text-blue-600 text-sm">check_circle</span>{f}
                                    </li>
                                ))}
                            </ul>
                            <a href={getAppUrl('/login')} className="block text-center py-2.5 rounded-2xl text-[12px] font-bold transition border border-blue-500 text-blue-600 hover:bg-blue-50">
                                Pilih Paket
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-16 sm:py-20 bg-white">
                <div className="max-w-2xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-10">Pertanyaan yang Sering Diajukan</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left font-bold"
                                >
                                    <span className="text-[13px] text-slate-700">{faq.q}</span>
                                    <span className={`material-symbols-outlined text-slate-400 text-lg transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                                    <p className="px-5 text-[12px] text-slate-500 font-semibold leading-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Professional Footer */}
            <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-8 mt-auto">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-xs font-semibold">
                    {/* Col 1: Brand & Logo */}
                    <div className="space-y-4">
                        <div className="flex items-center bg-white rounded-2xl p-2 w-fit">
                            <img 
                                src={getAppUrl('/images/logo-cuango-landscape.png')} 
                                alt="CuanGO Logo" 
                                className="h-10 object-contain"
                            />
                        </div>
                        <p className="text-slate-450 leading-relaxed font-medium">
                            Sistem Manajemen Inventaris & POS berbasis AI yang dirancang khusus untuk memajukan pemilik outlet makanan & minuman di seluruh Indonesia.
                        </p>
                    </div>

                    {/* Col 2: Fitur Utama */}
                    <div className="space-y-4">
                        <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">Fitur Utama</h4>
                        <ul className="space-y-2.5 text-slate-450 font-medium">
                            <li><a href="#features" className="hover:text-blue-400 transition">POS Kasir Kas</a></li>
                            <li><a href="#features" className="hover:text-blue-400 transition">Prediksi SES AI</a></li>
                            <li><a href="#features" className="hover:text-blue-400 transition">Stok Bahan Baku</a></li>
                            <li><a href="#features" className="hover:text-blue-400 transition">Laporan Keuangan</a></li>
                        </ul>
                    </div>

                    {/* Col 3: Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">Akses Sistem</h4>
                        <ul className="space-y-2.5 text-slate-450 font-medium">
                            <li><a href={getAppUrl('/pembeli/explore')} className="hover:text-blue-400 transition">Peta Eksplorasi Toko</a></li>
                            <li><a href={getAppUrl('/login')} className="hover:text-blue-400 transition">Portal POS Merchant</a></li>
                            <li><a href={getAppUrl('/developer/login')} className="hover:text-blue-400 transition">Portal Developer</a></li>
                            <li><a href="#pricing" className="hover:text-blue-400 transition">Pilihan Paket Langganan</a></li>
                        </ul>
                    </div>

                    {/* Col 4: Contact Support */}
                    <div className="space-y-4">
                        <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">Hubungi Developer</h4>
                        <ul className="space-y-2.5 text-slate-450 font-medium">
                            <li className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">mail</span>
                                <span>support@cuango.id</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">phone</span>
                                <span>+62 822-1234-5678</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                <span>Jakarta Pusat, Indonesia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>&copy; {new Date().getFullYear()} CuanGO Platform. All rights reserved.</span>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-slate-400">Terms of Service</a>
                        <a href="#" className="hover:text-slate-400">Privacy Policy</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
