import { useState, useEffect } from 'react';
import { safeJSONParse } from './utils/storage';
import { SettingsProvider } from './contexts/SettingsContext';
import { X } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import TripForm from './components/TripForm';
import History from './components/History';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ExpenseTracker from './components/ExpenseTracker';
import Calculator from './components/Calculator';

import type { Trip } from './utils/fare';
import QuotationForm from './components/QuotationForm';

import SideNav from './components/SideNav';

function AppContent() {
  /* Guest Roaming Logic */
  const { user, loading, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoiceQuotationToggle, setInvoiceQuotationToggle] = useState<'invoice' | 'quotation'>('invoice');
  const [trips, setTrips] = useState<Trip[]>(() => safeJSONParse<Trip[]>('namma-cab-trips', []));
  const [showLoginNudge, setShowLoginNudge] = useState(false);

  // Trigger login nudge after 2 minutes of roaming
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setShowLoginNudge(true), 120000);
      return () => clearTimeout(timer);
    } else {
      setShowLoginNudge(false);
    }
  }, [user]);

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
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard trips={trips} />;
      case 'trips':
        return (
          <div className="space-y-2">
            {/* Toggle between Invoice and Quotation */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1">
              <button
                onClick={() => setInvoiceQuotationToggle('invoice')}
                className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${invoiceQuotationToggle === 'invoice'
                  ? 'bg-[#0047AB] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                Invoice
              </button>
              <button
                onClick={() => setInvoiceQuotationToggle('quotation')}
                className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${invoiceQuotationToggle === 'quotation'
                  ? 'bg-[#0047AB] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                Quotation
              </button>
            </div>

            {/* Show Invoice or Quotation based on toggle */}
            {invoiceQuotationToggle === 'invoice' ? (
              <div className="space-y-2">
                <TripForm onSaveTrip={handleSaveTrip} />
                <History trips={trips} />
              </div>
            ) : (
              <QuotationForm />
            )}
          </div>
        );
      case 'expenses':
        return <ExpenseTracker />;
      case 'calculator':
        return <Calculator />;
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
              <Notifications />
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

      {/* Guest Login Nudge */}
      {showLoginNudge && !user && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:right-8 md:bottom-8 z-50 animate-slide-up">
          <div className="bg-[#1e293b] text-white p-5 rounded-2xl shadow-2xl border border-slate-700 max-w-sm relative overflow-hidden">
            {/* Gloss Effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full -mr-10 -mt-10"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-black text-lg">Enjoying Sarathi?</h3>
                <button onClick={() => setShowLoginNudge(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-300 font-medium mb-4">
                Sign in to sync your trips, expenses, and invoices across all your devices securely.
              </p>
              <button
                onClick={() => signInWithGoogle()}
                className="w-full bg-white text-[#0f172a] font-black py-3 rounded-xl uppercase tracking-wider text-xs hover:bg-blue-50 transition-colors"
              >
                Connect Google Account
              </button>
              <button
                onClick={() => setShowLoginNudge(false)}
                className="w-full mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-white"
                style={{ fontFamily: 'Korkai' }}
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import ReloadPrompt from './components/ReloadPrompt';
import { NotificationProvider } from './contexts/NotificationContext';
import Notifications from './components/Notifications';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SettingsProvider>
          <AppContent />
          <ReloadPrompt />
        </SettingsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
