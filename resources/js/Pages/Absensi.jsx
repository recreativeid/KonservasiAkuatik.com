import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';

export default function Absensi({ user, config, logs = [], staffs = [], today_log = null, history = [], today }) {
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const userName = user?.name || 'Staff';
    const isAdmin = user?.role === 'admin';

    // Admin state
    const [jamMasuk, setJamMasuk] = useState(config?.jam_masuk || '08:00:00');
    const [jamPulang, setJamPulang] = useState(config?.jam_pulang || '17:00:00');
    const [adminLoading, setAdminLoading] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [searchStaff, setSearchStaff] = useState('');

    // Staff state
    const [attendanceType, setAttendanceType] = useState('hadir'); // hadir or izin
    const [fotoFile, setFotoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [alasanIzin, setAlasanIzin] = useState('');
    const [staffLoading, setStaffLoading] = useState(false);

    // Selected proof photo modal
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Helper functions
    const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setAdminLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/absensi/config'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ jam_masuk: jamMasuk, jam_pulang: jamPulang })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.message || 'Gagal menyimpan konfigurasi.');
            }
        } catch (err) {
            alert('Kesalahan koneksi: ' + err.message);
        } finally {
            setAdminLoading(false);
        }
    };

    const handleCheckin = async (e) => {
        e.preventDefault();
        if (!fotoFile) {
            alert('Bukti foto sampai tempat kerja wajib diunggah.');
            return;
        }

        setStaffLoading(true);
        const formData = new FormData();
        formData.append('foto_masuk', fotoFile);

        try {
            const res = await fetch(getAppUrl('/api/absensi/checkin'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken(),
                    'Accept': 'application/json'
                },
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.message || 'Gagal melakukan absen masuk.');
            }
        } catch (err) {
            alert('Kesalahan: ' + err.message);
        } finally {
            setStaffLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!confirm('Apakah Anda yakin ingin absen pulang sekarang?')) return;
        setStaffLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/absensi/checkout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.message || 'Gagal melakukan absen pulang.');
            }
        } catch (err) {
            alert('Kesalahan: ' + err.message);
        } finally {
            setStaffLoading(false);
        }
    };

    const handlePermit = async (e) => {
        e.preventDefault();
        if (!alasanIzin.trim()) {
            alert('Keterangan alasan izin wajib diisi.');
            return;
        }
        setStaffLoading(true);
        try {
            const res = await fetch(getAppUrl('/api/absensi/permit'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ alasan_izin: alasanIzin })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.message || 'Gagal mengajukan izin.');
            }
        } catch (err) {
            alert('Kesalahan: ' + err.message);
        } finally {
            setStaffLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFotoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Filtered logs for admin
    const filteredLogs = logs.filter(log => {
        const matchesStaff = log.nama_staff.toLowerCase().includes(searchStaff.toLowerCase()) || 
                             log.username.toLowerCase().includes(searchStaff.toLowerCase());
        const matchesDate = filterDate ? log.tanggal === filterDate : true;
        return matchesStaff && matchesDate;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/absensi" />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-850">Absensi Staff</h1>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Pantau dan kelola kehadiran kru gerai Anda</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="text-right">
                                <span className="text-xs font-bold text-slate-700 block">{userName}</span>
                                <span className="text-[10px] text-slate-400 font-medium capitalize">{user.role}</span>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4361EE] to-[#3A56D4] flex items-center justify-center text-white font-bold text-xs uppercase shadow-md shadow-[#4361EE]/25">{userName.substring(0, 2)}</div>
                        </div>
                    </div>
                </header>

                <main className="p-8 space-y-6 overflow-y-auto flex-1">
                    {isAdmin ? (
                        /* ==================== ADMIN PANEL ==================== */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Settings (Left 4 cols) */}
                            <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-5">
                                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#4361EE]">schedule</span>
                                    <h3 className="font-extrabold text-sm text-slate-800">Atur Jam Kerja</h3>
                                </div>
                                <form onSubmit={handleSaveConfig} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jam Masuk Standar</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={jamMasuk}
                                            onChange={e => setJamMasuk(e.target.value)}
                                            placeholder="Contoh: 08:00:00"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition font-semibold"
                                        />
                                        <p className="text-[9px] text-slate-400 mt-1">Check-in lewat dari jam ini dicatat terlambat.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jam Pulang Standar</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={jamPulang}
                                            onChange={e => setJamPulang(e.target.value)}
                                            placeholder="Contoh: 17:00:00"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition font-semibold"
                                        />
                                        <p className="text-[9px] text-slate-400 mt-1">Check-out kurang dari jam ini dicatat pulang cepat.</p>
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={adminLoading}
                                        className="w-full bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-[#4361EE]/10 flex items-center justify-center gap-1.5"
                                    >
                                        {adminLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                        Simpan Perubahan
                                    </button>
                                </form>
                            </div>

                            {/* Reports list (Right 8 cols) */}
                            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                                    <h3 className="font-extrabold text-sm text-slate-800">Riwayat Kehadiran Staff</h3>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <input 
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white outline-none transition"
                                        />
                                        <input 
                                            type="text"
                                            value={searchStaff}
                                            onChange={e => setSearchStaff(e.target.value)}
                                            placeholder="Cari nama staff..."
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white outline-none transition w-40"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <th className="px-4 py-3">Tanggal</th>
                                                <th className="px-4 py-3">Nama Staff</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                                <th className="px-4 py-3">Jam Masuk</th>
                                                <th className="px-4 py-3">Jam Pulang</th>
                                                <th className="px-4 py-3 text-center">Foto Bukti</th>
                                                <th className="px-4 py-3">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-xs">
                                            {filteredLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-4 py-3.5 font-semibold text-slate-500">{log.tanggal}</td>
                                                    <td className="px-4 py-3.5 font-bold text-slate-800">{log.nama_staff}</td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase ${
                                                            log.status === 'hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                        }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {log.jam_masuk ? (
                                                            <div className="space-y-0.5">
                                                                <p className="font-extrabold text-slate-700">{log.jam_masuk}</p>
                                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                                    log.keterangan_masuk === 'terlambat' ? 'bg-red-55 text-red-500' : 'bg-emerald-55 text-emerald-500'
                                                                }`}>{log.keterangan_masuk}</span>
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {log.jam_pulang ? (
                                                            <div className="space-y-0.5">
                                                                <p className="font-extrabold text-slate-700">{log.jam_pulang}</p>
                                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                                    log.keterangan_pulang === 'cepat' ? 'bg-amber-55 text-amber-500' : 'bg-emerald-55 text-emerald-500'
                                                                }`}>{log.keterangan_pulang === 'cepat' ? 'pulang cepat' : 'tepat waktu'}</span>
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        {log.foto_masuk ? (
                                                            <button 
                                                                onClick={() => setSelectedPhoto(getAppUrl(log.foto_masuk))}
                                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border text-[9px] font-bold rounded-lg transition"
                                                            >
                                                                Lihat Foto
                                                            </button>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-medium text-slate-500 max-w-[150px] truncate">
                                                        {log.status === 'izin' ? log.alasan_izin : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                                                        Belum ada rekaman absensi hari ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ==================== STAFF / KASIR PANEL ==================== */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Attendance Action Box (Left 5 cols) */}
                            <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                                <div className="border-b pb-4">
                                    <span className="text-[9px] text-[#4361EE] bg-[#4361EE]/10 px-2.5 py-1 rounded-lg font-extrabold uppercase tracking-widest">{today}</span>
                                    <h2 className="text-base font-extrabold text-slate-800 mt-2">Pencatatan Absensi Hari Ini</h2>
                                </div>

                                {today_log ? (
                                    /* Already logged attendance */
                                    <div className="space-y-5">
                                        {today_log.status === 'hadir' ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-emerald-50/50 border border-emerald-250 rounded-2xl flex items-center gap-3.5">
                                                    <span className="material-symbols-outlined text-emerald-600 font-bold text-2xl">check_circle</span>
                                                    <div>
                                                        <h4 className="font-extrabold text-xs text-slate-800">Status Kehadiran: Hadir</h4>
                                                        <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Anda sudah absen masuk kerja.</p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-xs space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold">Jam Masuk</span>
                                                        <span className="font-extrabold text-slate-800">{today_log.jam_masuk}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400 font-bold">Keterangan Masuk</span>
                                                        <span className={`font-extrabold capitalize ${today_log.keterangan_masuk === 'terlambat' ? 'text-red-500' : 'text-emerald-500'}`}>{today_log.keterangan_masuk}</span>
                                                    </div>
                                                    {today_log.jam_pulang && (
                                                        <>
                                                            <div className="flex justify-between border-t border-slate-200/50 pt-2 mt-2">
                                                                <span className="text-slate-400 font-bold">Jam Pulang</span>
                                                                <span className="font-extrabold text-slate-800">{today_log.jam_pulang}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-400 font-bold">Keterangan Pulang</span>
                                                                <span className={`font-extrabold capitalize ${today_log.keterangan_pulang === 'cepat' ? 'text-amber-500' : 'text-emerald-500'}`}>{today_log.keterangan_pulang === 'cepat' ? 'Pulang Cepat' : 'Tepat Waktu'}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Uploaded Checkin Photo Preview */}
                                                {today_log.foto_masuk && (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wide">Foto Bukti Check-in</p>
                                                        <div className="w-full h-32 rounded-2xl overflow-hidden border border-slate-200">
                                                            <img src={getAppUrl(today_log.foto_masuk)} alt="Check-in Proof" className="w-full h-full object-cover" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Checkout action button */}
                                                {!today_log.jam_pulang && (
                                                    <button
                                                        onClick={handleCheckout}
                                                        disabled={staffLoading}
                                                        className="w-full bg-[#4361EE] hover:bg-[#3A56D4] disabled:bg-blue-300 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-[#4361EE]/10 flex items-center justify-center gap-1.5"
                                                    >
                                                        {staffLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                                        Absen Pulang (Check-out)
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            /* Izin */
                                            <div className="p-4 bg-amber-50/50 border border-amber-250 rounded-2xl flex items-center gap-3.5">
                                                <span className="material-symbols-outlined text-amber-600 font-bold text-2xl">description</span>
                                                <div>
                                                    <h4 className="font-extrabold text-xs text-slate-800">Status Kehadiran: Izin</h4>
                                                    <p className="text-[10px] text-amber-700 font-medium mt-0.5">Alasan: {today_log.alasan_izin}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Not checked in yet */
                                    <div className="space-y-5">
                                        <div className="flex bg-slate-100 p-0.5 rounded-xl">
                                            <button 
                                                onClick={() => setAttendanceType('hadir')}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                                                    attendanceType === 'hadir' ? 'bg-white text-[#4361EE] shadow-sm' : 'text-slate-450 hover:text-slate-700'
                                                }`}
                                            >
                                                Absen Hadir
                                            </button>
                                            <button 
                                                onClick={() => setAttendanceType('izin')}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                                                    attendanceType === 'izin' ? 'bg-white text-[#4361EE] shadow-sm' : 'text-slate-450 hover:text-slate-700'
                                                }`}
                                            >
                                                Ajukan Izin
                                            </button>
                                        </div>

                                        {attendanceType === 'hadir' ? (
                                            /* Hadir Form */
                                            <form onSubmit={handleCheckin} className="space-y-4">
                                                <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 text-[11px] text-blue-700 font-medium space-y-1">
                                                    <p className="font-bold flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">notifications</span> Jam Masuk Standar: {config.jam_masuk}
                                                    </p>
                                                    <p>Pemberitahuan: Anda wajib mengunggah bukti foto selfie sampai di tempat kerja agar kehadiran tercatat valid.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Unggah Foto Bukti Sampai Kerja</label>
                                                    
                                                    {previewUrl ? (
                                                        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200">
                                                            <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => { setFotoFile(null); setPreviewUrl(null); }}
                                                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">close</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition cursor-pointer relative bg-slate-50/50">
                                                            <input 
                                                                type="file" 
                                                                required
                                                                accept="image/*"
                                                                onChange={handleFileChange}
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                            />
                                                            <span className="material-symbols-outlined text-slate-350 text-3xl mb-1.5 block">add_a_photo</span>
                                                            <p className="text-xs font-bold text-slate-700">Ambil/Unggah Foto Selfie</p>
                                                            <p className="text-[10px] text-slate-400 mt-1">Maksimal resolusi file foto 4MB</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={staffLoading || !fotoFile}
                                                    className="w-full bg-[#4361EE] hover:bg-[#3A56D4] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-[#4361EE]/10 flex items-center justify-center gap-1.5"
                                                >
                                                    {staffLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                                    Absen Masuk (Check-in)
                                                </button>
                                            </form>
                                        ) : (
                                            /* Izin Form */
                                            <form onSubmit={handlePermit} className="space-y-4">
                                                <div className="bg-amber-50/50 border border-amber-250 rounded-2xl p-4 text-[11px] text-amber-700 font-medium">
                                                    Pemberitahuan: Izin kerja wajib memberikan keterangan tertulis alasan ketidakhadiran Anda secara jelas.
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Keterangan Alasan Izin</label>
                                                    <textarea 
                                                        required
                                                        rows={4}
                                                        value={alasanIzin}
                                                        onChange={e => setAlasanIzin(e.target.value)}
                                                        placeholder="Sebutkan alasan Anda mengajukan izin hari ini..."
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-3.5 text-xs focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none transition resize-none"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={staffLoading || !alasanIzin.trim()}
                                                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5"
                                                >
                                                    {staffLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                                    Kirim Permohonan Izin
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Attendance History (Right 7 cols) */}
                            <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                                <h3 className="font-extrabold text-sm text-slate-800">Riwayat Kehadiran Saya</h3>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="text-[10px] uppercase tracking-wider text-slate-450 border-b border-slate-100">
                                                <th className="py-2.5 font-bold">Tanggal</th>
                                                <th className="py-2.5 font-bold">Status</th>
                                                <th className="py-2.5 font-bold">Masuk</th>
                                                <th className="py-2.5 font-bold">Pulang</th>
                                                <th className="py-2.5">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {history.map(row => (
                                                <tr key={row.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="py-3 font-semibold text-slate-500">{row.tanggal}</td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                                            row.status === 'hadir' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                        }`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 font-bold text-slate-700">
                                                        {row.jam_masuk ? (
                                                            <div className="space-y-0.5">
                                                                <p>{row.jam_masuk}</p>
                                                                <span className={`text-[7px] font-bold px-1 py-0.2 rounded uppercase ${
                                                                    row.keterangan_masuk === 'terlambat' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                                                                }`}>{row.keterangan_masuk}</span>
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="py-3 font-bold text-slate-700">
                                                        {row.jam_pulang ? (
                                                            <div className="space-y-0.5">
                                                                <p>{row.jam_pulang}</p>
                                                                <span className={`text-[7px] font-bold px-1 py-0.2 rounded uppercase ${
                                                                    row.keterangan_pulang === 'cepat' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                                                                }`}>{row.keterangan_pulang === 'cepat' ? 'cepat' : 'tepat waktu'}</span>
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="py-3 font-semibold text-slate-450 max-w-[120px] truncate">
                                                        {row.status === 'izin' ? row.alasan_izin : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {history.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-slate-400">
                                                        Belum ada riwayat kehadiran.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Proof Photo Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="relative max-w-xl w-full bg-white rounded-3xl p-5 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-extrabold text-sm text-slate-800">Foto Bukti Absen Masuk</h3>
                            <button 
                                onClick={() => setSelectedPhoto(null)} 
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-650"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">close</span>
                            </button>
                        </div>
                        <div className="w-full h-[400px] rounded-2xl overflow-hidden border">
                            <img src={selectedPhoto} alt="Absensi Full Proof" className="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
