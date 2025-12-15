// src/pages/SpmPage.jsx

import { useState, useRef, useEffect } from 'react';
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
  Search,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
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

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('tanggal');
  const [sortOrder, setSortOrder] = useState('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [spmToDelete, setSpmToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  const isViewer = user?.role === 'viewer';

  // --- EFFECTS ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- QUERY ---
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'spms',
      {
        satker: selectedSatkerId,
        tahun: tahunAnggaran,
        page: currentPage,
        search: debouncedSearch,
        status: statusFilter,
        sortBy,
        order: sortOrder,
      },
    ],
    queryFn: async () =>
      apiClient
        .get('/spm', {
          params: {
            satkerId: selectedSatkerId,
            tahun: tahunAnggaran,
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedSearch,
            status: statusFilter,
            sortBy,
            order: sortOrder,
          },
        })
        .then((res) => res.data),
    enabled: isContextSet,
    placeholderData: (previousData) => previousData,
  });

  const spms = data?.spms;
  const totalPages = data?.totalPages;

  // --- MUTATIONS ---
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

  // --- HANDLERS ---
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

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
    }
  };

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
      setSuccessMessage(res.data.message || 'Import berhasil!');
      queryClient.invalidateQueries({ queryKey: ['spms'] });
    } catch (err) {
      setErrorMessage(
        `Import gagal: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setIsImporting(false);
      e.target.value = null;
    }
  };

  const openDeleteModal = (spm) => setSpmToDelete(spm);
  const confirmDelete = () => {
    if (spmToDelete) deleteSpmMutation.mutate(spmToDelete.id);
  };

  // --- COMPONENTS ---

  const HeaderCell = ({
    label,
    field,
    sortable = true,
    align = 'left',
    width,
  }) => {
    const isActive = sortBy === field;

    return (
      <th
        className={`
          px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none bg-gray-50/50 border-b border-gray-100
          ${
            sortable
              ? 'cursor-pointer hover:bg-gray-100/50 hover:text-bpsBlue-dark transition-colors group'
              : ''
          }
          ${
            align === 'right'
              ? 'text-right'
              : align === 'center'
              ? 'text-center'
              : 'text-left'
          }
        `}
        style={{ width: width }}
        onClick={sortable ? () => handleSort(field) : undefined}
      >
        <div
          className={`flex items-center gap-1.5 ${
            align === 'right'
              ? 'justify-end'
              : align === 'center'
              ? 'justify-center'
              : 'justify-start'
          }`}
        >
          <span>{label}</span>
          {sortable && (
            <span
              className={`transition-all duration-200 ${
                isActive
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-1 group-hover:opacity-40 group-hover:translate-y-0'
              }`}
            >
              {isActive && sortOrder === 'asc' ? (
                <ChevronUp size={14} strokeWidth={2.5} />
              ) : isActive && sortOrder === 'desc' ? (
                <ChevronDown size={14} strokeWidth={2.5} />
              ) : (
                <ChevronsUpDown size={14} />
              )}
            </span>
          )}
        </div>
      </th>
    );
  };

  const isProvAndNoSatkerSelected =
    (user?.role === 'op_prov' || user?.role === 'supervisor') &&
    !selectedSatkerId;

  // Filter Tabs Configuration
  const tabs = [
    { id: 'ALL', label: 'Semua' },
    { id: 'MENUNGGU', label: 'Menunggu' },
    { id: 'DITERIMA', label: 'Diterima' },
    { id: 'DITOLAK', label: 'Ditolak' },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Daftar SPM
            </h1>
            <p className="text-gray-500 mt-1">
              Kelola dan pantau semua Surat Perintah Membayar.
            </p>
          </div>

          {!isViewer && (
            <div className="flex flex-wrap gap-2 w-full xl:w-auto">
              <button
                onClick={handleDownloadTemplate}
                className="btn-secondary flex items-center gap-2 shadow-sm"
              >
                <Download size={18} />{' '}
                <span className="hidden sm:inline">Template</span>
              </button>

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
                  className={`btn-success flex items-center gap-2 shadow-sm ${
                    isProvAndNoSatkerSelected || !isContextSet
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <FileSpreadsheet size={18} />{' '}
                  <span>{isImporting ? 'Loading...' : 'Import'}</span>
                </button>
              </div>

              <div title={isProvAndNoSatkerSelected ? 'Pilih Satker dulu' : ''}>
                <Link
                  to="/spm/baru"
                  className={`btn-primary flex items-center gap-2 shadow-md shadow-blue-500/20 ${
                    isProvAndNoSatkerSelected || !isContextSet
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  onClick={(e) => {
                    if (isProvAndNoSatkerSelected || !isContextSet)
                      e.preventDefault();
                  }}
                >
                  <Plus size={18} /> <span>Buat Baru</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* MAIN CARD (Contains Toolbar + Table) */}
        <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* INTEGRATED TOOLBAR (Header of Card) */}
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
            {/* Left: Status Tabs (Pills) */}
            <div className="flex bg-gray-50 p-1.5 rounded-lg border border-gray-100 self-start md:self-auto overflow-x-auto max-w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`
                    px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${
                      statusFilter === tab.id
                        ? 'bg-white text-bpsBlue shadow-sm ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right: Search Bar */}
            <div className="relative w-full md:w-72 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-bpsBlue transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari Nomor SPM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-bpsBlue/20 focus:border-bpsBlue outline-none transition-all placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* TABLE CONTENT */}
          {!isContextSet ? (
            <div className="text-center py-20 bg-gray-50/30">
              <p className="text-gray-500">
                Silakan atur konteks (Satker & Tahun) di Dashboard.
              </p>
            </div>
          ) : isLoading && !data ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin w-6 h-6 border-2 border-bpsBlue border-t-transparent rounded-full mb-2"></div>
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20 text-red-500">
              Error: {error.message}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead>
                    <tr>
                      <HeaderCell
                        label="Nomor SPM"
                        field="nomorSpm"
                        width="22%"
                      />
                      <HeaderCell label="Tanggal" field="tanggal" width="15%" />
                      {user?.role !== 'op_satker' && (
                        <HeaderCell label="Satker" field="satker" width="18%" />
                      )}
                      <HeaderCell
                        label="Total Anggaran"
                        field="totalAnggaran"
                        align="right"
                        width="18%"
                      />
                      <HeaderCell
                        label="Rincian"
                        field="rincianCount"
                        align="center"
                        width="10%"
                        sortable={false}
                      />
                      <HeaderCell
                        label="Status"
                        field="status"
                        align="center"
                        width="12%"
                      />
                      <HeaderCell
                        label=""
                        field="action"
                        align="right"
                        width="10%"
                        sortable={false}
                      />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {spms?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={user?.role !== 'op_satker' ? 7 : 6}
                          className="text-center py-16"
                        >
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <div className="bg-gray-50 p-4 rounded-full mb-3">
                              <Search size={32} strokeWidth={1.5} />
                            </div>
                            <p className="text-lg font-medium text-gray-600">
                              Tidak ada data ditemukan
                            </p>
                            <p className="text-sm">
                              Coba sesuaikan kata kunci atau filter anda.
                            </p>
                            {(searchTerm || statusFilter !== 'ALL') && (
                              <button
                                onClick={() => {
                                  setSearchTerm('');
                                  setStatusFilter('ALL');
                                }}
                                className="mt-4 text-bpsBlue hover:text-bpsBlue-dark text-sm font-medium hover:underline"
                              >
                                Reset Filter
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      spms.map((spm) => (
                        <tr
                          key={spm.id}
                          className="hover:bg-blue-50/30 transition-colors group border-b border-gray-50 last:border-b-0"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate">
                            <div className="flex items-center gap-2.5">
                              <span title={spm.nomorSpm}>{spm.nomorSpm}</span>
                              {spm.driveLink && (
                                <a
                                  href={spm.driveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 p-1 rounded-md"
                                  title="Buka Google Drive"
                                >
                                  <LinkIcon size={12} />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(spm.tanggal)}
                          </td>
                          {user?.role !== 'op_satker' && (
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate"
                              title={spm.satker?.nama}
                            >
                              {spm.satker?.nama || '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-right">
                            {formatCurrency(spm.totalAnggaran)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                              {spm._count?.rincian || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <StatusBadge status={spm.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <Link
                              to={`/spm/${spm.id}/edit`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-bpsBlue hover:text-bpsBlue-dark hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit size={14} />{' '}
                              <span>{isViewer ? 'Lihat' : 'Detail'}</span>
                            </Link>
                            {!isViewer &&
                              ['MENUNGGU', 'DITOLAK'].includes(spm.status) && (
                                <button
                                  onClick={() => openDeleteModal(spm)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODALS */}
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
          Hapus SPM <strong>{spmToDelete?.nomorSpm}</strong>? Tindakan ini tidak
          dapat dibatalkan.
        </p>
      </Modal>

      <Modal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title={
          <span className="flex items-center gap-2 text-red-600">
            <AlertCircle size={20} /> Error
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

      <Modal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        title={
          <span className="flex items-center gap-2 text-green-600">
            <AlertCircle size={20} /> Berhasil
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
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {successMessage}
        </p>
      </Modal>
    </>
  );
}

export default SpmPage;
