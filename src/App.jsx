import { BrowserRouter, Route, Routes } from 'react-router';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import SpmPage from './pages/SpmPage';
import LaporanPage from './pages/LaporanPage';

function App() {
  return (
    <>
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
            <Route path="/laporan" element={<LaporanPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
