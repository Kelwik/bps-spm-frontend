import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import apiClient from '../api';
import RincianGroup from '../components/RincianGroup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatusBadge from '../components/StatusBadge';

// Helper untuk format mata uang
const formatCurrency = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);
};

function SpmCreatePage({ isEditMode = false }) {
  const { id: spmId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran: selectedYear } = useSatker();

  // --- LOGIKA BARU: FUNGSI UNTUK MEMAKSA TAHUN ---
  // Fungsi ini mengambil tanggal hari ini, tetapi mengganti tahunnya
  // dengan tahun yang dipilih di context.
  const getDefaultTanggal = (year) => {
    const today = new Date();
    // Buat tanggal baru dengan TAHUN dari context, BULAN & TANGGAL dari hari ini
    const forcedDate = new Date(year, today.getMonth(), today.getDate());
    return forcedDate.toISOString().split('T')[0]; // Format ke YYYY-MM-DD
  };

  // State untuk data utama SPM, sekarang menggunakan tanggal default yang baru
  const [spmData, setSpmData] = useState({
    nomorSpm: '',
    tanggal: getDefaultTanggal(selectedYear),
    tahunAnggaran: selectedYear,
  });

  const [rincianGroups, setRincianGroups] = useState([]);
  const [error, setError] = useState(null);

  // Efek untuk menyinkronkan tanggal jika tahun anggaran global berubah
  useEffect(() => {
    setSpmData((prev) => ({
      ...prev,
      tanggal: getDefaultTanggal(selectedYear),
      tahunAnggaran: selectedYear,
    }));
  }, [selectedYear]);

  // --- LOGIKA BARU: FUNGSI UNTUK MENANGANI PERUBAHAN TANGGAL ---
  const handleSpmDataChange = (e) => {
    const { name, value } = e.target;

    if (name === 'tanggal') {
      // Jika pengguna mengubah tanggal, kita tetap paksa tahunnya
      const chosenDate = new Date(value);
      const forcedDate = new Date(
        selectedYear, // Selalu gunakan tahun dari context
        chosenDate.getMonth(),
        chosenDate.getDate()
      );
      setSpmData((prev) => ({
        ...prev,
        tanggal: forcedDate.toISOString().split('T')[0],
      }));
    } else {
      setSpmData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // (Sisa logika state, query, dan handler lainnya tetap sama)
  const totalAnggaran = rincianGroups
    .flatMap((group) => group.items)
    .reduce((total, item) => total + (Number(item.jumlah) || 0), 0);

  const { data: existingSpmData, isLoading: isLoadingSpm } = useQuery({
    queryKey: ['spm', spmId],
    queryFn: async () => apiClient.get(`/spm/${spmId}`).then((res) => res.data),
    enabled: isEditMode && !!spmId,
  });

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
    onError: (err) =>
      setError(
        err.response?.data?.error ||
          `Terjadi kesalahan saat ${
            isEditMode ? 'memperbarui' : 'menyimpan'
          } SPM.`
      ),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }) =>
      apiClient.patch(`/spm/${spmId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      queryClient.invalidateQueries({ queryKey: ['spm', spmId] });
      navigate('/spm');
    },
    onError: (err) =>
      setError(err.response?.data?.error || 'Gagal memperbarui status SPM.'),
  });

  const handleStatusUpdate = (newStatus) => {
    const action = newStatus === 'DITERIMA' ? 'menerima' : 'menolak';
    if (window.confirm(`Apakah Anda yakin ingin ${action} SPM ini?`)) {
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  const handleAddGroup = () =>
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
  const handleRemoveGroup = (groupId) =>
    setRincianGroups(rincianGroups.filter((g) => g.id !== groupId));
  const handleUpdateGroup = (groupId, updatedData) =>
    setRincianGroups(
      rincianGroups.map((group) =>
        group.id === groupId ? { ...group, ...updatedData } : group
      )
    );

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
        id: isEditMode && item.spmId ? item.id : undefined,
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

  const isFormDisabled = isEditMode && existingSpmData?.status === 'DITERIMA';
  const showValidationButtons =
    isEditMode &&
    ['op_prov', 'supervisor'].includes(user.role) &&
    existingSpmData?.status === 'MENUNGGU';
  const showSaveButtons = !isFormDisabled;

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
          <div className="bg-blue-50 p-4 mb-6 rounded-md">
            SPM ini sudah <strong>Diterima</strong>.
          </div>
        )}
        {error && <div className="bg-red-50 p-4 mb-6 rounded-md">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isFormDisabled}>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg md:text-xl font-semibold text-blue-800 mb-4">
                Informasi Utama
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor SPM
                  </label>
                  <input
                    type="text"
                    name="nomorSpm"
                    value={spmData.nomorSpm}
                    onChange={handleSpmDataChange}
                    className="form-input"
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
                    // --- IMPLEMENTASI: Atribut min & max untuk mengunci tahun ---
                    min={`${selectedYear}-01-01`}
                    max={`${selectedYear}-12-31`}
                    onChange={handleSpmDataChange}
                    className="form-input"
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
                    className="form-input-disabled"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Anggaran
                  </label>
                  <input
                    type="text"
                    name="totalAnggaran"
                    value={formatCurrency(totalAnggaran)}
                    disabled
                    className="form-input-disabled font-mono"
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
                ➕ Tambah Kelompok Rincian
              </button>
            </div>
          </fieldset>

          {showValidationButtons && (
            <div className="pt-4 border-t border-gray-200 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => handleStatusUpdate('DITOLAK')}
                disabled={updateStatusMutation.isPending}
                className="btn-danger"
              >
                {updateStatusMutation.isPending
                  ? 'Memproses...'
                  : 'Tolak & Kembalikan'}
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('DITERIMA')}
                disabled={updateStatusMutation.isPending}
                className="btn-success"
              >
                {updateStatusMutation.isPending
                  ? 'Memproses...'
                  : 'Terima & Finalisasi'}
              </button>
            </div>
          )}

          {showSaveButtons && (
            <div
              className={`pt-4 ${
                showValidationButtons ? '' : 'border-t border-gray-200'
              } flex justify-end gap-4`}
            >
              <button
                type="button"
                onClick={() => navigate('/spm')}
                className="btn-secondary"
              >
                Batal
              </button>
              <button type="submit" className="btn-primary" disabled={isSaving}>
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
