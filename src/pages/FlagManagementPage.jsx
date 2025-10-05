import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

// Komponen Form untuk menambah/mengedit flag
function FlagForm({ flag, kodeAkunId, onSuccess, onCancel }) {
  const [nama, setNama] = useState(flag?.nama || '');
  const [tipe, setTipe] = useState(flag?.tipe || 'IYA');

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { nama, tipe, kodeAkunId };
    onSuccess(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Nama Dokumen / Persyaratan</label>
        <input
          type="text"
          className="form-input"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Surat Perintah Kerja (SPK)"
          required
        />
      </div>
      <div>
        <label className="form-label">Tipe Persyaratan</label>
        <select
          className="form-input"
          value={tipe}
          onChange={(e) => setTipe(e.target.value)}
        >
          <option value="IYA">Wajib Ada (Iya)</option>
          <option value="IYA_TIDAK">Opsional (Iya/Tidak)</option>
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn-primary">
          Simpan
        </button>
      </div>
    </form>
  );
}

function FlagManagementPage() {
  const queryClient = useQueryClient();
  const [selectedKodeAkunId, setSelectedKodeAkunId] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, flag: null }); // State untuk modal

  // Ambil daftar semua Kode Akun untuk dropdown
  const { data: kodeAkunList, isLoading: isLoadingKodeAkun } = useQuery({
    queryKey: ['kodeAkun'],
    queryFn: async () => apiClient.get('/kode-akun').then((res) => res.data),
  });

  // Ambil daftar flag untuk Kode Akun yang dipilih
  const { data: flags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['flags', selectedKodeAkunId],
    queryFn: async () =>
      apiClient
        .get(`/kode-akun/${selectedKodeAkunId}/flags`)
        .then((res) => res.data),
    enabled: !!selectedKodeAkunId, // Hanya jalankan jika ada Kode Akun yang dipilih
  });

  // Mutasi untuk membuat atau mengupdate flag
  const saveFlagMutation = useMutation({
    mutationFn: (payload) => {
      return modalState.flag?.id
        ? apiClient.put(`/flags/${modalState.flag.id}`, payload)
        : apiClient.post('/flags', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['flags', selectedKodeAkunId],
      });
      setModalState({ isOpen: false, flag: null });
    },
    onError: (err) => alert(err.response?.data?.error || 'Terjadi kesalahan'),
  });

  // Mutasi untuk menghapus flag
  const deleteFlagMutation = useMutation({
    mutationFn: (flagId) => apiClient.delete(`/flags/${flagId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['flags', selectedKodeAkunId],
      });
    },
  });

  const handleDelete = (flag) => {
    if (
      window.confirm(`Apakah Anda yakin ingin menghapus flag "${flag.nama}"?`)
    ) {
      deleteFlagMutation.mutate(flag.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Manajemen Checklist Dokumen
        </h1>
        <p className="text-gray-500 mt-1">
          Atur daftar persyaratan dokumen untuk setiap Kode Akun.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="max-w-md">
          <label className="form-label">Pilih Kode Akun untuk Dikelola</label>
          <select
            className="form-input"
            value={selectedKodeAkunId}
            onChange={(e) => setSelectedKodeAkunId(e.target.value)}
            disabled={isLoadingKodeAkun}
          >
            <option value="">-- Pilih Kode Akun --</option>
            {kodeAkunList?.map((akun) => (
              <option key={akun.id} value={akun.id}>
                {akun.kode} - {akun.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedKodeAkunId && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Daftar Persyaratan
            </h2>
            <button
              onClick={() => setModalState({ isOpen: true, flag: null })}
              className="btn-primary"
            >
              <Plus size={16} /> Tambah Persyaratan
            </button>
          </div>
          {isLoadingFlags && <p className="text-center py-4">Memuat data...</p>}
          {!isLoadingFlags && (
            <ul className="divide-y divide-gray-200">
              {flags?.map((flag) => (
                <li
                  key={flag.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{flag.nama}</p>
                    <p className="text-sm text-gray-500">
                      Tipe: {flag.tipe === 'IYA_TIDAK' ? 'Opsional' : 'Wajib'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setModalState({ isOpen: true, flag })}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(flag)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modal untuk Add/Edit */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, flag: null })}
        title={modalState.flag ? 'Edit Persyaratan' : 'Tambah Persyaratan Baru'}
      >
        <FlagForm
          flag={modalState.flag}
          kodeAkunId={selectedKodeAkunId}
          onSuccess={(payload) => saveFlagMutation.mutate(payload)}
          onCancel={() => setModalState({ isOpen: false, flag: null })}
        />
      </Modal>
    </div>
  );
}

export default FlagManagementPage;
