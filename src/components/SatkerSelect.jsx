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

  // Local states for "draft" selection
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('2025'); // Default to 2025 as in the image

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
    // This container holds the filter's title and the form controls
    <div className="mt-8 bg-white shadow-sm rounded-lg p-4 text-black">
      {/* --- Filter Header --- */}

      {/* --- Form Controls Container --- */}
      {/* 'items-end' aligns the button and select boxes along their bottom edge */}
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
            {data.map((satker) => (
              <option key={satker.id} value={satker.id}>
                {satker.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Tahun Anggaran Group */}
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700">
            Tahun Anggaran
          </label>
          <select
            onChange={(e) => setSelectedTahun(e.target.value)}
            value={selectedTahun}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 inset-shadow-gray-500"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

        {/* Apply Button */}
        {/* 'flex-shrink-0' prevents the button from shrinking */}
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
