import { useAppData } from '../context/AppContext';
import { DashboardIcon, ClientsIcon, JobsIcon, LogoutIcon } from '../assets/icons';
import DashboardPage from '../pages/DashboardPage';
import ClientsListPage from '../pages/ClientsListPage';
import ClientDetailPage from '../pages/ClientDetailPage';
import CandidateProfileModal from '../components/CandidateProfileModal';
import Toast from '../components/Toast';

const buxtonLogoDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA5NiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iMzIiIHJ4PSI2IiBmaWxsPSIjMTgxODFBIi8+PHRleHQgeD0iMTYiIHk9IjIxIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyZWFsIj5CdXh0b248L3RleHQ+PC9zdmc+"; // placeholder logo

export default function RootLayout({ user, onLogout }) {
  const {
    currentPage,
    navigate,
    pageContext,
    isCandidateModalOpen,
    closeCandidateModal,
    selectedCandidateId,
    getCandidateProfile,
    toastMessage,
    openCandidateModal
  } = useAppData();

  function renderPage() {
    switch (currentPage) {
      case 'clients':
        return <ClientsListPage onNavigate={navigate} onOpenCandidate={openCandidateModal} />;
      case 'clientDetail':
        return (
          <ClientDetailPage
            onNavigate={navigate}
            onOpenCandidate={openCandidateModal}
            context={pageContext}
          />
        );
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={navigate} onOpenCandidate={openCandidateModal} />;
    }
  }

  const candidateProfile = selectedCandidateId ? getCandidateProfile(selectedCandidateId) : undefined;

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center">
          <img src={buxtonLogoDataUrl} alt="Buxton Logo" className="h-10" />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <button
            onClick={() => navigate('dashboard')}
            className={`flex items-center px-4 py-2 rounded-md w-full ${
              currentPage === 'dashboard' ? 'bg-gray-900' : 'hover:bg-gray-700'
            }`}
          >
            <DashboardIcon />
            <span className="ml-3">Dashboard</span>
          </button>
          <button
            onClick={() => navigate('clients')}
            className={`flex items-center px-4 py-2 rounded-md w-full ${
              currentPage.startsWith('client') ? 'bg-gray-900' : 'hover:bg-gray-700'
            }`}
          >
            <ClientsIcon />
            <span className="ml-3">Clients</span>
          </button>
          <button className="flex items-center px-4 py-2 rounded-md w-full hover:bg-gray-700" type="button" disabled>
            <JobsIcon />
            <span className="ml-3">Jobs</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
          <button onClick={onLogout} className="w-full mt-4 text-left flex items-center text-sm text-red-400 hover:text-red-300">
            <LogoutIcon />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">{renderPage()}</main>

      {isCandidateModalOpen && candidateProfile && (
        <CandidateProfileModal profile={candidateProfile} onClose={closeCandidateModal} />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}