/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext'; // We need info about the logged-in user

const SatkerContext = createContext(null);

export const SatkerProvider = ({ children }) => {
  const { user } = useAuth(); // Get the current user's data

  const [selectedSatkerId, setSelectedSatkerId] = useState(null);
  // Initialize tahunAnggaran with the current year as a default string
  const [tahunAnggaran, setTahunAnggaran] = useState(
    new Date().getFullYear().toString()
  );

  // --- 1. NEW STATE TO ACT AS THE GLOBAL LOCK ---
  // This state will determine if the application is "locked" or "unlocked".
  const [isContextSet, setIsContextSet] = useState(false);

  useEffect(() => {
    // If the user changes, reset the context so the new user must select again.
    setIsContextSet(false);
    if (user && user.role === 'op_satker') {
      setSelectedSatkerId(user.satkerId);
    } else if (user && user.role !== 'op_satker') {
      setSelectedSatkerId(null);
    }
  }, [user]);

  // --- 2. ADD isContextSet AND ITS SETTER TO THE CONTEXT VALUE ---
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
