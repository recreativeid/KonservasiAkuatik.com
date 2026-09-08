import React, { useState, useEffect } from 'react';

/**
 * WilayahSelector - Cascading Indonesian Region Dropdown
 * Uses free API: https://www.emsifa.com/api-wilayah-indonesia/api/
 * 
 * Cascade: Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan
 * 
 * Props:
 *   - initialProvinsi, initialKota, initialKecamatan, initialKelurahan (string names)
 *   - onChange({ provinsi, kota, kecamatan, kelurahan }) => void
 *   - compact (bool) - whether to use compact layout
 *   - showKecamatan (bool) - whether to show kecamatan dropdown (default true)
 *   - showKelurahan (bool) - whether to show kelurahan dropdown (default true)
 */

const API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export default function WilayahSelector({
    initialProvinsi = '',
    initialKota = '',
    initialKecamatan = '',
    initialKelurahan = '',
    onChange,
    compact = false,
    showKecamatan = true,
    showKelurahan = true,
}) {
    // Data arrays from API
    const [provinces, setProvinces] = useState([]);
    const [regencies, setRegencies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    // Selected IDs (used to fetch children)
    const [selectedProvId, setSelectedProvId] = useState('');
    const [selectedRegId, setSelectedRegId] = useState('');
    const [selectedDistId, setSelectedDistId] = useState('');

    // Selected Names (display / output value)
    const [selectedProvName, setSelectedProvName] = useState(initialProvinsi);
    const [selectedRegName, setSelectedRegName] = useState(initialKota);
    const [selectedDistName, setSelectedDistName] = useState(initialKecamatan);
    const [selectedVilName, setSelectedVilName] = useState(initialKelurahan);

    // Loading states
    const [loadingProv, setLoadingProv] = useState(false);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loadingDist, setLoadingDist] = useState(false);
    const [loadingVil, setLoadingVil] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Fetch provinces on mount
    useEffect(() => {
        fetchProvinces();
    }, []);

    const fetchProvinces = async () => {
        setLoadingProv(true);
        setApiError(null);
        try {
            const res = await fetch(`${API_BASE}/provinces.json`);
            if (!res.ok) throw new Error('Gagal memuat data provinsi');
            const data = await res.json();
            setProvinces(data);

            // If initial value exists, try to match it
            if (initialProvinsi) {
                const match = data.find(p => p.name.toLowerCase() === initialProvinsi.toLowerCase());
                if (match) {
                    setSelectedProvId(match.id);
                    setSelectedProvName(match.name);
                    fetchRegencies(match.id, initialKota);
                }
            }
        } catch (e) {
            console.error('Error fetching provinces:', e);
            setApiError('Tidak dapat memuat data wilayah. Periksa koneksi internet Anda.');
        } finally {
            setLoadingProv(false);
        }
    };

    const fetchRegencies = async (provId, matchName = '') => {
        if (!provId) { setRegencies([]); return; }
        setLoadingReg(true);
        try {
            const res = await fetch(`${API_BASE}/regencies/${provId}.json`);
            if (!res.ok) throw new Error('Gagal memuat data kabupaten/kota');
            const data = await res.json();
            setRegencies(data);

            if (matchName) {
                const match = data.find(r => r.name.toLowerCase() === matchName.toLowerCase());
                if (match) {
                    setSelectedRegId(match.id);
                    setSelectedRegName(match.name);
                    if (showKecamatan) fetchDistricts(match.id, initialKecamatan);
                }
            }
        } catch (e) {
            console.error('Error fetching regencies:', e);
        } finally {
            setLoadingReg(false);
        }
    };

    const fetchDistricts = async (regId, matchName = '') => {
        if (!regId) { setDistricts([]); return; }
        setLoadingDist(true);
        try {
            const res = await fetch(`${API_BASE}/districts/${regId}.json`);
            if (!res.ok) throw new Error('Gagal memuat data kecamatan');
            const data = await res.json();
            setDistricts(data);

            if (matchName) {
                const match = data.find(d => d.name.toLowerCase() === matchName.toLowerCase());
                if (match) {
                    setSelectedDistId(match.id);
                    setSelectedDistName(match.name);
                    if (showKelurahan) fetchVillages(match.id, initialKelurahan);
                }
            }
        } catch (e) {
            console.error('Error fetching districts:', e);
        } finally {
            setLoadingDist(false);
        }
    };

    const fetchVillages = async (distId, matchName = '') => {
        if (!distId) { setVillages([]); return; }
        setLoadingVil(true);
        try {
            const res = await fetch(`${API_BASE}/villages/${distId}.json`);
            if (!res.ok) throw new Error('Gagal memuat data kelurahan');
            const data = await res.json();
            setVillages(data);

            if (matchName) {
                const match = data.find(v => v.name.toLowerCase() === matchName.toLowerCase());
                if (match) {
                    setSelectedVilName(match.name);
                }
            }
        } catch (e) {
            console.error('Error fetching villages:', e);
        } finally {
            setLoadingVil(false);
        }
    };

    // Emit changes to parent
    const emitChange = (prov, kota, kec, kel) => {
        if (onChange) {
            onChange({ provinsi: prov, kota, kecamatan: kec, kelurahan: kel });
        }
    };

    const handleProvinsiChange = (e) => {
        const id = e.target.value;
        const prov = provinces.find(p => p.id === id);
        setSelectedProvId(id);
        setSelectedProvName(prov ? prov.name : '');
        // Reset children
        setSelectedRegId('');
        setSelectedRegName('');
        setSelectedDistId('');
        setSelectedDistName('');
        setSelectedVilName('');
        setRegencies([]);
        setDistricts([]);
        setVillages([]);

        if (id) fetchRegencies(id);
        emitChange(prov ? prov.name : '', '', '', '');
    };

    const handleKotaChange = (e) => {
        const id = e.target.value;
        const reg = regencies.find(r => r.id === id);
        setSelectedRegId(id);
        setSelectedRegName(reg ? reg.name : '');
        // Reset children
        setSelectedDistId('');
        setSelectedDistName('');
        setSelectedVilName('');
        setDistricts([]);
        setVillages([]);

        if (id && showKecamatan) fetchDistricts(id);
        emitChange(selectedProvName, reg ? reg.name : '', '', '');
    };

    const handleKecamatanChange = (e) => {
        const id = e.target.value;
        const dist = districts.find(d => d.id === id);
        setSelectedDistId(id);
        setSelectedDistName(dist ? dist.name : '');
        // Reset children
        setSelectedVilName('');
        setVillages([]);

        if (id && showKelurahan) fetchVillages(id);
        emitChange(selectedProvName, selectedRegName, dist ? dist.name : '', '');
    };

    const handleKelurahanChange = (e) => {
        const id = e.target.value;
        const vil = villages.find(v => v.id === id);
        setSelectedVilName(vil ? vil.name : '');
        emitChange(selectedProvName, selectedRegName, selectedDistName, vil ? vil.name : '');
    };

    const inputClass = compact
        ? "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition"
        : "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4361EE] focus:bg-white transition";

    const labelClass = "block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5";

    const loadingIndicator = (
        <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-bold animate-pulse">
            <span className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            Memuat...
        </span>
    );

    if (apiError) {
        return (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">wifi_off</span>
                {apiError}
                <button onClick={fetchProvinces} className="ml-auto px-2 py-1 bg-amber-100 rounded-lg text-[10px] font-bold hover:bg-amber-200 transition">
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
            {/* Provinsi */}
            <div>
                <label className={labelClass}>
                    Provinsi {loadingProv && loadingIndicator}
                </label>
                <select
                    value={selectedProvId}
                    onChange={handleProvinsiChange}
                    className={inputClass}
                    disabled={loadingProv}
                >
                    <option value="">— Pilih Provinsi —</option>
                    {provinces.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.name}</option>
                    ))}
                </select>
            </div>

            {/* Kabupaten / Kota */}
            <div>
                <label className={labelClass}>
                    Kabupaten / Kota {loadingReg && loadingIndicator}
                </label>
                <select
                    value={selectedRegId}
                    onChange={handleKotaChange}
                    className={inputClass}
                    disabled={!selectedProvId || loadingReg}
                >
                    <option value="">— Pilih Kabupaten/Kota —</option>
                    {regencies.map(reg => (
                        <option key={reg.id} value={reg.id}>{reg.name}</option>
                    ))}
                </select>
            </div>

            {/* Kecamatan */}
            {showKecamatan && (
                <div>
                    <label className={labelClass}>
                        Kecamatan {loadingDist && loadingIndicator}
                    </label>
                    <select
                        value={selectedDistId}
                        onChange={handleKecamatanChange}
                        className={inputClass}
                        disabled={!selectedRegId || loadingDist}
                    >
                        <option value="">— Pilih Kecamatan —</option>
                        {districts.map(dist => (
                            <option key={dist.id} value={dist.id}>{dist.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Kelurahan */}
            {showKelurahan && (
                <div>
                    <label className={labelClass}>
                        Kelurahan / Desa {loadingVil && loadingIndicator}
                    </label>
                    <select
                        value={villages.find(v => v.name === selectedVilName)?.id || ''}
                        onChange={handleKelurahanChange}
                        className={inputClass}
                        disabled={!selectedDistId || loadingVil}
                    >
                        <option value="">— Pilih Kelurahan —</option>
                        {villages.map(vil => (
                            <option key={vil.id} value={vil.id}>{vil.name}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
