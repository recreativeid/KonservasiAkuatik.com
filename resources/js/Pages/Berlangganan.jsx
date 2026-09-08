import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function Berlangganan({ current_tier, expiry_date, user, dev_payment, subscription_cancel }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const devPrices = dev_payment?.prices || { monthly: 99000, '3months': 250000, yearly: 830000 };
    const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

    const [activeTier, setActiveTier] = useState(current_tier);
    const [isCanceled, setIsCanceled] = useState(subscription_cancel);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCancelSubscription = async () => {
        if (confirm('Apakah Anda yakin ingin membatalkan perpanjangan otomatis langganan Anda? Layanan aktif Anda tidak hangus dan tetap berjalan hingga masa berlaku habis.')) {
            setLoading(true);
            try {
                const res = await fetch(getAppUrl('/api/settings/cancel-subscription'), {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    }
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setIsCanceled(true);
                    showToast(data.message || 'Perpanjangan otomatis berhasil dibatalkan.');
                } else {
                    showToast(data.message || 'Gagal membatalkan perpanjangan.', 'error');
                }
            } catch (err) {
                showToast('Kesalahan: ' + err.message, 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const [checkoutPlan, setCheckoutPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('qris');
    const [qrisPayload, setQrisPayload] = useState('');
    const [uniqueCode, setUniqueCode] = useState(0);
    const [uniqueAmount, setUniqueAmount] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const [verifyStep, setVerifyStep] = useState(0);

    const handleSelectTier = async (tier) => {
        if (tier === 'free') {
            executeUpgrade('free');
        } else {
            const selected = plans.find(p => p.id === tier);
            setCheckoutPlan(selected);
            setPaymentMethod('qris');
            setVerifying(false);
            setVerifyStep(0);
            setQrisPayload('');
            setUniqueCode(0);
            setUniqueAmount(0);

            try {
                const res = await fetch(getAppUrl('/api/payment/generate-checkout-qris'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({ tier })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    setQrisPayload(data.qris_string);
                    setUniqueCode(data.unique_code);
                    setUniqueAmount(data.unique_amount);
                } else {
                    showToast('Gagal memuat QRIS Dinamis.', 'error');
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const executeUpgrade = async (tier) => {
        setLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/settings/update-subscription'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ tier })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setActiveTier(tier);
                showToast(data.message);
                setCheckoutPlan(null);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast(data.message || 'Gagal memperbarui paket.', 'error');
            }
        } catch (e) {
            showToast('Kesalahan: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPayment = () => {
        setVerifying(true);
        setVerifyStep(1);
        
        setTimeout(async () => {
            setVerifyStep(2);
            
            try {
                const res = await fetch(getAppUrl('/api/payment/verify-manual'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({
                        tier: checkoutPlan.id,
                        payment_method: paymentMethod
                    })
                });
                const data = await res.json();

                setTimeout(() => {
                    setVerifyStep(3);
                    setTimeout(() => {
                        if (res.ok && data.success) {
                            setVerifyStep(4);
                            setTimeout(() => {
                                setActiveTier(checkoutPlan.id);
                                showToast(data.message || 'Pembayaran berhasil diverifikasi!');
                                setCheckoutPlan(null);
                                setTimeout(() => window.location.reload(), 1500);
                            }, 1200);
                        } else {
                            setVerifying(false);
                            showToast(data.message || 'Pembayaran belum terdeteksi. Silakan coba lagi.', 'error');
                        }
                    }, 1200);
                }, 1200);

            } catch (e) {
                setVerifying(false);
                showToast('Kesalahan verifikasi: ' + e.message, 'error');
            }
        }, 1200);
    };

    const plans = [
        {
            id: 'free',
            name: 'Gratis (Pay-as-you-go)',
            price: 'Rp 0',
            period: 'selamanya',
            note: 'Biaya Rp 500 per transaksi',
            features: [
                'Bebas biaya bulanan / tahunan',
                'Semua Fitur Kasir (POS)',
                'QRIS Statis & Cash',
                'Analisis Prediksi Dasar',
                'Dukungan Komunitas'
            ],
            color: 'border-slate-200 hover:border-slate-300',
            btnClass: 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
        },
        {
            id: 'monthly',
            name: 'Bulanan',
            price: fmt(devPrices.monthly),
            priceValue: devPrices.monthly,
            period: 'bulan',
            note: 'Tanpa fee transaksi tambahan',
            features: [
                'Semua Fitur Kasir (POS)',
                'QRIS Dinamis & QRIS Statis',
                'Prediksi Bahan Baku SES',
                'Laporan Keuangan & Grafik',
                'Dukungan Premium 24/7'
            ],
            color: 'border-slate-200 hover:border-slate-300',
            btnClass: 'border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50'
        },
        {
            id: '3months',
            name: '3 Bulan (Hemat 33%)',
            price: fmt(devPrices['3months']),
            priceValue: devPrices['3months'],
            period: '3 bulan',
            note: 'Tanpa fee transaksi tambahan',
            features: [
                'Semua Fitur Bulanan',
                'Lebih hemat 33%',
                'Prediksi Bahan Baku SES',
                'Laporan Keuangan & Grafik',
                'Dukungan Premium Prioritas'
            ],
            color: 'border-[#2563EB] shadow-lg shadow-blue-500/5',
            popular: true,
            btnClass: 'bg-[#2563EB] text-white hover:bg-blue-750 shadow-md shadow-blue-500/20'
        },
        {
            id: 'yearly',
            name: 'Tahunan (Hemat 53%)',
            price: fmt(devPrices.yearly),
            priceValue: devPrices.yearly,
            period: 'tahun',
            note: 'Tanpa fee transaksi tambahan',
            features: [
                'Semua Fitur 3 Bulan',
                'Lebih hemat 53%',
                'Prediksi Bahan Baku SES',
                'Laporan Keuangan & Grafik',
                'Multi-Outlet Ready'
            ],
            color: 'border-slate-200 hover:border-slate-300',
            btnClass: 'border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/berlangganan" />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-[#2563EB]'}`}>
                    <span className="material-symbols-outlined text-lg">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                    {toast.message}
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shrink-0">
                    <span className="font-extrabold text-sm text-slate-800">Paket Berlangganan Toko</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CuanGO License</span>
                </header>

                {/* Content */}
                <main className="p-8 space-y-6 overflow-y-auto flex-1 max-w-6xl w-full mx-auto">
                    {/* Active Plan Widget */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="bg-blue-50 text-[#2563EB] px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">Status Paket</span>
                            <h2 className="text-lg font-black text-slate-850">
                                Paket Saat Ini:{' '}
                                <span className="text-[#2563EB]">
                                    {activeTier === 'free' && 'Gratis (Pay-as-you-go)'}
                                    {activeTier === 'monthly' && 'Bulanan'}
                                    {activeTier === '3months' && '3 Bulan'}
                                    {activeTier === 'yearly' && 'Tahunan'}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">
                                {activeTier === 'free' 
                                    ? 'Anda menggunakan lisensi gratis dengan biaya Rp 500 per transaksi yang diproses di sistem.' 
                                    : isCanceled 
                                        ? `Langganan Anda telah dibatalkan. Layanan aktif tetap berjalan hingga tanggal kedaluwarsa: ${expiry_date ? new Date(expiry_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}`
                                        : `Paket aktif hingga: ${expiry_date ? new Date(expiry_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}`}
                            </p>
                        </div>
                        {activeTier !== 'free' && !isCanceled && (
                            <button
                                type="button"
                                onClick={handleCancelSubscription}
                                disabled={loading}
                                className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 shrink-0"
                            >
                                <span className="material-symbols-outlined text-xs">cancel</span>
                                Batalkan Perpanjangan
                            </button>
                        )}
                        {activeTier === 'free' && (
                            <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 max-w-sm">
                                <span className="text-[10px] text-[#2563EB] font-bold uppercase tracking-wider block">💡 Tips Hemat</span>
                                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                                    Jika transaksi harian Anda cukup banyak, beralih ke paket langganan bulanan atau tahunan akan menghemat pengeluaran transaksi Anda secara signifikan!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pricing Cards Title */}
                    <div className="text-center space-y-2 mt-4">
                        <h3 className="text-xl font-black text-slate-850">Tingkatkan Ke Paket Langganan Lebih Hemat</h3>
                        <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">Semua paket langganan menghapus potongan biaya Rp 500/transaksi dan membuka semua fitur unggulan secara instan.</p>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {plans.map((plan) => {
                            const isCurrent = activeTier === plan.id;
                            return (
                                <div 
                                    key={plan.id} 
                                    className={`relative bg-white border-2 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-350 ${plan.color} ${isCurrent ? 'border-emerald-500 bg-emerald-50/10' : ''}`}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-500/20">
                                            <span className="material-symbols-outlined text-[10px]">check</span> Aktif Sekarang
                                        </div>
                                    )}
                                    {plan.popular && !isCurrent && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-[#2563EB] text-white text-[9px] font-extrabold rounded-full uppercase tracking-wider shadow-md">
                                            ✦ Paling Hemat
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-extrabold text-slate-800">{plan.name}</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{plan.note}</p>
                                        </div>

                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-2xl font-black text-slate-800">{plan.price}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold">/{plan.period}</span>
                                        </div>

                                        <ul className="space-y-2.5 border-t border-slate-100 pt-4">
                                            {plan.features.map((feat, i) => (
                                                <li key={i} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                                                    <span className="material-symbols-outlined text-[#2563EB] text-[14px]">check_circle</span>
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => handleSelectTier(plan.id)}
                                        disabled={loading || isCurrent}
                                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-center mt-6 ${plan.btnClass} ${isCurrent ? 'bg-emerald-500 border-emerald-500 text-white font-extrabold cursor-default opacity-80' : ''}`}
                                    >
                                        {isCurrent ? 'Paket Aktif Anda' : 'Pilih Paket'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>

            {/* Checkout Modal */}
            {checkoutPlan && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60 transition-all duration-300 animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-scaleUp">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 py-5 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-extrabold text-base">Checkout Langganan</h3>
                                <p className="text-[10px] text-blue-100 font-semibold mt-0.5">Paket {checkoutPlan.name} • Tanpa Pajak & Fee Admin</p>
                            </div>
                            <button 
                                onClick={() => !verifying && setCheckoutPlan(null)} 
                                disabled={verifying}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 overflow-y-auto flex-1 relative">
                            {verifying ? (
                                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 rounded-full border-4 border-[#2563EB] border-t-transparent animate-spin"></div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-extrabold text-slate-800">Verifikasi Pembayaran</p>
                                        <div className="text-xs font-semibold text-slate-500 min-h-[20px] transition-all">
                                            {verifyStep === 1 && "Menghubungkan ke API perbankan..."}
                                            {verifyStep === 2 && "Memeriksa mutasi BCA & status QRIS..."}
                                            {verifyStep === 3 && "Menyinkronkan data pembayaran masuk..."}
                                            {verifyStep === 4 && "Sukses! Memproses aktivasi lisensi..."}
                                        </div>
                                    </div>
                                    <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(verifyStep / 4) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Order Info Summary */}
                                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan (dengan kode unik)</span>
                                            <div className="text-lg font-black text-slate-800">
                                                {uniqueAmount > 0 ? `Rp ${uniqueAmount.toLocaleString('id-ID')}` : checkoutPlan.price}
                                            </div>
                                            {uniqueCode > 0 && (
                                                <span className="text-[9px] text-[#2563EB] font-bold">{checkoutPlan.price} + kode unik {uniqueCode}</span>
                                            )}
                                        </div>
                                        <div className="bg-blue-50 text-[#2563EB] px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide">
                                            {checkoutPlan.period === 'bulan' ? 'Bulanan' : checkoutPlan.period === '3 bulan' ? '3 Bulan' : 'Tahunan'}
                                        </div>
                                    </div>

                                    {/* Payment Method Selector */}
                                    <div className="grid grid-cols-2 gap-3 shrink-0">
                                        <button 
                                            onClick={() => setPaymentMethod('qris')}
                                            className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition ${paymentMethod === 'qris' ? 'border-[#2563EB] bg-blue-50/20 text-[#2563EB]' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <span className="material-symbols-outlined text-base">qr_code_2</span>
                                            QRIS Dinamis
                                        </button>
                                        <button 
                                            onClick={() => setPaymentMethod('va')}
                                            className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition ${paymentMethod === 'va' ? 'border-[#2563EB] bg-blue-50/20 text-[#2563EB]' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <span className="material-symbols-outlined text-base">account_balance</span>
                                            Transfer BCA
                                        </button>
                                    </div>

                                    {/* Payment Detail Display */}
                                    {paymentMethod === 'qris' ? (
                                        <div className="flex flex-col items-center space-y-4">
                                            {/* QR Code Card Wrapper */}
                                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col items-center w-64">
                                                <div className="bg-[#2563EB] text-white font-extrabold text-[9px] py-1 px-3 rounded-full mb-3 tracking-widest uppercase">QRIS GPN</div>
                                                {qrisPayload ? (
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrisPayload)}`} 
                                                        alt="QRIS Dinamis" 
                                                        className="w-44 h-44 object-contain animate-fadeIn"
                                                    />
                                                ) : (
                                                    <div className="w-44 h-44 flex flex-col items-center justify-center space-y-2 border border-slate-100 rounded-2xl bg-slate-50">
                                                        <div className="w-6 h-6 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin"></div>
                                                        <span className="text-[9px] font-bold text-slate-400">Membuat QRIS Dinamis...</span>
                                                    </div>
                                                )}
                                                <p className="text-[8px] text-slate-400 font-bold text-center mt-3 tracking-wide">Diterbitkan oleh rekening {dev_payment?.nama_pemilik || 'Developer'}</p>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-[10px] text-slate-650 leading-relaxed max-w-sm font-medium">
                                                💡 <strong>Metode Instan:</strong> Pindai QR Code di atas menggunakan aplikasi m-banking (BCA, Mandiri, dll) atau e-wallet (Gopay, OVO, ShopeePay). Sistem akan langsung memverifikasi otomatis setelah pembayaran dilakukan.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* BCA VA Details Card */}
                                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                                    <div>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Bank Tujuan</span>
                                                        <span className="text-xs font-black text-slate-800">{dev_payment?.bank_name || 'Bank Central Asia (BCA)'}</span>
                                                    </div>
                                                    <div className="bg-white px-3 py-1.5 rounded-xl border font-black text-[#2563EB] text-[10px]">{(dev_payment?.bank_name || 'BCA').split(' ').pop().replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase() || 'BCA'}</div>
                                                </div>

                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nomor Rekening</span>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="font-extrabold text-sm text-slate-800 select-all">{dev_payment?.no_rekening || '1222338764'}</span>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(dev_payment?.no_rekening || '1222338764');
                                                                showToast("Nomor rekening berhasil disalin!");
                                                            }}
                                                            className="text-[#2563EB] text-[10px] font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">content_copy</span> Salin
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Atas Nama Penerima</span>
                                                    <span className="font-bold text-xs text-slate-800 block mt-1">{dev_payment?.nama_pemilik || 'Muhammad Fathur Rohman'}</span>
                                                </div>

                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nominal Persis (Wajib Sama Persis)</span>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <div>
                                                            <span className="font-black text-sm text-slate-800">{uniqueAmount > 0 ? `Rp ${uniqueAmount.toLocaleString('id-ID')}` : fmt(checkoutPlan.priceValue)}</span>
                                                            {uniqueCode > 0 && <span className="text-[9px] text-[#2563EB] font-bold ml-2">kode: +{uniqueCode}</span>}
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(String(uniqueAmount || checkoutPlan.priceValue));
                                                                showToast("Nominal berhasil disalin!");
                                                            }}
                                                            className="text-[#2563EB] text-[10px] font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[12px]">content_copy</span> Salin
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[10px] text-slate-650 leading-relaxed font-medium">
                                                ⚠️ Transferlah dengan nominal yang tepat tanpa dibulatkan atau ditambah biaya lainnya untuk mempermudah deteksi sistem otomatis.
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between shrink-0">
                            <button 
                                onClick={() => setCheckoutPlan(null)} 
                                disabled={verifying}
                                className="px-4 py-2.5 text-xs text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                            >
                                Batalkan
                            </button>
                            {!verifying && (
                                <button 
                                    onClick={handleVerifyPayment}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
                                >
                                    <span className="material-symbols-outlined text-sm">verified_user</span>
                                    Saya Sudah Membayar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
