import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CabDriverDB extends DBSchema {
    trips: {
        key: string;
        value: any; // Using any for now to match the flexible Trip type, but should be Trip
    };
    quotations: {
        key: string;
        value: any;
    };
    settings: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'sarathi-book-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CabDriverDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<CabDriverDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('trips')) {
                    db.createObjectStore('trips', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('quotations')) {
                    db.createObjectStore('quotations', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                }
            },
        });
    }
    return dbPromise;
};

export const dbRequest = {
    async getAll<T>(storeName: 'trips' | 'quotations'): Promise<T[]> {
        const db = await initDB();
        return db.getAll(storeName) as Promise<T[]>;
    },

    async get<T>(storeName: 'trips' | 'quotations', id: string): Promise<T | undefined> {
        const db = await initDB();
        return db.get(storeName, id) as Promise<T | undefined>;
    },

    async put<T>(storeName: 'trips' | 'quotations', value: T): Promise<void> {
        const db = await initDB();
        await db.put(storeName, value);
    },

    async delete(storeName: 'trips' | 'quotations', id: string): Promise<void> {
        const db = await initDB();
        await db.delete(storeName, id);
    },

    // Settings (Key-Value store within 'settings' object store?)
    // Actually, for simple key-value like 'namma-cab-trips' array which was in localStorage,
    // we are migrating to individual items in an object store for better performance/querying?
    // The user said "Switch all trip data... to IndexedDB".
    // The previous code stored the ENTIRE array in one localStorage key.
    // It is better to store individual items.
    // BUT to minimize refactoring, I might store the whole array as one key in a 'keyval' store if I wanted to be lazy.
    // The Prompt says "IndexedDB is asynchronous and won't block... during heavy write operations".
    // Writing 1000 items as one blob is still heavy. Writing individual items is better.
    // I will implement `getAll` which returns the array, mimicking the current load behavior.
};
