import { Outlet } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const { logout } = useAuth();
  return (
    <>
      <button
        className="rounded-2xl bg-amber-300 p-4 cursor-pointer hover:bg-amber-200"
        onClick={logout}
      >
        Logout
      </button>
      <Outlet />
    </>
  );
}

export default Layout;
