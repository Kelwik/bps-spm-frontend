import RincianItem from './RincianItem';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';

function RincianGroup({ groupData, onUpdate, onRemove, isFirst }) {
  // Ambil daftar Kode Akun untuk dropdown
  const { data: kodeAkunList, isLoading: isLoadingKodeAkun } = useQuery({
    queryKey: ['kodeAkun'],
    queryFn: async () => {
      const res = await apiClient.get('/kode-akun');
      return res.data;
    },
  });

  const handleInputChange = (field, value) => {
    onUpdate(groupData.id, { [field]: value });
  };

  // Menambah item baru di dalam grup ini
  const handleAddItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      jumlah: 0,
      jawabanFlags: [],
    };
    onUpdate(groupData.id, { items: [...groupData.items, newItem] });
  };

  // Menghapus item dari dalam grup ini
  const handleRemoveItem = (itemId) => {
    const updatedItems = groupData.items.filter((item) => item.id !== itemId);
    onUpdate(groupData.id, { items: updatedItems });
  };

  // Mengupdate data item spesifik
  const handleUpdateItem = (itemId, updatedItemData) => {
    const updatedItems = groupData.items.map((item) =>
      item.id === itemId ? { ...item, ...updatedItemData } : item
    );
    onUpdate(groupData.id, { items: updatedItems });
  };

  return (
    <div className="p-5 border border-slate-200 rounded-lg bg-slate-50 relative">
      {!isFirst && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-7 w-7 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
          title="Hapus Kelompok Rincian"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Kode Program
          </label>
          <input
            type="text"
            value={groupData.kodeProgram}
            onChange={(e) => handleInputChange('kodeProgram', e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Kode Kegiatan
          </label>
          <input
            type="text"
            value={groupData.kodeKegiatan}
            onChange={(e) => handleInputChange('kodeKegiatan', e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Kode Akun
          </label>
          <select
            value={groupData.kodeAkunId || ''}
            onChange={(e) => handleInputChange('kodeAkunId', e.target.value)}
            className="form-input"
            required
          >
            <option value="" disabled>
              {isLoadingKodeAkun ? 'Memuat...' : 'Pilih Kode Akun'}
            </option>
            {kodeAkunList?.map((akun) => (
              <option key={akun.id} value={akun.id}>
                {akun.kode} - {akun.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {groupData.items.map((item) => (
          <RincianItem
            key={item.id}
            itemData={item}
            kodeAkunId={groupData.kodeAkunId}
            onUpdate={(updatedData) => handleUpdateItem(item.id, updatedData)}
            onRemove={() => handleRemoveItem(item.id)}
            isOnlyItem={groupData.items.length === 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Tambah Rincian (Kode Akun Sama)
      </button>
    </div>
  );
}

export default RincianGroup;
