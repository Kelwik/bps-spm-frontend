import { useState } from 'react';
import { useNavigate } from 'react-router'; // Note: corrected from 'react-router'
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api';
import { LockKeyhole, User, Eye, EyeOff } from 'lucide-react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token } = response.data;
      login(token);
      navigate('/');
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || 'Terjadi kesalahan. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Form Section */}

        {/* Image Section */}
        <div className="hidden md:block w-1/2">
          <img
            src="Login_Asset.png" // Make sure this path is correct
            alt="Illustrasi BPS"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h1 className="font-lato font-bold text-2xl text-bpsBlue mb-2">
            Sistem Surat Perintah Membayar (SPM)
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Selamat Datang Kembali
          </h2>
          <p className="text-gray-500 mb-6">Silakan masuk untuk melanjutkan.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Email Input */}
            <div className="relative">
              <User
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                className="w-full h-12 border border-gray-300 rounded-lg p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-bpsBlue"
                placeholder="Masukkan E-mail Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <LockKeyhole
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full h-12 border border-gray-300 rounded-lg p-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-bpsBlue"
                placeholder="Masukkan Password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bpsBlue rounded-lg h-12 text-white font-semibold hover:bg-bpsBlue/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
            >
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
