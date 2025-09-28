import RincianItem from './RincianItem';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';

function RincianGroup({ groupData, onUpdate, onRemove, isFirst }) {
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

  const handleAddItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      jumlah: 0,
      kodeKRO: '',
      kodeRO: '',
      kodeKomponen: '',
      kodeSubkomponen: '',
      uraian: '',
      jawabanFlags: [],
    };
    onUpdate(groupData.id, { items: [...groupData.items, newItem] });
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = groupData.items.filter((item) => item.id !== itemId);
    onUpdate(groupData.id, { items: updatedItems });
  };

  const handleUpdateItem = (itemId, updatedItemData) => {
    const updatedItems = groupData.items.map((item) =>
      item.id === itemId ? { ...item, ...updatedItemData } : item
    );
    onUpdate(groupData.id, { items: updatedItems });
  };

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-sm relative overflow-hidden">
      {!isFirst && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
          title="Hapus Kelompok Rincian"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode Program
          </label>
          <input
            type="text"
            value={groupData.kodeProgram}
            onChange={(e) => handleInputChange('kodeProgram', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode Kegiatan
          </label>
          <input
            type="text"
            value={groupData.kodeKegiatan}
            onChange={(e) => handleInputChange('kodeKegiatan', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kode Akun
          </label>
          <select
            value={groupData.kodeAkunId || ''}
            onChange={(e) => handleInputChange('kodeAkunId', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
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

      <div className="space-y-4">
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
        className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
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
