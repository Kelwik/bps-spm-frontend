import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import { Trash2 } from 'lucide-react';

function RincianItem({ itemData, kodeAkunId, onUpdate, onRemove, isOnlyItem }) {
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
  const handleJumlahChange = (value) =>
    onUpdate({ jumlah: parseInt(value) || 0 });

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="form-label-sm">Jumlah (Rp)</label>
          <input
            type="number"
            value={itemData.jumlah}
            onChange={(e) => handleJumlahChange(e.target.value)}
            className="form-input"
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
      <div>
        <label className="form-label-sm">Uraian</label>
        <textarea
          value={itemData.uraian || ''}
          onChange={(e) => handleInputChange('uraian', e.target.value)}
          className="form-input"
          rows="2"
        ></textarea>
      </div>

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
                  className="form-input"
                  value={getFlagValue(flag.nama)}
                  onChange={(e) => handleFlagChange(flag.nama, e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Pilih...
                  </option>
                  <option value="IYA">Iya</option>
                  <option value="TIDAK">Tidak</option>
                  {flag.tipe === 'IYA_TIDAK' && <option value="">-</option>}
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
