import { BrowserRouter, Route, Routes } from 'react-router';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import SpmPage from './pages/SpmPage';
import LaporanPage from './pages/LaporanPage';
import SpmDetailPage from './pages/DaftarRincian';
import SpmCreatePage from './pages/SpmCreatePage';
import SpmPercentage from './pages/SpmPercentage';
import FlagManagementPage from './pages/FlagManagementPage';
import SatkerPerformancePage from './pages/ReportPage';
import ValidationPage from './pages/ValidationPage';
import UserManagementPage from './pages/UserManagementPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="/spm" element={<SpmPage />} />
          <Route path="/rincian" element={<SpmDetailPage />} />
          <Route path="/laporanspm" element={<SpmPercentage />} />
          <Route path="/flags" element={<FlagManagementPage />} />
          <Route path="/performa" element={<SatkerPerformancePage />} />
          <Route path="/validasi" element={<ValidationPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
          <Route path="spm/:id/edit" element={<SpmCreatePage isEditMode />} />
          <Route path="spm/baru" element={<SpmCreatePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
