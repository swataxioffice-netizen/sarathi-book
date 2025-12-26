import { useState, useEffect } from 'react';
import { safeJSONParse } from './utils/storage';
import { supabase } from './utils/supabase';
import UpdateWatcher from './components/UpdateWatcher';
import { SettingsProvider } from './contexts/SettingsContext';
import { X, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useUpdate } from './contexts/UpdateContext';
import Header from './components/Header';
import TripForm from './components/TripForm';
import History from './components/History';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ExpenseTracker from './components/ExpenseTracker';
import Calculator from './components/Calculator';
import GoogleSignInButton from './components/GoogleSignInButton';

import type { Trip } from './utils/fare';
import QuotationForm from './components/QuotationForm';
import AdminPanel from './components/AdminPanel';

import SideNav from './components/SideNav';

function AppContent() {
  /* Guest Roaming Logic */
  const { user, isAdmin } = useAuth();
  const { needRefresh, updateServiceWorker } = useUpdate();

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('nav-active-tab') || 'dashboard');

  useEffect(() => {
    localStorage.setItem('nav-active-tab', activeTab);
  }, [activeTab]);

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



  /* Guest Access Enabled - Login handled per tab */

  // Sync Trips on Load/Login
  useEffect(() => {
    const fetchTrips = async () => {
      if (user) {
        const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
        if (data) {
          // Map DB rows back to Trip objects if needed, or just use the JSON `details` if that's where we store it.
          // Since I created specific columns + details jsonb, I'll prefer `details` for full fidelity.
          const cloudTrips: Trip[] = data.map(row => row.details);
          // Simple Strategy: If cloud has data, use it. Or merge. 
          // For now, let's Append Cloud trips that aren't in local? Or just Replace local with cloud?
          // User asked for "internet came back it all upload back". This implies sync.
          // Simplest Robust Strategy for single-user-multi-device:
          // 1. Fetch Cloud. 
          // 2. Identify Local trips not in Cloud (by ID?).
          // 3. Upload Local-only trips to Cloud.
          // 4. Set State to Union.

          setTrips(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newFromCloud = cloudTrips.filter(c => !existingIds.has(c.id));
            return [...newFromCloud, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
        }
      }
    };
    fetchTrips();
  }, [user]);

  // Sync Local Trips to Cloud (Background Sync) - Placeholder for future robust sync
  useEffect(() => {
    // Intentionally left blank for simplified flow: Cloud Restore on User Login
  }, [user]);

  const handleSaveTrip = async (trip: Trip) => {
    const newTrips = [trip, ...trips];
    setTrips(newTrips);

    // Save to Cloud
    if (user) {
      await supabase.from('trips').upsert({
        id: trip.id,
        user_id: user.id,
        customer_name: trip.customerName,
        // Map 'mode' to customer_name or drop_location if needed? 
        // Actually customer_name is present in Trip.
        date: trip.date,
        amount: trip.totalFare,
        details: trip
      });
    }
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
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard trips={trips} />;
      default:
        return <Dashboard trips={trips} />;
    }
  };

  return (
    <>
      <UpdateWatcher />
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen w-full bg-slate-100 overflow-hidden">
        <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#F5F7FA]">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize tracking-wide">{activeTab === 'trips' ? 'Invoices & Trips' : activeTab}</h2>
            <div className="flex items-center gap-4">
              {needRefresh ? (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100 animate-pulse shadow-sm"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 bg-slate-50 text-slate-400 rounded-full border border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
              )}
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
              <GoogleSignInButton
                text="Sign in with Google"
                size="large"
                className="w-full"
              />
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

import { UpdateProvider } from './contexts/UpdateContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SettingsProvider>
          <UpdateProvider>
            <AppContent />
            <ReloadPrompt />
          </UpdateProvider>
        </SettingsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
