// src/components/Layout.jsx

import { useState } from 'react';
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
  Scale,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import bpsLogo from '../assets/logobps.png';

function Layout() {
  const { user, logout } = useAuth();
  const { isContextSet } = useSatker();
  const location = useLocation();

  // State for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const toggleMobileDropdown = (dropdownName) => {
    if (activeMobileDropdown === dropdownName) {
      setActiveMobileDropdown(null);
    } else {
      setActiveMobileDropdown(dropdownName);
    }
  };

  // Styles
  const navLinkBaseStyle =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-200';
  const activeLinkStyle = 'bg-white/10 text-white';

  // Desktop dropdown styles
  const dropdownItemStyle =
    'flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md';

  // Mobile styles
  const mobileLinkStyle =
    'flex items-center gap-3 px-4 py-3 text-base font-medium text-blue-100 hover:bg-white/10 rounded-md transition-colors';
  const mobileActiveLinkStyle = 'bg-white/10 text-white';
  const mobileSubmenuStyle =
    'pl-11 pr-4 py-2 block text-sm text-blue-200 hover:text-white';

  // Check roles
  const isAdminOrProv = ['op_prov', 'supervisor'].includes(user?.role);

  // --- NEW: Define paths that do NOT require context ---
  const bypassContextPaths = ['/', '/users', '/flags'];

  // Check if current path starts with any of the allowed paths
  const isAllowedWithoutContext = bypassContextPaths.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + '/')
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Navbar */}
      <nav className="w-full bg-bpsBlue-dark shadow-lg sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side: Logo & Branding */}
            <div className="flex items-center gap-4">
              <NavLink to="/" className="flex items-center gap-3">
                <img
                  src={bpsLogo}
                  alt="Logo BPS"
                  className="h-8 w-auto sm:h-10 object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                    Badan Pusat Statistik
                  </span>
                  <span className="text-[10px] sm:text-xs text-blue-200 hidden sm:block">
                    Provinsi Gorontalo
                  </span>
                </div>
              </NavLink>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 h-full">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${navLinkBaseStyle} ${isActive ? activeLinkStyle : ''}`
                }
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/spm"
                className={({ isActive }) =>
                  `${navLinkBaseStyle} ${isActive ? activeLinkStyle : ''}`
                }
              >
                <FileText size={16} />
                <span>Daftar SPM</span>
              </NavLink>

              {/* Desktop Reports Dropdown */}
              <div className="relative group h-full flex items-center">
                <button
                  className={`${navLinkBaseStyle} group-hover:bg-white/10`}
                >
                  <BarChart3 size={16} />
                  <span>Laporan</span>
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-200 group-hover:rotate-180"
                  />
                </button>
                <div className="absolute top-full right-0 mt-0 pt-2 w-64 hidden group-hover:block">
                  <div className="bg-white rounded-md shadow-xl p-2">
                    <NavLink
                      to="/laporanspm"
                      className={({ isActive }) =>
                        `${dropdownItemStyle} ${isActive ? 'bg-blue-50' : ''}`
                      }
                    >
                      <FileText size={16} className="text-bpsBlue-light" />
                      <span>Kelengkapan SPM</span>
                    </NavLink>
                    <NavLink
                      to="/rincian"
                      className={({ isActive }) =>
                        `${dropdownItemStyle} ${isActive ? 'bg-blue-50' : ''}`
                      }
                    >
                      <BookCopy size={16} className="text-bpsBlue-light" />
                      <span>Rincian Belanja (App)</span>
                    </NavLink>
                    <NavLink
                      to="/laporan/sakti-comparison"
                      className={({ isActive }) =>
                        `${dropdownItemStyle} ${isActive ? 'bg-blue-50' : ''}`
                      }
                    >
                      <Scale size={16} className="text-bpsBlue-light" />
                      <span>Biaya Aplikasi vs SAKTI</span>
                    </NavLink>
                    {isAdminOrProv && (
                      <NavLink
                        to="/performa"
                        className={({ isActive }) =>
                          `${dropdownItemStyle} ${isActive ? 'bg-blue-50' : ''}`
                        }
                      >
                        <Users size={16} className="text-bpsBlue-light" />
                        <span>Performa Satker</span>
                      </NavLink>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Admin Dropdown */}
              {isAdminOrProv && (
                <div className="relative group h-full flex items-center">
                  <button
                    className={`${navLinkBaseStyle} group-hover:bg-white/10`}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                    <ChevronDown
                      size={14}
                      className="transition-transform duration-200 group-hover:rotate-180"
                    />
                  </button>
                  <div className="absolute top-full right-0 mt-0 pt-2 w-60 hidden group-hover:block">
                    <div className="bg-white rounded-md shadow-xl p-2">
                      <NavLink
                        to="/flags"
                        className={({ isActive }) =>
                          `${dropdownItemStyle} ${isActive ? 'bg-blue-50' : ''}`
                        }
                      >
                        <Tags size={16} className="text-bpsBlue-light" />
                        <span>Manajemen Checklist</span>
                      </NavLink>
                      <NavLink
                        to="/users"
                        className={({ isActive }) =>
                          `${dropdownItemStyle} ${isActive ? 'bg-blue-50' : ''}`
                        }
                      >
                        <Users size={16} className="text-bpsBlue-light" />
                        <span>Manajemen Pengguna</span>
                      </NavLink>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: User & Logout (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
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

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-blue-200 hover:text-white hover:bg-white/10 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-bpsBlue-dark border-t border-blue-800 shadow-xl">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Mobile User Info */}
              <div className="px-4 py-3 mb-2 bg-blue-900/50 rounded-md flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-white">
                    {user?.name}
                  </div>
                  <div className="text-sm font-medium text-blue-300">
                    {user?.role.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-blue-200 hover:bg-white/20 hover:text-white"
                >
                  <LogOut size={20} />
                </button>
              </div>

              <NavLink
                to="/"
                end
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${mobileLinkStyle} ${isActive ? mobileActiveLinkStyle : ''}`
                }
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/spm"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `${mobileLinkStyle} ${isActive ? mobileActiveLinkStyle : ''}`
                }
              >
                <FileText size={20} />
                <span>Daftar SPM</span>
              </NavLink>

              {/* Mobile Reports Dropdown */}
              <div>
                <button
                  onClick={() => toggleMobileDropdown('reports')}
                  className={`w-full ${mobileLinkStyle} justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 size={20} />
                    <span>Laporan</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      activeMobileDropdown === 'reports' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeMobileDropdown === 'reports' && (
                  <div className="space-y-1 bg-blue-900/20 rounded-md mb-1">
                    <NavLink
                      to="/laporanspm"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileSubmenuStyle}
                    >
                      Kelengkapan SPM
                    </NavLink>
                    <NavLink
                      to="/rincian"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileSubmenuStyle}
                    >
                      Rincian Belanja (App)
                    </NavLink>
                    <NavLink
                      to="/laporan/sakti-comparison"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={mobileSubmenuStyle}
                    >
                      Biaya Aplikasi vs SAKTI
                    </NavLink>
                    {isAdminOrProv && (
                      <NavLink
                        to="/performa"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={mobileSubmenuStyle}
                      >
                        Performa Satker
                      </NavLink>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Settings Dropdown */}
              {isAdminOrProv && (
                <div>
                  <button
                    onClick={() => toggleMobileDropdown('settings')}
                    className={`w-full ${mobileLinkStyle} justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={20} />
                      <span>Settings</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        activeMobileDropdown === 'settings' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {activeMobileDropdown === 'settings' && (
                    <div className="space-y-1 bg-blue-900/20 rounded-md mb-1">
                      <NavLink
                        to="/flags"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={mobileSubmenuStyle}
                      >
                        Manajemen Checklist
                      </NavLink>
                      <NavLink
                        to="/users"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={mobileSubmenuStyle}
                      >
                        Manajemen Pengguna
                      </NavLink>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* --- MODIFIED CONDITION: Allow flags and users without context --- */}
        {isContextSet || isAllowedWithoutContext ? (
          <Outlet />
        ) : (
          <DashboardPage />
        )}
      </main>
    </div>
  );
}

export default Layout;
