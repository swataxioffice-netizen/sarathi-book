import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { safeJSONParse } from './utils/storage';
import { dbRequest } from './utils/db'; // IndexedDB
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

import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import Notifications from './components/Notifications';
import { Analytics } from './utils/monitoring';
import { subscribeToPush, onMessageListener } from './utils/push';
import type { Trip } from './utils/fare';
import type { SavedQuotation } from './utils/pdf';

// Lazy load heavy components to reduce initial bundle size
import Calculator from './components/Calculator';
const TripForm = lazy(() => import('./components/TripForm'));
const History = lazy(() => import('./components/History'));
const Profile = lazy(() => import('./components/Profile'));
const ExpenseTracker = lazy(() => import('./components/ExpenseTracker'));
// const Calculator = lazy(() => import('./components/Calculator')); // Moved to critical path
const QuotationForm = lazy(() => import('./components/QuotationForm'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const PublicProfile = lazy(() => import('./components/PublicProfile'));
const QuickNotes = lazy(() => import('./components/QuickNotes'));
const PricingModal = lazy(() => import('./components/PricingModal'));
const SalaryManager = lazy(() => import('./components/SalaryManager'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0047AB]"></div>
  </div>
);

function AppContent() {
  /* Guest Roaming Logic */
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { needRefresh, updateServiceWorker } = useUpdate();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState(() => {
    // Priority: 1. URL Path, 2. URL Hash (Legacy/Auth), 3. Local Storage, 4. Default 'dashboard'
    const pathname = window.location.pathname.slice(1).split('/')[0];
    const hash = window.location.hash.slice(1).split('/')[0];
    const validTabs = ['dashboard', 'trips', 'expenses', 'calculator', 'profile', 'admin', 'notes', 'staff'];

    if (pathname && validTabs.includes(pathname)) return pathname;
    if (hash && validTabs.includes(hash)) return hash;
    return localStorage.getItem('nav-active-tab') || 'dashboard';
  });

  // Support for Browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname.slice(1).split('/')[0];
      const validTabs = ['dashboard', 'trips', 'expenses', 'calculator', 'profile', 'admin', 'notes'];
      if (pathname && validTabs.includes(pathname)) {
        setActiveTab(pathname);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleNav = (e: any) => setActiveTab(e.detail);
    const handleQuoteNav = () => {
      setActiveTab('trips');
      setInvoiceQuotationToggle('quotation');
    };

    window.addEventListener('nav-tab-change', handleNav);
    window.addEventListener('nav-tab-quotation', handleQuoteNav);
    return () => {
      window.removeEventListener('nav-tab-change', handleNav);
      window.removeEventListener('nav-tab-quotation', handleQuoteNav);
    };
  }, []);

  // Scroll inputs into view on focus
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  useEffect(() => {
    localStorage.setItem('nav-active-tab', activeTab);

    // Track Page View
    Analytics.viewPage(activeTab);

    // Check for auth redirects from Supabase (usually in Hash)
    const currentHash = window.location.hash;
    if (currentHash.includes('access_token') ||
      currentHash.includes('refresh_token') ||
      currentHash.includes('error_description')) {
      return;
    }

    // Update URL without reloading to support deep linking (Replace History)
    // We preserve the full URL if it already starts with the active tab to support sub-paths and search params
    const currentPath = window.location.pathname;
    const currentTab = currentPath.slice(1).split('/')[0] || 'dashboard';

    // If the tab just changed, we go to the base path. 
    // If we are already on that tab, we do nothing to avoid stripping sub-paths/params.
    if (currentPath.startsWith('/public')) return;

    if (activeTab !== currentTab) {
      if (activeTab !== 'admin' || isAdmin) {
        window.history.replaceState(null, '', `/${activeTab}`);
      }
    } else if (currentPath === '/' && activeTab !== 'dashboard') {
      window.history.replaceState(null, '', `/${activeTab}`);
    }
  }, [activeTab, isAdmin]);

  const [invoiceQuotationToggle, setInvoiceQuotationToggle] = useState<'invoice' | 'quotation'>('invoice');
  const [invoiceStep, setInvoiceStep] = useState(1);
  const [quotationStep, setQuotationStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // Initialize as empty, load from IDB in useEffect
  const [trips, setTrips] = useState<Trip[]>([]);
  const [quotations, setQuotations] = useState<SavedQuotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<SavedQuotation | null>(null);
  const [showLoginNudge, setShowLoginNudge] = useState(false);

  // Guest Login Nudge Logic
  useEffect(() => {
    if (user?.id) {
      setShowLoginNudge(false);
      subscribeToPush();
    } else if (!authLoading) {
      const timer = setTimeout(() => setShowLoginNudge(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, authLoading]);

  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    const handleOpenPricing = () => setShowPricing(true);
    window.addEventListener('open-pricing-modal', handleOpenPricing);
    return () => window.removeEventListener('open-pricing-modal', handleOpenPricing);
  }, []);

  // Handle foreground notifications
  useEffect(() => {
    onMessageListener().then((payload: any) => {
      console.log('Push received in foreground:', payload);
      if (payload.notification) {
        addNotification(payload.notification.title, payload.notification.body, 'info');
      }
    });
  }, [addNotification]);

  // Load Data from IndexedDB (with Migration Fallback)
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Trips
        let storedTrips = await dbRequest.getAll<Trip>('trips');
        if (storedTrips.length === 0) {
          // Migration: Check LocalStorage
          const lsTrips = safeJSONParse<Trip[]>('namma-cab-trips', []);
          if (lsTrips.length > 0) {
            console.log('Migrating Trips to IndexedDB...');
            await Promise.all(lsTrips.map(t => dbRequest.put('trips', t)));
            storedTrips = lsTrips;
            // Optional: localStorage.removeItem('namma-cab-trips');
          }
        }
        setTrips(storedTrips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        // 2. Quotations
        let storedQuotes = await dbRequest.getAll<SavedQuotation>('quotations');
        if (storedQuotes.length === 0) {
          // Migration
          const lsQuotes = safeJSONParse<SavedQuotation[]>('saved-quotations', []);
          if (lsQuotes.length > 0) {
            console.log('Migrating Quotations to IndexedDB...');
            await Promise.all(lsQuotes.map(q => dbRequest.put('quotations', q)));
            storedQuotes = lsQuotes;
          }
        }
        setQuotations(storedQuotes);

      } catch (error) {
        console.error("Failed to load data from DB:", error);
      }
    };
    loadData();
  }, []);

  // Removed localStorage effects as we now save on-demand (Optimistic + DB)


  const hasSyncedRef = useRef(false);

  // Sync Trips on Load/Login
  useEffect(() => {
    const fetchTrips = async () => {
      if (user && !hasSyncedRef.current) {
        hasSyncedRef.current = true; // Lock sync for this user session
        setLoading(true);
        try {
          // 1. Fetch Cloud Trips
          const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
          if (error) throw error;

          const cloudTripsMap = new Map<string, Trip>();
          if (data) {
            data.forEach(row => {
              cloudTripsMap.set(row.id, { ...row.details, id: row.id });
            });
          }

          // 2. Identify and Upload Local-Only Trips to Cloud
          const localTipsToUpload: Trip[] = [];

          // Access valid current trips (ignoring any potential state closure staleness if possible, 
          // but here we rely on 'trips' from closure which is fresh due to [user] dep getting hit after state updates usually)
          // Actually, 'trips' in this scope might be stale if strict mode runs effect twice? 
          // Better to use functional access or ref, but for now we trust 'trips' dependency or local read.
          // Wait, 'trips' is not in dependency array.

          // Let's use a trick: read from localStorage for source of truth of "Guest Work" to sync up
          const localStored = safeJSONParse<Trip[]>('namma-cab-trips', []);

          for (const localTrip of localStored) {
            if (!cloudTripsMap.has(localTrip.id)) {
              localTipsToUpload.push(localTrip);
            }
          }

          if (localTipsToUpload.length > 0) {
            console.log(`Syncing ${localTipsToUpload.length} local trips to cloud...`);
            await Promise.all(localTipsToUpload.map(t =>
              supabase.from('trips').upsert({
                id: t.id,
                user_id: user.id,
                customer_name: t.customerName,
                date: new Date(t.date).toISOString(),
                amount: t.totalFare,
                details: t,
                pickup_location: (t as any).from,
                drop_location: (t as any).to,
                distance: (t as any).distance
              })
            ));
            // Re-fetch to get cleaner state? Or just trust our merge logic below.
            // Let's rely on merge logic, but now cloudTripsMap effectively should include these if we wanted perfect sync,
            // but the merge logic below handles visual consistency.
          }

          setTrips(prev => {
            const merged = new Map<string, Trip>();
            // Keep local changes
            prev.forEach(t => merged.set(t.id, t));

            // Add Cloud Data (Win conflicts? Or Local wins? Standard sync usually Cloud Wins)
            cloudTripsMap.forEach((t, id) => merged.set(id, t));

            // Add the just-uploaded local trips back? 
            // They are already in 'prev' (from local), and we just pushed them to cloud.
            // If we fetched cloud trips BEFORE pushing, cloudTripsMap lacks them.
            // 'prev' has them. 'merged' has them. We are good.

            return Array.from(merged.values())
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });

        } catch (err) {
          console.error('Failed to sync trips:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTrips();

    if (!user) {
      hasSyncedRef.current = false; // Reset lock on logout
    }
  }, [user]);

  const handleSaveTrip = async (trip: Trip) => {
    // 1. Optimistic Update
    setTrips(prev => {
      const idx = prev.findIndex(t => t.id === trip.id);
      if (idx !== -1) {
        const newTrips = [...prev];
        newTrips[idx] = trip;
        return newTrips;
      }
      return [trip, ...prev];
    });
    setSelectedQuotation(null); // Clear any active template

    // 2. Persistent Save (IDB)
    try {
      await dbRequest.put('trips', trip);
    } catch (err) {
      console.error('Failed to save to IDB', err);
    }

    // 3. Persistent Save (Cloud)
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

    // IDB
    try {
      await dbRequest.delete('trips', tripId);
    } catch (err) { console.error('IDB delete failed', err); }

    if (user) {
      try {
        await supabase.from('trips').delete().eq('id', tripId);
      } catch (err) { console.error('Cloud delete failed', err); }
    }
  };

  const handleSaveQuotation = async (q: SavedQuotation) => {
    setQuotations(prev => [q, ...prev]);
    await dbRequest.put('quotations', q);
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!window.confirm("Delete this quotation?")) return;
    setQuotations(prev => prev.filter(q => q.id !== id));
    await dbRequest.delete('quotations', id);
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
            {/* Content Container - Removed Blur/Lock */}
            <div className="space-y-4 transition-all duration-700">

              {/* Non-blocking Profile Nudge */}
              {completion < 100 && (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-4 animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  <div className="relative z-10 w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </div>
                  <div className="relative z-10 flex-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">Incomplete Profile</h4>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-3">
                      Your business details are needed for generating invoices.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-colors"
                      >
                        Complete Now
                      </button>
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-col gap-1 items-end justify-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{completion}% Done</div>
                    <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${completion}%` }}></div>
                    </div>
                  </div>
                </div>
              )}

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
                    <QuotationForm onSaveQuotation={handleSaveQuotation} quotations={quotations} onStepChange={setQuotationStep} />
                  </Suspense>

                  {quotationStep === 1 && (
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
                  )}
                </div>
              )}
            </div>
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
          // Suspense is not strictly needed if Calculator is static, but keeping it is fine or removing it.
          // Since we made it static, we can remove Suspense or keep it as wrapper (it does no harm).
          // But to be clean:
          <Calculator />
        );
      case 'notes':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <QuickNotes />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Profile />
          </Suspense>
        );
      case 'staff':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SalaryManager />
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
  const pathSegments = window.location.pathname.split('/');
  const publicProfileId = pathSegments[1] === 'public' ? pathSegments[2] : null;

  if (publicProfileId) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {/* Dynamically import PublicProfile to avoid bundling it for admins if possible, though needed here */}
        <PublicProfile userId={publicProfileId} />
      </Suspense>
    );
  }

  return (
    <>

      <UpdateWatcher />
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen w-full bg-slate-100 overflow-hidden">
        <SideNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#F5F7FA]">
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
            <h2 className="text-hero font-bold text-slate-800 capitalize tracking-wide">{activeTab === 'trips' ? 'Invoices & Trips' : activeTab}</h2>
            <div className="flex items-center gap-4">
              {needRefresh && (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100 animate-pulse shadow-sm"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                  <span className="text-[10px] font-black uppercase tracking-widest">New Version Available</span>
                </button>
              )}
              <Notifications />
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-slate-900">{user?.user_metadata?.full_name || 'Guest User'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver Account</p>
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className="w-10 h-10 rounded-full bg-blue-100 text-[#0047AB] flex items-center justify-center font-black border border-blue-200 hover:bg-blue-200 transition-colors"
                title={loading ? "Syncing data..." : "View Profile"}
              >
                {authLoading ? (
                  <RefreshCw size={16} className="animate-spin text-blue-400" />
                ) : (
                  user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url || user.user_metadata.picture} referrerPolicy="no-referrer" alt="Profile" width="40" height="40" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'
                  )
                )}
              </button>
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
      <div className="md:hidden h-[100dvh] w-full bg-white flex flex-col relative overflow-hidden">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 pb-24 bg-[#F5F7FA] relative">
          {renderContent()}

          {/* Quick Notes FAB */}

        </main>
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Pricing Modal */}
      <Suspense fallback={null}>
        <PricingModal
          isOpen={showPricing}
          onClose={() => setShowPricing(false)}
        />
      </Suspense>

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
              <GoogleSignInButton className="w-full" />
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
    <UpdateProvider>
      <AuthProvider>
        <NotificationProvider>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </NotificationProvider>
      </AuthProvider>
    </UpdateProvider>
  );
}

export default App;
