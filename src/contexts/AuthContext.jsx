/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
// Hapus 'useNavigate' karena tidak akan digunakan di sini lagi
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Hapus 'useNavigate'

  const loadUserFromToken = (token) => {
    try {
      const decodedUser = jwtDecode(token);
      if (decodedUser.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        setUser(null);
      } else {
        setUser(decodedUser);
      }
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUserFromToken(token);
    }
    setLoading(false);

    const handleStorageChange = () => {
      const updatedToken = localStorage.getItem('token');
      if (updatedToken) {
        loadUserFromToken(updatedToken);
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Modifikasi fungsi 'login' untuk tidak lagi menangani navigasi
  const login = (token) => {
    localStorage.setItem('token', token);
    loadUserFromToken(token);
    // Navigasi akan ditangani oleh komponen yang memanggil fungsi ini
  };

  // Modifikasi fungsi 'logout' untuk tidak lagi menangani navigasi
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Navigasi akan ditangani oleh komponen yang memanggil fungsi ini
  };

  const value = { user, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// Custom hook agar lebih mudah digunakan
export const useAuth = () => useContext(AuthContext);
