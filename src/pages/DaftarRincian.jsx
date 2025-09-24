import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import apiClient from '../api';
import PercentageCircle from '../components/PercentageCircle';

const formatCurrency = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

function AllRincianPage() {
  const {
    data: allRincian,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['allRincian'],
    queryFn: async () => {
      const res = await apiClient.get('/rincian');
      return res.data;
    },
  });

  if (isLoading)
    return <div className="p-8 text-center">Memuat daftar rincian...</div>;
  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        Error: {error.response?.data?.error || error.message}
      </div>
    );

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Semua Rincian SPM
          </h1>
          <Link to="/spm/baru" className="btn-primary">
            + Buat SPM Baru
          </Link>
        </div>

        {/* Tabel Rincian */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
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
                  Detail Akun
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Jumlah
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kelengkapan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allRincian.map((rincian) => (
                <tr key={rincian.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {rincian.spm.nomorSpm}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {rincian.kodeAkun.nama}
                    </div>
                    <div className="text-sm text-gray-500">
                      {rincian.kodeProgram}/{rincian.kodeKegiatan}/
                      {rincian.kodeAkun.kode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-indigo-700">
                      {formatCurrency(rincian.jumlah)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      <PercentageCircle
                        percentage={rincian.persentaseKelengkapan}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AllRincianPage;
