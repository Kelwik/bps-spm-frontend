/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Kita butuh info user yang login

const SatkerContext = createContext(null);

export const SatkerProvider = ({ children }) => {
  const { user } = useAuth(); // Dapatkan data pengguna yang sedang login

  const [selectedSatkerId, setSelectedSatkerId] = useState(null);
  // Inisialisasi tahunAnggaran dengan tahun saat ini sebagai default
  const [tahunAnggaran, setTahunAnggaran] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user && user.role === 'op_satker') {
      setSelectedSatkerId(user.satkerId);
    } else if (user && user.role !== 'op_satker') {
      setSelectedSatkerId(null);
    }
  }, [user]);

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

export const useSatker = () => useContext(SatkerContext);
