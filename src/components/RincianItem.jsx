// src/components/RincianItem.jsx

import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import { Trash2, MessageSquareText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function RincianItem({ itemData, kodeAkunId, onUpdate, onRemove, isOnlyItem }) {
  const { user } = useAuth();

  const { data: flags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['flags', kodeAkunId],
    queryFn: async () => {
      if (!kodeAkunId) return [];
      const res = await apiClient.get(`/kode-akun/${kodeAkunId}/flags`);
      return res.data;
    },
    enabled: !!kodeAkunId,
  });

  const handleInputChange = (field, value) => onUpdate({ [field]: value });

  // Helper to format number with dots
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '';
    if (num === 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleJumlahChange = (inputValue) => {
    const cleanValue = inputValue.replace(/\./g, '').replace(/[^0-9]/g, '');
    const numberValue = parseInt(cleanValue, 10);
    onUpdate({ jumlah: isNaN(numberValue) ? 0 : numberValue });
  };

  const handleFlagChange = (flagName, flagType) => {
    const existingFlags = itemData.jawabanFlags || [];
    let updatedFlags;
    const existingFlagIndex = existingFlags.findIndex(
      (f) => f.nama === flagName
    );
    if (existingFlagIndex > -1) {
      updatedFlags = existingFlags.map((flag, index) =>
        index === existingFlagIndex ? { ...flag, tipe: flagType } : flag
      );
    } else {
      updatedFlags = [...existingFlags, { nama: flagName, tipe: flagType }];
    }
    onUpdate({ jawabanFlags: updatedFlags });
  };

  const getFlagValue = (flagName) =>
    itemData.jawabanFlags?.find((f) => f.nama === flagName)?.tipe || '';

  // Logic Visibility Catatan
  const isSupervisor = user?.role === 'supervisor';
  const hasCatatan = itemData.catatan && itemData.catatan.trim() !== '';

  // Tampilkan jika User adalah Supervisor ATAU jika sudah ada catatan
  const showCatatan = isSupervisor || hasCatatan;

  return (
    <div className="p-4 bg-white rounded-md border border-slate-200 relative space-y-4">
      {!isOnlyItem && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2.5 -right-2.5 text-slate-400 bg-white hover:text-danger hover:bg-danger-light p-1 rounded-full shadow-sm transition-colors"
          title="Hapus Rincian"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* --- Row 1: Amount & Codes --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="form-label-sm">Jumlah (Rp)</label>
          <input
            type="text"
            value={formatNumber(itemData.jumlah)}
            onChange={(e) => handleJumlahChange(e.target.value)}
            className="form-input font-mono text-right"
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="form-label-sm">Kode KRO</label>
          <input
            type="text"
            value={itemData.kodeKRO || ''}
            onChange={(e) => handleInputChange('kodeKRO', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label-sm">Kode RO</label>
          <input
            type="text"
            value={itemData.kodeRO || ''}
            onChange={(e) => handleInputChange('kodeRO', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label-sm">Kode Komponen</label>
          <input
            type="text"
            value={itemData.kodeKomponen || ''}
            onChange={(e) => handleInputChange('kodeKomponen', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label-sm">Kode Subkomponen</label>
          <input
            type="text"
            value={itemData.kodeSubkomponen || ''}
            onChange={(e) =>
              handleInputChange('kodeSubkomponen', e.target.value)
            }
            className="form-input"
          />
        </div>
      </div>

      {/* --- Row 2: Uraian & Catatan Pemeriksa --- */}
      {/* REVISI: 
          Jika showCatatan TRUE  => lg:grid-cols-2 (Bagi dua kolom)
          Jika showCatatan FALSE => Default grid-cols-1 (Uraian ambil lebar penuh)
      */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          showCatatan ? 'lg:grid-cols-2' : ''
        }`}
      >
        <div>
          <label className="form-label-sm">Uraian</label>
          <textarea
            value={itemData.uraian || ''}
            onChange={(e) => handleInputChange('uraian', e.target.value)}
            className="form-input"
            rows="3"
            placeholder="Deskripsi belanja..."
          ></textarea>
        </div>

        {/* Catatan Pemeriksa: Hanya dirender jika showCatatan true */}
        {showCatatan && (
          <div>
            <label className="form-label-sm flex items-center gap-1 text-orange-700">
              <MessageSquareText size={14} /> Catatan Pemeriksa
            </label>
            <textarea
              value={itemData.catatan || ''}
              onChange={(e) => handleInputChange('catatan', e.target.value)}
              className={`form-input ${
                !isSupervisor ? 'bg-orange-50 cursor-not-allowed' : 'bg-white'
              }`}
              rows="3"
              placeholder={
                isSupervisor ? 'Isi catatan jika ada kesalahan...' : ''
              }
              disabled={!isSupervisor}
            ></textarea>
          </div>
        )}
      </div>

      {/* --- Row 3: Flags / Checklist --- */}
      <div className="pt-4 border-t border-slate-200">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">
          Kelengkapan Dokumen
        </h4>
        {isLoadingFlags && (
          <p className="text-sm text-gray-500">Memuat checklist...</p>
        )}
        {!isLoadingFlags && !flags?.length && (
          <p className="text-sm text-gray-500">
            Pilih Kode Akun untuk melihat checklist.
          </p>
        )}
        {flags && flags.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {flags.map((flag) => (
              <div key={flag.id}>
                <label
                  htmlFor={`flag-${itemData.id}-${flag.id}`}
                  className="form-label-sm"
                >
                  {flag.nama}
                </label>
                <select
                  id={`flag-${itemData.id}-${flag.id}`}
                  className={`form-input text-sm ${
                    getFlagValue(flag.nama) === 'BELUM_SELESAI'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : ''
                  }`}
                  value={getFlagValue(flag.nama)}
                  onChange={(e) => handleFlagChange(flag.nama, e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Pilih...
                  </option>
                  <option value="IYA">Ada (Iya)</option>
                  {flag.tipe === 'IYA_TIDAK' && (
                    <option value="IYA_TIDAK">- (Tidak Perlu)</option>
                  )}
                  <option value="TIDAK">Tidak Ada</option>
                  <option value="BELUM_SELESAI">Belum Selesai</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RincianItem;
