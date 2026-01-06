// src/pages/DashboardPage.jsx

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

// Komponen Kartu Statistik
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

  // --- NEW: DYNAMIC YEAR LOGIC ---
  const currentYear = new Date().getFullYear();
  // Generate [2026, 2025, 2024, 2023, 2022]
  const yearsList = Array.from({ length: 5 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Local state for draft selections before applying
  const [draftTahun, setDraftTahun] = useState(tahunAnggaran);
  const [draftSatker, setDraftSatker] = useState(selectedSatkerId || '');

  // Fetch list of Satkers for the dropdown
  const { data: satkerList, isLoading: isLoadingSatkers } = useQuery({
    queryKey: ['satkers'],
    queryFn: async () => apiClient.get('/satker').then((res) => res.data),
  });

  // Sync draft state if context changes externally
  useEffect(() => {
    setDraftSatker(selectedSatkerId || '');
    setDraftTahun(tahunAnggaran);
  }, [selectedSatkerId, tahunAnggaran]);

  // --- HELPER: Check if user is restricted to a single Satker ---
  // Applies to both 'op_satker' AND 'viewer'
  const isSatkerUser = user?.role === 'op_satker' || user?.role === 'viewer';

  // Handle applying or changing the context
  const handleToggleContext = () => {
    if (isContextSet) {
      // If context is already set, unlock it
      setIsContextSet(false);
    } else {
      // If context is not set, apply the draft selections
      if (!isSatkerUser) {
        setSelectedSatkerId(draftSatker ? parseInt(draftSatker) : null);
      }
      setTahunAnggaran(draftTahun);
      setIsContextSet(true); // Lock the context
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
        {/* Satker Selection Dropdown */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Satuan Kerja
          </label>
          <select
            className="form-input"
            // Use user's satkerId if restricted, otherwise use draftSatker
            value={isSatkerUser ? user.satkerId : draftSatker}
            onChange={(e) => setDraftSatker(e.target.value)}
            // Disable if context is set, user is restricted, or loading
            disabled={isContextSet || isSatkerUser || isLoadingSatkers}
          >
            {/* Show "Semua Satker" option only for non-restricted users */}
            {!isSatkerUser && <option value="">Semua Satker</option>}
            {/* Populate with fetched satker list */}
            {satkerList?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Tahun Anggaran Selection Dropdown (DYNAMIC) */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tahun Anggaran
          </label>
          <select
            className="form-input"
            value={draftTahun}
            onChange={(e) => setDraftTahun(e.target.value)}
            disabled={isContextSet} // Disable if context is set
          >
            {yearsList.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Apply/Change Context Button */}
        <div className="w-full">
          <button
            onClick={handleToggleContext}
            className={`w-full ${
              isContextSet ? 'btn-secondary' : 'btn-primary' // Style changes based on context state
            }`}
          >
            {isContextSet ? 'Ubah Konteks' : 'Terapkan Konteks'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Page Component
function DashboardPage() {
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran, isContextSet, setIsContextSet } =
    useSatker();

  // Use a unique key for this non-paginated query
  const {
    data, // This will contain { spms: [...all SPMs], totalCount: ... }
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'spmsDashboardStats',
      { satker: selectedSatkerId, tahun: tahunAnggaran },
    ],
    queryFn: async () => {
      // Make the API call WITHOUT pagination parameters to get all data
      const res = await apiClient.get('/spm', {
        params: {
          satkerId: selectedSatkerId,
          tahun: tahunAnggaran,
        },
      });
      return res.data;
    },
    enabled: isContextSet, // Only fetch when context is applied
  });

  // Get the list of all Satkers for displaying names
  const { data: satkerList } = useQuery({
    queryKey: ['satkers'],
    queryFn: () => apiClient.get('/satker').then((res) => res.data),
  });

  // Extract the potentially large list of SPMs for calculating status counts
  const allSpmsForStats = data?.spms;

  // Calculate statistics based on the fetched data
  const stats = {
    total: data?.totalCount || 0,
    diterima:
      allSpmsForStats?.filter((spm) => spm.status === 'DITERIMA').length || 0,
    ditolak:
      allSpmsForStats?.filter((spm) => spm.status === 'DITOLAK').length || 0,
    menunggu:
      allSpmsForStats?.filter((spm) => spm.status === 'MENUNGGU').length || 0,
  };

  // Prepare data for the bar chart based on calculated stats
  const chartData = [
    { name: 'Menunggu', total: stats.menunggu, color: '#f59e0b' }, // Yellow
    { name: 'Ditolak', total: stats.ditolak, color: '#ef4444' }, // Red
    { name: 'Diterima', total: stats.diterima, color: '#22c55e' }, // Green
  ];

  // --- HELPER: Check if user is restricted ---
  const isSatkerUser = user?.role === 'op_satker' || user?.role === 'viewer';

  // Determine the name of the currently selected Satker for display
  const currentSatkerName = isSatkerUser
    ? satkerList?.find((s) => s.id === user.satkerId)?.nama // Restricted user's assigned satker
    : selectedSatkerId
    ? satkerList?.find((s) => s.id === selectedSatkerId)?.nama // Admin/prov selected specific satker
    : 'Semua Satker'; // Default when no specific satker is selected

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Selamat Datang, {user?.name}!
        </h1>
        <p className="mt-1 text-gray-500">
          Pilih konteks data di bawah ini untuk melihat ringkasan atau membuat
          SPM baru.
        </p>
      </div>

      {/* Context Control Component */}
      <ContextControls
        isContextSet={isContextSet}
        setIsContextSet={setIsContextSet}
      />

      {/* Conditional Rendering based on whether context is set */}
      {isContextSet ? (
        <>
          {/* Display Current Context */}
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

          {/* Loading State */}
          {isLoading && (
            <div className="text-center text-gray-500 py-10">
              Memuat data statistik...
            </div>
          )}
          {/* Error State */}
          {isError && (
            <div className="text-center text-red-500 py-10">
              Error: {error.message}
            </div>
          )}

          {/* Data Display Area (Cards and Chart) */}
          {!isLoading &&
            !isError &&
            data && ( // Ensure data is loaded before rendering
              <>
                {/* Summary Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <SummaryCard
                    icon={
                      <FileSpreadsheet size={28} className="text-blue-500" />
                    }
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

                {/* Bar Chart Section */}
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
        // Message shown when context is not yet set
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
