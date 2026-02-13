import React, { useState, useEffect } from 'react';
import { safeJSONParse } from '../utils/storage';
import { Analytics } from '../utils/monitoring';
import { StickyNote, Plus, Trash2, X, Save, Mic } from 'lucide-react';

interface Note {
    id: string;
    content: string;
    createdAt: string;
    color?: string; // Future proofing for Keep-like colors
}

interface QuickNotesProps {
    onCreateNew?: number; // Timestamp to trigger creation
}

const QuickNotes: React.FC<QuickNotesProps> = ({ onCreateNew }) => {
    const [notes, setNotes] = useState<Note[]>(() => {
        const saved = safeJSONParse<Note[]>('driver-quick-notes', []);
        if (saved.length === 0) {
            // Default Welcome Notes
            return [
                {
                    id: 'example-1',
                    content: "Trip Log Example:\n\nStart KM: 45,000\nEnd KM: 45,250\nTotal Run: 250 KM\n\nFuel: ₹2000 (35L)",
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'example-2',
                    content: "Pending Payments:\n\n- Saravana: ₹500 (GPay)\n- Airport Trip: ₹1200 (Cash Pending)",
                    createdAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
                }
            ];
        }
        return saved;
    });

    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Handle "Add Note" - Opens Modal immediately
    const handleAddNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            content: '',
            createdAt: new Date().toISOString()
        };
        setSelectedNote(newNote);
        setIsEditing(true);
    };

    useEffect(() => {
        // External trigger to create new note
        if (onCreateNew) {
            handleAddNote();
        }
    }, [onCreateNew]);

    useEffect(() => {
        localStorage.setItem('driver-quick-notes', JSON.stringify(notes));
    }, [notes]);

    // Handle "Edit Note" - Opens Modal with existing content
    const handleNoteClick = (note: Note) => {
        setSelectedNote({ ...note }); // Create a copy to edit
        setIsEditing(true);
    };

    // Save changes from Modal
    const handleSave = async () => {
        if (!selectedNote) return;

        // If it's empty, maybe warn or delete? For now, we save even if empty like Keep, or delete if totally empty.
        if (!selectedNote.content.trim()) {
            // If it's a new note (not in list) and empty, simply discard.
            // If it's existing and empty, we can choose to delete or keep empty.
            // Let's discard if completely empty to keep it clean.
            if (isEditing && !notes.find(n => n.id === selectedNote.id)) {
                handleClose();
                return;
            }
        }

        const isNew = !notes.find(n => n.id === selectedNote.id);

        setNotes(prev => {
            const exists = prev.find(n => n.id === selectedNote.id);
            if (exists) {
                return prev.map(n => n.id === selectedNote.id ? selectedNote : n);
            } else {
                return [selectedNote, ...prev];
            }
        });

        if (isNew) {
            await Analytics.logActivity('note_created', { length: selectedNote.content.length });
        } else {
            await Analytics.logActivity('note_updated', { id: selectedNote.id });
        }

        handleClose();
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (window.confirm('Delete this note?')) {
            setNotes(prev => prev.filter(note => note.id !== id));
            if (selectedNote?.id === id) handleClose();
        }
    };

    const handleClose = () => {
        setSelectedNote(null);
        setIsEditing(false);
    };

    // Voice Handler
    const toggleRecording = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice input is not supported in this browser. Try Chrome.');
            return;
        }

        if (isRecording) {
            setIsRecording(false);
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN'; // Default to Indian English

        recognition.onstart = () => setIsRecording(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (selectedNote) {
                setSelectedNote(prev => prev ? {
                    ...prev,
                    content: prev.content + (prev.content ? '\n' : '') + transcript
                } : null);
            }
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);

        recognition.start();
    };

    return (
        <div className="space-y-4 pb-24 relative">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-100 text-yellow-700 rounded-lg">
                        <StickyNote size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Quick Notes</h2>
                        <p className="text-[10px] text-slate-500 font-bold">Trip logs & reminders</p>
                    </div>
                </div>
                <button
                    onClick={handleAddNote}
                    className="flex items-center gap-1.5 bg-[#0047AB] text-white px-3 py-2 rounded-xl hover:bg-[#003a8c] transition-all active:scale-95 shadow-md shadow-blue-500/20"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-wider">New Note</span>
                </button>
            </div>

            {notes.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={handleAddNote}>
                    <StickyNote size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-base font-bold text-slate-400 uppercase tracking-wide">No notes yet</p>
                    <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Tap here to create your first note.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => handleNoteClick(note)}
                            className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col h-[120px]"
                        >
                            {/* Note Content Preview */}
                            <div className="flex-1 overflow-hidden relative">
                                <p className="text-[10px] text-slate-800 font-medium whitespace-pre-wrap leading-relaxed font-sans" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                                    {note.content || <span className="text-slate-400 italic">Empty note...</span>}
                                </p>
                                {/* Fade out effect at bottom */}
                                <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-yellow-50 to-transparent pointer-events-none"></div>
                            </div>

                            <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-yellow-200/50">
                                <span className="text-[8px] font-bold text-slate-400">
                                    {new Date(note.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                                <button
                                    onClick={(e) => handleDelete(note.id, e)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal (Google Keep Style) */}
            {isEditing && selectedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-[#fffef0] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-3 border-b border-yellow-200/50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {notes.find(n => n.id === selectedNote.id) ? 'Edit Note' : 'New Note'}
                            </span>
                            <div className="flex items-center gap-1">
                                {/* Voice Button */}
                                <button
                                    onClick={toggleRecording}
                                    className={`p-1.5 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                    title="Voice Note"
                                >
                                    <Mic size={16} />
                                </button>

                                <button
                                    onClick={() => handleDelete(selectedNote.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 overflow-y-auto p-0 relative">
                            {isRecording && (
                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-bounce">
                                    Listening...
                                </div>
                            )}
                            <textarea
                                value={selectedNote.content}
                                onChange={(e) => setSelectedNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                                placeholder="Type or Tap Mic to Speak...&#10;Ex: Trip via Vellore started."
                                className="w-full h-full min-h-[300px] p-5 bg-transparent text-slate-800 text-sm leading-relaxed resize-none focus:outline-none placeholder:text-slate-300"
                                style={{ fontFamily: 'Noto Sans, sans-serif' }}
                                autoFocus
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 border-t border-yellow-200/50 flex justify-end gap-2 bg-yellow-50/50 rounded-b-2xl">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 rounded-xl text-slate-500 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 px-5 py-2 bg-[#0047AB] text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                            >
                                <Save size={14} />
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickNotes;
