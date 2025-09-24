import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import apiClient from '../api';
import RincianGroup from '../components/RincianGroup';

function SpmCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSatkerId } = useSatker();

  const [nomorSpm, setNomorSpm] = useState('');
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tahunAnggaran, setTahunAnggaran] = useState(new Date().getFullYear());
  const [rincianGroups, setRincianGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const targetSatkerId =
    user.role === 'op_satker' ? user.satkerId : selectedSatkerId;

  const handleAddGroup = () => {
    setRincianGroups([
      ...rincianGroups,
      {
        id: crypto.randomUUID(),
        kodeProgram: '',
        kodeKegiatan: '',
        kodeAkunId: null,
        items: [],
      },
    ]);
  };

  const handleRemoveGroup = (groupId) => {
    setRincianGroups(rincianGroups.filter((group) => group.id !== groupId));
  };

  const handleUpdateGroup = (groupId, updatedData) => {
    setRincianGroups(
      rincianGroups.map((group) =>
        group.id === groupId ? { ...group, ...updatedData } : group
      )
    );
  };

  const handleAddItem = (groupId) => {
    setRincianGroups(
      rincianGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            items: [
              ...group.items,
              { id: crypto.randomUUID(), jumlah: 0, jawabanFlags: [] },
            ],
          };
        }
        return group;
      })
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!targetSatkerId) {
      setError(
        'Untuk admin provinsi, silakan pilih Satker terlebih dahulu di dashboard.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    const flatRincian = rincianGroups.flatMap((group) =>
      group.items.map((item) => ({
        kodeProgram: group.kodeProgram,
        kodeKegiatan: group.kodeKegiatan,
        kodeAkunId: group.kodeAkunId,
        jumlah: item.jumlah,
        jawabanFlags: item.jawabanFlags,
      }))
    );

    try {
      await apiClient.post('/spm', {
        nomorSpm,
        tanggal,
        tahunAnggaran,
        satkerId: targetSatkerId,
        rincian: flatRincian,
      });
      navigate('/spm');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan SPM.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Buat SPM Baru</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-lg font-semibold text-gray-700 px-2">
              Data Utama SPM
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="flex flex-col">
                <label
                  htmlFor="nomorSpm"
                  className="mb-2 font-medium text-gray-700"
                >
                  Nomor SPM
                </label>
                <input
                  type="text"
                  id="nomorSpm"
                  value={nomorSpm}
                  onChange={(e) => setNomorSpm(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="tanggal"
                  className="mb-2 font-medium text-gray-700"
                >
                  Tanggal
                </label>
                <input
                  type="date"
                  id="tanggal"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="tahunAnggaran"
                  className="mb-2 font-medium text-gray-700"
                >
                  Tahun Anggaran
                </label>
                <input
                  type="number"
                  id="tahunAnggaran"
                  value={tahunAnggaran}
                  onChange={(e) => setTahunAnggaran(parseInt(e.target.value))}
                  required
                  className="input-field"
                />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Satker Target:{' '}
              <strong className="font-semibold text-gray-800">
                {targetSatkerId || 'Belum Dipilih'}
              </strong>
            </p>
          </fieldset>

          <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-lg font-semibold text-gray-700 px-2">
              Rincian
            </legend>
            <div className="space-y-6 mt-4">
              {rincianGroups.map((group) => (
                <RincianGroup
                  key={group.id}
                  groupData={group}
                  onUpdate={handleUpdateGroup}
                  onRemove={handleRemoveGroup}
                  onAddItem={handleAddItem}
                  setRincianGroups={setRincianGroups}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddGroup}
              className="btn-secondary mt-6"
            >
              + Tambah Kelompok Rincian (Beda Kode Akun)
            </button>
          </fieldset>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-center">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan SPM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SpmCreatePage;
