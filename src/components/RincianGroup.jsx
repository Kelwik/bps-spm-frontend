import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import RincianItem from './RincianItem';

function RincianGroup({
  groupData,
  onUpdate,
  onRemove,
  onAddItem,
  setRincianGroups,
}) {
  const { data: kodeAkunList, isLoading } = useQuery({
    queryKey: ['kodeAkun'],
    queryFn: async () => {
      const res = await apiClient.get('/kode-akun');
      return res.data;
    },
  });

  const handleInputChange = (field, value) => {
    onUpdate(groupData.id, { [field]: value });
  };

  const handleKodeAkunChange = (e) => {
    const newKodeAkunId = parseInt(e.target.value) || null;
    onUpdate(groupData.id, { kodeAkunId: newKodeAkunId, items: [] });
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
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="text-md font-semibold text-gray-700">
          Kelompok Rincian
        </h4>
        <button
          type="button"
          onClick={() => onRemove(groupData.id)}
          className="btn-danger-sm"
        >
          Hapus Kelompok
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-600">
            Kode Program
          </label>
          <input
            type="text"
            value={groupData.kodeProgram}
            onChange={(e) => handleInputChange('kodeProgram', e.target.value)}
            className="input-field-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-600">
            Kode Kegiatan
          </label>
          <input
            type="text"
            value={groupData.kodeKegiatan}
            onChange={(e) => handleInputChange('kodeKegiatan', e.target.value)}
            className="input-field-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-600">
            Kode Akun
          </label>
          <select
            value={groupData.kodeAkunId || ''}
            onChange={handleKodeAkunChange}
            className="input-field-sm"
          >
            <option value="">
              {isLoading ? 'Memuat...' : '-- Pilih Kode Akun --'}
            </option>
            {kodeAkunList?.map((akun) => (
              <option key={akun.id} value={akun.id}>
                {akun.kode} - {akun.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pl-4 border-l-2 border-gray-200 space-y-4">
        {groupData.items.map((item) => (
          <RincianItem
            key={item.id}
            itemData={item}
            kodeAkunId={groupData.kodeAkunId}
            onUpdate={(updatedData) => handleUpdateItem(item.id, updatedData)}
            onRemove={() => handleRemoveItem(item.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddItem(groupData.id)}
        disabled={!groupData.kodeAkunId}
        className="btn-secondary-sm"
      >
        + Tambah Rincian (Kode Akun Sama)
      </button>
    </div>
  );
}

export default RincianGroup;
