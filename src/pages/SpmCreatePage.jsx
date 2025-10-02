import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import apiClient from '../api';
import RincianGroup from '../components/RincianGroup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatusBadge from '../components/StatusBadge';
import { Plus } from 'lucide-react';

const formatCurrency = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);

function SpmCreatePage({ isEditMode = false }) {
  const { id: spmId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran: selectedYear } = useSatker();

  // --- PERBAIKAN LOGIKA TANGGAL: Fungsi untuk membuat string tanggal ---
  const getDefaultTanggal = (year) => {
    if (!year) return '';
    const today = new Date();
    // Ambil bulan & hari, pastikan formatnya 2 digit (misal: 09)
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Langsung buat string YYYY-MM-DD
  };

  const [spmData, setSpmData] = useState({
    nomorSpm: '',
    tanggal: getDefaultTanggal(selectedYear),
    tahunAnggaran: selectedYear,
  });

  const [rincianGroups, setRincianGroups] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSpmData((prev) => ({
      ...prev,
      tanggal: getDefaultTanggal(selectedYear),
      tahunAnggaran: selectedYear,
    }));
  }, [selectedYear]);

  // --- PERBAIKAN LOGIKA TANGGAL: Handler perubahan input tanggal ---
  const handleSpmDataChange = (e) => {
    const { name, value } = e.target; // value akan dalam format "YYYY-MM-DD"
    if (name === 'tanggal') {
      const [, month, day] = value.split('-'); // Ambil bulan dan hari dari pilihan user
      const forcedDateString = `${selectedYear}-${month}-${day}`; // Gabungkan dengan tahun dari context
      setSpmData((prev) => ({ ...prev, tanggal: forcedDateString }));
    } else {
      setSpmData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // (Sisa logika state, query, dan handler lainnya tidak berubah)
  const totalAnggaran = rincianGroups
    .flatMap((g) => g.items)
    .reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);
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
    return <div className="p-6 text-center">Memuat data SPM...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditMode ? 'Detail / Edit SPM' : 'Buat SPM Baru'}
          </h1>
          <p className="text-gray-500 mt-1">
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
        <div className="bg-blue-100 p-4 mb-6 rounded-md">
          SPM ini sudah <strong>Diterima</strong>.
        </div>
      )}
      {error && <div className="bg-red-100 p-4 mb-6 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={isFormDisabled}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
              Informasi Utama
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="form-label">Nomor SPM</label>
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
                <label className="form-label">Tanggal</label>
                <input
                  type="date"
                  name="tanggal"
                  value={spmData.tanggal}
                  min={`${selectedYear}-01-01`}
                  max={`${selectedYear}-12-31`}
                  onChange={handleSpmDataChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Tahun Anggaran</label>
                <input
                  type="number"
                  name="tahunAnggaran"
                  value={isEditMode ? spmData.tahunAnggaran : selectedYear}
                  disabled
                  className="form-input-disabled"
                />
              </div>
              <div>
                <label className="form-label">Total Anggaran</label>
                <input
                  type="text"
                  value={formatCurrency(totalAnggaran)}
                  disabled
                  className="form-input-disabled font-mono text-lg"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
              Daftar Rincian
            </h2>
            <div className="space-y-6">
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
              className="btn-primary"
            >
              <Plus size={16} /> Tambah Kelompok Rincian
            </button>
          </div>
        </fieldset>

        <div className="pt-6 border-t flex justify-end gap-4">
          {showValidationButtons && (
            <>
              <button
                type="button"
                onClick={() => handleStatusUpdate('DITOLAK')}
                disabled={updateStatusMutation.isPending}
                className="btn-danger"
              >
                Tolak & Kembalikan
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('DITERIMA')}
                disabled={updateStatusMutation.isPending}
                className="btn-success"
              >
                Terima & Finalisasi
              </button>
            </>
          )}
          {showSaveButtons && (
            <>
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
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default SpmCreatePage;
