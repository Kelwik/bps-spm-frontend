// src/pages/SpmPage.jsx

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import apiClient from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import {
  Plus,
  Edit,
  Trash2,
  Link as LinkIcon,
  Download,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

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

  // State for Delete Confirmation
  const [spmToDelete, setSpmToDelete] = useState(null);

  // State for Error Handling (Replaces alert)
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for Import
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isViewer = user?.role === 'viewer';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'spms',
      { satker: selectedSatkerId, tahun: tahunAnggaran, page: currentPage },
    ],
    queryFn: async () =>
      apiClient
        .get('/spm', {
          params: {
            satkerId: selectedSatkerId,
            tahun: tahunAnggaran,
            page: currentPage,
            limit: itemsPerPage,
          },
        })
        .then((res) => res.data),
    enabled: isContextSet,
    placeholderData: (previousData) => previousData,
  });

  const spms = data?.spms;
  const totalPages = data?.totalPages;

  const deleteSpmMutation = useMutation({
    mutationFn: (spmId) => apiClient.delete(`/spm/${spmId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      setSpmToDelete(null);
      setSuccessMessage('SPM berhasil dihapus.');
    },
    onError: (error) => {
      setErrorMessage(
        `Gagal menghapus SPM: ${error.response?.data?.error || error.message}`
      );
      setSpmToDelete(null);
    },
  });

  const openDeleteModal = (spm) => setSpmToDelete(spm);
  const confirmDelete = () => {
    if (spmToDelete) {
      deleteSpmMutation.mutate(spmToDelete.id);
    }
  };

  // --- HANDLER: Download Template ---
  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get('/spm/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template_Import_SPM.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMessage('Gagal mendownload template. Silakan coba lagi.');
      console.error(err);
    }
  };

  // --- HANDLER: Upload Excel ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedSatkerId && user.role !== 'op_satker') {
      setErrorMessage('Harap pilih Satker terlebih dahulu di Dashboard.');
      e.target.value = null;
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (selectedSatkerId) formData.append('satkerId', selectedSatkerId);

    setIsImporting(true);
    try {
      const res = await apiClient.post('/spm/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMessage(
        res.data.message || 'Import berhasil! Data telah ditambahkan.'
      );
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      queryClient.invalidateQueries({ queryKey: ['spmsDashboardStats'] });
    } catch (err) {
      console.error(err);
      setErrorMessage(
        `Import gagal: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setIsImporting(false);
      e.target.value = null;
    }
  };

  const isProvAndNoSatkerSelected =
    (user?.role === 'op_prov' || user?.role === 'supervisor') &&
    !selectedSatkerId;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Daftar SPM</h1>
            <p className="text-gray-500 mt-1">
              Kelola dan pantau semua Surat Perintah Membayar yang terdaftar.
            </p>
          </div>

          {!isViewer && (
            <div className="flex flex-wrap gap-2 w-full xl:w-auto">
              {/* 1. Tombol Download Template */}
              <button
                onClick={handleDownloadTemplate}
                className="btn-secondary flex items-center gap-2"
                title="Download format Excel untuk import"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Template</span>
              </button>

              {/* 2. Tombol Import Excel */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={
                    isImporting || isProvAndNoSatkerSelected || !isContextSet
                  }
                  className={`btn-success flex items-center gap-2 ${
                    isProvAndNoSatkerSelected || !isContextSet
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  title={isProvAndNoSatkerSelected ? 'Pilih Satker dulu' : ''}
                >
                  <FileSpreadsheet size={18} />
                  <span>{isImporting ? 'Mengupload...' : 'Import Excel'}</span>
                </button>
              </div>

              {/* 3. Tombol Buat SPM Manual */}
              <div
                className="relative"
                title={
                  isProvAndNoSatkerSelected
                    ? 'Silakan pilih Satker spesifik di Dashboard untuk membuat SPM baru'
                    : ''
                }
              >
                <Link
                  to="/spm/baru"
                  className={`btn-primary flex items-center gap-2 ${
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
                  <span>Buat Baru</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          {!isContextSet ? (
            <p className="text-center text-gray-500 py-10">
              Silakan atur konteks di Dashboard untuk melihat data SPM.
            </p>
          ) : isLoading && !data ? (
            <p className="text-center text-gray-500 py-10">Memuat data...</p>
          ) : isError ? (
            <p className="text-center text-red-500 py-10">
              Error: {error.message}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nomor SPM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      {user?.role !== 'op_satker' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Satker
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Anggaran
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jml. Rincian
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {spms?.length === 0 ? (
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
                              <Edit size={14} />{' '}
                              <span>{isViewer ? 'Lihat' : 'Detail'}</span>
                            </Link>

                            {!isViewer &&
                              ['MENUNGGU', 'DITOLAK'].includes(spm.status) && (
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

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </div>
      </div>

      {/* --- MODAL: DELETE CONFIRMATION --- */}
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

      {/* --- MODAL: ERROR MESSAGE --- */}
      <Modal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title={
          <span className="flex items-center gap-2 text-red-600">
            <AlertCircle size={20} />
            Terjadi Kesalahan
          </span>
        }
        footer={
          <button
            onClick={() => setErrorMessage(null)}
            className="btn-secondary"
          >
            Tutup
          </button>
        }
      >
        <p className="text-sm text-gray-600">{errorMessage}</p>
      </Modal>

      {/* --- MODAL: SUCCESS MESSAGE --- */}
      <Modal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        title={
          <span className="flex items-center gap-2 text-green-600">
            <AlertCircle size={20} />
            Berhasil
          </span>
        }
        footer={
          <button
            onClick={() => setSuccessMessage(null)}
            className="btn-primary"
          >
            OK
          </button>
        }
      >
        <p className="text-sm text-gray-600">{successMessage}</p>
      </Modal>
    </>
  );
}

export default SpmPage;
