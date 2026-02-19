import React, { useState, useMemo } from 'react';
import { generateId } from '../utils/uuid';

import { useSettings } from '../contexts/SettingsContext';
import { type Staff } from '../types/settings';
import {
    Users, Plus, ChevronRight, User, Wallet, Calendar as CalendarIcon,
    Save, ArrowLeft, ChevronLeft, Trash2
} from 'lucide-react';
import { Analytics } from '../utils/monitoring';
import { 
    format, startOfMonth, endOfMonth, eachDayOfInterval, 
    isSameMonth, isToday, addMonths, subMonths, parseISO, getDay,
    isAfter, startOfDay
} from 'date-fns';
import { generatePayslipPDF, type PDFSettings } from '../utils/pdf';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

const ToggleButton: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
    <button
        onClick={(e) => {
            e.stopPropagation();
            onChange();
        }}
        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
            enabled ? 'bg-blue-600' : 'bg-slate-300'
        }`}
    >
        <span
            className={`${
                enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
            } inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm`}
        />
    </button>
);

const SalaryManager: React.FC = () => {

    const { settings, updateSettings } = useSettings();
    const { user } = useAuth();



    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

    // New Staff State
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newDutyPay, setNewDutyPay] = useState(settings.defaultSalaryConfig.dutyPay.toString());
    const [newStandbyPay, setNewStandbyPay] = useState(settings.defaultSalaryConfig.standbyPay.toString());
    const [newIsPfEnabled, setNewIsPfEnabled] = useState(settings.defaultSalaryConfig.isPfEnabled ?? true);
    const [newIsEsiEnabled, setNewIsEsiEnabled] = useState(settings.defaultSalaryConfig.isEsiEnabled ?? false);
    const [newDesignation, setNewDesignation] = useState('');
    const [newEmployeeId, setNewEmployeeId] = useState('');
    const [newPanNumber, setNewPanNumber] = useState('');
    const [newBankName, setNewBankName] = useState('');
    const [newAccountNumber, setNewAccountNumber] = useState('');
    const [newIfscCode, setNewIfscCode] = useState('');
    const [newUan, setNewUan] = useState('');
    const [newEsiNumber, setNewEsiNumber] = useState('');
    const [showEditStaffModal, setShowEditStaffModal] = useState(false);

    // Payroll State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showDeductionModal, setShowDeductionModal] = useState(false);
    const [newDeductionAmount, setNewDeductionAmount] = useState('');
    const [newDeductionReason, setNewDeductionReason] = useState('');
    const [newDeductionType, setNewDeductionType] = useState<'advance' | 'fine'>('advance');

    // Bulk Attendance State
    const [isBulkMode, setIsBulkMode] = useState(true);
    const [bulkDate, setBulkDate] = useState(new Date());

    // Derived State from Settings
    const selectedStaff = useMemo(() =>
        settings.staff.find(s => s.id === selectedStaffId),
        [settings.staff, selectedStaffId]);

    const monthDays = useMemo(() => {
        return eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth)
        });
    }, [currentMonth]);

    // Calculate the total actual payroll for all staff for the current month.
    // This looks at marked attendance (Duty/Standby) to provide a live total of accrued wages.
    const totalMonthlyPayroll = useMemo(() => {
        return settings.staff.reduce((acc, staff) => {
            let dDays = 0;
            let sDays = 0;

            monthDays.forEach(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const status = staff.attendance?.[dateKey];
                if (status === 'duty') dDays++;
                else if (status === 'standby') sDays++;
            });

            const dutyTotal = dDays * (staff.salaryConfig.dutyPay || 0);
            const standbyTotal = sDays * (staff.salaryConfig.standbyPay || 0);
            return acc + dutyTotal + standbyTotal;
        }, 0);
    }, [settings.staff, monthDays]);

    const [activeDatePicker, setActiveDatePicker] = useState<Date | null>(null);
    const [isAttendanceLocked, setIsAttendanceLocked] = useState(true);

    // Helpers
    const getAttendanceStatus = (date: Date) => {
        if (!selectedStaff?.attendance) return undefined;
        return selectedStaff.attendance[format(date, 'yyyy-MM-dd')];
    };

    const updateAttendance = (date: Date, status: 'duty' | 'standby' | 'leave' | 'holiday' | undefined, staffId?: string) => {
        const idToUpdate = staffId || selectedStaff?.id;
        if (!idToUpdate) return;
        
        // Block future dates
        if (isAfter(startOfDay(date), startOfDay(new Date()))) {
            return;
        }

        const dateKey = format(date, 'yyyy-MM-dd');

        const updatedStaff = settings.staff.map(s => {
            if (s.id === idToUpdate) {
                const newAttendance = { ...s.attendance };
                if (status) newAttendance[dateKey] = status;
                else delete newAttendance[dateKey]; // cleanup
                return { ...s, attendance: newAttendance };
            }
            return s;
        });
        
        updateSettings({ staff: updatedStaff });
    };

    const addDeduction = () => {
        if (!selectedStaff || !newDeductionAmount) return;
        const amount = parseFloat(newDeductionAmount);
        if (isNaN(amount)) return;

        const newDeduction = {
            id: generateId(),
            date: format(new Date(), 'yyyy-MM-dd'),
            amount,
            reason: newDeductionReason || (newDeductionType === 'advance' ? 'Salary Advance' : 'Deduction/Adjustment'),
            type: newDeductionType
        };

        const updatedStaff = settings.staff.map(s => {
            if (s.id === selectedStaff.id) {
                return { 
                    ...s, 
                    deductions: [...(s.deductions || []), newDeduction] 
                };
            }
            return s;
        });

        updateSettings({ staff: updatedStaff });
        setNewDeductionAmount('');
        setNewDeductionReason('');
        setNewDeductionType('advance');
        setShowDeductionModal(false);
    };

    const removeDeduction = (id: string) => {
        if (!selectedStaff) return;
        const updatedStaff = settings.staff.map(s => {
            if (s.id === selectedStaff.id) {
                return { 
                    ...s, 
                    deductions: (s.deductions || []).filter(d => d.id !== id) 
                };
            }
            return s;
        });
        updateSettings({ staff: updatedStaff });
    };

    const handleAddStaff = async () => {
        if (!newName) return;

        const newStaff: Staff = {
            id: generateId(),
            name: newName,
            phone: newPhone || '0000000000',
            role: 'driver',
            joinDate: new Date().toISOString(),
            status: 'active',
            balance: 0,
            salaryConfig: {
                ...settings.defaultSalaryConfig,
                dutyPay: parseInt(newDutyPay) || settings.defaultSalaryConfig.dutyPay,
                standbyPay: parseInt(newStandbyPay) || settings.defaultSalaryConfig.standbyPay,
                isPfEnabled: newIsPfEnabled,
                isEsiEnabled: newIsEsiEnabled
            },
            attendance: {},
            deductions: []
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
    const payroll = useMemo(() => {
        if (!selectedStaff) return { gross: 0, net: 0, pf: 0, esi: 0, dutyDays: 0, standbyDays: 0, advances: 0, fines: 0, dutyTotal: 0, standbyTotal: 0 };

        let dDays = 0;
        let sDays = 0;

        monthDays.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const status = selectedStaff.attendance?.[dateKey];
            if (status === 'duty') dDays++;
            else if (status === 'standby') sDays++;
        });

        const currentMonthDeductions = (selectedStaff.deductions || []).filter(d => 
            isSameMonth(parseISO(d.date), currentMonth)
        );
        const advances = currentMonthDeductions
            .filter(d => d.type === 'advance')
            .reduce((acc, curr) => acc + curr.amount, 0);
        const fines = currentMonthDeductions
            .filter(d => d.type !== 'advance')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const dutyTotal = dDays * selectedStaff.salaryConfig.dutyPay;
        const standbyTotal = sDays * selectedStaff.salaryConfig.standbyPay;
        const grossEarnings = dutyTotal + standbyTotal;

        // PF Calculation (12% of basic/DA, usually capped at 15,000 wage ceiling)
        let calculatedPf = 0;
        if (selectedStaff.salaryConfig.isPfEnabled ?? settings.defaultSalaryConfig.isPfEnabled) {
            const wageCeiling = 15000;
            const consideredWage = Math.min(grossEarnings, wageCeiling);
            calculatedPf = Math.round(consideredWage * 0.12);
        }

        // ESI Calculation (0.75% of gross, only if monthly gross <= 21,000)
        let calculatedEsi = 0;
        if (selectedStaff.salaryConfig.isEsiEnabled ?? settings.defaultSalaryConfig.isEsiEnabled) {
            const esiWageCeiling = 21000;
            if (grossEarnings <= esiWageCeiling) {
                calculatedEsi = Math.round(grossEarnings * 0.0075);
            }
        }

        const taxesAndDeductions = calculatedPf + calculatedEsi + advances + fines;
        const netPay = grossEarnings - taxesAndDeductions;

        return {
            gross: grossEarnings,
            pf: calculatedPf,
            esi: calculatedEsi,
            net: netPay,
            dutyTotal,
            standbyTotal,
            dutyDays: dDays,
            standbyDays: sDays,
            advances,
            fines
        };
    }, [selectedStaff, monthDays, settings.defaultSalaryConfig, currentMonth]);

    const handleGenerateSlip = async () => {
        if (!selectedStaff) return;

        try {
            const pdfSettings: PDFSettings = {
                companyName: settings.companyName,
                companyAddress: settings.companyAddress,
                driverPhone: settings.driverPhone,
                gstin: settings.gstin,
                vehicleNumber: settings.vehicles.find(v => v.id === settings.currentVehicleId)?.number || '',
                gstEnabled: settings.gstEnabled,
                appColor: settings.appColor,
                preferredPaymentMethod: settings.preferredPaymentMethod,
                signatureUrl: settings.signatureUrl
            };

            const doc = await generatePayslipPDF(selectedStaff, payroll, currentMonth, pdfSettings);
            const fileName = `Payslip_${selectedStaff.name}_${format(currentMonth, 'MMM_yyyy')}.pdf`.replace(/\s+/g, '_');
            doc.save(fileName);

            // Save to Expenses
            const expenseId = generateId();
            const expenseData = {
                id: expenseId,
                category: 'other',
                amount: payroll.net,
                description: `Staff Salary: ${selectedStaff.name} (${format(currentMonth, 'MMMM yyyy')})`,
                date: new Date().toISOString()
            };

            // Local Save
            const localExpenses = JSON.parse(localStorage.getItem('cab-expenses') || '[]');
            localStorage.setItem('cab-expenses', JSON.stringify([expenseData, ...localExpenses]));

            // Cloud Save
            if (user) {
                await supabase.from('expenses').insert({
                    id: expenseId,
                    user_id: user.id,
                    category: 'other',
                    amount: payroll.net,
                    description: expenseData.description,
                    date: expenseData.date
                });
            }

            alert(`Payslip generated and saved to expenses for ${selectedStaff.name}`);

            await Analytics.logActivity('payslip_generated', {
                staffId: selectedStaff.id,
                staffName: selectedStaff.name,
                amount: payroll.net,
                month: format(currentMonth, 'MMMM yyyy')
            });
        } catch (error) {
            console.error('Error generating payslip:', error);
            alert('Failed to generate payslip. Please try again.');
        }
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
                        <div className="flex items-center gap-2">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{selectedStaff.role} • +91 {selectedStaff.phone}</p>
                             <button 
                                onClick={() => {
                                    setNewName(selectedStaff.name);
                                    setNewPhone(selectedStaff.phone);
                                    setNewDutyPay(selectedStaff.salaryConfig.dutyPay.toString());
                                    setNewStandbyPay(selectedStaff.salaryConfig.standbyPay.toString());
                                    setNewIsPfEnabled(selectedStaff.salaryConfig.isPfEnabled ?? true);
                                    setNewIsEsiEnabled(selectedStaff.salaryConfig.isEsiEnabled ?? false);
                                    setNewDesignation(selectedStaff.designation || 'Driver');
                                    setNewEmployeeId(selectedStaff.employeeId || '');
                                    setNewPanNumber(selectedStaff.panNumber || '');
                                    setNewBankName(selectedStaff.bankName || '');
                                    setNewAccountNumber(selectedStaff.accountNumber || '');
                                    setNewIfscCode(selectedStaff.ifscCode || '');
                                    setNewUan(selectedStaff.uan || '');
                                    setNewEsiNumber(selectedStaff.esiNumber || '');
                                    setShowEditStaffModal(true);
                                }}
                                className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase"
                             >Edit Info</button>
                        </div>
                    </div>
                </div>

                {/* Payroll Calculation Card - Formula Design */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl relative overflow-hidden border border-white/5 mx-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-10 -mt-10 blur-3xl opacity-50" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-4">
                             <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.25em] pl-1">Salary Calculation</p>
                             <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 backdrop-blur-sm">
                                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Live</span>
                             </div>
                        </div>

                            {/* Sub-total Breakdown */}
                            <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">
                                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/10">
                                    <span>Duty: {payroll.dutyDays}d × ₹{selectedStaff.salaryConfig.dutyPay}</span>
                                </div>
                                {payroll.standbyDays > 0 && (
                                    <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg border border-amber-500/10">
                                        <span>Standby: {payroll.standbyDays}d × ₹{selectedStaff.salaryConfig.standbyPay}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-0.5">
                                {/* Gross */}
                                <div className="flex-1 text-center group transition-all">
                                    <p className="text-[6.5px] text-slate-500 font-black uppercase tracking-widest mb-1.5 transition-colors group-hover:text-slate-400">Total Gross</p>
                                    <div className="bg-white/5 rounded-xl py-2.5 px-0.5 border border-white/5 transition-all group-hover:bg-white/10 group-hover:border-white/10">
                                        <p className="text-[13px] font-black text-white leading-none">₹{payroll.gross.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Operator */}
                                <div className="text-slate-600 font-black text-xs shrink-0 pt-4 px-0.5 text-center">−</div>

                                {/* Deductions */}
                                <div className="flex-1 text-center group transition-all">
                                    <p className="text-[6.5px] text-red-300 font-black uppercase tracking-widest mb-1.5 transition-colors group-hover:text-red-200">Deductions</p>
                                    <div className="bg-red-500/10 rounded-xl py-2.5 px-0.5 border border-red-500/10 transition-all group-hover:bg-red-500/15 group-hover:border-red-500/20">
                                        <p className="text-[13px] font-black text-red-300 leading-none">₹{(payroll.advances + payroll.fines).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Operator */}
                                <div className="text-slate-600 font-black text-xs shrink-0 pt-4 px-0.5 text-center">−</div>

                                {/* Statutory */}
                                <div className="flex-1 text-center group transition-all">
                                    <p className="text-[6.5px] text-slate-400 font-black uppercase tracking-widest mb-1.5 transition-colors group-hover:text-slate-300">Statutory</p>
                                    <div className="bg-white/5 rounded-xl py-2.5 px-0.5 border border-white/5 transition-all group-hover:bg-white/10 group-hover:border-white/10">
                                        <p className="text-[13px] font-black text-slate-300 leading-none">₹{(payroll.pf + payroll.esi).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Equals */}
                                <div className="text-blue-500/50 font-black text-xs shrink-0 pt-4 px-1 text-center">＝</div>

                                {/* Result */}
                                <div className="flex-[1.3] text-center group relative">
                                    <p className="text-[6.5px] text-blue-400 font-black uppercase tracking-widest mb-1.5">Net Salary</p>
                                    <div className="bg-blue-600/20 rounded-xl py-2.5 px-1 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)] transition-all group-hover:bg-blue-600/30 group-hover:border-blue-500/40">
                                        <p className="text-[15px] font-black text-blue-400 leading-none">₹{payroll.net.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>

                {/* Calendar & Attendance */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <CalendarIcon size={16} className="text-blue-600" />
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Attendance</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={14} /></button>
                            <span className="text-[10px] font-bold min-w-[80px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-white rounded shadow-sm transition-all rotate-180"><ChevronLeft size={14} /></button>
                        </div>
                    </div>

                    {/* Controls & Bulk Actions */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsAttendanceLocked(!isAttendanceLocked)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all shrink-0 ${isAttendanceLocked ? 'bg-slate-100 border-slate-200 text-slate-500 shadow-sm' : 'bg-red-50 border-red-200 text-red-600 active:scale-95 shadow-md ring-2 ring-red-100'}`}
                        >
                            <span className="text-[9px] font-black uppercase tracking-wider">{isAttendanceLocked ? 'Locked' : 'Unlocked'}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${isAttendanceLocked ? 'bg-slate-400' : 'bg-red-500 animate-pulse'}`} />
                        </button>

                        <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide transition-all flex-1 ${isAttendanceLocked ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}`}>
                            <button 
                                disabled={isAttendanceLocked}
                                onClick={() => {
                                    if (!selectedStaff) return;
                                    const newAttendance = { ...(selectedStaff.attendance || {}) };
                                    monthDays.forEach(day => {
                                        if (!isAfter(startOfDay(day), startOfDay(new Date()))) {
                                            newAttendance[format(day, 'yyyy-MM-dd')] = 'duty';
                                        }
                                    });
                                    const updatedStaff = settings.staff.map(s => s.id === selectedStaff.id ? { ...s, attendance: newAttendance } : s);
                                    updateSettings({ staff: updatedStaff });
                                }}
                                className="whitespace-nowrap bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Mark All Duty
                            </button>
                            <button 
                                disabled={isAttendanceLocked}
                                onClick={() => {
                                    if (!selectedStaff) return;
                                    const newAttendance = { ...(selectedStaff.attendance || {}) };
                                    monthDays.forEach(day => {
                                        if (!isAfter(startOfDay(day), startOfDay(new Date()))) {
                                            const dayOfWeek = getDay(day);
                                            if (dayOfWeek !== 0) { // Not Sunday
                                                newAttendance[format(day, 'yyyy-MM-dd')] = 'duty';
                                            } else {
                                                newAttendance[format(day, 'yyyy-MM-dd')] = 'leave';
                                            }
                                        }
                                    });
                                    const updatedStaff = settings.staff.map(s => s.id === selectedStaff.id ? { ...s, attendance: newAttendance } : s);
                                    updateSettings({ staff: updatedStaff });
                                }}
                                className="whitespace-nowrap bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Mon-Sat Duty
                            </button>
                            <button 
                                disabled={isAttendanceLocked}
                                onClick={() => {
                                    if (!selectedStaff || !confirm('Clear all attendance for this month?')) return;
                                    const newAttendance = { ...(selectedStaff.attendance || {}) };
                                    monthDays.forEach(day => {
                                        delete newAttendance[format(day, 'yyyy-MM-dd')];
                                    });
                                    const updatedStaff = settings.staff.map(s => s.id === selectedStaff.id ? { ...s, attendance: newAttendance } : s);
                                    updateSettings({ staff: updatedStaff });
                                }}
                                className="whitespace-nowrap bg-slate-50 text-slate-600 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Clear Month
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-1 pt-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                            <div key={d} className="text-[8px] font-black text-slate-300 uppercase">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array(getDay(startOfMonth(currentMonth))).fill(null).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {monthDays.map(day => {
                            const status = getAttendanceStatus(day);
                            const isSun = getDay(day) === 0;
                            const isEditing = activeDatePicker && format(day, 'yyyy-MM-dd') === format(activeDatePicker, 'yyyy-MM-dd');
                            const isFuture = isAfter(startOfDay(day), startOfDay(new Date()));
                            
                            let bgClass = isSun ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-500';
                            if (isFuture) bgClass = 'bg-slate-50/50 text-slate-200 cursor-not-allowed';
                            
                            if (status === 'duty') bgClass = 'bg-emerald-600 text-white shadow-md shadow-emerald-200';
                            else if (status === 'standby') bgClass = 'bg-amber-400 text-white shadow-md shadow-amber-100';
                            else if (status === 'leave') bgClass = 'bg-red-500 text-white shadow-md shadow-red-100';
                            
                            return (
                                <div key={day.toISOString()} className="relative">
                                    <button
                                        disabled={isAttendanceLocked || isFuture}
                                        onClick={() => setActiveDatePicker(isEditing ? null : day)}
                                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${isToday(day) ? 'ring-2 ring-slate-900 z-10' : ''} ${isEditing ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg' : ''} ${bgClass} ${isAttendanceLocked || isFuture ? 'cursor-default opacity-90' : 'active:scale-90 hover:ring-2 hover:ring-blue-400'}`}
                                    >
                                        {format(day, 'd')}
                                    </button>

                                    {/* Inline Choice Popup */}
                                    {isEditing && (
                                        <div className="absolute left-1/2 -bottom-2 translate-y-full -translate-x-1/2 z-100 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] p-1 flex flex-col gap-1 min-w-[80px] animate-slide-up">
                                            <button 
                                                onClick={() => { updateAttendance(day, 'duty'); setActiveDatePicker(null); }}
                                                className="h-8 px-3 rounded-lg flex items-center gap-2 hover:bg-emerald-50 transition-all text-left"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                                                <span className="text-[9px] font-black uppercase text-slate-700">Duty</span>
                                            </button>
                                            <button 
                                                onClick={() => { updateAttendance(day, 'standby'); setActiveDatePicker(null); }}
                                                className="h-8 px-3 rounded-lg flex items-center gap-2 hover:bg-amber-50 transition-all text-left"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                <span className="text-[9px] font-black uppercase text-slate-700">Waiting</span>
                                            </button>
                                            <button 
                                                onClick={() => { updateAttendance(day, 'leave'); setActiveDatePicker(null); }}
                                                className="h-8 px-3 rounded-lg flex items-center gap-2 hover:bg-red-50 transition-all text-left"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                <span className="text-[9px] font-black uppercase text-slate-700">Leave</span>
                                            </button>
                                            <div className="h-px bg-slate-100 mx-1" />
                                            <button 
                                                onClick={() => { updateAttendance(day, undefined); setActiveDatePicker(null); }}
                                                className="h-8 px-3 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-all text-left"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                <span className="text-[8px] font-black uppercase text-slate-400">Clear</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="flex justify-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-600" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Duty ({payroll.dutyDays})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Standby ({payroll.standbyDays})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Leave</span>
                        </div>
                    </div>
                </div>

                {/* Advances & Deductions */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet size={16} className="text-red-500" />
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Adjustments</h3>
                        </div>
                        <button onClick={() => {
                            setNewDeductionType('advance');
                            setShowDeductionModal(true);
                        }} className="text-[9px] font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100">+ Add</button>
                    </div>

                    <div className="space-y-4">
                        {/* Advances Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cash Advances</span>
                                <span className="text-[10px] font-black text-slate-900">₹{payroll.advances}</span>
                            </div>
                            {(selectedStaff.deductions || [])
                                .filter(d => isSameMonth(parseISO(d.date), currentMonth) && d.type === 'advance')
                                .length === 0 ? (
                                    <p className="text-[9px] text-slate-300 italic pl-1">No advances</p>
                                ) : (
                                    (selectedStaff.deductions || [])
                                        .filter(d => isSameMonth(parseISO(d.date), currentMonth) && d.type === 'advance')
                                        .map(d => (
                                            <div key={d.id} className="flex justify-between items-center bg-blue-50/30 p-2.5 rounded-xl border border-blue-50">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-900">{d.reason}</p>
                                                    <p className="text-[8px] text-slate-400">{d.date}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black text-blue-600">-₹{d.amount}</span>
                                                    <button onClick={() => removeDeduction(d.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        ))
                                )}
                        </div>

                        {/* Fines Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deductions & Adjustments</span>
                                <span className="text-[10px] font-black text-slate-900">₹{payroll.fines}</span>
                            </div>
                            {(selectedStaff.deductions || [])
                                .filter(d => isSameMonth(parseISO(d.date), currentMonth) && d.type !== 'advance')
                                .length === 0 ? (
                                    <p className="text-[9px] text-slate-300 italic pl-1">No penalties</p>
                                ) : (
                                    (selectedStaff.deductions || [])
                                        .filter(d => isSameMonth(parseISO(d.date), currentMonth) && d.type !== 'advance')
                                        .map(d => (
                                            <div key={d.id} className="flex justify-between items-center bg-red-50/30 p-2.5 rounded-xl border border-red-50">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-900">{d.reason}</p>
                                                    <p className="text-[8px] text-slate-400">{d.date}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black text-red-500">-₹{d.amount}</span>
                                                    <button onClick={() => removeDeduction(d.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        ))
                                )}
                        </div>
                    </div>
                    
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                         <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-2">
                                <div className="text-[9px] font-bold text-slate-400 uppercase">EPF (12%)</div>
                                <ToggleButton 
                                    enabled={selectedStaff.salaryConfig.isPfEnabled ?? true} 
                                    onChange={() => {
                                        const updatedStaff = settings.staff.map(s => {
                                            if (s.id === selectedStaff.id) {
                                                return { ...s, salaryConfig: { ...s.salaryConfig, isPfEnabled: !(selectedStaff.salaryConfig.isPfEnabled ?? true) } };
                                            }
                                            return s;
                                        });
                                        updateSettings({ staff: updatedStaff });
                                    }}
                                />
                            </div>
                            <div className="text-xs font-black text-slate-600">
                                {payroll.pf > 0 ? `-₹${payroll.pf}` : <span className="text-[8px] text-slate-300 uppercase">Disabled</span>}
                            </div>
                         </div>

                         <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-2">
                                <div className="text-[9px] font-bold text-slate-400 uppercase">ESI (0.75%)</div>
                                <ToggleButton 
                                    enabled={selectedStaff.salaryConfig.isEsiEnabled ?? false} 
                                    onChange={() => {
                                        const updatedStaff = settings.staff.map(s => {
                                            if (s.id === selectedStaff.id) {
                                                return { ...s, salaryConfig: { ...s.salaryConfig, isEsiEnabled: !(selectedStaff.salaryConfig.isEsiEnabled ?? false) } };
                                            }
                                            return s;
                                        });
                                        updateSettings({ staff: updatedStaff });
                                    }}
                                />
                            </div>
                            <div className="text-xs font-black text-slate-600">
                                {payroll.esi > 0 ? `-₹${payroll.esi}` : (selectedStaff.salaryConfig.isEsiEnabled ? <span className="text-[8px] text-slate-300 uppercase">EXEMPT ({">"}21K)</span> : <span className="text-[8px] text-slate-300 uppercase">Disabled</span>)}
                            </div>
                         </div>

                    </div>
                </div>

                <div className="px-1">
                    <button onClick={handleGenerateSlip} className="w-full h-10 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-100 flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all">
                        <Save size={14} /> Generate Payslip
                    </button>
                    <p className="text-center text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-widest px-4 leading-relaxed">
                        Starts download & saves to Expenses.
                    </p>
                </div>

                {/* Attendance Tips */}
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mx-1">
                    <p className="text-[9px] text-blue-800 font-bold uppercase tracking-widest text-center leading-relaxed">
                        {isAttendanceLocked ? 'Attendance is Locked. Tap "Locked" button to modify.' : 'Tap any date to mark Duty, Waiting or Leave status.'}
                    </p>
                </div>

                {/* Edit Staff Modal */}
                {showEditStaffModal && (
                <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4 animate-fade-in" onClick={() => setShowEditStaffModal(false)}>
                        <div className="bg-white w-full max-w-sm rounded-[24px] p-5 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight">Edit Staff Settings</h3>
                                    <p className="text-[9px] text-slate-400 font-bold">{selectedStaff.name}</p>
                                </div>
                                <button onClick={() => setShowEditStaffModal(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-900"><User size={20} /></button>
                            </div>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Full Name</label>
                                    <input
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="tn-input w-full h-10 bg-slate-50 rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Phone Number</label>
                                        <input
                                            value={newPhone}
                                            onChange={e => setNewPhone(e.target.value)}
                                            className="tn-input w-full h-10 bg-slate-50 rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Designation</label>
                                        <input
                                            value={newDesignation}
                                            onChange={e => setNewDesignation(e.target.value)}
                                            placeholder="e.g. Driver"
                                            className="tn-input w-full h-10 bg-slate-50 rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Employee ID</label>
                                        <input
                                            value={newEmployeeId}
                                            onChange={e => setNewEmployeeId(e.target.value)}
                                            placeholder="e.g. SB-001"
                                            className="tn-input w-full h-10 bg-slate-50 rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">PAN Number</label>
                                        <input
                                            value={newPanNumber}
                                            onChange={e => setNewPanNumber(e.target.value)}
                                            placeholder="ABCDE1234F"
                                            className="tn-input w-full h-10 bg-slate-50 rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Bank Details</p>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Bank Name</label>
                                        <input
                                            value={newBankName}
                                            onChange={e => setNewBankName(e.target.value)}
                                            placeholder="e.g. SBI, HDFC"
                                            className="tn-input w-full h-10 bg-white rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Account No</label>
                                            <input
                                                value={newAccountNumber}
                                                onChange={e => setNewAccountNumber(e.target.value)}
                                                className="tn-input w-full h-10 bg-white rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">IFSC Code</label>
                                            <input
                                                value={newIfscCode}
                                                onChange={e => setNewIfscCode(e.target.value)}
                                                className="tn-input w-full h-10 bg-white rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Compliance (EPF/ESI)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">UAN Number</label>
                                            <input
                                                value={newUan}
                                                onChange={e => setNewUan(e.target.value)}
                                                className="tn-input w-full h-10 bg-white rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">ESI IP Number</label>
                                            <input
                                                value={newEsiNumber}
                                                onChange={e => setNewEsiNumber(e.target.value)}
                                                className="tn-input w-full h-10 bg-white rounded-xl px-3 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100/50">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PF Enrolled</label>
                                            <ToggleButton 
                                                enabled={newIsPfEnabled} 
                                                onChange={() => setNewIsPfEnabled(!newIsPfEnabled)} 
                                            />
                                        </div>
                                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100/50">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ESI Benefit</label>
                                            <ToggleButton 
                                                enabled={newIsEsiEnabled} 
                                                onChange={() => setNewIsEsiEnabled(!newIsEsiEnabled)} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
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
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Standby Pay</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                            <input
                                                type="number"
                                                value={newStandbyPay}
                                                onChange={e => setNewStandbyPay(e.target.value)}
                                                className="tn-input w-full h-10 bg-slate-50 rounded-xl pl-7 pr-4 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const updatedStaff = settings.staff.map(s => {
                                        if (s.id === selectedStaff.id) {
                                            return {
                                                ...s,
                                                name: newName,
                                                phone: newPhone,
                                                designation: newDesignation,
                                                employeeId: newEmployeeId,
                                                panNumber: newPanNumber,
                                                bankName: newBankName,
                                                accountNumber: newAccountNumber,
                                                ifscCode: newIfscCode,
                                                uan: newUan,
                                                esiNumber: newEsiNumber,
                                                salaryConfig: {
                                                    ...s.salaryConfig,
                                                    dutyPay: parseInt(newDutyPay) || s.salaryConfig.dutyPay,
                                                    standbyPay: parseInt(newStandbyPay) || s.salaryConfig.standbyPay,
                                                    isPfEnabled: newIsPfEnabled,
                                                    isEsiEnabled: newIsEsiEnabled
                                                }
                                            };
                                        }
                                        return s;
                                    });
                                    updateSettings({ staff: updatedStaff });
                                    setShowEditStaffModal(false);
                                }}
                                className="w-full h-11 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Deduction Modal */}
                {showDeductionModal && (
                    <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4 animate-fade-in" onClick={() => setShowDeductionModal(false)}>
                        <div className="bg-white w-full max-w-sm rounded-[24px] p-5 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight">Add Adjustment</h3>
                                    <p className="text-[9px] text-slate-400 font-bold">Record a deduction or advance</p>
                                </div>
                                <button onClick={() => setShowDeductionModal(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-900"><User size={20} /></button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setNewDeductionType('advance')}
                                            className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newDeductionType === 'advance' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                        >
                                            Advance
                                        </button>
                                        <button 
                                            onClick={() => setNewDeductionType('fine')}
                                            className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newDeductionType === 'fine' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                        >
                                            Deduction
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Reason (Optional)</label>
                                    <input
                                        value={newDeductionReason}
                                        onChange={e => setNewDeductionReason(e.target.value)}
                                        className={`tn-input w-full h-10 bg-slate-50 rounded-xl px-3 font-bold text-sm border-2 border-transparent outline-none transition-all ${newDeductionType === 'advance' ? 'focus:border-blue-500' : 'focus:border-red-500'}`}
                                        placeholder={newDeductionType === 'advance' ? "e.g. Monthly Advance" : "e.g. Damage, Fine"}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                        <input
                                            type="number"
                                            value={newDeductionAmount}
                                            onChange={e => setNewDeductionAmount(e.target.value)}
                                            className="tn-input w-full h-10 bg-slate-50 rounded-xl pl-7 pr-4 font-bold text-sm border-2 border-transparent focus:border-red-500 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={addDeduction}
                                disabled={!newDeductionAmount}
                                className={`w-full h-11 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[0.98] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100 ${newDeductionType === 'advance' ? 'bg-blue-600 shadow-blue-100' : 'bg-red-600 shadow-red-100'}`}
                            >
                                Add {newDeductionType === 'advance' ? 'Advance' : 'Deduction'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="pb-24 space-y-6 animate-fade-in">
            {/* Header Card */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-xl" />
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2.5">
                        <div>
                            <h2 className="text-base font-black uppercase tracking-tight">Staff Manager</h2>
                            <p className="text-slate-400 text-[9px] font-bold mt-0.5">Manage Drivers & Salaries</p>
                        </div>
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
                            <Users size={18} className="text-blue-400" />
                        </div>
                    </div>

                    <div className="flex gap-2.5">
                        <div className="bg-white/10 px-2.5 py-1.5 rounded-xl backdrop-blur-sm flex-1">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Active Staff</p>
                            <p className="text-base font-black">{settings.staff.length}</p>
                        </div>
                        <div className="bg-white/10 px-2.5 py-1.5 rounded-xl backdrop-blur-sm flex-[1.5]">
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Total Monthly</p>
                            <p className="text-base font-black">₹{totalMonthlyPayroll.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff List */}
            <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                            onClick={() => setIsBulkMode(true)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isBulkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                        >
                            Daily View
                        </button>
                        <button 
                            onClick={() => setIsBulkMode(false)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!isBulkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                        >
                            Individual
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                        <Plus size={12} strokeWidth={3} /> Add Staff
                    </button>
                </div>

                {isBulkMode ? (
                    <div className="space-y-4 animate-slide-up">
                        {/* Bulk Date Picker */}
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarIcon size={16} className="text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{format(bulkDate, 'EEE, dd MMM yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setBulkDate(new Date(bulkDate.getTime() - 86400000))}
                                    className="p-1.5 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => setBulkDate(new Date())}
                                    className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase"
                                >
                                    Today
                                </button>
                                <button 
                                    disabled={isAfter(startOfDay(new Date(bulkDate.getTime() + 86400000)), startOfDay(new Date()))}
                                    onClick={() => setBulkDate(new Date(bulkDate.getTime() + 86400000))}
                                    className="p-1.5 hover:bg-slate-50 rounded-lg transition-all rotate-180 disabled:opacity-30"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Bulk Actions Bar */}
                        <div className="flex gap-2 px-1">
                            <button 
                                onClick={() => {
                                    const dateKey = format(bulkDate, 'yyyy-MM-dd');
                                    const updatedStaff = settings.staff.map(s => ({
                                        ...s,
                                        attendance: { ...s.attendance, [dateKey]: 'duty' as const }
                                    }));
                                    updateSettings({ staff: updatedStaff });
                                }}
                                className="flex-1 h-9 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                            >
                                All Present (Duty)
                            </button>
                            <button 
                                onClick={() => {
                                    const dateKey = format(bulkDate, 'yyyy-MM-dd');
                                    const updatedStaff = settings.staff.map(s => {
                                        const newAttendance = { ...s.attendance };
                                        delete newAttendance[dateKey];
                                        return { ...s, attendance: newAttendance };
                                    });
                                    updateSettings({ staff: updatedStaff });
                                }}
                                className="flex-1 h-9 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 active:scale-95 transition-all"
                            >
                                Clear All
                            </button>
                        </div>

                        {/* Bulk List */}
                        <div className="grid gap-2">
                            {settings.staff.map(staff => {
                                const status = staff.attendance?.[format(bulkDate, 'yyyy-MM-dd')];
                                return (
                                    <div key={staff.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-black text-sm border-2 border-white shadow-sm">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-xs">{staff.name}</h4>
                                                {status === 'duty' ? (
                                                    <p className="text-[9px] font-bold text-emerald-600 uppercase">₹{staff.salaryConfig.dutyPay}/day</p>
                                                ) : status === 'standby' ? (
                                                    <p className="text-[9px] font-bold text-amber-500 uppercase">₹{staff.salaryConfig.standbyPay}/waiting</p>
                                                ) : status === 'leave' ? (
                                                    <p className="text-[9px] font-bold text-red-500 uppercase">On Leave</p>
                                                ) : (
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">₹{staff.salaryConfig.dutyPay}/day</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                            <button 
                                                onClick={() => updateAttendance(bulkDate, status === 'duty' ? undefined : 'duty', staff.id)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${status === 'duty' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-emerald-600'}`}
                                            >
                                                <span className="text-[10px] font-black">D</span>
                                            </button>
                                            <button 
                                                onClick={() => updateAttendance(bulkDate, status === 'standby' ? undefined : 'standby', staff.id)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${status === 'standby' ? 'bg-amber-400 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-amber-500'}`}
                                            >
                                                <span className="text-[10px] font-black">W</span>
                                            </button>
                                            <button 
                                                onClick={() => updateAttendance(bulkDate, status === 'leave' ? undefined : 'leave', staff.id)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${status === 'leave' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-red-500'}`}
                                            >
                                                <span className="text-[10px] font-black">L</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    settings.staff.length === 0 ? (
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
                    )
                )}
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
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
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Standby Pay (Per Day)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                    <input
                                        type="number"
                                        value={newStandbyPay}
                                        onChange={e => setNewStandbyPay(e.target.value)}
                                        className="tn-input w-full h-10 bg-slate-50 rounded-xl pl-7 pr-4 font-bold text-sm border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                             <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EPF Enrolled</label>
                                    <ToggleButton 
                                        enabled={newIsPfEnabled} 
                                        onChange={() => setNewIsPfEnabled(!newIsPfEnabled)} 
                                    />
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ESI Benefit</label>
                                    <ToggleButton 
                                        enabled={newIsEsiEnabled} 
                                        onChange={() => setNewIsEsiEnabled(!newIsEsiEnabled)} 
                                    />
                                </div>
                            </div>

                        </div>

                        <button
                            onClick={handleAddStaff}
                            disabled={!newName}
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
