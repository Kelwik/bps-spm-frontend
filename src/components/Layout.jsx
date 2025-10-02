import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  BookCopy,
} from 'lucide-react';
import bpsLogo from '../../src/assets/logobps.png';

function Layout() {
  const { user, logout } = useAuth();

  const navLinkBaseStyle =
    'flex h-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200';
  const activeLinkStyle = 'bg-white/10 text-white';
  const dropdownLinkStyle =
    'flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md';

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <nav className="w-full bg-bpsBlue-dark h-16 flex items-center justify-center shadow-lg sticky top-0 z-50">
        <div className="w-full max-w-7xl flex items-center justify-between px-6">
          <NavLink to="/" className="flex items-center gap-4">
            <img src={bpsLogo} alt="Logo BPS" className="h-10 object-contain" />
            <div className="hidden md:flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight">
                Badan Pusat Statistik
              </span>
              <span className="text-xs text-blue-200">Provinsi Gorontalo</span>
            </div>
          </NavLink>

          <div className="flex items-center gap-4 h-full">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navLinkBaseStyle} ${isActive ? activeLinkStyle : ''}`
              }
            >
              <LayoutDashboard size={16} />
              <span className="hidden lg:inline">Dashboard</span>
            </NavLink>
            <NavLink
              to="/spm"
              className={({ isActive }) =>
                `${navLinkBaseStyle} ${isActive ? activeLinkStyle : ''}`
              }
            >
              <FileText size={16} />
              <span className="hidden lg:inline">Daftar SPM</span>
            </NavLink>

            {/* --- PERBAIKAN DI SINI --- */}
            {/* 1. Tambahkan padding vertikal (py-2) ke 'group' untuk memperluas area hover */}
            <div className="relative group h-full flex items-center py-2">
              <div className={`${navLinkBaseStyle} cursor-pointer`}>
                <BarChart3 size={16} />
                <span className="hidden lg:inline">Laporan</span>
                <ChevronDown
                  size={14}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </div>
              {/* 2. Hapus margin-top (mt-2) agar tidak ada celah antara tombol dan menu */}
              <div className="absolute top-full right-0 bg-white rounded-md shadow-lg w-60 z-20 hidden group-hover:block p-2">
                <NavLink
                  to="/laporanspm"
                  className={({ isActive }) =>
                    `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                  }
                >
                  <FileText size={16} className="text-bpsBlue-light" />
                  <span>Laporan Kelengkapan SPM</span>
                </NavLink>
                <NavLink
                  to="/rincian"
                  className={({ isActive }) =>
                    `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                  }
                >
                  <BookCopy size={16} className="text-bpsBlue-light" />
                  <span>Laporan Semua Rincian</span>
                </NavLink>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-semibold text-white text-sm">
                {user?.name}
              </div>
              <div className="text-xs text-blue-200">
                {user?.role.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-full text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="w-full max-w-7xl mx-auto py-8 px-6">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
