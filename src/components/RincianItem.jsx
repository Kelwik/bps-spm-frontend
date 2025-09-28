import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';

function RincianItem({ itemData, kodeAkunId, onUpdate, onRemove, isOnlyItem }) {
  const { data: flags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['flags', kodeAkunId],
    queryFn: async () => {
      const res = await apiClient.get(`/kode-akun/${kodeAkunId}/flags`);
      return res.data;
    },
    enabled: !!kodeAkunId,
  });
  const handleInputChange = (field, value) => {
    onUpdate({ [field]: value });
  };

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
      updatedFlags = existingFlags.map((flag, index) =>
        index === existingFlagIndex ? { ...flag, tipe: flagType } : flag
      );
    } else {
      updatedFlags = [...existingFlags, { nama: flagName, tipe: flagType }];
    }
    onUpdate({ jawabanFlags: updatedFlags });
  };

  const getFlagValue = (flagName) => {
    const flag = itemData.jawabanFlags?.find((f) => f.nama === flagName);
    return flag ? flag.tipe : '';
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col gap-6 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-start">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jumlah (Rp)
          </label>
          <input
            type="number"
            value={itemData.jumlah}
            onChange={(e) => handleJumlahChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode KRO
          </label>
          <input
            type="text"
            value={itemData.kodeKRO || ''}
            onChange={(e) => handleInputChange('kodeKRO', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode RO
          </label>
          <input
            type="text"
            value={itemData.kodeRO || ''}
            onChange={(e) => handleInputChange('kodeRO', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode Komponen
          </label>
          <input
            type="text"
            value={itemData.kodeKomponen || ''}
            onChange={(e) => handleInputChange('kodeKomponen', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode Subkomponen
          </label>
          <input
            type="text"
            value={itemData.kodeSubkomponen || ''}
            onChange={(e) =>
              handleInputChange('kodeSubkomponen', e.target.value)
            }
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {!isOnlyItem && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-8 md:mt-0 md:self-start text-red-500 hover:text-red-700 transition-colors"
            title="Hapus Rincian"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Uraian
        </label>
        <textarea
          value={itemData.uraian || ''}
          onChange={(e) => handleInputChange('uraian', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="2"
        ></textarea>
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kelengkapan Dokumen
        </label>
        {isLoadingFlags && (
          <p className="text-sm text-gray-500">Memuat checklist...</p>
        )}
        {!isLoadingFlags && !flags?.length && (
          <p className="text-sm text-gray-500">
            Pilih Kode Akun untuk melihat checklist.
          </p>
        )}

        {flags && flags.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {flags.map((flag) => (
              <div key={flag.id}>
                <label
                  htmlFor={`flag-${itemData.id}-${flag.id}`}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {flag.nama}
                </label>
                <select
                  id={`flag-${itemData.id}-${flag.id}`}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
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
