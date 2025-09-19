import SatkerSelect from '../components/SatkerSelect';
import { useAuth } from '../contexts/AuthContext';

function DashboardPage() {
  const { user } = useAuth();
  return (
    <>
      <div>Selamat Datang : {user.name}</div>
      <SatkerSelect user={user} />
    </>
  );
}

export default DashboardPage;
