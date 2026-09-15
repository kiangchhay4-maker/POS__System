// Real-time synchronization channel across browser tabs and components

type EventType = 'ORDER_CREATED' | 'SHIFT_UPDATED' | 'PRODUCT_UPDATED' | 'STAFF_UPDATED' | 'SYSTEM_RESET';

interface SyncMessage {
  type: EventType;
  payload?: any;
  timestamp: number;
}

const CHANNEL_NAME = 'coffee_pos_realtime_sync';

let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  channel = null;
}

export function broadcastSync(type: EventType, payload?: any): void {
  const message: SyncMessage = {
    type,
    payload,
    timestamp: Date.now(),
  };

  // 1. Broadcast to other browser windows/tabs
  try {
    channel?.postMessage(message);
  } catch (e) {
    console.warn('BroadcastChannel error', e);
  }

  // 2. Dispatch local CustomEvent in current window
  try {
    window.dispatchEvent(new CustomEvent('coffee_pos_sync', { detail: message }));
  } catch (e) {
    console.warn('CustomEvent dispatch error', e);
  }
}

export function subscribeSync(callback: (msg: SyncMessage) => void): () => void {
  const handleBroadcast = (event: MessageEvent<SyncMessage>) => {
    if (event?.data?.type) {
      callback(event.data);
    }
  };

  const handleLocal = (event: Event) => {
    const custom = event as CustomEvent<SyncMessage>;
    if (custom?.detail?.type) {
      callback(custom.detail);
    }
  };

  channel?.addEventListener('message', handleBroadcast);
  window.addEventListener('coffee_pos_sync', handleLocal);

  return () => {
    channel?.removeEventListener('message', handleBroadcast);
    window.removeEventListener('coffee_pos_sync', handleLocal);
  };
}
