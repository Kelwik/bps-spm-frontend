import './App.css';
import { useQuery } from '@tanstack/react-query';

function App() {
  const { data } = useQuery({
    queryKey: ['spms'],
    queryFn: fetchSPM,
  });

  async function fetchSPM() {
    try {
      const res = await fetch('http://localhost:3000/api/kode-akun/1/flags', {
        method: 'GET',
        headers: {
          Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6Ik9wZXJhdG9yIEJQUyBLYWIuIEdvcm9udGFsbyIsInJvbGUiOiJvcF9zYXRrZXIiLCJzYXRrZXJJZCI6MiwiaWF0IjoxNzU4MTc5MDE1LCJleHAiOjE3NTgyNjU0MTV9.IFusmbm0p6T2l8T2YqlpYwuoaJgskQVcfBqukHsllQA',
        },
      });
      return await res.json();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <>
      <p>{JSON.stringify(data)}</p>
    </>
  );
}

export default App;
