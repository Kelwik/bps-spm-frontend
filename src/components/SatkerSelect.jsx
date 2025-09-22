import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import { useState } from 'react';

function SatkerSelect({ user }) {
  const [selectedValue, setSelectedValue] = useState(user.satkerId);
  const { data, isLoading, error } = useQuery({
    queryKey: ['satkers'],
    queryFn: async () => {
      const res = await apiClient.get('/satker');
      return res.data;
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <select
      value={selectedValue}
      disabled={user.satkerId ? true : false}
      onChange={(e) => {
        setSelectedValue(e.target.value);
      }}
    >
      <option value="">Pilih Satker</option>
      {data.map((satker) => (
        <option key={satker.id} value={satker.id}>
          {satker.nama}
        </option>
      ))}
    </select>
  );
}

export default SatkerSelect;
