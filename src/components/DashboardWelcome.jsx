import { useAuth } from '../contexts/AuthContext';
import SatkerSelect from './SatkerSelect';

function DashboardWelcome() {
  const { user } = useAuth();
  return (
    <div className="bg-[#f5f6fa] text-lato text-bpsBlue rounded-lg p-4 ">
      <h1 className="text-2xl font-semibold">Dashboard {user.name}</h1>
      <p className="mt-2 text-md">
        Kelola Surat Perintah Membayar dengan mudah dan efisien
      </p>
      <SatkerSelect />
    </div>
  );
}

export default DashboardWelcome;
