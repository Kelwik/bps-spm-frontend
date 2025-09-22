import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import { useState } from 'react';

function SpmPage() {
  const [id, setId] = useState('1');
  const { data, isLoading, error } = useQuery({
    queryKey: ['kodeakuns', id],
    queryFn: async () => {
      const res = await apiClient.get(`/kode-akun/${id}/flags`);
      return res.data;
    },
  });
  const { data: dataKodeAkun } = useQuery({
    queryKey: ['kodeakuns'],
    queryFn: async () => {
      const res = await apiClient.get(`/kode-akun`);
      return res.data;
    },
  });
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return (
    <div>
      <select
        value={id}
        onChange={(e) => {
          setId(e.target.value);
        }}
      >
        {dataKodeAkun.map((data) => {
          return (
            <option value={data.id}>{`${data.kode} - ${data.nama}`}</option>
          );
        })}
      </select>
      {data
        .filter((kode) => kode.tipe !== 'TIDAK')
        .map((kode) => {
          return (
            <p>
              {kode.nama}, {kode.tipe}
            </p>
          );
        })}
    </div>
  );
}

export default SpmPage;
