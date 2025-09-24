import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import InfoCards from './InfoCards';

function InfoCardsContainer() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['allSpms'],
    queryFn: async () => {
      const res = await apiClient.get('/spm');
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
    <div className="bg-[#f5f6fa] mt-4 p-4 rounded-lg shadow-md">
      <InfoCards data={data} />
    </div>
  );
}

export default InfoCardsContainer;
