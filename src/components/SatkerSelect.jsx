// src/components/SatkerSelect.jsx

import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import { useState, useEffect } from 'react';
import { useSatker } from '../contexts/SatkerContext';
import { useAuth } from '../contexts/AuthContext';

function SatkerSelect() {
  const {
    selectedSatkerId,
    setSelectedSatkerId,
    tahunAnggaran,
    setTahunAnggaran,
  } = useSatker();
  const { user } = useAuth();

  // --- DYNAMIC YEAR LOGIC ---
  // 1. Get current year (e.g., 2026)
  const currentYear = new Date().getFullYear();

  // 2. Generate a list of last 5 years: [2026, 2025, 2024, 2023, 2022]
  const yearsList = Array.from({ length: 5 }, (_, i) =>
    (currentYear - i).toString()
  );

  // Local states for "draft" selection
  const [selectedValue, setSelectedValue] = useState('');

  // Default to the context value OR the current year
  const [selectedTahun, setSelectedTahun] = useState(
    tahunAnggaran || String(currentYear)
  );

  // Sync local states with context when context changes
  useEffect(() => {
    if (selectedSatkerId) {
      setSelectedValue(selectedSatkerId);
    }
  }, [selectedSatkerId]);

  useEffect(() => {
    if (tahunAnggaran) {
      setSelectedTahun(tahunAnggaran);
    }
  }, [tahunAnggaran]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['satkers'],
    queryFn: async () => {
      const res = await apiClient.get('/satker');
      return res.data;
    },
  });

  function handleSave() {
    setSelectedSatkerId(selectedValue);
    setTahunAnggaran(selectedTahun);
  }

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="mt-8 bg-white shadow-sm rounded-lg p-4 text-black">
      <div className="mt-4 flex items-end gap-x-8">
        <div className="self-start">
          <h2 className="text-xl font-semibold text-gray-900">
            Pilih Data SPM
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Pilih Satuan Kerja dan Tahun Anggaran
          </p>
        </div>

        {/* Satuan Kerja Group */}
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700">
            Satuan Kerja
          </label>
          <select
            value={selectedValue}
            disabled={!!user.satkerId}
            onChange={(e) => setSelectedValue(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 inset-shadow-gray-500"
          >
            <option value="">Pilih Satuan Kerja</option>
            {data?.map((satker) => (
              <option key={satker.id} value={satker.id}>
                {satker.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Tahun Anggaran Group (DYNAMIC) */}
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700">
            Tahun Anggaran
          </label>
          <select
            onChange={(e) => setSelectedTahun(e.target.value)}
            value={selectedTahun}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 inset-shadow-gray-500"
          >
            {/* THIS MAPS THE ARRAY ABOVE INSTEAD OF HARDCODING OPTIONS */}
            {yearsList.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Apply Button */}
        <div className="flex-shrink-0">
          <button
            className="bg-[#0B2D60] hover:bg-blue-800 text-white font-semibold py-2 px-8 rounded-lg shadow-sm"
            onClick={handleSave}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default SatkerSelect;
