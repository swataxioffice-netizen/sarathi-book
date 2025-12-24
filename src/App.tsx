import { useState, useEffect } from 'react';
import { safeJSONParse } from './utils/storage';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import TripForm from './components/TripForm';
import History from './components/History';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ExpenseTracker from './components/ExpenseTracker';
import DocumentVault from './components/DocumentVault';
import Login from './components/Login';
import type { Trip } from './utils/fare';
import QuotationForm from './components/QuotationForm';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trips, setTrips] = useState<Trip[]>(() => safeJSONParse<Trip[]>('namma-cab-trips', []));

  useEffect(() => {
    localStorage.setItem('namma-cab-trips', JSON.stringify(trips));
  }, [trips]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[var(--bg-paper)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--border-ink)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleSaveTrip = (trip: Trip) => {
    setTrips(prev => [trip, ...prev]);
    setActiveTab('trips');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard trips={trips} />;
      case 'trips':
        return (
          <div className="space-y-8">
            <TripForm onSaveTrip={handleSaveTrip} />
            <History trips={trips} />
            <div className="h-px bg-slate-200 mx-4" />
            <QuotationForm />
          </div>
        );
      case 'expenses':
        return <ExpenseTracker />;
      case 'docs':
        return <DocumentVault />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard trips={trips} />;
    }
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white flex flex-col relative overflow-hidden shadow-2xl border-x border-slate-100">
      <Header />
      <main className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-20 bg-[#F5F7FA]">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <div className="h-screen w-full bg-slate-200 flex items-center justify-center">
          <AppContent />
        </div>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
