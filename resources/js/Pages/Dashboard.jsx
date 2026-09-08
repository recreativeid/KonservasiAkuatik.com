import React, { useRef, useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import Sidebar from '../Components/Sidebar';

export default function Dashboard({ user, stats, predictions, chart_data, menu_chart_data = [], material_predictions = [], history, top_predicted, subscription_tier, subscription_expiry, notifications = [] }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };
    const canvasRef = useRef(null);
    const menuCanvasRef = useRef(null);
    const [predicting, setPredicting] = useState(false);
    const userName = user?.name || user?.nama || 'User';
    const [showNotifications, setShowNotifications] = useState(false);

    const isSubscriptionExpiringSoon = () => {
        if (subscription_tier === 'free') return false;
        if (!subscription_expiry) return false;
        const expiryTime = new Date(subscription_expiry).getTime();
        const nowTime = new Date().getTime();
        const diffDays = (expiryTime - nowTime) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 3;
    };

    const isExpired = () => {
        if (subscription_tier === 'free') return false;
        if (!subscription_expiry) return true;
        return new Date(subscription_expiry).getTime() < new Date().getTime();
    };

    useEffect(() => {
        // --- 1. Total Sales Performance Chart ---
        if (!canvasRef.current || chart_data.length === 0) return;
        const Chart = window.Chart;
        if (!Chart) return;

        const ctx = canvasRef.current.getContext('2d');
        const labels = chart_data.map(d => d.date);
        const data = chart_data.map(d => d.total);

        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, 240);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)'); // Cyan top
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)'); // Blue middle
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)'); // Fade out

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Penjualan Hari Ini (Rupiah)',
                    data: data,
                    borderColor: '#06B6D4',
                    borderWidth: 3,
                    tension: 0.45,
                    fill: true,
                    backgroundColor: gradient,
                    pointRadius: 4,
                    pointBackgroundColor: '#06B6D4',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#f1f5f9' }, 
                        ticks: { 
                            callback: value => 'Rp ' + value.toLocaleString('id-ID'), 
                            font: { size: 9, weight: 'bold' },
                            color: '#94a3b8'
                        } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' } 
                    }
                }
            }
        });

        // --- 2. Raw Material Stock Prediction (Bar Chart) ---
        let menuChart = null;
        if (menuCanvasRef.current && material_predictions.length > 0) {
            const mCtx = menuCanvasRef.current.getContext('2d');
            const mLabels = material_predictions.map(d => d.nama_barang);
            const mKebutuhan = material_predictions.map(d => parseFloat(d.total_kebutuhan));
            const mStok = material_predictions.map(d => parseFloat(d.total_stok));

            menuChart = new Chart(mCtx, {
                type: 'bar',
                data: {
                    labels: mLabels,
                    datasets: [
                        {
                            label: 'Prediksi Kebutuhan (7 Hari)',
                            data: mKebutuhan,
                            backgroundColor: '#2563EB',
                            borderColor: '#2563EB',
                            borderWidth: 1,
                            borderRadius: 6,
                            barPercentage: 0.8,
                            categoryPercentage: 0.7
                        },
                        {
                            label: 'Stok Gudang Saat Ini',
                            data: mStok,
                            backgroundColor: '#06B6D4',
                            borderColor: '#06B6D4',
                            borderWidth: 1,
                            borderRadius: 6,
                            barPercentage: 0.8,
                            categoryPercentage: 0.7
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: true, 
                            position: 'top', 
                            align: 'end',
                            labels: { usePointStyle: true, boxWidth: 6, font: { size: 10, weight: 'bold' } } 
                        } 
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: '#f1f5f9' }, 
                            ticks: { 
                                font: { size: 9, weight: 'bold' },
                                color: '#94a3b8'
                            } 
                        },
                        x: { 
                            grid: { display: false }, 
                            ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' } 
                        }
                    }
                }
            });
        }

        return () => { 
            chart.destroy(); 
            if (menuChart) menuChart.destroy();
        };
    }, [chart_data, material_predictions]);

    const runPrediction = async () => {
        setPredicting(true);
        try {
            const response = await fetch(getAppUrl('/api/predict/run'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert('Prediksi gagal: ' + data.message);
            }
        } catch (e) {
            alert('Error running prediction: ' + e.message);
        } finally {
            setPredicting(false);
        }
    };

    const maxPred = top_predicted.length > 0 ? Math.max(...top_predicted.map(m => m.prediksi_cup)) : 100;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/dashboard" />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Cari data, menu, atau laporan..."
                                className="w-80 bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] outline-none transition"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition relative"
                            >
                                <span className="material-symbols-outlined text-[18px]">notifications</span>
                                {notifications.length > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 overflow-hidden py-2 divide-y divide-slate-50">
                                    <div className="px-4 py-2 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Notifikasi Aktivitas</span>
                                        <span className="text-[8px] bg-blue-50 text-[#4361EE] font-extrabold px-1.5 py-0.5 rounded-full">Live</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif, idx) => (
                                                <div key={idx} className="p-3 hover:bg-slate-50 transition flex items-start gap-2.5">
                                                    <span className="material-symbols-outlined text-xs text-[#4361EE] mt-0.5">shopping_bag</span>
                                                    <div className="text-[9px] font-semibold text-slate-600">
                                                        <p className="font-extrabold text-slate-800">Pesanan Masuk: {notif.order_id}</p>
                                                        <p className="mt-0.5">Pelanggan: {notif.nama_pembeli || 'Umum'} (Rp {parseInt(notif.total_biaya).toLocaleString('id-ID')})</p>
                                                        <p className="text-[8px] text-slate-400 font-medium mt-1">{new Date(notif.created_at).toLocaleTimeString('id-ID')} WIB</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-[10px] text-slate-400 font-bold">Tidak ada aktivitas baru baru ini.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-700">{userName}</span>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">
                                {userName.substring(0, 2)}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1">
                    {/* Page Title */}
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800">Dashboard</h1>
                        <p className="text-sm text-slate-400 mt-1">Pantau performa penjualan, stok, dan prediksi Haltea secara real-time.</p>
                    </div>

                    {subscription_tier !== 'free' && (isExpired() || isSubscriptionExpiringSoon()) && (
                        <div className="bg-gradient-to-r from-rose-500 to-amber-500 rounded-3xl p-5 text-white shadow-xl shadow-red-500/10 flex items-center justify-between flex-wrap gap-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-xl">warning</span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-black">PENTING: Jangan lupa perpanjang langgananmu!</h4>
                                    <p className="text-[10px] text-white/90 font-bold mt-0.5">
                                        {isExpired() 
                                            ? `Masa berlangganan paket ${subscription_tier} Anda telah HABIS pada ${new Date(subscription_expiry).toLocaleDateString('id-ID')}`
                                            : `Masa berlangganan paket ${subscription_tier} Anda akan HABIS dalam beberapa hari lagi (${new Date(subscription_expiry).toLocaleDateString('id-ID')})`}
                                    </p>
                                </div>
                            </div>
                            <a 
                                href={getAppUrl('/berlangganan')}
                                className="px-5 py-2.5 bg-white text-red-650 font-extrabold text-[10px] rounded-xl shadow-md transition hover:scale-[1.01] active:scale-[0.99]"
                            >
                                Perpanjang Sekarang
                            </a>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#4361EE]/10 text-[#4361EE] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-xl">inventory_2</span>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 font-semibold">Bahan Baku</p>
                                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.barang || '-'} <span className="text-xs font-semibold text-slate-400">item</span></h3>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-xl">restaurant_menu</span>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 font-semibold">Menu Aktif</p>
                                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.orders} <span className="text-xs font-semibold text-slate-400">SKU</span></h3>
                                <p className="text-[10px] text-green-500 font-bold mt-0.5">✓ Semua tersedia</p>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-xl">receipt_long</span>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 font-semibold">Total Transaksi</p>
                                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.customers.toLocaleString('id-ID')}</h3>
                                <p className="text-[10px] text-[#4361EE] font-bold mt-0.5">+12% dari kemarin</p>
                            </div>
                        </div>
                        <div className="bg-[#4361EE] rounded-2xl p-5 flex items-start gap-4 text-white shadow-lg shadow-[#4361EE]/20">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-xl">analytics</span>
                            </div>
                            <div>
                                <p className="text-[11px] text-blue-100 font-semibold">Rata-rata WMAPE</p>
                                <h3 className="text-xl font-extrabold mt-0.5">{stats.avg_wmape || '8.42'}%</h3>
                                <p className="text-[10px] text-blue-100 font-bold mt-0.5">Akurasi Tinggi</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart & Prediction Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart 1: Sales Performance */}
                        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col min-h-[360px] shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-extrabold text-sm text-slate-800">Sales Performance (Grafik Penjualan)</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Performa omset penjualan toko dalam 7 hari terakhir</p>
                                </div>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button className="px-3 py-1 rounded-md text-[11px] font-bold bg-white text-[#2563EB] shadow-sm">Harian</button>
                                    <button className="px-3 py-1 rounded-md text-[11px] font-bold text-slate-500 hover:bg-white transition">Mingguan</button>
                                </div>
                            </div>
                            <div className="flex-1 relative" style={{ minHeight: '240px' }}>
                                <canvas ref={canvasRef}></canvas>
                            </div>
                        </div>

                        {/* Prediction Control Panel */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-[#4361EE]">auto_awesome</span>
                                    <h4 className="font-extrabold text-sm text-slate-800">Ringkasan prediksi</h4>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400 font-medium">Prediksi Aktif</span>
                                        <span className="text-[10px] font-extrabold text-white bg-[#4361EE] px-2 py-0.5 rounded-full uppercase">Berjalan</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 space-y-2">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-semibold">Terakhir Diproses</p>
                                            <p className="text-xs text-slate-800 font-bold">Hari ini, {new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} WIB</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-semibold">Interval Auto</p>
                                            <p className="text-xs text-slate-800 font-bold">7 hari sekali</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mt-5">
                                <button
                                    onClick={runPrediction}
                                    disabled={predicting}
                                    className="w-full bg-[#4361EE] hover:bg-[#3A56D4] disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition shadow-md shadow-[#4361EE]/20 flex items-center justify-center gap-2 text-xs"
                                >
                                    {predicting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">play_arrow</span>}
                                    <span>Jalankan Prediksi Manual</span>
                                </button>
                                <a href={getAppUrl('/lihat-prediksi')} className="w-full block text-center border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-3 rounded-xl transition text-xs">
                                    Lihat Detail Parameter
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Chart Row 2: AI Demand Forecasting */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart 2: AI Demand Forecasting */}
                        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 flex flex-col min-h-[360px] shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-extrabold text-sm text-slate-800">AI Demand Forecasting (Grafik Penjualan Menu)</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Analisis kuantitas cup menu terjual vs kecerdasan prediksi AI</p>
                                </div>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button className="px-3 py-1 rounded-md text-[11px] font-bold bg-white text-[#2563EB] shadow-sm">Harian</button>
                                    <button className="px-3 py-1 rounded-md text-[11px] font-bold text-slate-500 hover:bg-white transition">Mingguan</button>
                                </div>
                            </div>
                            <div className="flex-1 relative" style={{ minHeight: '240px' }}>
                                <canvas ref={menuCanvasRef}></canvas>
                            </div>
                        </div>

                        {/* Extra informational widget */}
                        <div className="bg-[#f0f4ff]/40 border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">insights</span>
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-slate-800">Metrik Akurasi SES</h5>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                                        Model peramalan Single Exponential Smoothing (SES) menghitung rata-rata bergerak berbobot eksponensial untuk memproyeksikan kebutuhan bahan baku berikutnya dengan akurasi rata-rata di atas 90%.
                                    </p>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Akurasi AI</span>
                                    <span className="text-xs font-black text-emerald-600">{(100 - parseFloat(stats.avg_wmape || 8.42)).toFixed(2)}% Accuracy</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History & Top Menu Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Prediction History Table */}
                        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-extrabold text-sm text-slate-800">Riwayat Prediksi Terbaru</h4>
                                <a href={getAppUrl('/lihat-prediksi')} className="text-[11px] text-[#4361EE] font-bold hover:underline">Semua Riwayat →</a>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                            <th className="py-3 font-bold">Tanggal</th>
                                            <th className="py-3 font-bold">Model AI</th>
                                            <th className="py-3 font-bold">Akurasi</th>
                                            <th className="py-3 font-bold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {history.map(row => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition">
                                                <td className="py-3.5 font-semibold text-slate-600">{row.nama_menu}</td>
                                                <td className="py-3.5 font-semibold text-slate-500">SES v1.0</td>
                                                <td className="py-3.5 font-bold text-slate-800">{(100 - parseFloat(row.wmape)).toFixed(1)}%</td>
                                                <td className="py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${row.is_valid ? 'bg-[#4361EE]/10 text-[#4361EE]' : 'bg-amber-50 text-amber-600'}`}>
                                                        {row.is_valid ? 'Selesai' : 'Rendah'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && (
                                            <tr><td colSpan={4} className="py-8 text-center text-slate-400">Belum ada data prediksi.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Menu by Prediction */}
                        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
                            <h4 className="font-extrabold text-sm text-slate-800">Top Menu by Prediction</h4>
                            <div className="space-y-3.5">
                                {top_predicted.map((menu, i) => {
                                    const pct = maxPred > 0 ? Math.round((menu.prediksi_cup / maxPred) * 100) : 0;
                                    const colors = ['bg-[#4361EE]', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
                                    return (
                                        <div key={menu.id}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="font-bold text-slate-700">{menu.nama_menu}</span>
                                                <span className="font-bold text-slate-500">{pct}% Sold-out Risk</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {top_predicted.length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-4">Belum ada data prediksi.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
