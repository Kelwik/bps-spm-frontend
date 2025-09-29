import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import apiClient from '../api';
import RincianGroup from '../components/RincianGroup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatusBadge from '../components/StatusBadge';

function SpmCreatePage({ isEditMode = false }) {
  const { id: spmId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran: selectedYear } = useSatker();

  // State
  const [spmData, setSpmData] = useState({ nomorSpm: '', tanggal: '' });
  const [rincianGroups, setRincianGroups] = useState([]);
  const [error, setError] = useState(null);

  // Query untuk mengambil data SPM saat mode edit
  const { data: existingSpmData, isLoading: isLoadingSpm } = useQuery({
    queryKey: ['spm', spmId],
    queryFn: async () => apiClient.get(`/spm/${spmId}`).then((res) => res.data),
    enabled: isEditMode && !!spmId,
  });

  // Efek untuk mengisi form dari data yang ada
  useEffect(() => {
    if (isEditMode && existingSpmData) {
      setSpmData({
        nomorSpm: existingSpmData.nomorSpm,
        tanggal: new Date(existingSpmData.tanggal).toISOString().split('T')[0],
        tahunAnggaran: existingSpmData.tahunAnggaran,
      });
      const grouped = existingSpmData.rincian.reduce((acc, rincian) => {
        const groupKey = `${rincian.kodeProgram}-${rincian.kodeKegiatan}-${rincian.kodeAkunId}`;
        if (!acc[groupKey]) {
          acc[groupKey] = {
            id: crypto.randomUUID(),
            kodeProgram: rincian.kodeProgram,
            kodeKegiatan: rincian.kodeKegiatan,
            kodeAkunId: rincian.kodeAkunId,
            items: [],
          };
        }
        acc[groupKey].items.push({ ...rincian });
        return acc;
      }, {});
      setRincianGroups(Object.values(grouped));
    }
  }, [isEditMode, existingSpmData]);

  // Mutasi untuk menyimpan atau mengupdate SPM
  const { mutate: saveSpm, isPending: isSaving } = useMutation({
    mutationFn: (payload) =>
      isEditMode
        ? apiClient.put(`/spm/${spmId}`, payload)
        : apiClient.post('/spm', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      queryClient.invalidateQueries({ queryKey: ['allRincian'] });
      navigate('/spm');
    },
    onError: (err) => {
      const errorMessage =
        err.response?.data?.error ||
        `Terjadi kesalahan saat ${
          isEditMode ? 'memperbarui' : 'menyimpan'
        } SPM.`;
      setError(errorMessage);
    },
  });

  // Mutasi untuk update status
  const updateStatusMutation = useMutation({
    mutationFn: ({ status }) =>
      apiClient.patch(`/spm/${spmId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      queryClient.invalidateQueries({ queryKey: ['spm', spmId] });
      navigate('/spm');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Gagal memperbarui status SPM.');
    },
  });

  const handleStatusUpdate = (newStatus) => {
    const action = newStatus === 'DITERIMA' ? 'menerima' : 'menolak';
    if (window.confirm(`Apakah Anda yakin ingin ${action} SPM ini?`)) {
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  const isFormDisabled = isEditMode && existingSpmData?.status === 'DITERIMA';

  // Handlers untuk form
  const handleSpmDataChange = (e) => {
    setSpmData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddGroup = () => {
    setRincianGroups([
      ...rincianGroups,
      {
        id: crypto.randomUUID(),
        kodeProgram: '',
        kodeKegiatan: '',
        kodeAkunId: null,
        items: [
          {
            id: crypto.randomUUID(),
            jumlah: 0,
            jawabanFlags: [],
            kodeKRO: '',
            kodeRO: '',
            kodeKomponen: '',
            kodeSubkomponen: '',
            uraian: '',
          },
        ],
      },
    ]);
  };

  const handleRemoveGroup = (groupId) => {
    setRincianGroups(rincianGroups.filter((g) => g.id !== groupId));
  };

  const handleUpdateGroup = (groupId, updatedData) => {
    setRincianGroups(
      rincianGroups.map((group) =>
        group.id === groupId ? { ...group, ...updatedData } : group
      )
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

    const targetSatkerId =
      user.role === 'op_satker' ? user.satkerId : selectedSatkerId;
    if (!targetSatkerId && !isEditMode) {
      setError(
        'Untuk admin provinsi, silakan pilih Satker terlebih dahulu di dashboard.'
      );
      return;
    }

    const rincianForApi = rincianGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: isEditMode ? item.id : undefined,
        kodeProgram: group.kodeProgram,
        kodeKegiatan: group.kodeKegiatan,
        kodeAkunId: group.kodeAkunId,
        jumlah: item.jumlah,
        jawabanFlags: item.jawabanFlags,
        kodeKRO: item.kodeKRO,
        kodeRO: item.kodeRO,
        kodeKomponen: item.kodeKomponen,
        kodeSubkomponen: item.kodeSubkomponen,
        uraian: item.uraian,
      }))
    );

    const finalPayload = {
      ...spmData,
      tahunAnggaran: isEditMode
        ? spmData.tahunAnggaran
        : parseInt(selectedYear),
      satkerId: isEditMode ? existingSpmData.satkerId : targetSatkerId,
      rincian: rincianForApi,
    };

    saveSpm(finalPayload);
  };

  if (isEditMode && isLoadingSpm) {
    return <div className="p-4 text-center">Memuat data SPM...</div>;
  }

  return (
    <div className="mt-8 mx-4 md:mx-8 overflow-x-hidden">
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900">
              {isEditMode ? 'Detail / Edit SPM' : 'Buat SPM Baru'}
            </h1>
            <p className="text-gray-600">
              {isEditMode
                ? 'Ubah atau verifikasi detail SPM di bawah ini.'
                : 'Isi detail SPM dan tambahkan rincian belanja.'}
            </p>
          </div>
          {isEditMode && existingSpmData && (
            <StatusBadge status={existingSpmData.status} />
          )}
        </div>

        {isFormDisabled && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md">
            <p className="font-semibold">Informasi</p>
            <p>
              SPM ini sudah <strong>Diterima</strong> dan tidak dapat diubah
              lagi.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isFormDisabled}>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor SPM
                  </label>
                  <input
                    type="text"
                    name="nomorSpm"
                    value={spmData.nomorSpm}
                    onChange={handleSpmDataChange}
                    className="w-full p-2 md:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    name="tanggal"
                    value={spmData.tanggal}
                    onChange={handleSpmDataChange}
                    className="w-full p-2 md:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Anggaran
                  </label>
                  <input
                    type="number"
                    name="tahunAnggaran"
                    value={isEditMode ? spmData.tahunAnggaran : selectedYear}
                    disabled
                    className="w-full p-2 md:p-3 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold text-blue-800 mb-4">
                Daftar Rincian
              </h2>
              <div className="space-y-4">
                {rincianGroups.map((group, index) => (
                  <RincianGroup
                    key={group.id}
                    groupData={group}
                    onUpdate={handleUpdateGroup}
                    onRemove={() => handleRemoveGroup(group.id)}
                    isFirst={index === 0}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddGroup}
                className="mt-4 inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Tambah Kelompok Rincian
              </button>
            </div>
          </fieldset>

          {isEditMode &&
            ['op_prov', 'supervisor'].includes(user.role) &&
            existingSpmData?.status === 'MENUNGGU' && (
              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-4">
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('DITOLAK')}
                  disabled={updateStatusMutation.isPending}
                  className="btn-danger w-full sm:w-auto"
                >
                  {updateStatusMutation.isPending
                    ? 'Memproses...'
                    : 'Tolak & Kembalikan'}
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('DITERIMA')}
                  disabled={updateStatusMutation.isPending}
                  className="btn-success w-full sm:w-auto"
                >
                  {updateStatusMutation.isPending
                    ? 'Memproses...'
                    : 'Terima & Finalisasi'}
                </button>
              </div>
            )}

          {!isFormDisabled && (
            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(isEditMode ? '/spm' : '/')}
                className="w-full sm:w-auto px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={isSaving}
              >
                {isSaving
                  ? isEditMode
                    ? 'Memperbarui...'
                    : 'Menyimpan...'
                  : isEditMode
                  ? 'Update SPM'
                  : 'Simpan SPM'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default SpmCreatePage;
