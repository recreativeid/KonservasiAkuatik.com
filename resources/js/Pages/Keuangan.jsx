import React, { useRef, useEffect } from 'react';
import Sidebar from '../Components/Sidebar';

export default function Keuangan({ 
    total_sales = 0, 
    total_expense = 0, 
    mutations = [], 
    chart_data = [], 
    menu_profitability = [], 
    user,
    dev_payment = {},
    subscription_tier = 'free',
    free_plan_fee = 500,
    bukti_transfers = []
}) {
    const canvasRef = useRef(null);

    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    useEffect(() => {
        if (!canvasRef.current || chart_data.length === 0) return;

        const Chart = window.Chart;
        if (!Chart) return;

        const ctx = canvasRef.current.getContext('2d');
        const labels = chart_data.map(d => d.tanggal);
        const incomeData = chart_data.map(d => d.pendapatan);
        const expenseData = chart_data.map(d => d.pengeluaran);

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pendapatan',
                        data: incomeData,
                        borderColor: '#4361EE',
                        backgroundColor: 'rgba(67, 97, 238, 0.05)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 2,
                    },
                    {
                        label: 'Laba Bersih',
                        data: incomeData.map((v, i) => Math.max(0, v - expenseData[i])),
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            font: { size: 11, weight: '600' }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            callback: value => 'Rp ' + value.toLocaleString('id-ID'),
                            font: { size: 9 }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });

        return () => {
            chart.destroy();
        };
    }, [chart_data]);

    const handleExportPdf = () => {
        window.print();
    };

    const saldoKas = total_sales - total_expense;
    const userName = user?.name || user?.nama || 'User';

    const [isUploadOpen, setIsUploadOpen] = React.useState(false);
    const [showQrisModal, setShowQrisModal] = React.useState(false);
    const [uploadForm, setUploadForm] = React.useState({ nominal: '', tanggal: '', gambar_file: null });
    const [uploadLoading, setUploadLoading] = React.useState(false);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.gambar_file) {
            alert('Silakan pilih berkas bukti transfer terlebih dahulu.');
            return;
        }
        setUploadLoading(true);
        const formData = new FormData();
        formData.append('nominal', uploadForm.nominal);
        formData.append('tanggal', uploadForm.tanggal);
        formData.append('gambar_file', uploadForm.gambar_file);

        try {
            const res = await fetch(getAppUrl('/api/finance/upload-transfer'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                setIsUploadOpen(false);
                setUploadForm({ nominal: '', tanggal: '', gambar_file: null });
                window.location.reload();
            } else {
                alert(data.message || 'Gagal mengunggah bukti transfer.');
            }
        } catch (err) {
            alert('Kesalahan jaringan: ' + err.message);
        } finally {
            setUploadLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none print:bg-white print:p-0">
            <div className="print:hidden">
                <Sidebar user={user} activePage="/keuangan" />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between print:hidden">
                    <div className="relative">
                        <input type="text" placeholder="Cari data keuangan..." className="w-80 bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-[#4361EE]/20 outline-none transition" />
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

                <main className="p-8 space-y-6 overflow-y-auto flex-1 print:p-0">
                    {/* Title & CTA */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 print:pb-0 print:border-none">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-850">Laporan Keuangan</h1>
                            <p className="text-sm text-slate-450 mt-1">Ringkasan arus kas operasional outlet</p>
                        </div>
                        <button 
                            onClick={handleExportPdf}
                            className="bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#4361EE]/20 flex items-center gap-2 transition print:hidden"
                        >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            <span>Ekspor PDF</span>
                        </button>
                    </div>

                    {/* Summary Widgets Row */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Uang Masuk & Keluar</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Pemasukan</p>
                                <h3 className="text-xl font-extrabold text-green-600 mt-1">Rp {total_sales.toLocaleString('id-ID')}</h3>
                                <p className="text-[10px] text-green-500 font-bold mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">trending_up</span>
                                    <span>+12% vs bulan lalu</span>
                                </p>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Pengeluaran</p>
                                <h3 className="text-xl font-extrabold text-red-500 mt-1">Rp {total_expense.toLocaleString('id-ID')}</h3>
                                <p className="text-[10px] text-red-400 font-bold mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">trending_down</span>
                                    <span>+5% vs belanja lalu</span>
                                </p>
                            </div>
                            <div className="bg-white border border-[#4361EE]/10 bg-gradient-to-br from-white to-[#4361EE]/5 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Saldo Kas</p>
                                <h3 className="text-xl font-extrabold text-[#4361EE] mt-1">Rp {saldoKas.toLocaleString('id-ID')}</h3>
                                <p className="text-[10px] text-[#4361EE] font-bold mt-1.5 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">verified</span>
                                    <span>Aman & Terverifikasi</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Daily Payout / Pencairan Dana Developer Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Read-only List of Developer Payouts */}
                        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Pencairan Dana dari Developer</h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Riwayat pencairan dana yang ditransfer oleh developer ke rekening toko Anda.</p>
                                </div>
                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-wider border border-emerald-100">Otomatis</span>
                            </div>

                            <div className="overflow-x-auto border border-slate-50 rounded-xl">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                            <th className="px-4 py-2.5">Tanggal</th>
                                            <th className="px-4 py-2.5">Nominal Pencairan</th>
                                            <th className="px-4 py-2.5">Status</th>
                                            <th className="px-4 py-2.5 text-center">Bukti</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-[11px] font-medium text-slate-650">
                                        {bukti_transfers.map((b) => (
                                            <tr key={b.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-4 py-3">{new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                <td className="px-4 py-3 font-bold text-slate-800">Rp {parseInt(b.nominal).toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        b.status === 'approved' 
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-amber-50 text-amber-600 animate-pulse'
                                                    }`}>
                                                        {b.status === 'approved' ? 'Diterima' : 'Menunggu'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {b.gambar ? (
                                                        <a href={getAppUrl(b.gambar)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[10px] font-bold">Lihat Bukti</a>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-bold">Dihapus (Auto 7 Hari)</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {bukti_transfers.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-slate-400 font-bold">Belum ada riwayat pencairan dari developer.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right Column: Payout Explanation Card */}
                        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Paket: {subscription_tier === 'free' ? 'Gratis (Free)' : subscription_tier}
                                    </span>
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mt-2">Informasi Pencairan</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                        Dana dari transaksi pembelian ditampung sementara oleh developer. Setelah jam tutup toko, dana akan diproses dan ditransfer ke rekening Anda <b>paling lambat 24 jam</b>.
                                    </p>
                                </div>

                                {subscription_tier === 'free' && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
                                            <span className="text-[10px] font-black text-amber-700 uppercase">Biaya Per Transaksi</span>
                                        </div>
                                        <p className="text-[10px] text-amber-600 font-semibold leading-relaxed">
                                            Untuk paket Gratis, setiap transaksi dikenakan biaya layanan sebesar <b>Rp {free_plan_fee.toLocaleString('id-ID')}</b>. Biaya ini sudah dipotong secara otomatis dari nominal yang dicairkan ke toko Anda.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2 text-xs font-semibold text-slate-650 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Alur Pencairan</div>
                                    <div className="flex items-start gap-2 text-[10px] text-slate-500">
                                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 text-[8px] font-black flex items-center justify-center">1</span>
                                        <span>Pembeli melakukan pembayaran</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-[10px] text-slate-500">
                                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 text-[8px] font-black flex items-center justify-center">2</span>
                                        <span>Dana ditampung oleh developer</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-[10px] text-slate-500">
                                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-blue-100 text-blue-600 text-[8px] font-black flex items-center justify-center">3</span>
                                        <span>Jam tutup toko: developer proses pencairan</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-[10px] text-slate-500">
                                        <span className="w-5 h-5 flex-shrink-0 rounded-full bg-emerald-100 text-emerald-600 text-[8px] font-black flex items-center justify-center">4</span>
                                        <span>Paling lambat 24 jam dana diterima</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <a 
                                    href="https://wa.me/6281234567890?text=Halo%20Developer%20CuanGO,%20saya%20butuh%20bantuan%20mengenai%20pencairan%20dana%20toko%20saya"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 px-4 py-2.5 bg-[#10B981] hover:bg-[#0E9F6E] text-white text-[10px] font-black rounded-xl text-center shadow-md transition flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-xs">chat</span> Hubungi Developer
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Arus Kas Terbaru Table */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Arus Kas Terbaru</h3>
                            <button className="text-[11px] text-[#4361EE] font-bold hover:underline">Lihat Semua</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-3.5">Tanggal</th>
                                        <th className="px-6 py-3.5">Keterangan</th>
                                        <th className="px-6 py-3.5">Kategori</th>
                                        <th className="px-6 py-3.5 text-right">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[13px]">
                                    {mutations.slice(0, 5).map((m, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-3.5 text-slate-500 font-medium">
                                                {new Date(m.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-3.5 font-bold text-slate-800">{m.detail || 'Operasional'}</td>
                                            <td className="px-6 py-3.5">
                                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${m.tipe.includes('Masuk') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                                    {m.tipe.includes('Masuk') ? 'Pemasukan' : 'Pengeluaran'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-3.5 text-right font-extrabold ${m.tipe.includes('Masuk') ? 'text-green-600' : 'text-red-500'}`}>
                                                {m.tipe.includes('Masuk') ? '+' : '-'}Rp {parseInt(m.nominal).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                    {mutations.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">Belum ada mutasi kas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Laba Rugi Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-850">Laporan Laba Rugi</h2>
                                <p className="text-xs text-slate-450 mt-0.5">Performa finansial bersih operasional</p>
                            </div>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                <button className="px-3 py-1 rounded-md text-[11px] font-bold text-slate-500 hover:bg-white transition">Harian</button>
                                <button className="px-3 py-1 rounded-md text-[11px] font-bold bg-white text-[#4361EE] shadow-sm">Mingguan</button>
                                <button className="px-3 py-1 rounded-md text-[11px] font-bold text-slate-500 hover:bg-white transition">Bulanan</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Chart Card */}
                            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
                                <h4 className="font-extrabold text-sm text-slate-800">Tren Laba Bersih</h4>
                                <div className="flex-1 relative h-60 mt-4">
                                    <canvas ref={canvasRef}></canvas>
                                </div>
                            </div>

                            {/* Sidebar Profit Metrics */}
                            <div className="space-y-4 flex flex-col justify-between">
                                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-1.5">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase font-semibold">Pendapatan</p>
                                    <h4 className="text-lg font-extrabold text-slate-800">Rp {total_sales.toLocaleString('id-ID')}</h4>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-1.5">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase font-semibold">HPP (Total Belanja)</p>
                                    <h4 className="text-lg font-extrabold text-slate-800">Rp {total_expense.toLocaleString('id-ID')}</h4>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-1.5">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase font-semibold">Laba Kotor</p>
                                    <h4 className="text-lg font-extrabold text-slate-800">Rp {Math.round(total_sales - total_expense * 0.7).toLocaleString('id-ID')}</h4>
                                </div>
                                <div className="bg-[#4361EE] text-white rounded-2xl p-5 space-y-1.5 shadow-lg shadow-[#4361EE]/20">
                                    <p className="text-[10px] text-blue-100 font-bold uppercase font-semibold">Laba Bersih</p>
                                    <h4 className="text-lg font-extrabold">Rp {saldoKas.toLocaleString('id-ID')}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profitabilitas Menu Grid */}
                    <div>
                        <div className="mb-4">
                            <h2 className="text-lg font-extrabold text-slate-850">Profitabilitas Menu</h2>
                            <p className="text-xs text-slate-450 mt-0.5">Analisis keuntungan per item (30 Hari Terakhir)</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {menu_profitability.map((menu, i) => (
                                <div key={menu.id} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={menu.gambar ? getAppUrl(menu.gambar) : getAppUrl('haltea-logo.png')} 
                                                alt={menu.nama_menu} 
                                                className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                                                onError={(e) => { e.target.src = getAppUrl('haltea-logo.png'); }}
                                            />
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-[13px] text-slate-800 truncate">{menu.nama_menu}</h4>
                                                {i === 0 && (
                                                    <span className="text-[8px] bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase mt-1 inline-block">BEST SELLER</span>
                                                )}
                                                {i === 1 && (
                                                    <span className="text-[8px] bg-green-50 text-green-600 font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase mt-1 inline-block">HIGH MARGIN</span>
                                                )}
                                                {i >= 2 && (
                                                    <span className="text-[8px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase mt-1 inline-block">STEADY</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-1.5 text-xs text-slate-500 font-medium">
                                            <div className="flex justify-between">
                                                <span>Harga Jual:</span>
                                                <span className="text-slate-800 font-bold">Rp {menu.harga.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>HPP/Cup:</span>
                                                <span className="text-red-500 font-semibold">Rp {Math.round(menu.hpp).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between border-t border-slate-50 pt-1.5 mt-1 font-bold text-slate-700">
                                                <span>Profit/Cup:</span>
                                                <span className="text-green-600">Rp {Math.round(menu.profit_per_cup).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">TOTAL PROFIT (30 HARI)</p>
                                            <p className="text-sm font-extrabold text-blue-600">Rp {Math.round(menu.total_profit).toLocaleString('id-ID')}</p>
                                        </div>
                                        {/* Sparkline mini bar chart */}
                                        <div className="flex items-end gap-0.5 h-6">
                                            <div className="w-1 bg-blue-100 h-2 rounded-t-sm"></div>
                                            <div className="w-1 bg-blue-200 h-4 rounded-t-sm"></div>
                                            <div className="w-1 bg-blue-300 h-3 rounded-t-sm"></div>
                                            <div className="w-1 bg-blue-500 h-5 rounded-t-sm"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Upload Setoran Harian */}
            {isUploadOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-sm text-slate-800">Unggah Bukti Setoran Harian</h3>
                            <button onClick={() => setIsUploadOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Pilih Tanggal Penjualan</label>
                                <input 
                                    type="date" 
                                    required 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none font-semibold text-slate-700" 
                                    value={uploadForm.tanggal}
                                    onChange={e => setUploadForm({ ...uploadForm, tanggal: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Nominal Setoran (Rp)</label>
                                <input 
                                    type="number" 
                                    required 
                                    placeholder="Contoh: 15000"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none font-semibold text-slate-700" 
                                    value={uploadForm.nominal}
                                    onChange={e => setUploadForm({ ...uploadForm, nominal: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Unggah Foto Bukti Transfer</label>
                                <input 
                                    type="file" 
                                    required
                                    accept="image/*"
                                    onChange={e => setUploadForm({ ...uploadForm, gambar_file: e.target.files[0] })}
                                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={uploadLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-blue-500/20 flex justify-center items-center gap-1.5"
                            >
                                {uploadLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                <span>Kirim Setoran</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal QRIS Scan Developer */}
            {showQrisModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowQrisModal(false)}>
                    <div className="bg-white rounded-3xl overflow-hidden max-w-sm w-full p-6 text-center space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                            <span className="text-[10px] font-black text-slate-800 uppercase">Scan QRIS Developer</span>
                            <button onClick={() => setShowQrisModal(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        <p className="text-[11px] text-slate-450 font-medium leading-relaxed">Pindai kode QRIS di bawah melalui aplikasi e-wallet Anda (Gopay, OVO, Dana, LinkAja, Mobile Banking) untuk setoran langsung.</p>
                        
                        <div className="w-56 h-56 mx-auto bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner p-2">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(dev_payment.qris_string)}`}
                                alt="QRIS Developer"
                                className="w-full h-full object-contain rounded-xl"
                            />
                        </div>
                        <div className="font-mono text-[9px] bg-slate-50 border border-slate-100 rounded-xl p-2 select-all break-all text-slate-500 max-h-16 overflow-y-auto">
                            {dev_payment.qris_string}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
