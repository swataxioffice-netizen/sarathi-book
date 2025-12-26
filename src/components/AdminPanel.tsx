import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import {
    Users,
    Settings,
    FileCheck,
    TrendingUp,
    Search,
    ShieldAlert,
    Activity,
    Bell,
    Send,
    HardDrive,
    Bug,
    RefreshCw
} from 'lucide-react';
import { useUpdate } from '../contexts/UpdateContext';
import { useNotifications } from '../contexts/NotificationContext';

const AdminPanel: React.FC = () => {
    const [subTab, setSubTab] = useState<'stats' | 'users' | 'documents' | 'settings' | 'debug'>('stats');
    const { needRefresh, setNeedRefresh } = useUpdate();
    const { addNotification } = useNotifications();
    const [notifyingUser, setNotifyingUser] = useState<any | null>(null);
    const [notificationText, setNotificationText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingUsers(true);

            const { data: usersData } = await supabase.from('profiles').select('*');
            if (usersData) setUsers(usersData);

            const { data: docsData } = await supabase.from('user_documents').select('*');
            if (docsData) setDocuments(docsData);

            setLoadingUsers(false);
        };
        fetchData();
    }, []);

    // Calculated Stats
    const docsCount = documents.length;
    const pendingDocs = documents.length; // Treating all as pending review for now
    const storageUsed = (docsCount * 0.5).toFixed(1) + ' MB'; // Estimate

    // Stats Section
    const StatsView = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: loadingUsers ? '--' : users.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Docs Uploaded', value: loadingUsers ? '--' : docsCount.toString(), icon: FileCheck, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Pending Review', value: loadingUsers ? '--' : pendingDocs.toString(), icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Storage Est.', value: loadingUsers ? '--' : storageUsed, icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-full">--</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">System Health</h3>
                    <TrendingUp className="text-blue-600" size={20} />
                </div>
                <div className="p-5">
                    <div className="h-48 flex items-end gap-2 px-2">
                        {[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((h, i) => (
                            <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative group transition-all hover:bg-blue-600">
                                <div style={{ height: `${h}%` }} className="w-full bg-blue-600 rounded-t-lg transition-all group-hover:bg-blue-700"></div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                    {h}% Capacity
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                        <span>Jan</span>
                        <span>Jun</span>
                        <span>Dec</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Users Section
    const UsersView = () => (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Name, Email or ID..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    // Add search logic if needed
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select className="flex-1 md:flex-none bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold uppercase tracking-wider">
                        <option>All Status</option>
                        <option>Verified</option>
                        <option>Pending</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User / Profile</th>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</th>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</th>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</th>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {loadingUsers ? (
                            <tr><td colSpan={5} className="text-center py-8 italic text-slate-400">Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 italic text-slate-400">No Users Found</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td className="p-4 font-bold">{user.name || user.id}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4">{user.phone}</td>
                                    <td className="p-4">{user.address}</td>
                                    <td className="p-4 text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Document Queue Section
    const DocumentsView = () => (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Document</th>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry</th>
                            <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {loadingUsers ? (
                            <tr><td colSpan={5} className="text-center py-8 italic text-slate-400">Loading Documents...</td></tr>
                        ) : documents.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 italic text-slate-400">No Documents Found</td></tr>
                        ) : (
                            documents.map((doc) => {
                                const user = users.find(u => u.id === doc.user_id);
                                return (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-xs text-slate-900">{user?.name || 'Unknown User'}</div>
                                            <div className="text-[10px] text-slate-400">{user?.email}</div>
                                        </td>
                                        <td className="p-4 font-bold text-xs">{doc.name}</td>
                                        <td className="p-4">
                                            <span className="text-[9px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                                                {doc.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-bold">{doc.expiry_date}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => window.open(doc.file_url, '_blank')}
                                                className="text-[10px] font-black uppercase text-[#0047AB] hover:underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Platform Settings Section
    const SettingsView = () => (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-black text-slate-900 uppercase tracking-tight">Platform Configuration</h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Platform Fee (%)</label>
                        <input type="number" defaultValue="5" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GST Rate (%)</label>
                        <input type="number" defaultValue="5" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10" />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-slate-900">Auto-Approve Documents</p>
                            <p className="text-xs text-slate-400 font-bold">New signups can use basics immediately</p>
                        </div>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-slate-900">Dark Mode Enforcement</p>
                            <p className="text-xs text-slate-400 font-bold">Require all users to use premium dark theme</p>
                        </div>
                        <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                        </div>
                    </div>
                </div>

                <button className="w-full bg-[#0047AB] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:scale-[0.99] transition-transform">
                    Save Configuration
                </button>
            </div>
        </div>
    );

    const DebugView = () => (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-500 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-red-50/30">
                <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <Bug size={20} className="text-red-500" />
                    System Debug & QA
                </h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">PWA Update Simulator</h4>
                    <p className="text-xs text-slate-600 mb-4 font-bold">This will manually trigger the "Update Available" state to test notifications and header behavior.</p>

                    <button
                        onClick={() => setNeedRefresh(!needRefresh)}
                        className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md
                            ${needRefresh ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
                    >
                        {needRefresh ? 'Deactivate Update State' : 'Simulate New Update'}
                        <RefreshCw size={14} className={needRefresh ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Instant Notification Test</h4>
                    <div className="flex gap-2">
                        <button
                            onClick={() => addNotification('Test Successful!', 'The notification system is working perfectly.', 'success')}
                            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                            Test Success
                        </button>
                        <button
                            onClick={() => addNotification('Database Alert', 'High latency detected in Supabase region.', 'warning')}
                            className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                            Test Warning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-full space-y-6 pb-20">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">SYSTEM ADMIN</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Status: Healthy • v1.4.2</p>
                    </div>
                </div>

                {/* Internal Nav */}
                <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'stats', label: 'Stats', icon: Activity },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'documents', label: 'Docs', icon: FileCheck },
                        { id: 'settings', label: 'Setup', icon: Settings },
                        { id: 'debug', label: 'Debug', icon: Bug },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSubTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap
                                ${subTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* View Render */}
            {subTab === 'stats' && <StatsView />}
            {subTab === 'users' && <UsersView />}
            {subTab === 'documents' && <DocumentsView />}
            {subTab === 'settings' && <SettingsView />}
            {subTab === 'debug' && <DebugView />}

            {/* Notification Modal */}
            {notifyingUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
                            <div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">Send Notification</h3>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">To: {notifyingUser.name}</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200 text-blue-600">
                                <Bell size={20} />
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Message Content</label>
                                <textarea
                                    value={notificationText}
                                    onChange={(e) => setNotificationText(e.target.value)}
                                    placeholder="Type your message to the driver..."
                                    className="w-full h-32 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setNotifyingUser(null);
                                        setNotificationText('');
                                    }}
                                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={!notificationText.trim() || isSending}
                                    onClick={async () => {
                                        setIsSending(true);
                                        // Simulate API call
                                        await new Promise(r => setTimeout(r, 800));
                                        setIsSending(false);
                                        setNotifyingUser(null);
                                        setNotificationText('');
                                        // In a real app, signal success here
                                    }}
                                    className="flex-2 bg-[#0047AB] text-white py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSending ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={14} /> Send Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
