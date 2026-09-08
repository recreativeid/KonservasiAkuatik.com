import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Components/Sidebar';
import WilayahSelector from '../Components/WilayahSelector';

export default function ProfilToko({ user, toko }) {
    const [namaToko, setNamaToko] = useState(toko?.nama_toko || '');
    const [deskripsi, setDeskripsi] = useState(toko?.deskripsi || '');
    const [alamat, setAlamat] = useState(toko?.alamat || '');
    const [provinsi, setProvinsi] = useState(toko?.provinsi || '');
    const [kota, setKota] = useState(toko?.kota || '');
    const [kecamatan, setKecamatan] = useState(toko?.kecamatan || '');
    const [kelurahan, setKelurahan] = useState(toko?.kelurahan || '');
    const [latitude, setLatitude] = useState(toko?.latitude || '-6.175392');
    const [longitude, setLongitude] = useState(toko?.longitude || '106.827153');
    const [jamBuka, setJamBuka] = useState(toko?.jam_buka || '08:00');
    const [jamTutup, setJamTutup] = useState(toko?.jam_tutup || '22:00');
    const [isActive, setIsActive] = useState(toko?.is_active === 1 || toko?.is_active === true);

    // Branding Files
    const [logoFile, setLogoFile] = useState(null);
    const [sampulFile, setSampulFile] = useState(null);
    
    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    const [logoPreview, setLogoPreview] = useState(toko?.logo ? getAppUrl(toko.logo) : null);
    const [sampulPreview, setSampulPreview] = useState(toko?.foto_sampul ? getAppUrl(toko.foto_sampul) : null);

    // State for Cropping Cover Image
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [tempCropSrc, setTempCropSrc] = useState('');
    const [cropZoom, setCropZoom] = useState(1);
    const [cropOffsetX, setCropOffsetX] = useState(0);
    const [cropOffsetY, setCropOffsetY] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [useLeaflet, setUseLeaflet] = useState(() => typeof window !== 'undefined' && !!window.L);

    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const imageRef = useRef(null);

    const leafletMapRef = useRef(null);
    const leafletMarkerRef = useRef(null);

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.address) {
                const addr = data.address;
                
                // Construct detailed street address
                const road = addr.road || addr.suburb || addr.neighbourhood || addr.village || '';
                const houseNumber = addr.house_number ? ' No. ' + addr.house_number : '';
                setAlamat(road ? (road + houseNumber) : (data.display_name.split(',').slice(0, 3).join(', ')));
                
                // Set kelurahan
                setKelurahan(addr.village || addr.suburb || addr.neighbourhood || addr.municipality || '');
                
                // Set kecamatan
                setKecamatan(addr.city_district || addr.district || addr.county || '');
                
                // Set kota / kabupaten
                setKota(addr.city || addr.regency || addr.town || '');
                
                // Set provinsi
                setProvinsi(addr.state || addr.province || addr.region || '');
            }
        } catch (err) {
            console.error("Gagal mendeteksi alamat:", err);
        }
    };

    // Initialize Leaflet Map
    useEffect(() => {
        if (!useLeaflet || !window.L) {
            return;
        }

        const lat = parseFloat(latitude) || -6.175392;
        const lng = parseFloat(longitude) || 106.827153;

        const container = document.getElementById('toko-map');
        if (!container) return;

        // Clear existing map instance if any
        if (leafletMapRef.current) {
            leafletMapRef.current.remove();
        }

        // Initialize map
        const map = window.L.map('toko-map').setView([lat, lng], 15);
        leafletMapRef.current = map;

        // Load open street map tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Customize marker pin with CSS
        const pinIcon = window.L.divIcon({
            html: `<div style="background-color: #2563EB; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
            className: 'custom-leaflet-pin',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Place draggable marker
        const marker = window.L.marker([lat, lng], {
            draggable: true,
            icon: pinIcon
        }).addTo(map);
        leafletMarkerRef.current = marker;

        // Dragend marker updates inputs
        marker.on('dragend', () => {
            const position = marker.getLatLng();
            setLatitude(position.lat.toFixed(6));
            setLongitude(position.lng.toFixed(6));
            reverseGeocode(position.lat, position.lng);
        });

        // Click map updates marker & inputs
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            setLatitude(lat.toFixed(6));
            setLongitude(lng.toFixed(6));
            reverseGeocode(lat, lng);
        });

        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, [useLeaflet]);

    // Center map & marker when coords state changes
    useEffect(() => {
        if (leafletMapRef.current && leafletMarkerRef.current) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                const newLatLng = [lat, lng];
                leafletMarkerRef.current.setLatLng(newLatLng);
                leafletMapRef.current.setView(newLatLng, leafletMapRef.current.getZoom() || 15);
            }
        }
    }, [latitude, longitude]);


    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSampulFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setTempCropSrc(reader.result);
                setCropZoom(1);
                setCropOffsetX(0);
                setCropOffsetY(0);
                setIsCropOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const applyCrop = () => {
        const img = imageRef.current;
        if (!img) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Define cropped image target size (16:9 banner)
        canvas.width = 800;
        canvas.height = 450;

        // Calculate source rectangle based on zoom and offsets
        const sWidth = img.naturalWidth / cropZoom;
        const sHeight = img.naturalHeight / cropZoom;
        const sX = (img.naturalWidth - sWidth) / 2 + (cropOffsetX * (img.naturalWidth / 100));
        const sY = (img.naturalHeight - sHeight) / 2 + (cropOffsetY * (img.naturalHeight / 100));

        ctx.drawImage(
            img,
            Math.max(0, sX),
            Math.max(0, sY),
            Math.min(img.naturalWidth, sWidth),
            Math.min(img.naturalHeight, sHeight),
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'cropped_cover.jpg', { type: 'image/jpeg' });
                setSampulFile(file);
                setSampulPreview(URL.createObjectURL(blob));
                setIsCropOpen(false);
            }
        }, 'image/jpeg', 0.85);
    };

    const removeSampul = () => {
        if (confirm('Apakah Anda yakin ingin menghapus foto sampul?')) {
            setSampulFile(null);
            setSampulPreview(null);
            // Append flag to delete on submit
        }
    };

    const handleWilayahChange = ({ provinsi, kota, kecamatan, kelurahan }) => {
        setProvinsi(provinsi);
        setKota(kota);
        setKecamatan(kecamatan);
        setKelurahan(kelurahan);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        const formData = new FormData();
        formData.append('nama_toko', namaToko);
        formData.append('deskripsi', deskripsi);
        formData.append('alamat', alamat);
        formData.append('kota', kota);
        formData.append('provinsi', provinsi);
        formData.append('kecamatan', kecamatan);
        formData.append('kelurahan', kelurahan);
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);
        formData.append('jam_buka', jamBuka);
        formData.append('jam_tutup', jamTutup);
        formData.append('is_active', isActive ? '1' : '0');

        if (logoFile) {
            formData.append('logo_file', logoFile);
        }
        if (sampulFile) {
            formData.append('sampul_file', sampulFile);
        } else if (sampulPreview === null) {
            // Flag to remove sampul
            formData.append('remove_sampul', '1');
        }

        try {
            const res = await fetch(getAppUrl('/api/toko/update'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSuccessMsg('Profil Toko berhasil diperbarui!');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setError(data.message || 'Gagal memperbarui profil toko.');
            }
        } catch (e) {
            setError('Terjadi kesalahan jaringan: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGetGPS = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6);
                    const lng = position.coords.longitude.toFixed(6);
                    setLatitude(lat);
                    setLongitude(lng);
                    alert('Koordinat GPS berhasil diperoleh!');
                },
                (err) => {
                    console.warn("GPS failed, trying IP fallback...", err.message);
                    fetch('https://ipapi.co/json/')
                        .then(res => res.json())
                        .then(data => {
                            if (data.latitude && data.longitude) {
                                setLatitude(data.latitude.toFixed(6));
                                setLongitude(data.longitude.toFixed(6));
                                alert('Mendeteksi lokasi berdasarkan alamat IP Internet Anda:\nLatitude: ' + data.latitude + '\nLongitude: ' + data.longitude + '\n\nTips: Anda juga bisa menyeret pin biru pada peta atau mengklik langsung peta untuk menempatkan titik presisi.');
                            } else {
                                alert('Gagal mendeteksi lokasi: ' + err.message + '\n\nSilakan klik peta secara manual untuk menempatkan lokasi.');
                            }
                        })
                        .catch(() => {
                            alert('Gagal mendeteksi lokasi: ' + err.message + '\n\nSilakan klik peta secara manual untuk menempatkan lokasi.');
                        });
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            alert('Browser Anda tidak mendukung Geolocation API.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex select-none">
            <Sidebar user={user} activePage="/profil-toko" />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                    <h2 className="font-extrabold text-base text-slate-850">Pengaturan Profil Toko / UMKM</h2>
                </header>

                <main className="p-8 overflow-y-auto flex-1 max-w-5xl space-y-6">
                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 text-red-650 text-xs font-bold border border-red-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span> {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-650 text-xs font-bold border border-emerald-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span> {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        {/* Visual Branding Card */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                            <h3 className="font-extrabold text-sm text-slate-850 mb-4">Branding Visual</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Logo Uploader */}
                                <div className="md:col-span-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 relative min-h-[160px]">
                                    {logoPreview ? (
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden border">
                                            <img src={logoPreview} alt="Logo Toko" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-450 border border-slate-200">
                                            <span className="material-symbols-outlined text-2xl">store</span>
                                        </div>
                                    )}
                                    <label className="mt-3 cursor-pointer bg-[#4361EE]/10 text-[#4361EE] hover:bg-[#4361EE]/20 px-3 py-1.5 rounded-xl text-[10px] font-bold transition">
                                        Pilih Logo
                                        <input type="file" onChange={handleLogoChange} accept="image/*" className="hidden" />
                                    </label>
                                </div>

                                {/* Sampul Uploader with Crop / Delete CRUD options */}
                                <div className="md:col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 relative min-h-[160px] bg-slate-50/50">
                                    {sampulPreview ? (
                                        <div className="w-full relative rounded-xl overflow-hidden border">
                                            <img src={sampulPreview} alt="Foto Sampul" className="w-full h-28 object-cover" />
                                            <button 
                                                type="button"
                                                onClick={removeSampul}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition shadow-md"
                                                title="Hapus Foto Sampul"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <span className="material-symbols-outlined text-3xl mb-1 block">image</span>
                                            <span className="text-[10px] font-bold block">Belum ada Foto Sampul</span>
                                        </div>
                                    )}
                                    <label className="mt-3 cursor-pointer bg-[#4361EE] hover:bg-[#3A56D4] text-white px-4 py-2 rounded-xl text-[10px] font-bold transition flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">crop_original</span>
                                        Unggah & Potong Sampul
                                        <input type="file" onChange={handleSampulFileSelect} accept="image/*" className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Status Operasional Toko */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-sm text-slate-850">Status Operasional Toko</h3>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {isActive 
                                        ? 'Toko berstatus BUKA. Pelanggan dapat melihat menu dan melakukan pemesanan.' 
                                        : 'Toko berstatus TUTUP. Pelanggan tidak dapat mengirimkan pesanan.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`px-4 py-2 rounded-2xl text-[10px] font-bold transition flex items-center gap-1.5 shadow-sm border ${
                                    isActive 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' 
                                        : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    {isActive ? 'storefront' : 'storefront_off'}
                                </span>
                                <span>{isActive ? 'BUKA' : 'TUTUP'}</span>
                            </button>
                        </div>

                        {/* Detail Informasi */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-sm text-slate-850 mb-1">Informasi Dasar Toko</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Nama Toko / UMKM</label>
                                    <input 
                                        type="text" 
                                        value={namaToko} 
                                        onChange={e => setNamaToko(e.target.value)} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Jam Buka</label>
                                        <input 
                                            type="time" 
                                            value={jamBuka} 
                                            onChange={e => setJamBuka(e.target.value)} 
                                            required 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Jam Tutup</label>
                                        <input 
                                            type="time" 
                                            value={jamTutup} 
                                            onChange={e => setJamTutup(e.target.value)} 
                                            required 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cascading Wilayah Selector */}
                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[#4361EE] text-sm">map</span>
                                    Wilayah Administratif (Seluruh Indonesia)
                                </h4>
                                <WilayahSelector 
                                    initialProvinsi={provinsi}
                                    initialKota={kota}
                                    initialKecamatan={kecamatan}
                                    initialKelurahan={kelurahan}
                                    onChange={handleWilayahChange}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Deskripsi Toko / Slogan</label>
                                <textarea 
                                    value={deskripsi} 
                                    onChange={e => setDeskripsi(e.target.value)} 
                                    rows="2"
                                    placeholder="Jelaskan mengenai menu andalan toko Anda..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Alamat Lengkap (Jalan / Nomor / Gedung)</label>
                                <textarea 
                                    value={alamat} 
                                    onChange={e => setAlamat(e.target.value)} 
                                    rows="3"
                                    placeholder="Jl. Raya Indah No. 123..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition resize-none"
                                />
                            </div>
                        </div>

                        {/* GPS Koordinat & Interactive Leaflet Map */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-850 mb-0.5">Titik Koordinat & Peta Maps</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Klik pada peta atau geser pin marker untuk menentukan titik lokasi presisi toko Anda.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleGetGPS}
                                    className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold transition hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[14px]">my_location</span> Deteksi GPS Saya
                                </button>
                            </div>

                             <div className="w-full h-80 rounded-2xl border border-slate-200 relative z-10 overflow-hidden bg-slate-100">
                                 {useLeaflet ? (
                                     <div id="toko-map" className="w-full h-full" />
                                 ) : (
                                     <iframe
                                         title="Peta Lokasi Toko"
                                         width="100%"
                                         height="100%"
                                         style={{ border: 0 }}
                                         loading="lazy"
                                         referrerPolicy="no-referrer-when-downgrade"
                                         src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                                     />
                                 )}
                             </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Latitude</label>
                                    <input 
                                        type="number" 
                                        step="0.000001"
                                        value={latitude} 
                                        onChange={e => setLatitude(e.target.value)} 
                                        placeholder="-6.175392"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Longitude</label>
                                    <input 
                                        type="number" 
                                        step="0.000001"
                                        value={longitude} 
                                        onChange={e => setLongitude(e.target.value)} 
                                        placeholder="106.827153"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="px-8 py-3.5 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#4361EE]/20 transition flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'save'}</span>
                                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </main>
            </div>

            {/* CROP MODAL */}
            {isCropOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="font-extrabold text-sm text-slate-800">Sesuaikan Gambar Sampul (Rasio 16:9)</h3>
                            <button onClick={() => setIsCropOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-450"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>

                        <div className="relative bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center p-4 min-h-[300px]">
                            <img 
                                ref={imageRef}
                                src={tempCropSrc} 
                                alt="Untuk dipotong" 
                                className="max-h-[340px] max-w-full object-contain transition-transform" 
                                style={{
                                    transform: `scale(${cropZoom}) translate(${cropOffsetX}px, ${cropOffsetY}px)`
                                }}
                            />
                            {/* Target Crop Area Box Indicator */}
                            <div className="absolute border-2 border-dashed border-[#4361EE] pointer-events-none w-[320px] h-[180px] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                        </div>

                        {/* Sliders */}
                        <div className="space-y-3.5 pt-2">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-450 uppercase mb-1">
                                    <span>Skala Perbesar (Zoom)</span>
                                    <span>{cropZoom.toFixed(1)}x</span>
                                </div>
                                <input type="range" min="1" max="3" step="0.1" value={cropZoom} onChange={e => setCropZoom(parseFloat(e.target.value))} className="w-full accent-[#4361EE]" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Geser X (Horizontal)</label>
                                    <input type="range" min="-50" max="50" step="1" value={cropOffsetX} onChange={e => setCropOffsetX(parseInt(e.target.value))} className="w-full accent-[#4361EE]" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Geser Y (Vertikal)</label>
                                    <input type="range" min="-50" max="50" step="1" value={cropOffsetY} onChange={e => setCropOffsetY(parseInt(e.target.value))} className="w-full accent-[#4361EE]" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t pt-3">
                            <button type="button" onClick={() => setIsCropOpen(false)} className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl text-xs transition">Batal</button>
                            <button type="button" onClick={applyCrop} className="px-6 py-2.5 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold rounded-xl text-xs transition flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">crop</span> Potong & Gunakan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
