import { safeJSONParse } from './storage';

export type HistoryCategory = 'customer_name' | 'customer_phone' | 'customer_gstin' | 'customer_address' | 'location' | 'quotation_subject' | 'item_description';

export const saveToHistory = (category: HistoryCategory, value: string) => {
    if (!value || value.trim().length < 2) return;

    const history = safeJSONParse<Record<string, string[]>>('sarathi-form-history', {});
    const items = history[category] || [];

    // Maintain a list of last 20 unique values
    const newItems = [value.trim(), ...items.filter(i => i !== value.trim())].slice(0, 20);

    history[category] = newItems;
    localStorage.setItem('sarathi-form-history', JSON.stringify(history));
};

export const getHistory = (category: HistoryCategory): string[] => {
    const history = safeJSONParse<Record<string, string[]>>('sarathi-form-history', {});
    return history[category] || [];
};
