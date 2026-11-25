import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Subscription } from '../types';

interface MyDB extends DBSchema {
  subscriptions: {
    key: string;
    value: Subscription;
    indexes: { 'by-status': string; 'by-updated': string };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: string;
    };
  };
}

const DB_NAME = 'subit_db';
const DB_VERSION = 1;
const LS_SUBS_KEY = 'subit_local_subscriptions';
const LS_QUEUE_KEY = 'subit_sync_queue';

function getLocalStorageSubs(): Subscription[] {
  try {
    const raw = localStorage.getItem(LS_SUBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalStorageSubs(subs: Subscription[]) {
  try {
    localStorage.setItem(LS_SUBS_KEY, JSON.stringify(subs));
  } catch {}
}

let dbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('subscriptions')) {
          const subStore = db.createObjectStore('subscriptions', { keyPath: 'id' });
          subStore.createIndex('by-status', 'status');
          subStore.createIndex('by-updated', 'updated_at');
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const localDb = {
  async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const db = await getDB();
      const items = await db.getAll('subscriptions');
      if (items && items.length > 0) {
        saveLocalStorageSubs(items);
        return items;
      }
      const ls = getLocalStorageSubs();
      if (ls && ls.length > 0) {
        for (const it of ls) {
          try { await db.put('subscriptions', it); } catch {}
        }
        return ls;
      }
      return items || [];
    } catch {
      return getLocalStorageSubs();
    }
  },

  async getSubscription(id: string): Promise<Subscription | undefined> {
    try {
      const db = await getDB();
      const found = await db.get('subscriptions', id);
      if (found) return found;
    } catch {}
    const ls = getLocalStorageSubs();
    return ls.find((s) => s.id === id);
  },

  async putSubscription(sub: Subscription): Promise<void> {
    try {
      const db = await getDB();
      await db.put('subscriptions', sub);
    } catch (e) {
      console.warn('IDB put error, falling back to localStorage:', e);
    }
    const current = getLocalStorageSubs();
    const idx = current.findIndex((s) => s.id === sub.id);
    if (idx >= 0) {
      current[idx] = sub;
    } else {
      current.push(sub);
    }
    saveLocalStorageSubs(current);
  },

  async deleteSubscription(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('subscriptions', id);
    } catch (e) {}
    const current = getLocalStorageSubs().filter((s) => s.id !== id);
    saveLocalStorageSubs(current);
  },

  async addToSyncQueue(item: { id: string; action: 'create' | 'update' | 'delete'; data: any }): Promise<void> {
    try {
      const db = await getDB();
      await db.put('sync_queue', {
        ...item,
        timestamp: new Date().toISOString(),
      });
    } catch {}
  },

  async getSyncQueue(): Promise<any[]> {
    try {
      const db = await getDB();
      return await db.getAll('sync_queue');
    } catch {
      return [];
    }
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('sync_queue', id);
    } catch {}
  },

  async clearAllData(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('subscriptions');
      await db.clear('sync_queue');
    } catch {}
    try {
      localStorage.removeItem(LS_SUBS_KEY);
      localStorage.removeItem(LS_QUEUE_KEY);
    } catch {}
  },
};
