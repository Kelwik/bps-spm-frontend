import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import apiClient from '../api';
import { useAuth } from '../contexts/AuthContext';
import PercentageCircle from '../components/PercentageCircle';
import StatusBadge from '../components/StatusBadge';

// Helper
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
  }).format(number);

function SpmPercentage() {
  const { user } = useAuth();

  const {
    data: spms,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['spms'], // Kita gunakan query key yang sama agar data di-cache
    queryFn: async () => apiClient.get('/spm').then((res) => res.data),
  });

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Laporan Kelengkapan SPM
          </h1>
          <p className="text-slate-500 mt-1">
            Analisis persentase kelengkapan dokumen untuk setiap SPM.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          {isLoading && (
            <p className="text-center text-slate-500">Memuat data laporan...</p>
          )}
          {isError && (
            <p className="text-center text-red-500">Error: {error.message}</p>
          )}

          {!isLoading && !isError && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Nomor SPM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    {user?.role !== 'op_satker' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Satker
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Anggaran
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Kelengkapan Dokumen
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Detail</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {spms?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={user?.role !== 'op_satker' ? 7 : 6}
                        className="text-center py-8 text-slate-500"
                      >
                        Tidak ada data SPM untuk ditampilkan.
                      </td>
                    </tr>
                  ) : (
                    spms?.map((spm) => (
                      <tr key={spm.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {spm.nomorSpm}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {formatDate(spm.tanggal)}
                        </td>
                        {user?.role !== 'op_satker' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {spm.satker?.nama || 'N/A'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                          {formatCurrency(spm.totalAnggaran)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                          <StatusBadge status={spm.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-center">
                            <PercentageCircle
                              percentage={spm.completenessPercentage}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/spm/${spm.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Lihat Detail
                          </Link>
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

export default SpmPercentage;
