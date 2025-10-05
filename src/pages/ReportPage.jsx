import { useQuery } from '@tanstack/react-query';
import { useSatker } from '../contexts/SatkerContext';
import apiClient from '../api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText } from 'lucide-react';

function SatkerPerformancePage() {
  const { tahunAnggaran, setTahunAnggaran } = useSatker();

  const {
    data: performanceData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['satkerPerformance', tahunAnggaran],
    queryFn: async () =>
      apiClient
        .get(`/reports/satker-performance?tahun=${tahunAnggaran}`)
        .then((res) => res.data),
  });

  const sortedByRejection = performanceData
    ? [...performanceData].sort((a, b) => b.rejectionRate - a.rejectionRate)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Laporan Kinerja Satker
        </h1>
        <p className="text-gray-500 mt-1">
          Analisis dan perbandingan kinerja antar Satuan Kerja.
        </p>
      </div>

      {/* Filter Tahun */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 max-w-xs">
        <label className="font-semibold text-gray-700">Tahun Anggaran:</label>
        <select
          className="form-input"
          value={tahunAnggaran}
          onChange={(e) => setTahunAnggaran(e.target.value)}
        >
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
      </div>

      {isLoading && (
        <p className="text-center text-gray-500 py-10">
          Menghitung data kinerja...
        </p>
      )}
      {isError && (
        <p className="text-center text-red-500 py-10">Error: {error.message}</p>
      )}

      {!isLoading && !isError && performanceData && (
        <div className="space-y-8">
          {/* Grafik Tingkat Penolakan */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Peringkat Tingkat Penolakan SPM (%)
            </h2>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={sortedByRejection}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    dataKey="nama"
                    type="category"
                    stroke="#374151"
                    fontSize={12}
                    width={150}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '0.5rem' }}
                  />
                  <Bar
                    dataKey="rejectionRate"
                    name="Tingkat Penolakan"
                    unit="%"
                    radius={[0, 4, 4, 0]}
                  >
                    {sortedByRejection.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.rejectionRate > 20
                            ? '#ef4444'
                            : entry.rejectionRate > 10
                            ? '#f59e0b'
                            : '#22c55e'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabel Detail Kinerja */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Tabel Detail Kinerja Satker
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nama Satker
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Total SPM
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      SPM Ditolak
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Tingkat Penolakan
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Rata-rata Kelengkapan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceData.map((satker) => (
                    <tr key={satker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {satker.nama}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {satker.totalSpm}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {satker.totalDitolak}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-center ${
                          satker.rejectionRate > 20
                            ? 'text-red-600'
                            : satker.rejectionRate > 10
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {satker.rejectionRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center text-blue-600">
                        {satker.averageCompleteness}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SatkerPerformancePage;
