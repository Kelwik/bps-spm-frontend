import RincianItem from './RincianItem';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import { Plus, Trash2 } from 'lucide-react';

function RincianGroup({ groupData, onUpdate, onRemove, isFirst }) {
  const { data: kodeAkunList, isLoading: isLoadingKodeAkun } = useQuery({
    queryKey: ['kodeAkun'],
    queryFn: async () => apiClient.get('/kode-akun').then((res) => res.data),
  });

  const handleInputChange = (field, value) =>
    onUpdate(groupData.id, { [field]: value });

  const handleAddItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      jumlah: 0,
      jawabanFlags: [],
      kodeKRO: '',
      kodeRO: '',
      kodeKomponen: '',
      kodeSubkomponen: '',
      uraian: '',
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
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 relative space-y-4">
      {!isFirst && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-3 -right-3 text-slate-400 bg-white hover:text-red-600 hover:bg-red-100 p-1 rounded-full shadow transition-colors"
          title="Hapus Kelompok Rincian"
        >
          <Trash2 size={16} />
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Kode Akun</label>
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
        <div>
          <label className="form-label">Kode Program</label>
          <input
            type="text"
            value={groupData.kodeProgram}
            onChange={(e) => handleInputChange('kodeProgram', e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div>
          <label className="form-label">Kode Kegiatan</label>
          <input
            type="text"
            value={groupData.kodeKegiatan}
            onChange={(e) => handleInputChange('kodeKegiatan', e.target.value)}
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200">
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
        className="btn-primary btn-sm"
      >
        <Plus size={14} /> Tambah Rincian (Kode Akun Sama)
      </button>
    </div>
  );
}

export default RincianGroup;
