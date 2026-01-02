import { useState, useEffect, lazy, Suspense } from 'react';
import { safeJSONParse } from './utils/storage';
import { supabase } from './utils/supabase';
import UpdateWatcher from './components/UpdateWatcher';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { X, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useUpdate, UpdateProvider } from './contexts/UpdateContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import GoogleSignInButton from './components/GoogleSignInButton';
import SideNav from './components/SideNav';
import { NotificationProvider } from './contexts/NotificationContext';
import Notifications from './components/Notifications';
import { Analytics } from './utils/monitoring';
import type { Trip } from './utils/fare';
import type { SavedQuotation } from './utils/pdf';

// Lazy load heavy components to reduce initial bundle size
const TripForm = lazy(() => import('./components/TripForm'));
const History = lazy(() => import('./components/History'));
const Profile = lazy(() => import('./components/Profile'));
const ExpenseTracker = lazy(() => import('./components/ExpenseTracker'));
const Calculator = lazy(() => import('./components/Calculator'));
const QuotationForm = lazy(() => import('./components/QuotationForm'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const PublicProfile = lazy(() => import('./components/PublicProfile'));

// Loading fallback component
// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0047AB]"></div>
  </div>
);

function AppContent() {
  /* Guest Roaming Logic */
  const { user, isAdmin } = useAuth();
  const { needRefresh, updateServiceWorker } = useUpdate();

  const [activeTab, setActiveTab] = useState(() => {
    // Priority: 1. URL Hash, 2. Local Storage, 3. Default 'dashboard'
    const hash = window.location.hash.slice(1);
    const validTabs = ['dashboard', 'trips', 'expenses', 'calculator', 'profile', 'admin'];
    if (hash && validTabs.includes(hash)) return hash;
    return localStorage.getItem('nav-active-tab') || 'dashboard';
  });

  useEffect(() => {
    const handleNav = (e: any) => setActiveTab(e.detail);
    window.addEventListener('nav-tab-change', handleNav);
    return () => window.removeEventListener('nav-tab-change', handleNav);
  }, []);

  useEffect(() => {
    localStorage.setItem('nav-active-tab', activeTab);

    // Track Page View
    Analytics.viewPage(activeTab);

    // Check if the current hash is an auth redirect from Supabase
    // If so, DO NOT overwrite it, otherwise auth will fail
    const currentHash = window.location.hash;
    if (currentHash.includes('access_token') ||
      currentHash.includes('refresh_token') ||
      currentHash.includes('error_description')) {
      return;
    }

    // Update URL without reloading to support deep linking
    window.history.replaceState(null, '', `#${activeTab}`);
  }, [activeTab]);

  const [invoiceQuotationToggle, setInvoiceQuotationToggle] = useState<'invoice' | 'quotation'>('invoice');
  const [invoiceStep, setInvoiceStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<Trip[]>(() => safeJSONParse<Trip[]>('namma-cab-trips', []));
  const [quotations, setQuotations] = useState<SavedQuotation[]>(() => safeJSONParse<SavedQuotation[]>('saved-quotations', []));
  const [selectedQuotation, setSelectedQuotation] = useState<SavedQuotation | null>(null);
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

  useEffect(() => {
    localStorage.setItem('saved-quotations', JSON.stringify(quotations));
  }, [quotations]);

  // Sync Trips on Load/Login
  useEffect(() => {
    const fetchTrips = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
          if (error) throw error;

          if (data) {
            const cloudTrips: Trip[] = data.map(row => ({
              ...row.details,
              id: row.id // Ensure ID consistency
            }));

            setTrips(prev => {
              // Merge logic: Map by ID to avoid duplicates, keep newest versions if applicable
              const merged = new Map<string, Trip>();
              // Add local trips first
              prev.forEach(t => merged.set(t.id, t));
              // Overwrite/Add with cloud trips (Cloud is authority for synced data)
              cloudTrips.forEach(t => merged.set(t.id, t));

              return Array.from(merged.values())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
          }
        } catch (err) {
          console.error('Failed to fetch trips:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTrips();
  }, [user]);

  const handleSaveTrip = async (trip: Trip) => {
    // 1. Optimistic Update
    setTrips(prev => [trip, ...prev]);
    setSelectedQuotation(null); // Clear any active template

    // 2. Persistent Save
    if (user) {
      try {
        const { error } = await supabase.from('trips').upsert({
          id: trip.id,
          user_id: user.id,
          customer_name: trip.customerName,
          date: new Date(trip.date).toISOString(),
          amount: trip.totalFare,
          details: trip,
          pickup_location: (trip as any).from,
          drop_location: (trip as any).to,
          distance: (trip as any).distance
        });
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync trip to cloud:', err);
        // We could notify user here that cloud sync failed
      }
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This cannot be undone.")) return;
    setTrips(prev => prev.filter(t => t.id !== tripId));
    if (user) {
      try {
        await supabase.from('trips').delete().eq('id', tripId);
      } catch (err) { console.error('Cloud delete failed', err); }
    }
  };

  const handleSaveQuotation = (q: SavedQuotation) => {
    setQuotations(prev => [q, ...prev]);
  };

  const handleDeleteQuotation = (id: string) => {
    if (!window.confirm("Delete this quotation?")) return;
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  const handleConvertQuotation = (q: SavedQuotation) => {
    setSelectedQuotation(q);
    setInvoiceQuotationToggle('invoice');
    window.scrollTo({ top: 380, behavior: 'smooth' }); // Scroll to form (approx pos)
  };

  const { settings, docStats } = useSettings();

  const getCompletion = () => {
    let score = 0;
    const totalSteps = 5;
    if (settings.companyName && settings.companyAddress && settings.driverPhone) score++;
    const hasBank = settings.bankName && settings.accountNumber && settings.ifscCode && settings.holderName;
    const hasUPI = !!settings.upiId;
    if (hasBank || hasUPI) score++;
    if (settings.vehicles.length > 0) score++;
    if (docStats.hasFullVehicle) score++;
    if (docStats.hasFullDriver) score++;
    return Math.min(100, Math.round((score / totalSteps) * 100));
  };

  const completion = getCompletion();
  const isLocked = invoiceStep > 1 && invoiceQuotationToggle === 'invoice';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard trips={trips} />;
      case 'trips':
        return (
          <div className="relative min-h-[500px]">
            {/* Blurred Content Preview - Adjusted for higher visibility */}
            <div className={`space-y-4 transition-all duration-700 ${completion < 100 ? 'blur-[4px] pointer-events-none select-none opacity-70' : ''}`}>

              {!isLocked && (
                <div className="flex items-center gap-2">
                  {/* Toggle between Invoice and Quotation */}
                  <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1 relative overflow-auto flex-1">
                    <button
                      onClick={() => {
                        setInvoiceQuotationToggle('invoice');
                        setSelectedQuotation(null);
                      }}
                      className={`flex-1 min-w-[80px] py-2 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all ${invoiceQuotationToggle === 'invoice'
                        ? 'bg-[#0047AB] text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                      New Invoice
                    </button>
                    <button
                      onClick={() => setInvoiceQuotationToggle('quotation')}
                      className={`flex-1 min-w-[80px] py-2 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all ${invoiceQuotationToggle === 'quotation'
                        ? 'bg-[#6366F1] text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                      Quotation
                    </button>
                  </div>
                </div>
              )}

              {/* Show Invoice or Quotation based on toggle */}
              {invoiceQuotationToggle === 'invoice' ? (
                <div className="space-y-2">
                  <Suspense fallback={<LoadingFallback />}>
                    <TripForm onSaveTrip={handleSaveTrip} onStepChange={setInvoiceStep} invoiceTemplate={selectedQuotation} trips={trips} />
                  </Suspense>

                  {invoiceStep === 1 && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <Suspense fallback={<LoadingFallback />}>
                        <History trips={trips} type="invoice" onDeleteTrip={handleDeleteTrip} />
                      </Suspense>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Suspense fallback={<LoadingFallback />}>
                    <QuotationForm onSaveQuotation={handleSaveQuotation} quotations={quotations} />
                  </Suspense>

                  <div className="mt-8 pt-6 border-t border-slate-200 text-left">
                    <Suspense fallback={<LoadingFallback />}>
                      <History
                        quotations={quotations}
                        type="quotation"
                        onDeleteQuotation={handleDeleteQuotation}
                        onConvertQuotation={handleConvertQuotation}
                      />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>

            {/* Incomplete Profile Overlay */}
            {
              completion < 100 && (
                <div className="absolute inset-0 z-30 flex items-center justify-center p-6 animate-fade-in">
                  <div className="bg-white/90 backdrop-blur-xl w-full max-w-[340px] p-10 rounded-[40px] border border-white shadow-2xl text-center ring-1 ring-black/5">
                    <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center mb-8 mx-auto relative">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-100/50" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 * (1 - completion / 100)}
                          strokeLinecap="round"
                          className="text-green-500 transition-all duration-1500 ease-out"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xl font-black tracking-tighter text-slate-900">{completion}%</span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Profile Incomplete</h3>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-8">
                      You must complete your 100% profile details including business info, fleet, and documents to access invoicing features.
                    </p>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className="w-full py-4 bg-[#0047AB] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                    >
                      Setup My Profile
                    </button>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                        {settings.companyName ? '✅ Business Info' : '❌ Business Info'}<br />
                        {settings.vehicles.length > 0 ? '✅ Fleet Added' : '❌ Fleet Added'}<br />
                        {docStats.hasFullVehicle && docStats.hasFullDriver ? '✅ Documents Verified' : '❌ Documents Missing'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
          </div >
        );
      case 'expenses':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ExpenseTracker />
          </Suspense>
        );
      case 'calculator':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Calculator />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Profile />
          </Suspense>
        );
      case 'admin':
        return isAdmin ? (
          <Suspense fallback={<LoadingFallback />}>
            <AdminPanel />
          </Suspense>
        ) : <Dashboard trips={trips} />;
      default:
        return <Dashboard trips={trips} />;
    }
  };

  /* Public Profile Route */
  const params = new URLSearchParams(window.location.search);
  const publicProfileId = params.get('u');
  let publicProfileCode = params.get('code') || params.get('p');

  // Guard against "null" string from poorly generated URLs
  if (publicProfileCode === 'null') publicProfileCode = null;

  useEffect(() => {
    // Dynamic SEO title for public profiles
    if (publicProfileId || publicProfileCode) {
      document.title = 'Driver Profile - Sarathi Book';
    } else {
      document.title = 'Sarathi Book - Your Digital Office on Car';
    }
  }, [publicProfileId, publicProfileCode]);

  if (publicProfileId || publicProfileCode) {
    const parsedCode = publicProfileCode ? parseInt(publicProfileCode) : undefined;

    // Only return PublicProfile if we have a valid ID or valid numeric code
    if (publicProfileId || (parsedCode && !isNaN(parsedCode))) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <PublicProfile userId={publicProfileId || ''} driverCode={parsedCode} />
        </Suspense>
      );
    }
  }

  return (
    <>
      <UpdateWatcher />
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen w-full bg-slate-100 overflow-hidden">
        <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#F5F7FA]">
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize tracking-wide">{activeTab === 'trips' ? 'Invoices & Trips' : activeTab}</h2>
            <div className="flex items-center gap-4">
              {needRefresh ? (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100 animate-pulse shadow-sm"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                  <span className="text-[10px] font-black uppercase tracking-widest">New Version Available</span>
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  aria-label="Refresh page"
                  className="p-2 bg-slate-50 text-slate-400 rounded-full border border-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin text-blue-600' : ''} />
                </button>
              )}
              <Notifications />
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-slate-900">{user?.user_metadata?.full_name || 'Guest User'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver Account</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0047AB] flex items-center justify-center font-black border border-blue-200">
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'
                )}
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
                variant="full"
                className="w-full"
              />
              <button
                onClick={() => setShowLoginNudge(false)}
                className="w-full mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-white"
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

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SettingsProvider>
          <UpdateProvider>
            <AppContent />
          </UpdateProvider>
        </SettingsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
