/**
 * Tab Synchronization Utility
 * Enables real-time communication between tabs for the same user session
 */

export type TabSyncMessage = {
  type: 'LOGOUT' | 'SETTINGS_UPDATE' | 'INVOICE_UPDATE' | 'CLIENT_UPDATE' | 'BUSINESS_CHANGE';
  userId: string;
  timestamp: number;
  data?: any;
};

class TabSyncManager {
  private channels: Map<string, BroadcastChannel> = new Map();
  private listeners: Map<string, Set<(message: TabSyncMessage) => void>> = new Map();

  /**
   * Initialize a channel for a specific user
   */
  initChannel(userId: string): void {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      console.warn('BroadcastChannel API not supported');
      return;
    }

    const channelName = `smartgst_user_${userId}`;
    
    if (this.channels.has(channelName)) {
      return;
    }

    const channel = new BroadcastChannel(channelName);
    this.channels.set(channelName, channel);

    channel.onmessage = (event: MessageEvent<TabSyncMessage>) => {
      const listeners = this.listeners.get(channelName);
      if (listeners) {
        listeners.forEach(listener => listener(event.data));
      }
    };
  }

  /**
   * Send a message to all tabs for a specific user
   */
  broadcast(userId: string, message: Omit<TabSyncMessage, 'userId' | 'timestamp'>): void {
    const channelName = `smartgst_user_${userId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      const fullMessage: TabSyncMessage = {
        ...message,
        userId,
        timestamp: Date.now(),
      };
      channel.postMessage(fullMessage);
    }
  }

  /**
   * Subscribe to messages for a specific user
   */
  subscribe(userId: string, listener: (message: TabSyncMessage) => void): () => void {
    this.initChannel(userId);
    const channelName = `smartgst_user_${userId}`;
    
    if (!this.listeners.has(channelName)) {
      this.listeners.set(channelName, new Set());
    }

    this.listeners.get(channelName)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(channelName);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Close a specific channel
   */
  closeChannel(userId: string): void {
    const channelName = `smartgst_user_${userId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      channel.close();
      this.channels.delete(channelName);
      this.listeners.delete(channelName);
    }
  }

  /**
   * Close all channels
   */
  closeAll(): void {
    this.channels.forEach(channel => channel.close());
    this.channels.clear();
    this.listeners.clear();
  }
}

// Export a singleton instance
export const tabSync = new TabSyncManager();

/**
 * React hook for tab synchronization
 */
export function useTabSync(
  userId: string | null | undefined,
  onMessage: (message: TabSyncMessage) => void
) {
  if (typeof window === 'undefined') {
    return { broadcast: () => {} };
  }

  if (!userId) {
    return { broadcast: () => {} };
  }

  // Subscribe to messages
  const unsubscribe = tabSync.subscribe(userId, onMessage);

  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', unsubscribe);
  }

  return {
    broadcast: (message: Omit<TabSyncMessage, 'userId' | 'timestamp'>) => {
      tabSync.broadcast(userId, message);
    },
    cleanup: unsubscribe,
  };
}

/**
 * Storage event listener for fallback when BroadcastChannel is not available
 */
export function setupStorageSync(userId: string, callback: (key: string, value: string | null) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: StorageEvent) => {
    // Only process events for this user
    if (event.key && event.key.includes(`_user_${userId}`)) {
      callback(event.key, event.newValue);
    }
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}
