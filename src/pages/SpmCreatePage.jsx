import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import apiClient from '../api';
import RincianGroup from '../components/RincianGroup';
import { useQueryClient } from '@tanstack/react-query';

function SpmCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran: selectedYear } = useSatker();

  const getDefaultTanggal = (year) => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [spmData, setSpmData] = useState({
    nomorSpm: '',
    tanggal: getDefaultTanggal(selectedYear),
    tahunAnggaran: selectedYear,
  });

  const [rincianGroups, setRincianGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSpmData((prev) => ({
      ...prev,
      tanggal: getDefaultTanggal(selectedYear),
      tahunAnggaran: selectedYear,
    }));
  }, [selectedYear]);

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
            kodeKRO: '',
            kodeRO: '',
            kodeKomponen: '',
            kodeSubkomponen: '',
            uraian: '',
            jawabanFlags: [],
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

  const handleSpmDataChange = (e) => {
    const { name, value } = e.target;

    if (name === 'tanggal') {
      const chosenDate = new Date(value);
      const forcedDate = new Date(
        selectedYear,
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const targetSatkerId =
      user.role === 'op_satker' ? user.satkerId : selectedSatkerId;
    if (!targetSatkerId) {
      setError(
        'Untuk admin provinsi, silakan pilih Satker terlebih dahulu di dashboard.'
      );
      setIsLoading(false);
      return;
    }

    const rincianForApi = rincianGroups.flatMap((group) =>
      group.items.map((item) => ({
        // Data yang sudah ada
        kodeProgram: group.kodeProgram,
        kodeKegiatan: group.kodeKegiatan,
        kodeAkunId: parseInt(group.kodeAkunId),
        jumlah: parseInt(item.jumlah),
        jawabanFlags: item.jawabanFlags,

        // 👇 --- PASTIKAN FIELD BARU DISERTAKAN --- 👇
        kodeKRO: item.kodeKRO,
        kodeRO: item.kodeRO,
        kodeKomponen: item.kodeKomponen,
        kodeSubkomponen: item.kodeSubkomponen,
        uraian: item.uraian,
      }))
    );

    const finalPayload = {
      ...spmData,
      satkerId: targetSatkerId,
      rincian: rincianForApi,
    };

    try {
      await apiClient.post('/spm', finalPayload);
      queryClient.invalidateQueries(['spms']);
      queryClient.invalidateQueries(['allRincian']);
      navigate('/');
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || 'Terjadi kesalahan saat menyimpan SPM.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">Buat SPM Baru</h1>
        <p className="text-gray-600 mb-6">
          Isi detail SPM dan tambahkan rincian belanja.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Informasi Utama
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor SPM
                </label>
                <input
                  type="text"
                  name="nomorSpm"
                  value={spmData.nomorSpm}
                  onChange={handleSpmDataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="001/SPM/V/2025"
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
                  min={`${selectedYear}-01-01`}
                  max={`${selectedYear}-12-31`}
                  onChange={handleSpmDataChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  value={selectedYear}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
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
              className="mt-6 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Tambah Kelompok Rincian (Beda Kode Akun)
            </button>
          </div>

          <div className="pt-6 border-t border-gray-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan SPM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SpmCreatePage;
