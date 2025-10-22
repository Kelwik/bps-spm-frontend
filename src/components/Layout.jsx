// src/components/Layout.jsx

import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import DashboardPage from '../pages/DashboardPage';
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  BookCopy,
  Users,
  Tags,
  // ShieldCheck, // Remove old icon import
  Scale, // New icon for comparison/balance
  Settings,
} from 'lucide-react';
import bpsLogo from '../assets/logobps.png';

function Layout() {
  const { user, logout } = useAuth();
  const { isContextSet } = useSatker();
  const location = useLocation();

  const navLinkBaseStyle =
    'flex h-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200';
  const activeLinkStyle = 'bg-white/10 text-white';
  const dropdownLinkStyle =
    'flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md';

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <nav className="w-full bg-bpsBlue-dark h-16 flex items-center justify-center shadow-lg sticky top-0 z-50">
        <div className="w-full max-w-7xl flex items-center justify-between px-6">
          {/* ... (Logo and Branding remain the same) ... */}
          <NavLink to="/" className="flex items-center gap-4">
            <img src={bpsLogo} alt="Logo BPS" className="h-10 object-contain" />
            <div className="hidden md:flex flex-col">
              <span className="text-lg font-bold text-white tracking-tight">
                Badan Pusat Statistik
              </span>
              <span className="text-xs text-blue-200">Provinsi Gorontalo</span>
            </div>
          </NavLink>

          <div className="flex items-center gap-2 h-full">
            {/* ... (Dashboard, Daftar SPM links remain the same) ... */}
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

            {/* --- MODIFIED Reports Dropdown --- */}
            <div className="relative group h-full flex items-center py-2">
              <div className={`${navLinkBaseStyle} cursor-pointer`}>
                <BarChart3 size={16} />
                <span className="hidden lg:inline">Laporan</span>
                <ChevronDown
                  size={14}
                  className="transition-transform duration-200 group-hover:rotate-180"
                />
              </div>
              <div className="absolute top-full right-0 bg-white rounded-md shadow-lg w-64 z-20 hidden group-hover:block p-2">
                {' '}
                {/* Increased width slightly */}
                <NavLink
                  to="/laporanspm"
                  className={({ isActive }) =>
                    `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                  }
                >
                  <FileText size={16} className="text-bpsBlue-light" />
                  <span>Kelengkapan SPM</span>
                </NavLink>
                <NavLink
                  to="/rincian"
                  className={({ isActive }) =>
                    `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                  }
                >
                  <BookCopy size={16} className="text-bpsBlue-light" />
                  <span>Rincian Belanja (App)</span>
                </NavLink>
                {/* Add the new Sakti Comparison link */}
                <NavLink
                  to="/laporan/sakti-comparison"
                  className={({ isActive }) =>
                    `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                  }
                >
                  <Scale size={16} className="text-bpsBlue-light" />{' '}
                  {/* New Icon */}
                  <span>Biaya Aplikasi vs SAKTI</span>
                </NavLink>
                {/* Performa Satker remains here for admin/prov */}
                {['op_prov', 'supervisor'].includes(user?.role) && (
                  <NavLink
                    to="/performa"
                    className={({ isActive }) =>
                      `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                    }
                  >
                    <Users size={16} className="text-bpsBlue-light" />
                    <span>Performa Satker</span>
                  </NavLink>
                )}
              </div>
            </div>
            {/* --- END MODIFIED Reports Dropdown --- */}

            {/* --- MODIFIED Admin/Settings Dropdown --- */}
            {['op_prov', 'supervisor'].includes(user?.role) && (
              <div className="relative group h-full flex items-center py-2">
                <div className={`${navLinkBaseStyle} cursor-pointer`}>
                  <Settings size={16} />
                  <span className="hidden lg:inline">Settings</span>
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-200 group-hover:rotate-180"
                  />
                </div>
                <div className="absolute top-full right-0 bg-white rounded-md shadow-lg w-60 z-20 hidden group-hover:block p-2">
                  <NavLink
                    to="/flags"
                    className={({ isActive }) =>
                      `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                    }
                  >
                    <Tags size={16} className="text-bpsBlue-light" />
                    <span>Manajemen Checklist</span>
                  </NavLink>
                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                    }
                  >
                    <Users size={16} className="text-bpsBlue-light" />
                    <span>Manajemen Pengguna</span>
                  </NavLink>
                  {/* Remove Validasi SAKTI from here */}
                  {/*
                  <NavLink
                    to="/validasi"
                    className={({ isActive }) =>
                      `${dropdownLinkStyle} ${isActive ? 'bg-blue-50' : ''}`
                    }
                  >
                    <ShieldCheck size={16} className="text-bpsBlue-light" />
                    <span>Validasi SAKTI</span>
                  </NavLink>
                   */}
                </div>
              </div>
            )}
            {/* --- END MODIFIED Admin/Settings Dropdown --- */}
          </div>

          {/* ... (User Info and Logout Button remain the same) ... */}
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
        {/* ... (Outlet rendering logic remains the same) ... */}
        {isContextSet || location.pathname === '/' ? (
          <Outlet />
        ) : (
          <DashboardPage /> // Show Dashboard if context not set and not on root path
        )}
      </main>
    </div>
  );
}

export default Layout;
