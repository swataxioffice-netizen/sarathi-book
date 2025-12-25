import { useState, useEffect } from 'react';
import { safeJSONParse } from './utils/storage';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ShieldCheck } from 'lucide-react';
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

import SideNav from './components/SideNav';

function AppContent() {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trips, setTrips] = useState<Trip[]>(() => safeJSONParse<Trip[]>('namma-cab-trips', []));

  useEffect(() => {
    localStorage.setItem('namma-cab-trips', JSON.stringify(trips));
  }, [trips]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[var(--bg-app)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0047AB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  /* Guest Access Enabled - Login handled per tab */

  const handleSaveTrip = (trip: Trip) => {
    setTrips(prev => [trip, ...prev]);
    setActiveTab('trips');
  };

  const renderContent = () => {
    // Public Access
    if (activeTab === 'dashboard') {
      return <Dashboard trips={trips} />;
    }

    // Auth Gate
    if (!user) {
      return <Login />;
    }

    // Profile Completion Gate
    const isProfileIncomplete = settings.companyName === 'SWA TAXI SERVICES';
    if (['trips', 'expenses', 'docs'].includes(activeTab) && isProfileIncomplete) {
      return (
        <div className="space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-black text-amber-900 uppercase text-xs tracking-wider">Setup Required</p>
                <p className="text-[11px] font-bold text-amber-700/80 uppercase tracking-wide">Please complete your business profile to unlock this feature.</p>
              </div>
            </div>
          </div>
          {/* Render Profile for them to fix it */}
          <Profile />
        </div>
      );
    }

    switch (activeTab) {
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
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen w-full bg-slate-100 overflow-hidden">
        <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#F5F7FA]">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize tracking-wide">{activeTab === 'trips' ? 'Invoices & Trips' : activeTab}</h2>
            <div className="flex items-center gap-4">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-slate-900">{user?.user_metadata?.full_name || 'Guest User'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver Account</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0047AB] flex items-center justify-center font-black border border-blue-200">
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto w-full">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-screen w-full bg-white flex flex-col relative overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-24 bg-[#F5F7FA]">
          {renderContent()}
        </main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
