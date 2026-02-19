import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { type Trip } from './fare';
import { type SavedQuotation } from './pdf';
import { type Settings } from '../contexts/SettingsContext';

interface CabDriverDB extends DBSchema {
    trips: {
        key: string;
        value: Trip;
    };
    quotations: {
        key: string;
        value: SavedQuotation;
    };
    settings: {
        key: string;
        value: Settings;
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
    async getAll<K extends 'trips' | 'quotations'>(storeName: K): Promise<CabDriverDB[K]['value'][]> {
        const db = await initDB();
        return db.getAll(storeName);
    },

    async get<K extends 'trips' | 'quotations'>(storeName: K, id: string): Promise<CabDriverDB[K]['value'] | undefined> {
        const db = await initDB();
        return db.get(storeName, id);
    },

    async put<K extends 'trips' | 'quotations'>(storeName: K, value: CabDriverDB[K]['value']): Promise<void> {
        const db = await initDB();
        await db.put(storeName, value);
    },

    async delete(storeName: 'trips' | 'quotations', id: string): Promise<void> {
        const db = await initDB();
        await db.delete(storeName, id);
    },
};
