import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import { useState, useEffect } from 'react';
import { useSatker } from '../contexts/SatkerContext';

function SatkerSelect() {
  const {
    selectedSatkerId,
    setSelectedSatkerId,
    tahunAnggaran,
    setTahunAnggaran,
  } = useSatker();

  // Local states for "draft" selection
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedTahun, setSelectedTahun] = useState('');

  // Sync local states with context when context changes (e.g. after login)
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
    <div className="mt-8 bg-white p-8 rounded-lg shadow-sm flex gap-4 justify-center">
      <div className="flex flex-col gap-4">
        <p className="text-black font-semibold">Satuan Kerja</p>
        <select
          value={selectedValue}
          disabled={!!selectedSatkerId}
          onChange={(e) => setSelectedValue(e.target.value)}
          className="bg-white text-black border-[#f5f6fa] border-2 p-2 w-full shadow-sm rounded-lg"
        >
          <option value="">Pilih Satker</option>
          {data.map((satker) => (
            <option key={satker.id} value={satker.id}>
              {satker.nama}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-black font-semibold">Tahun Anggaran</p>

        <select
          onChange={(e) => setSelectedTahun(e.target.value)}
          value={selectedTahun}
          className="bg-white text-black border-[#f5f6fa] border-2 p-2 w-full shadow-sm rounded-lg"
        >
          <option value="">Pilih Tahun</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
      </div>
      <button
        className="bg-bpsBlue rounded-lg w-32 text-white"
        onClick={handleSave}
      >
        Apply
      </button>
    </div>
  );
}

export default SatkerSelect;
