import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function Pengaturan({ qris, stats, notifSettings = {}, user }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const userName = user?.name || user?.nama || 'User';
    const [activeTab, setActiveTab] = useState(user.role === 'admin' ? 'qris' : 'printer');

    // QRIS state
    const [namaPemilik, setNamaPemilik] = useState(qris?.nama_pemilik || '');
    const [bankName, setBankName] = useState(qris?.bank_name || 'Bank Negara Indonesia (BNI)');
    const [noRekening, setNoRekening] = useState(qris?.no_rekening || '');
    const [tipeQris, setTipeQris] = useState(qris?.tipe_qris || 'statis');
    const [qrisString, setQrisString] = useState(qris?.qris_string || '');
    const [qrisImage, setQrisImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(qris?.image_path ? getAppUrl(qris.image_path) : null);
    const [loading, setLoading] = useState(false);

    // Password state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Printer state
    const [printerType, setPrinterType] = useState('bluetooth');
    const [printerConnected, setPrinterConnected] = useState(false);
    const [printerName, setPrinterName] = useState('');

    // Language state
    const [language, setLanguage] = useState('id');

    // Notification states
    const [notifPesananMasuk, setNotifPesananMasuk] = useState(notifSettings.notif_pesanan_masuk ?? true);
    const [notifPembayaranDiterima, setNotifPembayaranDiterima] = useState(notifSettings.notif_pembayaran_diterima ?? true);
    const [notifStokMenipis, setNotifStokMenipis] = useState(notifSettings.notif_stok_menipis ?? false);
    const [notifAbsensiKaryawan, setNotifAbsensiKaryawan] = useState(notifSettings.notif_absensi_karyawan ?? false);

    const handleToggleNotif = async (key, currentValue, setter) => {
        const newValue = !currentValue;
        setter(newValue); // Optimistic UI update

        // Build request payload with current states + updated value
        const payload = {
            notif_pesanan_masuk: key === 'pesanan_masuk' ? newValue : notifPesananMasuk,
            notif_pembayaran_diterima: key === 'pembayaran_diterima' ? newValue : notifPembayaranDiterima,
            notif_stok_menipis: key === 'stok_menipis' ? newValue : notifStokMenipis,
            notif_absensi_karyawan: key === 'absensi_karyawan' ? newValue : notifAbsensiKaryawan,
        };

        try {
            const res = await fetch(getAppUrl('/api/settings/update-notifications'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setter(currentValue); // Revert state if failed
                alert(data.message || 'Gagal menyimpan pengaturan notifikasi.');
            }
        } catch (err) {
            setter(currentValue); // Revert state
            alert('Kesalahan jaringan: ' + err.message);
        }
    };

    const bankOptions = [
        'Bank Negara Indonesia (BNI)', 'Bank Central Asia (BCA)', 'Bank Mandiri',
        'Bank Rakyat Indonesia (BRI)', 'LinkAja', 'GoPay', 'OVO', 'Dana', 'ShopeePay'
    ];

    const tabs = user.role === 'admin'
        ? [
            { id: 'qris', label: 'Pembayaran QRIS', icon: 'credit_card' },
            { id: 'printer', label: 'Printer POS', icon: 'print' },
            { id: 'security', label: 'Keamanan', icon: 'lock' },
            { id: 'notifications', label: 'Notifikasi', icon: 'notifications' },
        ]
        : [
            { id: 'printer', label: 'Printer POS', icon: 'print' },
            { id: 'security', label: 'Keamanan', icon: 'lock' },
        ];

    // ======== QRIS ========
    const handleQrisFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setQrisImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleQrisSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('nama_pemilik', namaPemilik);
        formData.append('bank_name', bankName);
        formData.append('no_rekening', noRekening);
        formData.append('tipe_qris', tipeQris);
        formData.append('qris_string', qrisString);
        if (qrisImage) formData.append('qris_image', qrisImage);

        try {
            const res = await fetch(getAppUrl('/api/qris-config/update'), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.message || 'Gagal menyimpan.');
            }
        } catch (err) { alert('Kesalahan: ' + err.message); }
        finally { setLoading(false); }
    };

    // ======== PASSWORD ========
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('Konfirmasi password tidak cocok.');
            return;
        }
        setPasswordLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/settings/change-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                setOldPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                alert(data.message || 'Gagal mengubah password.');
            }
        } catch (err) { alert('Kesalahan: ' + err.message); }
        finally { setPasswordLoading(false); }
    };

    // ======== PRINTER ========
    const connectBluetoothPrinter = async () => {
        try {
            if (!navigator.bluetooth) {
                alert('Browser Anda tidak mendukung Web Bluetooth API. Gunakan Chrome desktop.');
                return;
            }
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });
            setPrinterName(device.name || 'Bluetooth Printer');
            setPrinterConnected(true);
            alert('Printer Bluetooth "' + (device.name || 'Unknown') + '" berhasil tersambung!');
        } catch (err) {
            if (err.name !== 'NotFoundError') {
                alert('Gagal menyambungkan printer: ' + err.message);
            }
        }
    };

    const connectUsbPrinter = async () => {
        try {
            if (!navigator.usb) {
                alert('Browser Anda tidak mendukung Web USB API. Gunakan Chrome desktop.');
                return;
            }
            const device = await navigator.usb.requestDevice({ filters: [] });
            setPrinterName(device.productName || 'USB Printer');
            setPrinterConnected(true);
            alert('Printer USB "' + (device.productName || 'Unknown') + '" berhasil tersambung!');
        } catch (err) {
            if (err.name !== 'NotFoundError') {
                alert('Gagal menyambungkan printer: ' + err.message);
            }
        }
    };

    const testPrint = () => {
        const receiptWindow = window.open('', '_blank', 'width=300,height=500');
        receiptWindow.document.write(`
            <html><head><title>Test Print</title>
            <style>body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:10px;}
            .center{text-align:center;}.line{border-top:1px dashed #000;margin:6px 0;}</style></head>
            <body>
            <div class="center"><strong>== TEST PRINT ==</strong></div>
            <div class="center">CuanGO Thermal</div>
            <div class="line"></div>
            <div>Printer: ${printerName || 'Default'}</div>
            <div>Koneksi: ${printerType === 'bluetooth' ? 'Bluetooth' : 'USB'}</div>
            <div>Waktu: ${new Date().toLocaleString('id-ID')}</div>
            <div class="line"></div>
            <div class="center">✓ Printer berfungsi normal</div>
            <div class="center" style="margin-top:10px;font-size:10px;">--- Terima Kasih ---</div>
            <script>setTimeout(()=>{window.print();},500);</script>
            </body></html>
        `);
        receiptWindow.document.close();
    };

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition";
    const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5";

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/pengaturan" />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-850">Pengaturan Sistem</h1>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Konfigurasi pembayaran, printer, keamanan, dan bahasa</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-700">{userName}</span>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">{userName.substring(0, 2)}</div>
                    </div>
                </header>

                <main className="p-8 overflow-y-auto flex-1 max-w-5xl space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex gap-2 border-b border-slate-100 pb-0.5">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white border border-slate-200 border-b-white text-[#4361EE] shadow-sm -mb-[1px]'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ======== TAB: QRIS ======== */}
                    {activeTab === 'qris' && (
                        <form onSubmit={handleQrisSave} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="font-extrabold text-sm text-slate-850">Konfigurasi Pembayaran QRIS</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Nama Pemilik Rekening</label>
                                    <input type="text" value={namaPemilik} onChange={e => setNamaPemilik(e.target.value)} required className={inputClass} placeholder="Nama lengkap" />
                                </div>
                                <div>
                                    <label className={labelClass}>Bank / E-Wallet</label>
                                    <select value={bankName} onChange={e => setBankName(e.target.value)} className={inputClass}>
                                        {bankOptions.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Nomor Rekening</label>
                                    <input type="text" value={noRekening} onChange={e => setNoRekening(e.target.value)} required className={inputClass} placeholder="1234567890" />
                                </div>
                                <div>
                                    <label className={labelClass}>Tipe QRIS</label>
                                    <select value={tipeQris} onChange={e => setTipeQris(e.target.value)} className={inputClass}>
                                        <option value="statis">Statis (QR Code Tetap)</option>
                                        <option value="dinamis">Dinamis (Generate per Transaksi)</option>
                                    </select>
                                </div>
                            </div>

                            {tipeQris === 'statis' && (
                                <div>
                                    <label className={labelClass}>Upload Gambar QRIS</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                                        {previewImage ? (
                                            <img src={previewImage} alt="QRIS" className="w-48 h-48 object-contain mx-auto rounded-xl" />
                                        ) : (
                                            <div className="text-slate-400">
                                                <span className="material-symbols-outlined text-3xl mb-2 block">qr_code_2</span>
                                                <p className="text-[10px] font-bold">Unggah gambar QR Code QRIS Anda</p>
                                            </div>
                                        )}
                                        <label className="mt-3 inline-block cursor-pointer bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-bold transition">
                                            Pilih Gambar
                                            <input type="file" accept="image/*" onChange={handleQrisFileChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {tipeQris === 'dinamis' && (
                                <div>
                                    <label className={labelClass}>QRIS String (Payload)</label>
                                    <textarea value={qrisString} onChange={e => setQrisString(e.target.value)} rows={3} className={inputClass + " resize-none"} placeholder="0002010102..." />
                                </div>
                            )}

                            {stats && (
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="bg-blue-50/50 rounded-2xl p-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total Scan QRIS</p>
                                        <h3 className="text-xl font-extrabold text-[#4361EE] mt-1">{stats.total_scan}</h3>
                                    </div>
                                    <div className="bg-green-50/50 rounded-2xl p-4">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Volume Transaksi QRIS</p>
                                        <h3 className="text-xl font-extrabold text-green-600 mt-1">Rp {(stats.total_volume || 0).toLocaleString('id-ID')}</h3>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={loading} className="px-6 py-3 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold rounded-xl text-xs shadow-md shadow-[#4361EE]/20 transition flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'save'}</span>
                                    {loading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ======== TAB: PRINTER ======== */}
                    {activeTab === 'printer' && (
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="font-extrabold text-sm text-slate-850">Koneksi Printer Thermal POS</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Hubungkan printer thermal receipt untuk mencetak struk kasir via Bluetooth atau kabel USB.</p>

                            {/* Connection Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setPrinterType('bluetooth')} className={`p-5 rounded-2xl border-2 transition text-center ${printerType === 'bluetooth' ? 'border-[#4361EE] bg-[#4361EE]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <span className="material-symbols-outlined text-2xl text-[#4361EE] mb-2 block">bluetooth</span>
                                    <h4 className="text-xs font-bold text-slate-800">Bluetooth</h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">Nirkabel / Wireless</p>
                                </button>
                                <button onClick={() => setPrinterType('usb')} className={`p-5 rounded-2xl border-2 transition text-center ${printerType === 'usb' ? 'border-[#4361EE] bg-[#4361EE]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <span className="material-symbols-outlined text-2xl text-[#4361EE] mb-2 block">usb</span>
                                    <h4 className="text-xs font-bold text-slate-800">USB / Kabel</h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">Koneksi langsung</p>
                                </button>
                            </div>

                            {/* Status */}
                            <div className={`p-4 rounded-2xl flex items-center gap-3 ${printerConnected ? 'bg-green-50 border border-green-100' : 'bg-slate-50 border border-slate-200'}`}>
                                <span className={`material-symbols-outlined text-lg ${printerConnected ? 'text-green-500' : 'text-slate-400'}`}>
                                    {printerConnected ? 'check_circle' : 'print_disabled'}
                                </span>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">{printerConnected ? `Tersambung: ${printerName}` : 'Printer Belum Tersambung'}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">{printerConnected ? `Mode: ${printerType === 'bluetooth' ? 'Bluetooth' : 'USB'}` : 'Klik tombol di bawah untuk menyambungkan'}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={printerType === 'bluetooth' ? connectBluetoothPrinter : connectUsbPrinter}
                                    className="px-5 py-2.5 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold rounded-xl text-xs shadow-md shadow-[#4361EE]/20 transition flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">{printerType === 'bluetooth' ? 'bluetooth_searching' : 'usb'}</span>
                                    Sambungkan {printerType === 'bluetooth' ? 'Bluetooth' : 'USB'}
                                </button>
                                {printerConnected && (
                                    <button onClick={testPrint} className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs transition flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                                        Test Print
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ======== TAB: SECURITY ======== */}
                    {activeTab === 'security' && (
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="font-extrabold text-sm text-slate-850">Ubah Password Akun</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Password lama harus diverifikasi sebelum Anda dapat mengatur password baru.</p>

                            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                                <div>
                                    <label className={labelClass}>Password Lama (Verifikasi)</label>
                                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className={inputClass} placeholder="Masukkan password lama Anda" />
                                </div>
                                <div>
                                    <label className={labelClass}>Password Baru</label>
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className={inputClass} placeholder="Minimal 6 karakter" />
                                </div>
                                <div>
                                    <label className={labelClass}>Konfirmasi Password Baru</label>
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClass} placeholder="Ketik ulang password baru" />
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-red-500 text-[10px] font-bold mt-1">⚠ Password tidak cocok</p>
                                    )}
                                </div>
                                <button type="submit" disabled={passwordLoading} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 transition flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">{passwordLoading ? 'sync' : 'lock_reset'}</span>
                                    {passwordLoading ? 'Memproses...' : 'Ubah Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ======== TAB: NOTIFICATIONS ======== */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            {/* Notifications */}
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                                <h3 className="font-extrabold text-sm text-slate-850">Pengaturan Notifikasi Sistem</h3>
                                <p className="text-[11px] text-slate-450 font-medium">Lacak event dan alert penting sistem kasir dan operasional Anda.</p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Notifikasi pesanan masuk baru', desc: 'Bunyi notifikasi saat ada pesanan baru dari pembeli', key: 'pesanan_masuk', value: notifPesananMasuk, setter: setNotifPesananMasuk },
                                        { label: 'Notifikasi pembayaran diterima', desc: 'Alert saat pembayaran berhasil diverifikasi', key: 'pembayaran_diterima', value: notifPembayaranDiterima, setter: setNotifPembayaranDiterima },
                                        { label: 'Notifikasi stok bahan baku menipis', desc: 'Peringatan otomatis saat stok di bawah safety stock', key: 'stok_menipis', value: notifStokMenipis, setter: setNotifStokMenipis },
                                        { label: 'Notifikasi absensi karyawan', desc: 'Pemberitahuan ketika karyawan absen masuk/pulang', key: 'absensi_karyawan', value: notifAbsensiKaryawan, setter: setNotifAbsensiKaryawan },
                                    ].map((notif, i) => (
                                        <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-700">{notif.label}</h4>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{notif.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={notif.value} 
                                                    onChange={() => handleToggleNotif(notif.key, notif.value, notif.setter)}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#4361EE] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:shadow-sm"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
