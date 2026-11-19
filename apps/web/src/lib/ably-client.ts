import * as Ably from 'ably';

let ablyInstance: Ably.Realtime | null = null;
let currentClientId: string | null = null;

/**
 * Initializes and returns the browser-side Ably Realtime singleton.
 * Authenticates securely via token auth at `/api/ably/auth` without
 * exposing the master API key to the client.
 */
export function getAblyRealtime(clientId?: string): Ably.Realtime | null {
  if (typeof window === 'undefined') return null;

  if (clientId && clientId !== currentClientId && ablyInstance) {
    // If clientId changed, disconnect previous and re-init
    try {
      ablyInstance.close();
    } catch {
      // ignore
    }
    ablyInstance = null;
  }

  if (!ablyInstance) {
    try {
      currentClientId = clientId || null;
      ablyInstance = new Ably.Realtime({
        authUrl: '/api/ably/auth',
        authParams: clientId ? { clientId } : undefined,
        autoConnect: true
      });

      ablyInstance.connection.on('connected', () => {
        console.log('⚡ [Ably Realtime] Connected securely to Ably edge network.');
      });

      ablyInstance.connection.on('failed', (stateChange) => {
        console.warn('⚠️ [Ably Realtime] Connection failed:', stateChange.reason?.message);
      });

      ablyInstance.connection.on('suspended', (stateChange) => {
        console.warn('⚠️ [Ably Realtime] Connection suspended:', stateChange.reason?.message);
      });
    } catch (err: any) {
      console.warn('⚠️ [Ably Realtime] Initialization warning:', err.message);
      return null;
    }
  }

  return ablyInstance;
}

/**
 * Convenience helper to publish a high-frequency event (like canvas draw strokes)
 * directly through the browser Ably Realtime channel for sub-30ms latency.
 */
export async function publishDirectToChannel(channelName: string, eventName: string, data: any): Promise<void> {
  const ably = getAblyRealtime();
  if (!ably) return;

  try {
    const channel = ably.channels.get(channelName);
    await channel.publish(eventName, data);
  } catch (err: any) {
    console.error(`❌ [Ably Direct Publish] Failed to publish ${eventName} to ${channelName}:`, err.message);
  }
}
