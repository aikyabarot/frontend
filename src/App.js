import { AppProvider, useAppData } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import RootLayout from './layouts/RootLayout';
import './App.css';

function AppContent() {
  const { activeUser, login, logout } = useAppData();

  if (!activeUser) {
    return <LoginPage onLogin={login} />;
  }

  return <RootLayout user={activeUser} onLogout={logout} />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}