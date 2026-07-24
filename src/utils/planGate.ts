import type { Settings } from '../types/settings';
import type { Trip } from './fare';
import type { SavedQuotation } from './pdf';

// --- Monthly limits (All tiers are now free and unlimited) ---
export const FREE_TRIP_LIMIT = Infinity;
export const FREE_QUOTATION_LIMIT = Infinity;
export const FREE_CALC_LIMIT = Infinity;

// Kept for reference / any legacy code that imports these
export const PRO_TRIP_LIMIT = Infinity;
export const PRO_QUOTATION_LIMIT = Infinity;
export const PRO_CALC_LIMIT = Infinity;

// --- Tier checks ---
export function isPro(_settings: Settings): boolean {
    return true; // Site is 100% free with premium features enabled
}

export function isSuper(_settings: Settings): boolean {
    return true; // Enable all features including staff/finance
}

export function isFree(_settings: Settings): boolean {
    return false;
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
export function canCreateTrip(_settings: Settings, _trips: Trip[]): boolean {
    return true;
}

export function canCreateQuotation(_settings: Settings, _quotations: SavedQuotation[]): boolean {
    return true;
}

// --- Calculator count (localStorage, auto-resets monthly via month-keyed key) ---
function calcMonthKey(): string {
    const now = new Date();
    return `calc_count_${now.getFullYear()}-${now.getMonth() + 1}`;
}

// Keep tracking count for statistics but allow unlimited calculations
export function getMonthlyCalcCount(): number {
    return parseInt(localStorage.getItem(calcMonthKey()) || '0', 10);
}

export function incrementCalcCount(): void {
    const key = calcMonthKey();
    const count = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(count + 1));
}

export function canCalculateFare(_settings: Settings): boolean {
    return true;
}

// --- Human-readable limit helpers for alert messages ---
export function tripLimitForPlan(_settings: Settings): number {
    return Infinity;
}

export function quotationLimitForPlan(_settings: Settings): number {
    return Infinity;
}

export function calcLimitForPlan(_settings: Settings): number {
    return Infinity;
}

export function openUpgradeModal(): void {
    // No-op: all subscriptions removed and site is free
}
