import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';

function RincianItem({ itemData, kodeAkunId, onUpdate, onRemove, isOnlyItem }) {
  // Ambil daftar flag/checklist yang relevan untuk KodeAkun ini
  const { data: flags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['flags', kodeAkunId],
    queryFn: async () => {
      const res = await apiClient.get(`/kode-akun/${kodeAkunId}/flags`);
      return res.data;
    },
    // Hanya jalankan query jika kodeAkunId sudah dipilih
    enabled: !!kodeAkunId,
  });

  const handleJumlahChange = (value) => {
    onUpdate({ jumlah: parseInt(value) || 0 });
  };

  const handleFlagChange = (flagName, flagType) => {
    const existingFlags = itemData.jawabanFlags || [];
    let updatedFlags;

    const existingFlagIndex = existingFlags.findIndex(
      (f) => f.nama === flagName
    );

    if (existingFlagIndex > -1) {
      // Jika flag sudah ada, update tipenya
      updatedFlags = existingFlags.map((flag, index) =>
        index === existingFlagIndex ? { ...flag, tipe: flagType } : flag
      );
    } else {
      // Jika flag belum ada, tambahkan yang baru
      updatedFlags = [...existingFlags, { nama: flagName, tipe: flagType }];
    }
    onUpdate({ jawabanFlags: updatedFlags });
  };

  // Fungsi untuk mendapatkan nilai jawaban flag yang sudah ada
  const getFlagValue = (flagName) => {
    const flag = itemData.jawabanFlags?.find((f) => f.nama === flagName);
    return flag ? flag.tipe : ''; // Default ke string kosong
  };

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-md flex flex-col md:flex-row gap-4 items-start relative">
      <div className="flex-1 w-full md:w-auto">
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Jumlah (Rp)
        </label>
        <input
          type="number"
          value={itemData.jumlah}
          onChange={(e) => handleJumlahChange(e.target.value)}
          className="form-input"
          required
        />
      </div>

      <div className="flex-[2] w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Kelengkapan Dokumen
        </label>
        {isLoadingFlags && (
          <p className="text-sm text-slate-500">Memuat checklist...</p>
        )}
        {!isLoadingFlags && !flags?.length && (
          <p className="text-sm text-slate-500">
            Pilih Kode Akun untuk melihat checklist.
          </p>
        )}

        {flags && flags.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-2">
            {flags.map((flag) => (
              <div key={flag.id}>
                <label
                  htmlFor={`flag-${itemData.id}-${flag.id}`}
                  className="text-sm text-slate-700"
                >
                  {flag.nama}
                </label>
                <select
                  id={`flag-${itemData.id}-${flag.id}`}
                  className="form-input-sm mt-1"
                  value={getFlagValue(flag.nama)}
                  onChange={(e) => handleFlagChange(flag.nama, e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Pilih...
                  </option>
                  <option value="IYA">Iya</option>
                  {flag.tipe === 'IYA_TIDAK' && (
                    <option value="TIDAK">Tidak</option>
                  )}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isOnlyItem && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition-colors absolute top-2 right-2"
          title="Hapus Rincian"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default RincianItem;
