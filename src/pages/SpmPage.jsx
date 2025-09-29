import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import apiClient from '../api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';

// Helper untuk format tanggal dan mata uang
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatCurrency = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

function SpmListPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: spms,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['spms'],
    queryFn: async () => {
      const res = await apiClient.get('/spm');
      return res.data;
    },
  });

  const deleteSpmMutation = useMutation({
    mutationFn: (spmId) => apiClient.delete(`/spm/${spmId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      queryClient.invalidateQueries({ queryKey: ['allRincian'] });
    },
    onError: (error) => {
      alert(
        `Gagal menghapus SPM: ${error.response?.data?.error || error.message}`
      );
    },
  });

  const handleDelete = (spmId, nomorSpm) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus SPM dengan nomor "${nomorSpm}"?`
      )
    ) {
      deleteSpmMutation.mutate(spmId);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Daftar SPM
            </h1>
            <p className="text-slate-500 mt-1">
              Kelola semua Surat Perintah Membayar.
            </p>
          </div>
          <Link to="/spm/baru" className="btn-primary w-full md:w-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            <span>Buat SPM Baru</span>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          {isLoading && (
            <p className="text-center text-slate-500">Memuat data...</p>
          )}
          {isError && (
            <p className="text-center text-red-500">Error: {error.message}</p>
          )}

          {!isLoading && !isError && spms && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Nomor SPM
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Tanggal
                    </th>
                    {user && user.role !== 'op_satker' && (
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Satker
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Total Anggaran
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Jml. Rincian
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {spms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={user && user.role !== 'op_satker' ? 6 : 5}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Tidak ada data SPM yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    spms.map((spm) => (
                      <tr key={spm.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-sm font-medium text-slate-900">
                          {spm.nomorSpm}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {formatDate(spm.tanggal)}
                        </td>
                        {user && user.role !== 'op_satker' && (
                          <td className="px-4 py-4 text-sm text-slate-600">
                            {spm.satker?.nama || 'N/A'}
                          </td>
                        )}
                        <td className="px-4 py-4 text-sm text-slate-600 font-mono">
                          {formatCurrency(spm.totalAnggaran)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600 text-center">
                          {spm._count?.rincian || 0}
                        </td>
                        <td>
                          <StatusBadge status={spm.status} />
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium space-x-2">
                          <Link
                            to={`/spm/${spm.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(spm.id, spm.nomorSpm)}
                            disabled={deleteSpmMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Hapus
                          </button>
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
    </div>
  );
}

export default SpmListPage;
