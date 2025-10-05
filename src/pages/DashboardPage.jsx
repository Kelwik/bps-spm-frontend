import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
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
} from 'recharts';
import {
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  CalendarDays,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// Komponen Kartu Statistik (No changes needed)
function SummaryCard({ icon, title, value, colorClass }) {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-md flex items-center gap-5 border-l-4 ${colorClass}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// Komponen untuk Kontrol Konteks/Filter
function ContextControls({ isContextSet, setIsContextSet }) {
  const { user } = useAuth();
  const {
    selectedSatkerId,
    setSelectedSatkerId,
    tahunAnggaran,
    setTahunAnggaran,
  } = useSatker();

  const [draftTahun, setDraftTahun] = useState(tahunAnggaran);
  const [draftSatker, setDraftSatker] = useState(selectedSatkerId || '');

  const { data: satkerList, isLoading: isLoadingSatkers } = useQuery({
    queryKey: ['satkers'],
    queryFn: async () => apiClient.get('/satker').then((res) => res.data),
  });

  useEffect(() => {
    setDraftSatker(selectedSatkerId || '');
    setDraftTahun(tahunAnggaran);
  }, [selectedSatkerId, tahunAnggaran]);

  const handleToggleContext = () => {
    if (isContextSet) {
      setIsContextSet(false);
    } else {
      if (user.role !== 'op_satker') {
        setSelectedSatkerId(draftSatker ? parseInt(draftSatker) : null);
      }
      setTahunAnggaran(draftTahun);
      setIsContextSet(true);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <Settings size={20} className="text-bpsBlue-dark" />
        <h2 className="text-xl font-bold text-gray-800">
          Pengaturan Konteks Data
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Satuan Kerja
          </label>
          <select
            className="form-input"
            value={user.role === 'op_satker' ? user.satkerId : draftSatker}
            onChange={(e) => setDraftSatker(e.target.value)}
            disabled={
              isContextSet || user.role === 'op_satker' || isLoadingSatkers
            }
          >
            {user.role !== 'op_satker' && (
              <option value="">Semua Satker</option>
            )}
            {satkerList?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tahun Anggaran
          </label>
          <select
            className="form-input"
            value={draftTahun}
            onChange={(e) => setDraftTahun(e.target.value)}
            disabled={isContextSet}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
        <div className="w-full">
          <button
            onClick={handleToggleContext}
            className={`w-full ${
              isContextSet ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            {isContextSet ? 'Ubah Konteks' : 'Terapkan Konteks'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran, isContextSet, setIsContextSet } =
    useSatker();

  const {
    data, // Get the entire response object as 'data'
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'spmsDashboard',
      { satker: selectedSatkerId, tahun: tahunAnggaran },
    ],
    queryFn: async () => {
      // For dashboard stats, we fetch ALL SPMs, so pagination params are removed.
      const res = await apiClient.get('/spm', {
        params: { satkerId: selectedSatkerId, tahun: tahunAnggaran },
      });
      return res.data;
    },
    enabled: isContextSet,
  });

  // Extract the 'spms' array from the response object
  const spms = data?.spms;

  const { data: satkerList } = useQuery({
    queryKey: ['satkers'],
    queryFn: () => apiClient.get('/satker').then((res) => res.data),
  });

  // The stats calculation will now work correctly on the 'spms' array
  const stats = {
    total: data?.totalCount || 0, // Use totalCount from API for accuracy
    diterima: spms?.filter((spm) => spm.status === 'DITERIMA').length || 0,
    ditolak: spms?.filter((spm) => spm.status === 'DITOLAK').length || 0,
    menunggu: spms?.filter((spm) => spm.status === 'MENUNGGU').length || 0,
  };

  const chartData = [
    { name: 'Menunggu', total: stats.menunggu, color: '#f59e0b' },
    { name: 'Ditolak', total: stats.ditolak, color: '#ef4444' },
    { name: 'Diterima', total: stats.diterima, color: '#22c55e' },
  ];

  const currentSatkerName =
    user?.role === 'op_satker'
      ? satkerList?.find((s) => s.id === user.satkerId)?.nama
      : selectedSatkerId
      ? satkerList?.find((s) => s.id === selectedSatkerId)?.nama
      : 'Semua Satker';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Selamat Datang, {user?.name}!
        </h1>
        <p className="mt-1 text-gray-500">
          Pilih konteks data di bawah ini untuk melihat ringkasan atau membuat
          SPM baru.
        </p>
      </div>

      {/* Context Controls */}
      <ContextControls
        isContextSet={isContextSet}
        setIsContextSet={setIsContextSet}
      />

      {/* Conditional Content */}
      {isContextSet ? (
        <>
          {/* Active Context Indicator */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Building size={18} />
                <span className="font-semibold">{currentSatkerName}</span>
              </div>
              <div className="border-l border-gray-300 h-6"></div>
              <div className="flex items-center gap-2">
                <CalendarDays size={18} />
                <span className="font-semibold">
                  Tahun Anggaran: {tahunAnggaran}
                </span>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {isLoading && (
            <div className="text-center text-gray-500 py-10">
              Memuat data statistik...
            </div>
          )}
          {isError && (
            <div className="text-center text-red-500 py-10">
              Error: {error.message}
            </div>
          )}

          {/* Data and Chart Content */}
          {!isLoading && !isError && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard
                  icon={<FileSpreadsheet size={28} className="text-blue-500" />}
                  title="Total SPM"
                  value={stats.total}
                  colorClass="border-blue-500"
                />
                <SummaryCard
                  icon={<CheckCircle size={28} className="text-green-500" />}
                  title="Diterima"
                  value={stats.diterima}
                  colorClass="border-green-500"
                />
                <SummaryCard
                  icon={<XCircle size={28} className="text-red-500" />}
                  title="Ditolak"
                  value={stats.ditolak}
                  colorClass="border-red-500"
                />
                <SummaryCard
                  icon={<Clock size={28} className="text-yellow-500" />}
                  title="Menunggu"
                  value={stats.menunggu}
                  colorClass="border-yellow-500"
                />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Distribusi Status SPM
                </h2>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                        }}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="border-t border-dashed border-gray-300 pt-8 text-center text-gray-500">
          <p>
            Silakan <strong>terapkan konteks</strong> di atas untuk menampilkan
            data.
          </p>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
