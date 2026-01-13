import { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Auto-reload on chunk load error (common in Vite + SW updates)
        // This happens when the browser/SW caches an old index.html but the JS chunks on the server are new/renamed
        const isChunkError = error.message.includes("Loading chunk") ||
            error.message.includes("Importing a module script failed") ||
            error.name === 'ChunkLoadError';

        if (isChunkError) {
            console.log("Chunk load error detected. Attempting auto-reload...");
            const lastReload = sessionStorage.getItem('chunk-reload-timestamp');
            const now = Date.now();

            // Only force reload if we haven't done so in the last 10 seconds to prevent infinite loops
            if (!lastReload || now - parseInt(lastReload) > 10000) {
                sessionStorage.setItem('chunk-reload-timestamp', now.toString());
                // Force reload from server, ignoring cache
                window.location.reload();
                return;
            }
        }
    }

    private handleReload = () => {
        // Clear cache/SW might be needed, but usually a simple reload is enough.
        // However, if the user is stuck, we can attempt to unregister SW or clear storage.

        // Try to empty partial caches if possible (optional)
        if ('caches' in window) {
            caches.keys().then((names) => {
                names.forEach((name) => {
                    caches.delete(name);
                });
            });
        }

        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#F5F7FA] font-sans">
                    <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden text-center p-8 animate-in fade-in zoom-in duration-300">

                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>

                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
                            Something went wrong
                        </h2>

                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                            We encountered an issue while loading the application. This typically happens after a new update.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-4 bg-[#0047AB] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                <RefreshCw size={16} />
                                Reload Application
                            </button>

                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Error Code: {this.state.error?.name || 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
