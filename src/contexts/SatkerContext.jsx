// src/contexts/SatkerContext.jsx

/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SatkerContext = createContext(null);

export const SatkerProvider = ({ children }) => {
  const { user } = useAuth(); // Get the current user's data

  const [selectedSatkerId, setSelectedSatkerId] = useState(null);
  // Initialize tahunAnggaran with the current year as a default string
  const [tahunAnggaran, setTahunAnggaran] = useState(
    new Date().getFullYear().toString()
  );

  // This state determines if the application is "locked" or "unlocked".
  const [isContextSet, setIsContextSet] = useState(false);

  useEffect(() => {
    // If the user changes, reset the context so the new user must select again.
    setIsContextSet(false);

    // --- MODIFIED LOGIC FOR VIEWER ---
    // Treat 'viewer' the same as 'op_satker': Lock them to their ID
    const isSatkerUser = user?.role === 'op_satker' || user?.role === 'viewer';

    if (user && isSatkerUser) {
      setSelectedSatkerId(user.satkerId);
    } else if (user && !isSatkerUser) {
      setSelectedSatkerId(null);
    }
  }, [user]);

  const value = {
    selectedSatkerId,
    setSelectedSatkerId,
    tahunAnggaran,
    setTahunAnggaran,
    isContextSet, // Export the state
    setIsContextSet, // Export the function to change the state
  };

  return (
    <SatkerContext.Provider value={value}>{children}</SatkerContext.Provider>
  );
};

export const useSatker = () => useContext(SatkerContext);
