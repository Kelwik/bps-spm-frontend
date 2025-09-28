import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import apiClient from '../api';
import RincianGroup from '../components/RincianGroup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Komponen Halaman untuk membuat atau mengedit SPM
function SpmCreatePage({ isEditMode = false }) {
  const { id: spmId } = useParams(); // Ambil ID dari URL jika dalam mode edit
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran: selectedYear } = useSatker();

  // --- State Lokal Komponen ---
  const [spmData, setSpmData] = useState({ nomorSpm: '', tanggal: '' });
  const [rincianGroups, setRincianGroups] = useState([]);
  const [error, setError] = useState(null);

  // --- Pengambilan Data untuk Mode Edit ---
  const { data: existingSpmData, isLoading: isLoadingSpm } = useQuery({
    queryKey: ['spm', spmId],
    queryFn: async () => {
      const res = await apiClient.get(`/spm/${spmId}`);
      return res.data;
    },
    // Hanya jalankan query ini jika dalam mode edit dan spmId ada
    enabled: isEditMode && !!spmId,
  });

  // --- Efek untuk Mengisi Form Saat Data Edit Tersedia ---
  useEffect(() => {
    if (isEditMode && existingSpmData) {
      // 1. Isi data utama SPM
      setSpmData({
        nomorSpm: existingSpmData.nomorSpm,
        // Format tanggal dari ISO string (YYYY-MM-DDTHH:mm:ss.sssZ) ke YYYY-MM-DD
        tanggal: new Date(existingSpmData.tanggal).toISOString().split('T')[0],
        tahunAnggaran: existingSpmData.tahunAnggaran,
      });

      // 2. Transformasi data rincian dari format 'datar' ke format 'bertingkat'
      const grouped = existingSpmData.rincian.reduce((acc, rincian) => {
        const groupKey = `${rincian.kodeProgram}-${rincian.kodeKegiatan}-${rincian.kodeAkunId}`;
        if (!acc[groupKey]) {
          acc[groupKey] = {
            id: crypto.randomUUID(), // Buat ID sementara untuk grup
            kodeProgram: rincian.kodeProgram,
            kodeKegiatan: rincian.kodeKegiatan,
            kodeAkunId: rincian.kodeAkunId,
            items: [],
          };
        }
        acc[groupKey].items.push({ ...rincian }); // 'id' rincian berasal dari database
        return acc;
      }, {});
      setRincianGroups(Object.values(grouped));
    }
  }, [isEditMode, existingSpmData]);

  // --- Logika Mutasi (Create/Update) dengan TanStack Mutation ---
  const { mutate: saveSpm, isPending: isSaving } = useMutation({
    mutationFn: (payload) => {
      if (isEditMode) {
        return apiClient.put(`/spm/${spmId}`, payload);
      }
      return apiClient.post('/spm', payload);
    },
    onSuccess: () => {
      // Segarkan kembali data di halaman daftar
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      queryClient.invalidateQueries({ queryKey: ['allRincian'] });
      // Kembali ke halaman daftar rincian
      navigate('/');
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

  // --- Handler untuk Form ---
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

    // Meratakan kembali data rincian untuk dikirim ke API
    const rincianForApi = rincianGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: isEditMode ? item.id : undefined, // Sertakan ID hanya jika mode edit
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

  // --- Tampilan UI ---
  if (isEditMode && isLoadingSpm) {
    return (
      <div className="p-6 text-center">Memuat data SPM untuk diedit...</div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          {isEditMode ? 'Edit SPM' : 'Buat SPM Baru'}
        </h1>
        <p className="text-slate-500 mb-8">
          {isEditMode
            ? 'Ubah detail SPM di bawah ini.'
            : 'Isi detail SPM dan tambahkan rincian belanja.'}
        </p>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Bagian Data Utama */}
          <div className="p-6 border border-slate-200 rounded-lg">
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              Informasi Utama
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
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
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={spmData.tanggal}
                  onChange={handleSpmDataChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Tahun Anggaran
                </label>
                <input
                  type="number"
                  name="tahunAnggaran"
                  value={isEditMode ? spmData.tahunAnggaran : selectedYear}
                  disabled
                  className="form-input bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Bagian Rincian */}
          <div>
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
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
              className="mt-6 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              ➕ Tambah Kelompok Rincian (Beda Kode Akun)
            </button>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-6 border-t border-slate-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
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
        </form>
      </div>
    </div>
  );
}

export default SpmCreatePage;
