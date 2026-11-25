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
    const db = await getDB();
    return db.getAll('subscriptions');
  },

  async getSubscription(id: string): Promise<Subscription | undefined> {
    const db = await getDB();
    return db.get('subscriptions', id);
  },

  async putSubscription(sub: Subscription): Promise<void> {
    const db = await getDB();
    await db.put('subscriptions', sub);
  },

  async deleteSubscription(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('subscriptions', id);
  },

  async addToSyncQueue(item: { id: string; action: 'create' | 'update' | 'delete'; data: any }): Promise<void> {
    const db = await getDB();
    await db.put('sync_queue', {
      ...item,
      timestamp: new Date().toISOString(),
    });
  },

  async getSyncQueue(): Promise<any[]> {
    const db = await getDB();
    return db.getAll('sync_queue');
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('sync_queue', id);
  },
};
