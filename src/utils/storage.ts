export const safeJSONParse = <T,>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        return JSON.parse(item) as T;
    } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return fallback;
    }
};
