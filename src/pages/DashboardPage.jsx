import SatkerSelect from '../components/SatkerSelect';
import { useAuth } from '../contexts/AuthContext';

function DashboardPage() {
  const { user } = useAuth();
  return (
    <>
      <div>Selamat Datang : {user.name}</div>
      <SatkerSelect user={user} />
      <select name="" id="">
        <option value="2025">2025</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
      </select>
    </>
  );
}

export default DashboardPage;
