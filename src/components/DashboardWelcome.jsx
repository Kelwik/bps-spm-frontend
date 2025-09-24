// DashboardWelcome.js

import { useAuth } from '../contexts/AuthContext';
import SatkerSelect from './SatkerSelect';

function DashboardWelcome() {
  const { user } = useAuth();

  return (
    <div className="bg-[#f5f6fa] text-lato rounded-lg p-8 shadow-md">
      <div>
        <h1 className="text-3xl font-semibold text-[#0B2D60]">
          Dashboard {user.name}
        </h1>
        <p className="mt-1 text-gray-500">
          Kelola Surat Perintah Membayar dengan mudah dan efisien
        </p>
      </div>

      <SatkerSelect />
    </div>
  );
}

export default DashboardWelcome;
