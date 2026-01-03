import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, MoveHorizontal } from 'lucide-react';
import { chatWithSarathi } from '../utils/geminiApi';

const SarathiAI: React.FC = () => {
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

    const handleSend = async () => {
        if (!message.trim()) return;

        const userText = message;
        setMessage('');
        setChatHistory(prev => [...prev, { role: "user", text: userText }]);
        setIsTyping(true);

        // Prepare history for Gemini API
        const apiHistory = chatHistory.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const response = await chatWithSarathi(userText, apiHistory);

        setIsTyping(false);
        setChatHistory(prev => [...prev, { role: "model", text: response }]);
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
                    <MessageSquare size={28} className="relative z-10" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold">AI</span>
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed inset-x-4 bottom-24 md:inset-auto md:bottom-10 md:right-10 md:w-[400px] h-[550px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up z-50">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <Bot className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    Sarathi AI <Sparkles size={12} className="text-yellow-400" />
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Smart Assistant Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth"
                    >
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="w-20 h-20 bg-blue-500/5 rounded-full flex items-center justify-center relative">
                                    <Sparkles size={40} className="text-blue-500/30" />
                                    <div className="absolute inset-0 animate-ping bg-blue-500/10 rounded-full"></div>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">How can I help you today?</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                        Ask me about fare calculations, interstate permits, OR anything about the app!
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-2 w-full pt-4">
                                    <button
                                        onClick={() => setMessage("How to calculate outstation fare?")}
                                        className="text-left p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:border-white/10 transition-all uppercase tracking-tight"
                                    >
                                        💡 How to calculate outstation fare?
                                    </button>
                                    <button
                                        onClick={() => setMessage("What are the permit charges for Bangalore?")}
                                        className="text-left p-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:border-white/10 transition-all uppercase tracking-tight"
                                    >
                                        🚛 Permit charges for Bangalore?
                                    </button>
                                </div>
                            </div>
                        )}

                        {chatHistory.map((item, idx) => (
                            <div
                                key={idx}
                                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${item.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${item.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-white/10'}`}>
                                        {item.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-blue-400" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-[13px] leading-relaxed font-medium shadow-lg ${item.role === 'user' ? 'bg-[#0047AB] text-white rounded-tr-none' : 'bg-slate-800/50 text-slate-200 border border-white/5 rounded-tl-none'}`}>
                                        {item.text}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center">
                                        <Bot size={16} className="text-blue-400" />
                                    </div>
                                    <div className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Input */}
                    <div className="p-4 bg-slate-900 border-t border-white/5">
                        <div className="relative flex items-center bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-2 group focus-within:border-blue-500/50 transition-all">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your question..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-sm py-2 placeholder:text-slate-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim() || isTyping}
                                className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:bg-slate-700 disabled:shadow-none hover:bg-blue-500 active:scale-95 transition-all"
                            >
                                {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest mt-3 flex items-center justify-center gap-2">
                            Powered by Gemini AI <MoveHorizontal size={10} /> Safe & Accurate
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default SarathiAI;
