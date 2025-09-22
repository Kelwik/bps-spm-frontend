import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartColumnBig,
  FileText,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';

function Layout() {
  const { logout } = useAuth();

  // Reusable styles for navigation links to keep the code clean (DRY principle).
  // A transparent bottom border is included to prevent content from shifting when the
  // visible border appears on hover or active states.
  const navLinkBaseStyle =
    'flex h-full items-center gap-2 border-b-3 border-transparent px-2 transition-colors duration-200';

  // The style that will be applied for both active and hover states.
  const activeLinkStyle = 'border-white';

  return (
    <>
      <nav className="w-screen bg-bpsBlue h-12 flex items-center justify-between gap-24 px-6 text-sm font-lato text-white">
        {/* Main navigation links */}
        <div className="flex items-center gap-4">
          <img src="logobps.png" alt="" className="h-8 object-cover" />
          <p className="font-semibold">Badan Pusat Statistik</p>
        </div>
        <div className="flex h-full items-center gap-8">
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

          <NavLink
            to="/laporan"
            className={({ isActive }) =>
              `${navLinkBaseStyle} hover:${activeLinkStyle} ${
                isActive ? activeLinkStyle : ''
              }`
            }
          >
            <ChartColumnBig size={14} />
            Laporan
          </NavLink>
        </div>

        {/* Logout button styled to match other nav items */}
        <button
          onClick={logout}
          className={`${navLinkBaseStyle} hover:${activeLinkStyle}`}
        >
          <LogOut size={14} />
          Keluar
        </button>
      </nav>

      {/* This component renders the content of the child routes */}
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
