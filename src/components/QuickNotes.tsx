import React, { useState, useEffect } from 'react';
import { safeJSONParse } from '../utils/storage';
import { StickyNote, Plus, Trash2, X, Save } from 'lucide-react';

interface Note {
    id: string;
    content: string;
    createdAt: string;
    color?: string; // Future proofing for Keep-like colors
}

const QuickNotes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>(() => {
        const saved = safeJSONParse<Note[]>('driver-quick-notes', []);
        return saved;
    });

    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        localStorage.setItem('driver-quick-notes', JSON.stringify(notes));
    }, [notes]);

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

    // Handle "Edit Note" - Opens Modal with existing content
    const handleNoteClick = (note: Note) => {
        setSelectedNote({ ...note }); // Create a copy to edit
        setIsEditing(true);
    };

    // Save changes from Modal
    const handleSave = () => {
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

        setNotes(prev => {
            const exists = prev.find(n => n.id === selectedNote.id);
            if (exists) {
                return prev.map(n => n.id === selectedNote.id ? selectedNote : n);
            } else {
                return [selectedNote, ...prev];
            }
        });
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

    return (
        <div className="space-y-4 pb-24 relative">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-200 text-yellow-700 rounded-lg">
                        <StickyNote size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Quick Notes</h2>
                        <p className="text-xs text-slate-500 font-bold">Trip logs & reminders</p>
                    </div>
                </div>
                <button
                    onClick={handleAddNote}
                    className="flex items-center gap-2 bg-[#0047AB] text-white px-4 py-2.5 rounded-xl hover:bg-[#003a8c] transition-all active:scale-95 shadow-md shadow-blue-500/20"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span className="text-[11px] font-black uppercase tracking-wider">New Note</span>
                </button>
            </div>

            {notes.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={handleAddNote}>
                    <StickyNote size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-base font-bold text-slate-400 uppercase tracking-wide">No notes yet</p>
                    <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Tap here to create your first note.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => handleNoteClick(note)}
                            className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col h-[140px]"
                        >
                            {/* Note Content Preview */}
                            <div className="flex-1 overflow-hidden relative">
                                <p className="text-[11px] text-slate-800 font-medium whitespace-pre-wrap leading-relaxed font-sans" style={{ fontFamily: 'Noto Sans, sans-serif' }}>
                                    {note.content || <span className="text-slate-400 italic">Empty note...</span>}
                                </p>
                                {/* Fade out effect at bottom */}
                                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-yellow-50 to-transparent pointer-events-none"></div>
                            </div>

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-yellow-200/50">
                                <span className="text-[9px] font-bold text-slate-400">
                                    {new Date(note.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                                <button
                                    onClick={(e) => handleDelete(note.id, e)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={12} />
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
                        <div className="flex items-center justify-between p-4 border-b border-yellow-200/50">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                {notes.find(n => n.id === selectedNote.id) ? 'Edit Note' : 'New Note'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDelete(selectedNote.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 overflow-y-auto p-0">
                            <textarea
                                value={selectedNote.content}
                                onChange={(e) => setSelectedNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                                placeholder="Type your note here...&#10;Ex: Start KM: 45000&#10;End KM: 45200"
                                className="w-full h-full min-h-[300px] p-6 bg-transparent text-slate-800 text-base leading-relaxed resize-none focus:outline-none placeholder:text-slate-300"
                                style={{ fontFamily: 'Noto Sans, sans-serif' }}
                                autoFocus
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-yellow-200/50 flex justify-end gap-3 bg-yellow-50/50 rounded-b-2xl">
                            <button
                                onClick={handleClose}
                                className="px-5 py-2.5 rounded-xl text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#0047AB] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                            >
                                <Save size={16} />
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
