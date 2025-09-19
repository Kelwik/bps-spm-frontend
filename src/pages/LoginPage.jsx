import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api'; // Path ini sekarang seharusnya sudah benar

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // Ambil fungsi login dari context

  const handleLogin = async (event) => {
    event.preventDefault(); // Mencegah form submit me-refresh halaman
    setIsLoading(true);
    setError(null);

    try {
      // 1. Panggil API login
      const response = await apiClient.post('/auth/login', { email, password });
      const { token } = response.data;

      // 2. Jika berhasil, panggil fungsi login dari context
      // Ini akan menyimpan token ke localStorage dan mengupdate state global
      login(token);

      // 3. Arahkan pengguna ke halaman dashboard
      navigate('/');
    } catch (err) {
      // Tangani error dari API
      const errorMessage =
        err.response?.data?.error || 'Terjadi kesalahan. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="title">Aplikasi SPM</h1>
          <p className="subtitle">Badan Pusat Statistik</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="contoh@bps.go.id"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
