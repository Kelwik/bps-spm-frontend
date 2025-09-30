import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext'; // Path diperbaiki
import {
  ChartColumnBig,
  FileText,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from 'lucide-react';

function Layout() {
  const { logout } = useAuth();

  const navLinkBaseStyle =
    'flex h-full items-center gap-2 border-b-2 border-transparent px-2 transition-colors duration-200 text-gray-300';
  const activeLinkStyle = 'border-white text-white';
  const dropdownLinkStyle =
    'flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100';

  return (
    <>
      <nav className="w-screen bg-bpsBlue h-12 flex items-center justify-between gap-24 px-6 text-sm font-lato text-white">
        <div className="flex items-center gap-4">
          <img src="/logobps.png" alt="Logo BPS" className="h-8 object-cover" />
          <p className="font-semibold">Badan Pusat Statistik</p>
        </div>
        <div className="flex h-full items-center gap-8">
          {/* Tautan Dashboard */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navLinkBaseStyle} hover:${activeLinkStyle} ${
                isActive ? activeLinkStyle : ''
              }`
            }
          >
            <LayoutDashboard size={14} />
            Dashboard
          </NavLink>

          {/* Tautan Daftar SPM */}
          <NavLink
            to="/spm"
            className={({ isActive }) =>
              `${navLinkBaseStyle} hover:${activeLinkStyle} ${
                isActive ? activeLinkStyle : ''
              }`
            }
          >
            <FileText size={14} />
            Daftar SPM
          </NavLink>

          {/* Menu Dropdown Laporan */}
          <div className="relative group h-full flex items-center py-3">
            <div className={`${navLinkBaseStyle} cursor-pointer`}>
              <ChartColumnBig size={14} />
              <span>Laporan</span>
              <ChevronDown
                size={12}
                className="transition-transform duration-200 group-hover:rotate-180"
              />
            </div>

            <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white rounded-md shadow-lg w-52 z-10 hidden group-hover:block pt-2">
              <div className="py-1">
                <NavLink
                  to="/laporanspm"
                  className={({ isActive }) =>
                    `${dropdownLinkStyle} ${isActive ? 'bg-gray-100' : ''}`
                  }
                >
                  <FileText size={14} />
                  Laporan SPM
                </NavLink>
                <NavLink
                  to="/rincian"
                  className={({ isActive }) =>
                    `${dropdownLinkStyle} ${isActive ? 'bg-gray-100' : ''}`
                  }
                >
                  <ChartColumnBig size={14} />
                  Laporan Rincian
                </NavLink>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Logout */}
        <button
          onClick={logout}
          className={`${navLinkBaseStyle} hover:${activeLinkStyle}`}
        >
          <LogOut size={14} />
          Keluar
        </button>
      </nav>

      <main>
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
