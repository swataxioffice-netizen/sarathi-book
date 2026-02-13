import React, { useState, useMemo } from 'react';
import { generateId } from '../utils/uuid';

import { useSettings, type Staff } from '../contexts/SettingsContext';
import {
    Users, Plus, ChevronRight, User, Wallet, Calendar,
    Save, ArrowLeft, AlertCircle
} from 'lucide-react';
import { Analytics } from '../utils/monitoring';

const SalaryManager: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    // Security Check: Pro Feature
    if (!settings.isPremium) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Users size={40} className="text-slate-400" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Staff Management</h2>
                <p className="text-sm text-slate-500 font-medium max-w-xs mb-8">
                    Manage driver salaries, attendance, and generate payslips with the Pro plan.
                </p>
                <div className="w-full max-w-xs space-y-3">
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-pricing-modal'))}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200"
                    >
                        Upgrade to Pro
                    </button>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: 'profile' }))}
                        className="w-full py-4 bg-white text-slate-400 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:text-slate-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

    // New Staff State
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newDutyPay, setNewDutyPay] = useState(settings.defaultSalaryConfig.dutyPay.toString());

    // Payroll State
    const [dutyDays, setDutyDays] = useState(20);
    const [standbyDays, setStandbyDays] = useState(4);
    const [advances, setAdvances] = useState(0);
    const [manualPdfDeduction, setManualPfDeduction] = useState<number | null>(null);

    const selectedStaff = useMemo(() =>
        settings.staff.find(s => s.id === selectedStaffId),
        [settings.staff, selectedStaffId]);

    const handleAddStaff = async () => {
        if (!newName || !newPhone) return;

        const newStaff: Staff = {
            id: generateId(),
            name: newName,
            phone: newPhone,
            role: 'driver',
            joinDate: new Date().toISOString(),
            status: 'active',
            balance: 0,
            salaryConfig: {
                ...settings.defaultSalaryConfig,
                dutyPay: parseInt(newDutyPay) || settings.defaultSalaryConfig.dutyPay,
            }
        };

        updateSettings({ staff: [...settings.staff, newStaff] });
        setShowAddModal(false);
        setNewName('');
        setNewPhone('');

        await Analytics.logActivity('staff_added', {
            name: newStaff.name,
            role: newStaff.role,
            dutyPay: newStaff.salaryConfig.dutyPay
        });
    };

    // Indian Salary Logic: 
    // PF is 12% of Basic. We assume "Duty Pay * 26" is the monthly Gross.
    // However, for unorganized sector, they often just want a flat deduction if salary > 15k, or just fixed.
    // Statutory Rule: Wage Ceiling 15,000 for mandatory PF. 
    // Calculations:
    const calculatePayroll = () => {
        if (!selectedStaff) return { gross: 0, net: 0, pf: 0 };

        const dutyTotal = dutyDays * selectedStaff.salaryConfig.dutyPay;
        const standbyTotal = standbyDays * selectedStaff.salaryConfig.standbyPay;
        const grossEarnings = dutyTotal + standbyTotal;

        // Smart PF Calculation
        // If Gross > 15000, PF is capped at 1800 (12% of 15000)
        // If Gross <= 15000, PF is 12% of Gross
        // UNLESS manually overridden
        let calculatedPf = 0;
        if (settings.defaultSalaryConfig.pfDeduction === 0 && !manualPdfDeduction) {
            calculatedPf = 0; // PF disabled by default
        } else {
            // Use manual if set, else auto-calc
            if (manualPdfDeduction !== null) {
                calculatedPf = manualPdfDeduction;
            } else {
                const wageCeiling = 15000;
                const consideredWage = Math.min(grossEarnings, wageCeiling);
                calculatedPf = Math.round(consideredWage * 0.12);
            }
        }

        const netPay = grossEarnings - calculatedPf - advances;

        return {
            gross: grossEarnings,
            pf: calculatedPf,
            net: netPay,
            dutyTotal,
            standbyTotal
        };
    };

    const payroll = calculatePayroll();

    const handleGenerateSlip = async () => {
        alert(`Payslip generated for ${selectedStaff?.name}`);
        // In real app, generate PDF here.
        await Analytics.logActivity('payslip_generated', {
            staffId: selectedStaff?.id,
            staffName: selectedStaff?.name,
            amount: payroll.net,
            month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        });
    };

    if (selectedStaff) {
        return (
            <div className="pb-24 space-y-6 animate-slide-left">
                {/* Driver Detail Header */}
                <div className="bg-white border-b border-slate-200 px-3 py-2 -mx-4 -mt-4 sticky top-0 z-10 flex items-center gap-3 shadow-sm">
                    <button onClick={() => setSelectedStaffId(null)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 hover:bg-slate-50 rounded-xl transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-sm font-black uppercase text-slate-900">{selectedStaff.name}</h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{selectedStaff.role} • +91 {selectedStaff.phone}</p>
                    </div>
                </div>

                {/* Payroll Calculator Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-10 -mt-10 blur-2xl" />

                    <div className="relative z-10 text-center py-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Net Payable Salary</p>
                        <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-1">
                            <span className="text-xl text-slate-500">₹</span>
                            {payroll.net.toLocaleString()}
                        </h1>
                        <div className="mt-4 flex justify-center gap-6 border-t border-white/10 pt-3">
                            <div>
                                <p className="text-[8px] text-slate-400 uppercase tracking-wider">Gross Earned</p>
                                <p className="font-bold text-sm">₹{payroll.gross.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[8px] text-red-300 uppercase tracking-wider">Deductions</p>
                                <p className="font-bold text-sm text-red-300">-₹{(payroll.pf + advances).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inputs */}
                <div className="space-y-4 px-1">
                    {/* Attendance */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-blue-600" />
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Attendance (Days)</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase">Duty (Driving)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        value={dutyDays}
                                        onChange={e => setDutyDays(Number(e.target.value))}
                                        className="w-full h-10 bg-slate-50 rounded-xl px-3 font-black text-sm text-center outline-none focus:ring-1 ring-blue-500/20 border border-transparent focus:border-blue-500"
                                    />
                                </div>
                                <p className="text-[8px] text-right text-slate-400 mt-1">x ₹{selectedStaff.salaryConfig.dutyPay}</p>
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase">Standby (Idle)</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        value={standbyDays}
                                        onChange={e => setStandbyDays(Number(e.target.value))}
                                        className="w-full h-10 bg-slate-50 rounded-xl px-3 font-black text-sm text-center outline-none focus:ring-1 ring-blue-500/20 border border-transparent focus:border-blue-500"
                                    />
                                </div>
                                <p className="text-[8px] text-right text-slate-400 mt-1">x ₹{selectedStaff.salaryConfig.standbyPay}</p>
                            </div>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Wallet size={16} className="text-red-500" />
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Deductions</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-900 uppercase">Advance / Cash</p>
                                    <p className="text-[8px] text-slate-400">Deduct from cash in hand</p>
                                </div>
                                <div className="w-20 relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={advances === 0 ? '' : advances}
                                        onChange={e => setAdvances(Number(e.target.value))}
                                        placeholder="0"
                                        className="w-full h-8 bg-white rounded-lg pl-5 pr-2 font-bold text-xs text-right outline-none border border-slate-200 focus:border-red-400"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-300">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-900 uppercase">PF Calculation</p>
                                    <p className="text-[8px] text-slate-400">15k Wage Ceiling Rule</p>
                                </div>
                                <div className="w-20 relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={payroll.pf}
                                        onChange={e => setManualPfDeduction(Number(e.target.value))}
                                        className="w-full h-8 bg-white rounded-lg pl-5 pr-2 font-bold text-xs text-right outline-none border border-slate-200 focus:border-blue-400 text-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <p className="text-[8px] text-slate-400 flex items-center gap-1">
                                    <AlertCircle size={10} /> Auto-calculated. Tap to edit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-1">
                    <button onClick={handleGenerateSlip} className="w-full h-11 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-100 flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all">
                        <Save size={14} /> Generate Payslip
                    </button>
                    <p className="text-center text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-widest px-4 leading-relaxed">
                        Starts download & saves to Expenses.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 space-y-6 animate-fade-in">
            {/* Header Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-xl" />
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight">Staff Manager</h2>
                            <p className="text-slate-400 text-[10px] font-bold mt-0.5">Manage Drivers & Salaries</p>
                        </div>
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
                            <Users size={20} className="text-blue-400" />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm flex-1">
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Active Staff</p>
                            <p className="text-lg font-black">{settings.staff.length}</p>
                        </div>
                        <div className="bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm flex-[1.5]">
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Total Monthly</p>
                            <p className="text-lg font-black">₹{settings.staff.reduce((acc, s) => acc + (s.salaryConfig.dutyPay * 26), 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff List */}
            <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Team</h3>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                        <Plus size={12} strokeWidth={3} /> Add Staff
                    </button>
                </div>

                {settings.staff.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                        <User size={24} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">No staff members yet.</p>
                        <p className="text-[10px] text-slate-300 mt-1">Add drivers to manage their salary.</p>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {settings.staff.map(staff => (
                            <div
                                key={staff.id}
                                onClick={() => setSelectedStaffId(staff.id)}
                                className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer hover:border-blue-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-black text-sm border-2 border-white shadow-sm">
                                        {staff.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-xs">{staff.name}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded">{staff.role}</span>
                                            <span className="text-[9px] font-bold text-blue-600">₹{staff.salaryConfig.dutyPay}/day</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[24px] p-5 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight">Add New Staff</h3>
                                <p className="text-[9px] text-slate-400 font-bold">Enter staff details below</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-900"><User size={20} /></button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Full Name</label>
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="tn-input w-full h-10 bg-slate-50 rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. Ramesh Kumar"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Phone Number</label>
                                <input
                                    value={newPhone}
                                    onChange={e => setNewPhone(e.target.value)}
                                    type="tel"
                                    className="tn-input w-full h-10 bg-slate-50 rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. 9876543210"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Duty Pay (Per Day)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                    <input
                                        type="number"
                                        value={newDutyPay}
                                        onChange={e => setNewDutyPay(e.target.value)}
                                        className="tn-input w-full h-10 bg-slate-50 rounded-xl pl-7 pr-4 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <p className="text-[8px] text-slate-400 mt-1 pl-1 italic">
                                    *Default Standby Pay is ₹{settings.defaultSalaryConfig.standbyPay}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleAddStaff}
                            disabled={!newName || !newPhone}
                            className="w-full h-11 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[0.98] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
                        >
                            Create Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryManager;
