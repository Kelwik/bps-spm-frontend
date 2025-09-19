import axios from 'axios';

// Buat instance Axios dengan konfigurasi dasar
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // Sesuaikan dengan URL backend Anda
});

// Gunakan interceptor untuk menambahkan token JWT ke setiap permintaan secara otomatis
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem('token');

    // Jika token ada, tambahkan ke header Authorization
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Lakukan sesuatu jika ada error pada permintaan
    return Promise.reject(error);
  }
);

export default apiClient;
