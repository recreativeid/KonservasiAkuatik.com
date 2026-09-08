import React, { useState, useEffect, useRef } from 'react';
import WilayahSelector from '../Components/WilayahSelector';

export default function PembeliExplore() {
    const [search, setSearch] = useState('');
    const [provinsi, setProvinsi] = useState('');
    const [kota, setKota] = useState('');
    const [kecamatan, setKecamatan] = useState('');
    const [kelurahan, setKelurahan] = useState('');

    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [mapSearchLoading, setMapSearchLoading] = useState(false);
    const [mapSearchSuggestions, setMapSearchSuggestions] = useState([]);
    const [selectedRadius, setSelectedRadius] = useState(10);

    const [tokos, setTokos] = useState([]);
    const [nearbyTokos, setNearbyTokos] = useState([]);
    const [gpsEnabled, setGpsEnabled] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [hasAttemptedGps, setHasAttemptedGps] = useState(false);

    // Coordinates for center / user location search pin (Default: Monas Jakarta)
    const [userLat, setUserLat] = useState(-6.175392);
    const [userLng, setUserLng] = useState(106.827153);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [storeSuggestions, setStoreSuggestions] = useState([]);

    useEffect(() => {
        if (search.trim().length > 0) {
            const filtered = tokos.filter(t => 
                t.nama_toko.toLowerCase().includes(search.toLowerCase())
            );
            setStoreSuggestions(filtered.slice(0, 8));
        } else {
            setStoreSuggestions([]);
        }
    }, [search, tokos]);

    useEffect(() => {
        if (!mapSearchQuery || mapSearchQuery.length < 2) {
            setMapSearchSuggestions([]);
            return;
        }
        const matches = tokos.filter(t => 
            t.nama_toko.toLowerCase().includes(mapSearchQuery.toLowerCase())
        ).map(t => ({
            type: 'store',
            label: `${t.nama_toko}`,
            data: t
        }));
        setMapSearchSuggestions(matches.slice(0, 5));
    }, [mapSearchQuery, tokos]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.L) {
            setLeafletLoaded(true);
        } else {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.L) {
                    setLeafletLoaded(true);
                    clearInterval(interval);
                } else if (attempts > 30) {
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    const exploreMapRef = useRef(null);
    const exploreUserMarkerRef = useRef(null);
    const exploreStoreMarkersRef = useRef([]);

    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    // Ask for Geolocation on mount
    useEffect(() => {
        requestLocation();
        handleSearch();
    }, []);

    const fetchNearbyByCoords = async (lat, lng) => {
        try {
            const res = await fetch(getAppUrl(`/api/toko/nearby?lat=${lat}&lng=${lng}`));
            const data = await res.json();
            if (res.ok && data.success) {
                setNearbyTokos(data.tokos || []);
            }
        } catch (e) {
            console.error("Gagal memuat toko terdekat: ", e);
        }
    };

    const getIpFallbackLocation = async () => {
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData.latitude && ipData.longitude) {
                setUserLat(ipData.latitude);
                setUserLng(ipData.longitude);
                setGpsEnabled(true);
                setGpsLoading(false);
                setHasAttemptedGps(true);
                await fetchNearbyByCoords(ipData.latitude, ipData.longitude);
            } else {
                throw new Error('Invalid IP geo response');
            }
        } catch (err) {
            console.warn("IP fallback geo failed:", err);
            setGpsEnabled(false);
            setGpsLoading(false);
            setHasAttemptedGps(true);
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            // No geolocation API, try IP fallback
            setGpsLoading(true);
            getIpFallbackLocation();
            return;
        }

        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setUserLat(lat);
                setUserLng(lng);
                setGpsEnabled(true);
                setGpsLoading(false);
                setHasAttemptedGps(true);
                await fetchNearbyByCoords(lat, lng);
            },
            (err) => {
                console.warn("Akses lokasi ditolak, mencoba IP fallback: ", err.message);
                // Fallback to IP-based location
                getIpFallbackLocation();
            },
            { timeout: 8000, maximumAge: 60000 }
        );
    };

    // Initialize Leaflet Map
    useEffect(() => {
        if (!leafletLoaded || !window.L) return;

        const container = document.getElementById('explore-map');
        if (!container) return;

        // Clear existing map instance if any
        if (exploreMapRef.current) {
            exploreMapRef.current.remove();
        }

        // Initialize map centered at current coordinates
        const map = window.L.map('explore-map').setView([userLat, userLng], 13);
        exploreMapRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom User Pin Icon (Blue circle with pulsing wave)
        const userIcon = window.L.divIcon({
            html: `<div style="background-color: #2563EB; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(37,99,235,0.6); position: relative; margin: -7px 0 0 -7px;"><div style="position: absolute; top: -5px; left: -5px; width: 18px; height: 18px; border-radius: 50%; background-color: rgba(37,99,235,0.2); border: 1px solid rgba(37,99,235,0.4);"></div></div>`,
            className: 'custom-leaflet-user-pin',
            iconSize: [20, 20],
            iconAnchor: [0, 0]
        });

        // Draggable User Marker
        const userMarker = window.L.marker([userLat, userLng], {
            draggable: true,
            icon: userIcon
        }).addTo(map);
        userMarker.bindPopup("<b>Posisi Anda (Geser pin atau klik peta untuk ubah area)</b>").openPopup();
        exploreUserMarkerRef.current = userMarker;

        // Dragend updates coordinates & refetches
        userMarker.on('dragend', async () => {
            const pos = userMarker.getLatLng();
            setUserLat(pos.lat);
            setUserLng(pos.lng);
            await fetchNearbyByCoords(pos.lat, pos.lng);
        });

        // Click map updates user marker & refetches
        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            userMarker.setLatLng([lat, lng]);
            setUserLat(lat);
            setUserLng(lng);
            await fetchNearbyByCoords(lat, lng);
        });

        return () => {
            if (exploreMapRef.current) {
                exploreMapRef.current.remove();
                exploreMapRef.current = null;
            }
        };
    }, [leafletLoaded]);

    // Center map & marker when coordinates change externally
    useEffect(() => {
        if (exploreMapRef.current && exploreUserMarkerRef.current) {
            const newLatLng = [userLat, userLng];
            exploreUserMarkerRef.current.setLatLng(newLatLng);
            exploreMapRef.current.setView(newLatLng, exploreMapRef.current.getZoom() || 13);
        }
    }, [userLat, userLng]);

    // Render Store Pins on the Map
    useEffect(() => {
        if (!exploreMapRef.current || !window.L) return;

        // Clear old store markers
        exploreStoreMarkersRef.current.forEach(m => m.remove());
        exploreStoreMarkersRef.current = [];

        // Pin icon for outlets
        const storeIcon = window.L.divIcon({
            html: `<div style="background-color: #EF4444; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(239,68,68,0.6); position: relative; margin: -7px 0 0 -7px;"></div>`,
            className: 'custom-leaflet-store-pin',
            iconSize: [20, 20],
            iconAnchor: [0, 0]
        });

        const displayTokos = nearbyTokos.length > 0 ? nearbyTokos : tokos;

        displayTokos.forEach(toko => {
            const lat = parseFloat(toko.latitude);
            const lng = parseFloat(toko.longitude);
            if (isNaN(lat) || isNaN(lng)) return;

            const marker = window.L.marker([lat, lng], { icon: storeIcon })
                .addTo(exploreMapRef.current);

            // Construct detailed address details
            const detailAlamat = [
                toko.alamat,
                toko.kelurahan ? `Kel. ${toko.kelurahan}` : null,
                toko.kecamatan ? `Kec. ${toko.kecamatan}` : null,
                toko.kota ? toko.kota : null,
                toko.provinsi ? toko.provinsi : null
            ].filter(Boolean).join(', ');

            const popupContent = `
                <div style="font-family: sans-serif; font-size: 11px; padding: 4px; min-width: 180px; max-width: 240px; line-height: 1.4;">
                    <b style="font-size: 12px; color: #1E293B; display: block; margin-bottom: 3px;">${toko.nama_toko}</b>
                    <span style="color: #475569; display: block; margin-bottom: 6px; font-weight: 500;">📍 ${detailAlamat || 'Lokasi Toko'}</span>
                    <span style="color: #64748B; font-size: 10px; display: block; margin-bottom: 8px;">Jarak: ${toko.distance ? parseFloat(toko.distance).toFixed(2) + ' km' : '-'}</span>
                    <a href="${getAppUrl(`/pembeli/toko/${toko.id}`)}" style="display: block; text-align: center; background-color: #2563EB; color: white; text-decoration: none; padding: 6px; border-radius: 8px; font-weight: bold; transition: background-color 0.2s;">Pesan Sekarang</a>
                </div>
            `;
            marker.bindPopup(popupContent);
            exploreStoreMarkersRef.current.push(marker);
        });
    }, [nearbyTokos, tokos]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoadingSearch(true);
        try {
            const queryParams = new URLSearchParams({
                search,
                provinsi,
                kota,
                kecamatan,
                kelurahan
            });
            const res = await fetch(getAppUrl(`/api/toko/search?${queryParams.toString()}`));
            const data = await res.json();
            if (res.ok && data.success) {
                setTokos(data.tokos || []);
            }
        } catch (e) {
            console.error("Gagal mencari toko: ", e);
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleMapSearch = async (e) => {
        if (e) e.preventDefault();
        if (!mapSearchQuery.trim()) return;
        setMapSearchLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(mapSearchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setUserLat(lat);
                setUserLng(lng);
                setGpsEnabled(true);
                setGpsLoading(false);
                setHasAttemptedGps(true);
                await fetchNearbyByCoords(lat, lng);
                alert(`Lokasi ditemukan: ${data[0].display_name}\n\nMenampilkan toko mitra terdekat di sekitar area ini.`);
            } else {
                alert('Alamat atau lokasi tidak ditemukan. Silakan masukkan kata kunci wilayah yang lebih spesifik.');
            }
        } catch (err) {
            console.error("Gagal geocoding:", err);
            alert('Gagal mencari alamat. Pastikan Anda terhubung ke internet.');
        } finally {
            setMapSearchLoading(false);
        }
    };

    const handleWilayahChange = ({ provinsi, kota, kecamatan, kelurahan }) => {
        setProvinsi(provinsi);
        setKota(kota);
        setKecamatan(kecamatan);
        setKelurahan(kelurahan);
    };

    const handleResetFilters = () => {
        setSearch('');
        setProvinsi('');
        setKota('');
        setKecamatan('');
        setKelurahan('');
        setTimeout(async () => {
            setLoadingSearch(true);
            try {
                const res = await fetch(getAppUrl('/api/toko/search'));
                const data = await res.json();
                if (res.ok && data.success) setTokos(data.tokos || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingSearch(false);
            }
        }, 100);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12 select-none">
            {/* Header / Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Cari & Temukan Toko UMKM</h1>
                        <p className="text-blue-100 text-xs mt-2 font-medium">Pesan kuliner dan minuman segar langsung dari merchant terdekat di wilayah Anda.</p>
                    </div>
                    <div>
                        <a href={getAppUrl('/login')} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md">
                            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span> Portal POS Merchant
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
                {/* Interactive map display */}
                {leafletLoaded && (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="font-extrabold text-sm text-slate-850 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#4361EE]">map</span>
                                    <span>Peta Toko Mitra di Sekitar Anda</span>
                                </h2>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    Cari lokasi/alamat Anda di peta, geser pin biru, atau klik peta untuk memindahkan area pencarian Anda.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <form onSubmit={handleMapSearch} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 focus-within:border-blue-500 transition">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                                        <input 
                                            type="text" 
                                            value={mapSearchQuery}
                                            onChange={e => setMapSearchQuery(e.target.value)}
                                            placeholder="Ketik nama toko / wilayah..."
                                            className="bg-transparent text-[10px] font-semibold outline-none w-36 sm:w-48 placeholder-slate-400"
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={mapSearchLoading}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg transition"
                                        >
                                            {mapSearchLoading ? 'Cari...' : 'Cari'}
                                        </button>
                                    </form>

                                    {mapSearchSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-[999] overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                                            {mapSearchSuggestions.map((sug, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={async () => {
                                                        setMapSearchQuery(sug.data.nama_toko);
                                                        setMapSearchSuggestions([]);
                                                        const lat = parseFloat(sug.data.latitude);
                                                        const lng = parseFloat(sug.data.longitude);
                                                        if (!isNaN(lat) && !isNaN(lng)) {
                                                            setUserLat(lat);
                                                            setUserLng(lng);
                                                            setGpsEnabled(true);
                                                            setGpsLoading(false);
                                                            setHasAttemptedGps(true);
                                                            await fetchNearbyByCoords(lat, lng);
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-[10px] font-bold hover:bg-blue-50/50 text-slate-700 transition flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-xs text-blue-500">store</span>
                                                    <span>{sug.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    type="button"
                                    onClick={requestLocation}
                                    className="px-3 py-2 bg-[#4361EE]/10 hover:bg-[#4361EE]/20 text-[#4361EE] rounded-xl text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                                >
                                    <span className="material-symbols-outlined text-xs">my_location</span> Deteksi GPS
                                </button>
                            </div>
                        </div>
                        <div id="explore-map" className="w-full rounded-2xl border border-slate-200 relative z-10 overflow-hidden bg-slate-100" style={{ height: '350px', minHeight: '350px' }} />
                    </div>
                )}

                {/* 1. Rekomendasi Terdekat (GPS) */}
                {gpsLoading && (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-slate-500">Mendeteksi koordinat GPS wilayah Anda...</span>
                    </div>
                )}

                {hasAttemptedGps && gpsEnabled && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-500">location_on</span>
                                <h2 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider">Rekomendasi Terdekat Anda</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Radius:</span>
                                <div className="flex bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                                    {[1, 5, 10].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setSelectedRadius(r)}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                selectedRadius === r 
                                                    ? 'bg-blue-600 text-white shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            {r} km
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {nearbyTokos.filter(t => (t.distance || 0) <= selectedRadius).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {nearbyTokos.filter(t => (t.distance || 0) <= selectedRadius).map(toko => (
                                    <a 
                                        href={getAppUrl(`/pembeli/toko/${toko.id}`)}
                                        key={toko.id} 
                                        className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between"
                                    >
                                        <div className="flex gap-4 items-start">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border bg-slate-50 flex items-center justify-center">
                                                {toko.logo ? (
                                                    <img src={getAppUrl(toko.logo)} alt={toko.nama_toko} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-400 text-xl">store</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-extrabold text-xs text-slate-850 truncate">{toko.nama_toko}</h3>
                                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{toko.alamat}</p>
                                                <p className="text-[9px] text-slate-400 font-medium truncate">
                                                    {toko.kelurahan ? `${toko.kelurahan}, ` : ''}
                                                    {toko.kecamatan ? `${toko.kecamatan}, ` : ''}
                                                    {toko.kota}
                                                </p>
                                                <p className="text-[10px] text-blue-600 font-bold mt-2 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">navigation</span>
                                                    {toko.distance ? `${toko.distance.toFixed(1)} km dari lokasi Anda` : 'Terdekat'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold text-slate-450">
                                            <span>🕒 {toko.jam_buka.substring(0,5)} - {toko.jam_tutup.substring(0,5)}</span>
                                            <span className="text-[#4361EE] flex items-center gap-0.5">Lihat Profil <span className="material-symbols-outlined text-[10px]">arrow_forward</span></span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 bg-amber-50 text-amber-800 border border-amber-100 rounded-3xl text-center space-y-2">
                                <span className="material-symbols-outlined text-2xl text-amber-600">storefront</span>
                                <p className="text-xs font-bold">Tidak ada toko mitra yang aktif dalam radius {selectedRadius} km terdekat Anda.</p>
                                <p className="text-[10px] text-amber-600/80 font-medium">Silakan coba pilih radius jangkauan yang lebih jauh atau ketik lokasi baru di pencarian peta.</p>
                            </div>
                        )}
                    </div>
                )}

                {hasAttemptedGps && !gpsEnabled && (
                    <div className="p-5 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 space-y-3">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-amber-500 mt-0.5">gps_off</span>
                            <div className="space-y-1.5">
                                <p className="text-xs font-bold">Deteksi Lokasi GPS Tidak Tersedia</p>
                                <p className="text-[10px] leading-relaxed font-medium text-amber-700">
                                    Browser Anda memblokir akses GPS karena koneksi tidak aman (HTTP). 
                                    Untuk mengaktifkan GPS otomatis, akses situs melalui <strong>HTTPS</strong> atau <strong>localhost</strong>.
                                </p>
                                <p className="text-[10px] leading-relaxed font-medium text-amber-700">
                                    Anda tetap bisa menemukan toko terdekat menggunakan <strong>filter wilayah (Provinsi/Kota/Kecamatan)</strong> di bawah ini.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 pl-8">
                            <button onClick={requestLocation} className="px-3.5 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-bold transition hover:bg-amber-700 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-xs">my_location</span> Coba Aktifkan GPS
                            </button>
                            <button onClick={() => document.getElementById('wilayah-filter')?.scrollIntoView({ behavior: 'smooth' })} className="px-3.5 py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-[10px] font-bold transition hover:bg-amber-50 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-xs">search</span> Cari Manual
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Form Pencarian & Sortir Wilayah */}
                <div id="wilayah-filter" className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                    <h2 className="font-extrabold text-sm text-slate-850 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">search</span> Cari Berdasarkan Wilayah
                    </h2>

                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-2 relative">
                                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Nama Toko</label>
                                <input 
                                    type="text" 
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Masukkan nama toko..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
                                />
                                {storeSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-[999] max-h-48 overflow-y-auto divide-y divide-slate-100">
                                        {storeSuggestions.map(toko => (
                                            <button
                                                key={toko.id}
                                                type="button"
                                                onClick={() => {
                                                    setSearch(toko.nama_toko);
                                                    setStoreSuggestions([]);
                                                    if (toko.latitude && toko.longitude) {
                                                        const lat = parseFloat(toko.latitude);
                                                        const lng = parseFloat(toko.longitude);
                                                        setUserLat(lat);
                                                        setUserLng(lng);
                                                        fetchNearbyByCoords(lat, lng);
                                                    }
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-xs text-slate-700 font-bold hover:bg-blue-50/50 flex items-center justify-between transition-colors"
                                            >
                                                <span>{toko.nama_toko}</span>
                                                <span className="text-[10px] text-slate-400 font-semibold">{toko.kota}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Filter Wilayah (Dropdown Bertingkat)</span>
                                <WilayahSelector
                                    initialProvinsi={provinsi}
                                    initialKota={kota}
                                    initialKecamatan={kecamatan}
                                    initialKelurahan={kelurahan}
                                    onChange={handleWilayahChange}
                                    compact={true}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={handleResetFilters}
                                className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-2xl text-xs font-bold transition"
                            >
                                Reset Filter
                            </button>
                            <button 
                                type="submit" 
                                disabled={loadingSearch}
                                className="px-6 py-2.5 bg-[#4361EE] hover:bg-[#3A56D4] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#4361EE]/20 transition flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">{loadingSearch ? 'sync' : 'search'}</span>
                                {loadingSearch ? 'Mencari...' : 'Cari Toko'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 3. Daftar Hasil Pencarian Toko */}
                {tokos.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider">Hasil Pencarian Toko ({tokos.length})</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tokos.map(toko => (
                                <a 
                                    href={getAppUrl(`/pembeli/toko/${toko.id}`)}
                                    key={toko.id} 
                                    className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] flex flex-col justify-between"
                                >
                                    <div className="flex gap-4 items-start">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border bg-slate-50 flex items-center justify-center">
                                            {toko.logo ? (
                                                <img src={getAppUrl(toko.logo)} alt={toko.nama_toko} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-450 text-xl">store</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-extrabold text-xs text-slate-850 truncate">{toko.nama_toko}</h3>
                                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{toko.alamat}</p>
                                            <p className="text-[9px] text-slate-500 font-semibold truncate mt-1">
                                                📌 {toko.kelurahan ? `${toko.kelurahan}, ` : ''}
                                                {toko.kecamatan ? `${toko.kecamatan}, ` : ''}
                                                {toko.kota}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[9px] font-bold text-slate-450">
                                        <span>🕒 {toko.jam_buka.substring(0,5)} - {toko.jam_tutup.substring(0,5)}</span>
                                        <span className="text-[#4361EE] flex items-center gap-0.5">Pesan Sekarang <span className="material-symbols-outlined text-[10px]">arrow_forward</span></span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
