/**
 * Storage utility for managing multi-tab sessions
 * Uses user-specific keys to prevent conflicts between different users in different tabs
 */

// Generate a unique storage key based on user ID
export const getUserStorageKey = (baseKey: string, userId?: string | null): string => {
  if (!userId) return baseKey;
  return `${baseKey}_user_${userId}`;
};

// Safe localStorage wrapper with user-specific keys
export const storage = {
  getItem: (key: string, userId?: string | null): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const userKey = getUserStorageKey(key, userId);
      return localStorage.getItem(userKey);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string, userId?: string | null): void => {
    if (typeof window === 'undefined') return;
    try {
      const userKey = getUserStorageKey(key, userId);
      localStorage.setItem(userKey, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  removeItem: (key: string, userId?: string | null): void => {
    if (typeof window === 'undefined') return;
    try {
      const userKey = getUserStorageKey(key, userId);
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (userId?: string | null): void => {
    if (typeof window === 'undefined') return;
    try {
      // Only clear items for this user
      if (userId) {
        const keys = Object.keys(localStorage);
        const userPrefix = `_user_${userId}`;
        keys.forEach(key => {
          if (key.includes(userPrefix)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Session storage wrapper for tab-specific data
export const sessionStore = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }
};

// Broadcast channel for cross-tab communication
export const createTabSync = (channelName: string) => {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null;
  }
  
  return new BroadcastChannel(channelName);
};
