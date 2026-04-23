import type { Settings } from '../types/settings';
import type { Trip } from './fare';
import type { SavedQuotation } from './pdf';

// --- Monthly limits (Free tier only — Pro & Fleet are unlimited) ---
export const FREE_TRIP_LIMIT = 10;
export const FREE_QUOTATION_LIMIT = 10;
export const FREE_CALC_LIMIT = 50;

// Kept for reference / any legacy code that imports these
export const PRO_TRIP_LIMIT = Infinity;
export const PRO_QUOTATION_LIMIT = Infinity;
export const PRO_CALC_LIMIT = Infinity;

// --- Tier checks ---
export function isPro(settings: Settings): boolean {
    return settings.isPremium === true || settings.plan === 'pro' || settings.plan === 'super';
}

export function isSuper(settings: Settings): boolean {
    return settings.plan === 'super';
}

export function isFree(settings: Settings): boolean {
    return !isPro(settings);
}

// --- Monthly window ---
function currentMonthStart(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

// --- Trip / Quotation counts from in-memory arrays ---
export function getMonthlyTripCount(trips: Trip[]): number {
    const start = currentMonthStart();
    return trips.filter(t => new Date(t.date || t.startTime).getTime() >= start).length;
}

export function getMonthlyQuotationCount(quotations: SavedQuotation[]): number {
    const start = currentMonthStart();
    return quotations.filter(q => new Date(q.date).getTime() >= start).length;
}

// --- Can create? ---
export function canCreateTrip(settings: Settings, trips: Trip[]): boolean {
    if (isPro(settings)) return true;
    return getMonthlyTripCount(trips) < FREE_TRIP_LIMIT;
}

export function canCreateQuotation(settings: Settings, quotations: SavedQuotation[]): boolean {
    if (isPro(settings)) return true;
    return getMonthlyQuotationCount(quotations) < FREE_QUOTATION_LIMIT;
}

// --- Calculator count (localStorage, auto-resets monthly via month-keyed key) ---
function calcMonthKey(): string {
    const now = new Date();
    return `calc_count_${now.getFullYear()}-${now.getMonth() + 1}`;
}

export function getMonthlyCalcCount(): number {
    return parseInt(localStorage.getItem(calcMonthKey()) || '0', 10);
}

export function incrementCalcCount(): void {
    const key = calcMonthKey();
    const count = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(count + 1));
}

export function canCalculateFare(settings: Settings): boolean {
    if (isPro(settings)) return true;
    return getMonthlyCalcCount() < FREE_CALC_LIMIT;
}

// --- Human-readable limit helpers for alert messages ---
export function tripLimitForPlan(settings: Settings): number {
    if (isPro(settings)) return Infinity;
    return FREE_TRIP_LIMIT;
}

export function quotationLimitForPlan(settings: Settings): number {
    if (isPro(settings)) return Infinity;
    return FREE_QUOTATION_LIMIT;
}

export function calcLimitForPlan(settings: Settings): number {
    if (isPro(settings)) return Infinity;
    return FREE_CALC_LIMIT;
}

export function openUpgradeModal(): void {
    window.dispatchEvent(new CustomEvent('open-pricing-modal'));
}
