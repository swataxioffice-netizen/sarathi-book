import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Loader2, Sparkles, MoveHorizontal, Mic } from 'lucide-react';
import { chatWithSarathi } from '../utils/geminiApi';

interface SarathiAIProps {
    onNavigate?: (page: string) => void;
}

const SarathiAI: React.FC<SarathiAIProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: "user" | "model", text: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isTyping]);

    const speakResponse = (text: string) => {
        if (!('speechSynthesis' in window)) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a good Indian English or Tamil voice
        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-GB'));

        if (indianVoice) utterance.voice = indianVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async (overrideMessage?: string) => {
        const textToSend = overrideMessage || message;
        if (!textToSend.trim()) return;

        setMessage('');
        setChatHistory(prev => [...prev, { role: "user", text: textToSend }]);
        setIsTyping(true);

        // --- GATHER SITE CONTEXT ---
        const trips = localStorage.getItem('namma-cab-trips') || '[]';
        const notes = localStorage.getItem('driver-quick-notes') || '[]';
        const expenses = localStorage.getItem('cab-expenses') || '[]';
        const settings = localStorage.getItem('namma-cab-settings') || '{}';

        const contextString = `
            USER_PROFILE: ${settings}
            TRIPS_DATA: ${trips}
            EXPENSES_DATA: ${expenses}
            QUICK_NOTES: ${notes}
        `.slice(0, 3000); // Limit context size

        // Prepare history for Gemini API
        const apiHistory = chatHistory.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const responseRaw = await chatWithSarathi(textToSend, apiHistory, contextString);

        // Parse Commands
        let responseText = responseRaw;
        const navMatch = responseRaw.match(/\[\[NAVIGATE:(.*?)\]\]/);

        if (navMatch && navMatch[1]) {
            const targetPage = navMatch[1].trim();
            responseText = responseText.replace(navMatch[0], '').trim(); // Remove command from chat

            if (onNavigate) {
                // Small delay to let user read "Opening..." if present
                setTimeout(() => {
                    onNavigate(targetPage);
                    setIsOpen(false); // Auto-close on nav? Maybe keep open? Let's close for "Assistant" feel.
                }, 1500);
            }
        }

        setIsTyping(false);
        setChatHistory(prev => [...prev, { role: "model", text: responseText }]);

        // Voice Assistant: Talk back!
        speakResponse(responseText);
    };

    const toggleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice not supported in this browser. Please use Chrome.');
            return;
        }

        if (isTyping) return;

        // @ts-ignore
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'en-IN'; // Works well for Tanglish too
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsTyping(true); // Reuse typing state as a "Listening" indicator

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setMessage(transcript);

            if (event.results[0].isFinal) {
                setTimeout(() => {
                    handleSend(transcript);
                }, 500);
            }
        };

        recognition.onerror = () => setIsTyping(false);
        recognition.onend = () => setIsTyping(false);

        recognition.start();
    };

    return (
        <>
            {/* Floating Bubble */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-24 right-5 md:bottom-10 md:right-10 w-16 h-16 bg-gradient-to-tr from-[#0047AB] to-[#4F46E5] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping group-hover:block hidden"></div>
                    <Bot size={28} className="relative z-10" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold">AI</span>
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed inset-x-4 bottom-24 md:inset-auto md:bottom-10 md:right-10 md:w-[450px] h-[600px] bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up z-50">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                <Bot className="text-blue-400" size={28} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    Sarathi Pro <Sparkles size={14} className="text-yellow-400" />
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Voice Assistant Ready</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                window.speechSynthesis.cancel();
                            }}
                            className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gradient-to-b from-[#0f172a] to-[#1e293b]"
                    >
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center relative">
                                    <Bot size={48} className="text-blue-400 animate-bounce" />
                                    <div className="absolute inset-0 animate-ping bg-blue-500/20 rounded-full"></div>
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-lg mb-2 uppercase tracking-tight">Vanakkam Saravana!</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed font-bold">
                                        Eppadi help pannattum? <br />
                                        Try saying: <span className="text-blue-400">"Add fuel expense"</span> or <span className="text-blue-400">"Calculate fare"</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 w-full max-w-[280px]">
                                    <button
                                        onClick={() => handleSend("Calculate fare for 300km Sedan")}
                                        className="text-left p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black text-slate-300 hover:bg-white/10 hover:border-blue-500/30 transition-all uppercase tracking-tight flex items-center gap-3"
                                    >
                                        🚗 Calculate 300km Sedan Fare
                                    </button>
                                    <button
                                        onClick={() => handleSend("I want to add Diesel expense")}
                                        className="text-left p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black text-slate-300 hover:bg-white/10 hover:border-blue-500/30 transition-all uppercase tracking-tight flex items-center gap-3"
                                    >
                                        ⛽ Log Fuel Expense
                                    </button>
                                </div>
                            </div>
                        )}

                        {chatHistory.map((item, idx) => (
                            <div
                                key={idx}
                                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`flex gap-3 max-w-[90%] ${item.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${item.role === 'user' ? 'bg-[#0047AB]' : 'bg-slate-800 border border-white/10'}`}>
                                        {item.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={18} className="text-blue-400" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-[14px] leading-relaxed font-bold shadow-xl ${item.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-100 border border-white/10 rounded-tl-none'}`}>
                                        {item.text}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center">
                                        <Loader2 size={16} className="text-blue-400 animate-spin" />
                                    </div>
                                    <div className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Sarathi is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Input */}
                    <div className="p-5 bg-slate-900/50 border-t border-white/5 backdrop-blur-md">
                        <div className="relative flex items-center bg-slate-800/80 border border-white/10 rounded-[24px] px-5 py-3 group focus-within:border-blue-500/50 transition-all shadow-inner">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Speak or Type in Tamil/English..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-sm py-2 placeholder:text-slate-500 font-bold"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleVoiceInput}
                                    className={`p-3 rounded-full transition-all ${isTyping ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                    title="Voice Assistant"
                                >
                                    <Mic size={20} />
                                </button>
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!message.trim() || isTyping}
                                    className="p-3 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:bg-slate-700 disabled:shadow-none hover:bg-blue-500 active:scale-90 transition-all"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-center text-slate-600 font-black uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-2">
                            AI Driver Assistant <MoveHorizontal size={10} /> v2.0
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default SarathiAI;
