import { get, set, del } from 'idb-keyval';

export const storage = {
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await get(key);
    } catch (error) {
      console.error(`Error getting key ${key} from IndexedDB:`, error);
      return undefined;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await set(key, value);
    } catch (error) {
      console.error(`Error setting key ${key} in IndexedDB:`, error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await del(key);
    } catch (error) {
      console.error(`Error deleting key ${key} from IndexedDB:`, error);
    }
  }
};
