import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import apiClient from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import { useMemo } from 'react';
import { Edit } from 'lucide-react';

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

function DaftarRincian() {
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran, isContextSet } = useSatker();

  const {
    data: allRincian,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'allRincian',
      { satker: selectedSatkerId, tahun: tahunAnggaran },
    ],
    queryFn: async () =>
      apiClient
        .get('/rincian', {
          params: { satkerId: selectedSatkerId, tahun: tahunAnggaran },
        })
        .then((res) => res.data),
    enabled: isContextSet,
  });

  const groupedSpms = useMemo(() => {
    if (!allRincian) return [];
    const groups = allRincian.reduce((acc, rincian) => {
      const spmKey = rincian.spm.nomorSpm;
      if (!acc[spmKey]) {
        acc[spmKey] = { ...rincian.spm, id: rincian.spmId, rincianItems: [] };
      }
      acc[spmKey].rincianItems.push(rincian);
      return acc;
    }, {});
    return Object.values(groups);
  }, [allRincian]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Laporan Semua Rincian
        </h1>
        <p className="text-gray-500 mt-1">
          Daftar terperinci semua item belanja yang dikelompokkan per SPM.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {!isContextSet ? (
          <p className="text-center text-gray-500 py-10">
            Silakan atur konteks di Dashboard untuk melihat laporan.
          </p>
        ) : isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Memuat Laporan Rincian...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Error: {error.message}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Info SPM
                  </th>
                  {user?.role !== 'op_satker' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Satker
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Detail Akun Rincian
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="w-56 px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Kelengkapan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {groupedSpms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      Tidak ada data rincian ditemukan untuk konteks ini.
                    </td>
                  </tr>
                ) : (
                  groupedSpms.flatMap((spm, spmIndex) =>
                    spm.rincianItems.map((rincian, rincianIndex) => (
                      <tr
                        key={rincian.id}
                        className="border-b border-slate-100"
                      >
                        {rincianIndex === 0 && (
                          <td
                            className={`px-6 py-4 align-top ${
                              spmIndex > 0 ? 'border-t-2 border-slate-300' : ''
                            }`}
                            rowSpan={spm.rincianItems.length}
                          >
                            <div className="font-bold text-sm text-gray-900">
                              {spm.nomorSpm}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(spm.tanggal)}
                            </div>
                            <div className="mt-2">
                              <StatusBadge status={spm.status} />
                            </div>
                            <Link
                              to={`/spm/${spm.id}/edit`}
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-900 mt-3 font-semibold"
                            >
                              <Edit size={12} /> <span>Detail SPM</span>
                            </Link>
                          </td>
                        )}
                        {rincianIndex === 0 && user?.role !== 'op_satker' && (
                          <td
                            className={`px-6 py-4 align-top text-sm text-gray-600 ${
                              spmIndex > 0 ? 'border-t-2 border-slate-300' : ''
                            }`}
                            rowSpan={spm.rincianItems.length}
                          >
                            {spm.satker?.nama}
                          </td>
                        )}
                        <td
                          className={`px-6 py-4 align-top ${
                            rincianIndex === 0 && spmIndex > 0
                              ? 'border-t-2 border-slate-300'
                              : ''
                          }`}
                        >
                          <div className="text-sm font-semibold text-gray-800">
                            {rincian.kodeAkun.nama}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rincian.kodeProgram}/{rincian.kodeKegiatan}/
                            {rincian.kodeAkun.kode}
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 align-top text-sm font-mono text-right ${
                            rincianIndex === 0 && spmIndex > 0
                              ? 'border-t-2 border-slate-300'
                              : ''
                          }`}
                        >
                          {formatCurrency(rincian.jumlah)}
                        </td>
                        <td
                          className={`px-6 py-4 align-top ${
                            rincianIndex === 0 && spmIndex > 0
                              ? 'border-t-2 border-slate-300'
                              : ''
                          }`}
                        >
                          <ProgressBar
                            percentage={rincian.persentaseKelengkapan}
                          />
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DaftarRincian;
