import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { safeJSONParse } from './utils/storage';
import { dbRequest } from './utils/db'; // IndexedDB
import { supabase } from './utils/supabase';
import UpdateWatcher from './components/UpdateWatcher';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
// Staging Environment Trigger
import { X, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useUpdate, UpdateProvider } from './contexts/UpdateContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import GoogleSignInButton from './components/GoogleSignInButton';
import SideNav from './components/SideNav';
import Footer from './components/Footer';

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

const QuotationForm = lazy(() => import('./components/QuotationForm'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const PublicProfile = lazy(() => import('./components/PublicProfile'));
const QuickNotes = lazy(() => import('./components/QuickNotes'));
const PricingModal = lazy(() => import('./components/PricingModal'));
const SalaryManager = lazy(() => import('./components/SalaryManager'));
const TrendingRoutes = lazy(() => import('./components/TrendingRoutes'));
const RoutesDirectory = lazy(() => import('./components/RoutesDirectory'));
const TariffPage = lazy(() => import('./components/TariffPage'));
const MobileMenu = lazy(() => import('./components/MobileMenu'));
const Finance = lazy(() => import('./components/Finance'));
const RouteLandingPage = lazy(() => import('./components/RouteLandingPage'));

const AboutUs = lazy(() => import('./components/AboutUs'));
const ContactUs = lazy(() => import('./components/ContactUs'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));

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
    // Priority: 1. URL Path, 2. URL Hash (Legacy/Auth), 3. Local Storage, 4. Default 'calculator'
    const pathname = window.location.pathname.slice(1).split('/')[0];
    const hash = window.location.hash.slice(1).split('/')[0];
    const validTabs = ['dashboard', 'trips', 'expenses', 'calculator', 'taxi-fare-calculator', 'profile', 'admin', 'notes', 'staff', 'trending', 'routes', 'tariff', 'finance', 'about', 'contact', 'privacy', 'terms'];

    // Migration: specific check to force old defaults (dashboard) to new default (calculator) one time
    const storedTab = localStorage.getItem('nav-active-tab');
    if (storedTab === 'dashboard' && !pathname && !hash) {
      // If user was on dashboard and just opened app (no specific path), force calculator
      return 'taxi-fare-calculator';
    }

    if (pathname && validTabs.includes(pathname)) return pathname;

    // SEO Route Detection (e.g. chennai-to-bangalore-taxi)
    if (pathname && (pathname.includes('-to-') || pathname.endsWith('-taxi'))) {
      return pathname;
    }

    if (hash && validTabs.includes(hash)) return hash;
    return storedTab || 'taxi-fare-calculator';
  });

  // Support for Browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname.slice(1).split('/')[0];
      const validTabs = ['dashboard', 'trips', 'expenses', 'calculator', 'taxi-fare-calculator', 'profile', 'admin', 'notes', 'trending', 'routes', 'tariff', 'finance', 'staff', 'about', 'contact', 'privacy', 'terms'];
      if (pathname && validTabs.includes(pathname)) {
        setActiveTab(pathname);
      } else if (pathname && (pathname.includes('-to-') || pathname.endsWith('-taxi') || pathname.endsWith('-rental'))) {
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
    const handleInvoiceNav = () => {
      setActiveTab('trips');
      setInvoiceQuotationToggle('invoice');
    };

    window.addEventListener('nav-tab-change', handleNav);
    window.addEventListener('nav-tab-quotation', handleQuoteNav);
    window.addEventListener('nav-tab-invoice', handleInvoiceNav);
    return () => {
      window.removeEventListener('nav-tab-change', handleNav);
      window.removeEventListener('nav-tab-quotation', handleQuoteNav);
      window.removeEventListener('nav-tab-invoice', handleInvoiceNav);
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
  // Guest Login Nudge Logic
  useEffect(() => {
    if (user?.id) {
      setShowLoginNudge(false);
      subscribeToPush();
    } else if (!authLoading) {
      const lastClosed = localStorage.getItem('login_nudge_closed_at');
      const COOLDOWN = 24 * 60 * 60 * 1000; // 24 Hours

      const shouldShow = !lastClosed || (Date.now() - parseInt(lastClosed) > COOLDOWN);

      if (shouldShow) {
        const timer = setTimeout(() => setShowLoginNudge(true), 15000); // Increased initial delay to 15s to be less intrusive
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id, authLoading]);

  const handleCloseNudge = () => {
    setShowLoginNudge(false);
    localStorage.setItem('login_nudge_closed_at', Date.now().toString());
  };

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

          // Use IndexedDB as the source of truth for local data
          let localStored: Trip[] = [];
          try {
            localStored = await dbRequest.getAll<Trip>('trips');
          } catch (e) {
            console.warn('Failed to read IDB for sync, falling back to localStorage', e);
            localStored = safeJSONParse<Trip[]>('namma-cab-trips', []);
          }

          for (const localTrip of localStored) {
            // If the trip is not in the cloud map, it's a local-only trip (created offline)
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

          // --- 3. Sync Quotations ---
          // Fetch Cloud Quotations
          const { data: qData, error: qError } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
          if (!qError) {
            const cloudQuotesMap = new Map<string, SavedQuotation>();
            if (qData) {
              qData.forEach(row => {
                cloudQuotesMap.set(row.id, { ...row.data, id: row.id });
              });
            }

            // Upload Local-Only Quotations
            const localQuotesToUpload: SavedQuotation[] = [];
            let localStoredQuotes: SavedQuotation[] = [];
            try {
              localStoredQuotes = await dbRequest.getAll<SavedQuotation>('quotations');
            } catch (e) {
              localStoredQuotes = safeJSONParse<SavedQuotation[]>('saved-quotations', []);
            }

            for (const localQ of localStoredQuotes) {
              if (!cloudQuotesMap.has(localQ.id)) {
                localQuotesToUpload.push(localQ);
              }
            }

            if (localQuotesToUpload.length > 0) {
              console.log(`Syncing ${localQuotesToUpload.length} local quotations to cloud...`);
              await Promise.all(localQuotesToUpload.map(q =>
                supabase.from('quotations').upsert({
                  id: q.id,
                  user_id: user.id,
                  customer_name: q.customerName,
                  date: new Date(q.date).toISOString(),
                  data: q
                })
              ));
            }

            setQuotations(prev => {
              const merged = new Map<string, SavedQuotation>();
              prev.forEach(q => merged.set(q.id, q));
              cloudQuotesMap.forEach((q, id) => merged.set(id, q));
              return Array.from(merged.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
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

  // 4. Real-time Subscription for Simultaneous Sync
  useEffect(() => {
    if (!user) return;

    // Subscribe to Trips
    const tripsChannel = supabase
      .channel('public:trips')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time trip change:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newTrip: Trip = { ...payload.new.details, id: payload.new.id };
            setTrips(prev => {
              const idx = prev.findIndex(t => t.id === newTrip.id);
              if (idx !== -1) {
                // Only update if data is different? Prevents recursive loops
                if (JSON.stringify(prev[idx]) === JSON.stringify(newTrip)) return prev;
                const next = [...prev];
                next[idx] = newTrip;
                return next;
              }
              return [newTrip, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
            dbRequest.put('trips', newTrip).catch(console.error);
          } else if (payload.eventType === 'DELETE') {
            setTrips(prev => prev.filter(t => t.id !== payload.old.id));
            dbRequest.delete('trips', payload.old.id).catch(console.error);
          }
        }
      )
      .subscribe();

    // Subscribe to Quotations
    const quotesChannel = supabase
      .channel('public:quotations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time quotation change:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newQuote: SavedQuotation = { ...payload.new.data, id: payload.new.id };
            setQuotations(prev => {
              const idx = prev.findIndex(q => q.id === newQuote.id);
              if (idx !== -1) {
                if (JSON.stringify(prev[idx]) === JSON.stringify(newQuote)) return prev;
                const next = [...prev];
                next[idx] = newQuote;
                return next;
              }
              return [newQuote, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
            dbRequest.put('quotations', newQuote).catch(console.error);
          } else if (payload.eventType === 'DELETE') {
            setQuotations(prev => prev.filter(q => q.id !== payload.old.id));
            dbRequest.delete('quotations', payload.old.id).catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tripsChannel);
      supabase.removeChannel(quotesChannel);
    };
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

    // 3. Persistent Save (Cloud) - Non-blocking
    if (user) {
      (async () => {
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
          if (error) console.error('Failed to sync trip to cloud:', error.message);
        } catch (err) {
          console.error('Cloud trip sync exception:', err);
        }
      })();
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

    if (user) {
      (async () => {
        try {
          const { error } = await supabase.from('quotations').upsert({
            id: q.id,
            user_id: user.id,
            customer_name: q.customerName,
            date: new Date(q.date).toISOString(),
            data: q
          });
          if (error) console.error('Cloud quote save failed:', error.message);
        } catch (err) {
          console.error('Cloud quote sync exception:', err);
        }
      })();
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!window.confirm("Delete this quotation?")) return;
    setQuotations(prev => prev.filter(q => q.id !== id));
    await dbRequest.delete('quotations', id);

    if (user) {
      try {
        await supabase.from('quotations').delete().eq('id', id);
      } catch (err) { console.error('Cloud quote delete failed', err); }
    }
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
                <div className={invoiceStep === 1 ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" : "max-w-4xl mx-auto space-y-4"}>
                  <div className={invoiceStep === 1 ? "lg:col-span-7 w-full" : "w-full"}>
                    <Suspense fallback={<LoadingFallback />}>
                      <TripForm onSaveTrip={handleSaveTrip} onStepChange={setInvoiceStep} invoiceTemplate={selectedQuotation} trips={trips} />
                    </Suspense>
                  </div>

                  {invoiceStep === 1 && (
                    <div className="lg:col-span-5 w-full mt-4 lg:mt-0">
                      <div className="sticky top-4">
                        <Suspense fallback={<LoadingFallback />}>
                          <History trips={trips} type="invoice" onDeleteTrip={handleDeleteTrip} />
                        </Suspense>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={quotationStep === 1 ? "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" : "max-w-4xl mx-auto space-y-4"}>
                  <div className={quotationStep === 1 ? "lg:col-span-7 w-full" : "w-full"}>
                    <Suspense fallback={<LoadingFallback />}>
                      <QuotationForm onSaveQuotation={handleSaveQuotation} quotations={quotations} onStepChange={setQuotationStep} />
                    </Suspense>
                  </div>

                  {quotationStep === 1 && (
                    <div className="lg:col-span-5 w-full mt-4 lg:mt-0">
                      <div className="sticky top-4">
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
      case 'taxi-fare-calculator':
        return (
          <Calculator />
        );
      case 'trending':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TrendingRoutes />
          </Suspense>
        );
      case 'routes':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <RoutesDirectory />
          </Suspense>
        );
      case 'tariff':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TariffPage />
          </Suspense>
        );
      case 'finance':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Finance />
          </Suspense>
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
      case 'about':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AboutUs />
          </Suspense>
        );
      case 'contact':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ContactUs />
          </Suspense>
        );
      case 'privacy':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PrivacyPolicy />
          </Suspense>
        );
      case 'terms':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TermsOfService />
          </Suspense>
        );
      default:
        // Check if it's an SEO route
        if (activeTab.includes('-to-') || activeTab.endsWith('-taxi') || activeTab.endsWith('-rental')) {
          return (
            <Suspense fallback={<LoadingFallback />}>
              <RouteLandingPage slug={activeTab} />
            </Suspense>
          );
        }
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              {!user ? (
                <GoogleSignInButton
                  text="Sign In"
                  className="!w-fit !py-2 !px-4 !text-xs !rounded-xl !shadow-sm !border-slate-200 !gap-2"
                />
              ) : (
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
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto w-full">
              {renderContent()}
            </div>
            {/* Show Footer on Public Pages */}
            {!['dashboard', 'admin', 'profile', 'staff', 'finance'].includes(activeTab) && (
              <Footer setActiveTab={setActiveTab} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden h-[100dvh] w-full bg-white flex flex-col relative overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 pb-24 bg-[#F5F7FA] relative">
          {renderContent()}
          {/* Show Footer on Public Pages for Mobile */}
          {!['dashboard', 'admin', 'profile', 'staff', 'finance', 'notes'].includes(activeTab) && (
            <Footer setActiveTab={setActiveTab} />
          )}
        </main>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <Suspense fallback={null}>
          <MobileMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </Suspense>
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
                <button onClick={handleCloseNudge} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-300 font-medium mb-4">
                Sign in to sync your trips, expenses, and invoices across all your devices securely.
              </p>
              <GoogleSignInButton className="w-full" />
              <button
                onClick={handleCloseNudge}
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
    <ErrorBoundary>
      <UpdateProvider>
        <AuthProvider>
          <NotificationProvider>
            <SettingsProvider>
              <AppContent />
            </SettingsProvider>
          </NotificationProvider>
        </AuthProvider>
      </UpdateProvider>
    </ErrorBoundary>
  );
}

export default App;
