/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Kita butuh info user yang login

const SatkerContext = createContext(null);

export const SatkerProvider = ({ children }) => {
  const { user } = useAuth(); // Dapatkan data pengguna yang sedang login

  // State global untuk menyimpan ID satker yang sedang aktif/dipilih
  const [selectedSatkerId, setSelectedSatkerId] = useState(null);
  const [tahunAnggaran, setTahunAnggaran] = useState('');

  // Efek ini akan berjalan setiap kali data 'user' berubah (misalnya setelah login)
  useEffect(() => {
    // Jika user sudah login dan dia adalah op_satker,
    // maka langsung set satker terpilih sesuai dengan satker miliknya.
    if (user && user.role === 'op_satker') {
      setSelectedSatkerId(user.satkerId);
    }
    // Jika user adalah op_prov, kita biarkan null pada awalnya,
    // sehingga mereka bisa memilih dari dropdown.
    else if (user && user.role !== 'op_satker') {
      setSelectedSatkerId(null);
    }
  }, [user]); // Bergantung pada 'user'

  const value = {
    selectedSatkerId,
    setSelectedSatkerId,
    tahunAnggaran,
    setTahunAnggaran,
  };

  return (
    <SatkerContext.Provider value={value}>{children}</SatkerContext.Provider>
  );
};

// Custom hook agar lebih mudah digunakan di komponen lain
export const useSatker = () => useContext(SatkerContext);
