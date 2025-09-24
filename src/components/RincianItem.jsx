import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';

function RincianItem({ itemData, kodeAkunId, onUpdate, onRemove }) {
  // Fetch checklist dinamis (flags) berdasarkan kodeAkunId
  const { data: flags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['flags', kodeAkunId],
    queryFn: async () => {
      const res = await apiClient.get(`/kode-akun/${kodeAkunId}/flags`);
      return res.data;
    },
    // Hanya jalankan query jika kodeAkunId sudah dipilih
    enabled: !!kodeAkunId,
  });

  const handleJumlahChange = (e) => {
    onUpdate({ jumlah: parseInt(e.target.value) || 0 });
  };

  const handleFlagChange = (flagName, flagType) => {
    const existingFlags = itemData.jawabanFlags || [];
    const newFlags = [...existingFlags];
    const flagIndex = newFlags.findIndex((f) => f.nama === flagName);

    if (flagIndex > -1) {
      newFlags[flagIndex] = { ...newFlags[flagIndex], tipe: flagType };
    } else {
      newFlags.push({ nama: flagName, tipe: flagType });
    }
    onUpdate({ jawabanFlags: newFlags });
  };

  const getFlagValue = (flagName) => {
    const flag = itemData.jawabanFlags?.find((f) => f.nama === flagName);
    return flag ? flag.tipe : '';
  };

  return (
    <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col flex-grow mr-4">
          <label className="mb-1 text-sm font-medium text-gray-600">
            Jumlah (Rp)
          </label>
          <input
            type="number"
            value={itemData.jumlah}
            onChange={handleJumlahChange}
            className="input-field-sm"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="btn-danger-sm self-end"
        >
          Hapus
        </button>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h5 className="text-sm font-semibold text-gray-600 mb-2">
          Kelengkapan Dokumen
        </h5>
        {isLoadingFlags && (
          <p className="text-sm text-gray-500">Memuat checklist...</p>
        )}
        {flags && flags.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {flags.map((flag) => (
              <div key={flag.id} className="flex flex-col">
                <label className="mb-1 text-xs text-gray-600">
                  {flag.nama}
                </label>
                <select
                  value={getFlagValue(flag.nama)}
                  onChange={(e) => handleFlagChange(flag.nama, e.target.value)}
                  className="input-field-xs"
                >
                  <option value="">-- Pilih --</option>
                  <option value="IYA">Iya</option>
                  <option value="TIDAK">Tidak</option>
                  {flag.tipe === 'IYA_TIDAK' && (
                    <option value="IYA_TIDAK">Iya/Tidak</option>
                  )}
                </select>
              </div>
            ))}
          </div>
        ) : (
          !isLoadingFlags && (
            <p className="text-sm text-gray-500">
              Pilih Kode Akun untuk menampilkan checklist.
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default RincianItem;
