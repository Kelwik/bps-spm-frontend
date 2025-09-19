import { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; // Install: npm install jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Cek localStorage saat aplikasi pertama kali dimuat
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        // Cek jika token sudah kedaluwarsa
        if (decodedUser.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
        } else {
          setUser(decodedUser);
        }
      } catch (error) {
        // Jika token tidak valid, hapus
        localStorage.removeItem('token');
        console.error('Invalid token found in localStorage', error);
      }
    }
  }, []);

  const logout = () => {
    // Hapus token dari localStorage
    localStorage.removeItem('token');
    // Set state user menjadi null
    setUser(null);
    // Arahkan ke halaman login
    window.location.href = '/login';
  };

  const login = (token) => {
    localStorage.setItem('token', token);
    const decodedUser = jwtDecode(token);
    setUser(decodedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook agar lebih mudah digunakan
export const useAuth = () => {
  return useContext(AuthContext);
};
