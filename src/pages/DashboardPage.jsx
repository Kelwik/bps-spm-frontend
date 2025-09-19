import { useAuth } from '../contexts/AuthContext';

function DashboardPage() {
  const { user } = useAuth();
  return <div>Contoh Dashboard : {user.name}</div>;
}

export default DashboardPage;
