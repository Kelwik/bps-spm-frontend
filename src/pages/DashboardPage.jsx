import DashboardWelcome from '../components/DashboardWelcome';
import InfoCardsContainer from '../components/InfoCardsContainer';

function DashboardPage() {
  return (
    <div className="mt-8 mx-8">
      <DashboardWelcome />
      <InfoCardsContainer />
    </div>
  );
}

export default DashboardPage;
