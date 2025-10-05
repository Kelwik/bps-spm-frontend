import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import apiClient from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Link as LinkIcon } from 'lucide-react'; // Add LinkIcon

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
const formatCurrency = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);

function SpmPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran, isContextSet } = useSatker();
  const [spmToDelete, setSpmToDelete] = useState(null);

  const {
    data: spms,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['spms', { satker: selectedSatkerId, tahun: tahunAnggaran }],
    queryFn: async () =>
      apiClient
        .get('/spm', {
          params: { satkerId: selectedSatkerId, tahun: tahunAnggaran },
        })
        .then((res) => res.data),
    enabled: isContextSet,
  });

  const deleteSpmMutation = useMutation({
    mutationFn: (spmId) => apiClient.delete(`/spm/${spmId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      setSpmToDelete(null);
    },
    onError: (error) =>
      alert(
        `Gagal menghapus SPM: ${error.response?.data?.error || error.message}`
      ),
  });

  const openDeleteModal = (spm) => setSpmToDelete(spm);
  const confirmDelete = () => {
    if (spmToDelete) {
      deleteSpmMutation.mutate(spmToDelete.id);
    }
  };

  const isProvAndNoSatkerSelected =
    (user?.role === 'op_prov' || user?.role === 'supervisor') &&
    !selectedSatkerId;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Daftar SPM</h1>
            <p className="text-gray-500 mt-1">
              Kelola dan pantau semua Surat Perintah Membayar yang terdaftar.
            </p>
          </div>
          <div
            className="relative w-full md:w-auto"
            title={
              isProvAndNoSatkerSelected
                ? 'Silakan pilih Satker spesifik di Dashboard untuk membuat SPM baru'
                : ''
            }
          >
            <Link
              to="/spm/baru"
              className={`btn-primary w-full ${
                isProvAndNoSatkerSelected || !isContextSet
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              onClick={(e) => {
                if (isProvAndNoSatkerSelected || !isContextSet)
                  e.preventDefault();
              }}
              aria-disabled={isProvAndNoSatkerSelected || !isContextSet}
            >
              <Plus size={18} />
              <span>Buat SPM Baru</span>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          {!isContextSet ? (
            <p className="text-center text-gray-500 py-10">
              Silakan atur konteks di Dashboard untuk melihat data SPM.
            </p>
          ) : isLoading ? (
            <p className="text-center text-gray-500 py-10">Memuat data...</p>
          ) : isError ? (
            <p className="text-center text-red-500 py-10">
              Error: {error.message}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nomor SPM
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Tanggal
                    </th>
                    {user?.role !== 'op_satker' && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Satker
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total Anggaran
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Jml. Rincian
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={user?.role !== 'op_satker' ? 7 : 6}
                        className="text-center py-8 text-gray-500"
                      >
                        Tidak ada data SPM yang ditemukan untuk konteks ini.
                      </td>
                    </tr>
                  ) : (
                    spms.map((spm) => (
                      <tr
                        key={spm.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {spm.driveLink && (
                              <a
                                href={spm.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Buka tautan G-Drive"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <LinkIcon className="w-4 h-4" />
                              </a>
                            )}
                            <span>{spm.nomorSpm}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(spm.tanggal)}
                        </td>
                        {user?.role !== 'op_satker' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {spm.satker?.nama || 'N/A'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-right">
                          {formatCurrency(spm.totalAnggaran)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {spm._count?.rincian || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <StatusBadge status={spm.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                          <Link
                            to={`/spm/${spm.id}/edit`}
                            className="inline-flex items-center gap-1.5 text-bpsBlue-dark hover:text-bpsBlue-light font-semibold"
                          >
                            <Edit size={14} /> <span>Detail</span>
                          </Link>
                          {['MENUNGGU', 'DITOLAK'].includes(spm.status) && (
                            <button
                              onClick={() => openDeleteModal(spm)}
                              disabled={deleteSpmMutation.isPending}
                              className="inline-flex items-center gap-1.5 text-danger hover:text-danger-dark disabled:opacity-50 font-semibold"
                            >
                              <Trash2 size={14} /> <span>Hapus</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={!!spmToDelete}
        onClose={() => setSpmToDelete(null)}
        title="Konfirmasi Penghapusan"
        footer={
          <>
            <button
              onClick={() => setSpmToDelete(null)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              onClick={confirmDelete}
              className="btn-danger"
              disabled={deleteSpmMutation.isPending}
            >
              {deleteSpmMutation.isPending ? 'Menghapus...' : 'Ya, Hapus SPM'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Apakah Anda benar-benar yakin ingin menghapus SPM dengan nomor:
          <br />
          <strong className="font-semibold text-gray-900 mt-2 block">
            {spmToDelete?.nomorSpm}
          </strong>
          <br />
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </>
  );
}

export default SpmPage;
