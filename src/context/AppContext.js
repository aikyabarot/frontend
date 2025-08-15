import { createContext, useContext, useMemo, useState, useEffect } from 'react';

// Minimal in-memory data to preserve current functionality without TS types
const mockCandidates = [
  { id: 1, name: 'Alex Johnson', title: 'Senior Backend Engineer', email: 'alex@example.com', associatedJobId: 101 },
  { id: 2, name: 'Priya Shah', title: 'Frontend Engineer', email: 'priya@example.com', associatedJobId: 102 },
  { id: 3, name: 'Diego Alvarez', title: 'Data Scientist', email: 'diego@example.com', associatedJobId: 103 }
];

const mockJobs = [
  { id: 101, title: 'Backend Engineer', clientId: 1, status: 'Open' },
  { id: 102, title: 'Frontend Engineer', clientId: 1, status: 'Open' },
  { id: 103, title: 'Data Scientist', clientId: 2, status: 'Closed' }
];

const mockClients = [
  { id: 1, name: 'Acme Corp', description: 'E-commerce platform modernization', contacts: [], candidateIds: [1, 2] },
  { id: 2, name: 'Globex Inc', description: 'Cloud migration and analytics', contacts: [], candidateIds: [3] }
];

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeUser, setActiveUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'clients' | 'clientDetail'
  const [pageContext, setPageContext] = useState(null);
  const [isCandidateModalOpen, setCandidateModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [clients, setClients] = useState(mockClients);
  const [jobs] = useState(mockJobs);
  const [candidates] = useState(mockCandidates);

  const login = (email) => {
    const name = email.split('@')[0];
    setActiveUser({ id: 'user-1', name: name.charAt(0).toUpperCase() + name.slice(1), email, role: 'Recruiter' });
    navigate('dashboard');
  };

  const logout = () => {
    setActiveUser(null);
    setCurrentPage('login');
  };

  const navigate = (page, context = null) => {
    setCurrentPage(page);
    setPageContext(context);
  };

  const openCandidateModal = (candidateId) => {
    setSelectedCandidateId(candidateId);
    setCandidateModalOpen(true);
  };

  const closeCandidateModal = () => {
    setCandidateModalOpen(false);
    setSelectedCandidateId(null);
  };

  const showToast = (message) => {
    setToastMessage(message);
  };

  const addClientContact = (clientId, newContact) => {
    const newContactId = Math.max(...clients.flatMap(c => c.contacts?.map(ct => ct.contactId) || [0]), 0) + 1;
    const contactToAdd = { ...newContact, contactId: newContactId };
    const updatedClients = clients.map(client => {
      if (client.id === clientId) {
        return { ...client, contacts: [...(client.contacts || []), contactToAdd] };
      }
      return client;
    });
    setClients(updatedClients);
    showToast('Contact added successfully!');
  };

  const getCandidateProfile = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return undefined;
    const job = jobs.find(j => j.id === candidate.associatedJobId);
    if (!job) return undefined;
    return { ...candidate, job };
  };

  const getClient = (clientId) => clients.find(c => c.id === clientId);
  const getJobsForClient = (clientId) => jobs.filter(j => j.clientId === clientId);
  const getOpenJobsCount = () => jobs.filter(j => j.status === 'Open').length;
  const getJobs = () => jobs;
  const getClients = () => clients;

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const value = useMemo(() => ({
    activeUser,
    currentPage,
    pageContext,
    isCandidateModalOpen,
    selectedCandidateId,
    toastMessage,
    candidates,
    login,
    logout,
    navigate,
    openCandidateModal,
    closeCandidateModal,
    showToast,
    addClientContact,
    getCandidateProfile,
    getClient,
    getJobsForClient,
    getOpenJobsCount,
    getJobs,
    getClients
  }), [
    activeUser,
    currentPage,
    pageContext,
    isCandidateModalOpen,
    selectedCandidateId,
    toastMessage,
    clients,
    jobs,
    candidates
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
}