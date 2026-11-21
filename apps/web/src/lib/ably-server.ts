import Ably from 'ably';

// Server-side Ably REST client (singleton)
let ablyRestInstance: Ably.Rest | null = null;
let ablyInitFailed = false;

/**
 * Checks whether ABLY_API_KEY is present and looks like a real Ably key (`appId.keyId:secret`),
 * ignoring common placeholder values from .env.example.
 */
export const isAblyConfigured = (): boolean => {
  const key = (process.env.ABLY_API_KEY || '').trim();
  if (!key) return false;
  const lower = key.toLowerCase();
  if (
    lower.includes('your-ably') ||
    lower.includes('your_ably') ||
    lower.includes('placeholder') ||
    lower.includes('changeme') ||
    lower.includes('example')
  ) {
    return false;
  }
  const colonIdx = key.indexOf(':');
  const dotIdx = key.indexOf('.');
  return dotIdx > 0 && colonIdx > dotIdx + 1 && colonIdx < key.length - 1;
};

export const getAblyRest = (): Ably.Rest | null => {
  if (ablyInitFailed || !isAblyConfigured()) {
    return null;
  }
  if (!ablyRestInstance) {
    try {
      ablyRestInstance = new Ably.Rest({ key: (process.env.ABLY_API_KEY || '').trim() });
    } catch (err: any) {
      ablyInitFailed = true;
      console.warn('⚠️ [Ably] Invalid ABLY_API_KEY — falling back to local mode:', err?.message || err);
      return null;
    }
  }
  return ablyRestInstance;
};

/**
 * Publishes an event to all players in a room via the public room channel.
 */
export async function publishToRoom(roomCode: string, eventName: string, data: any): Promise<void> {
  const normalized = roomCode.toUpperCase().trim();
  const ably = getAblyRest();
  if (!ably) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📡 [Ably Mock Publish] Channel feto:room:${normalized} Event: ${eventName}`);
    }
    return;
  }

  try {
    const channel = ably.channels.get(`feto:room:${normalized}`);
    await channel.publish(eventName, data);
  } catch (err: any) {
    console.error(`❌ [Ably] Failed to publish to feto:room:${normalized}:`, err.message);
  }
}

/**
 * Publishes a private targeted event (e.g. secret role or word) to an individual player.
 */
export async function publishToPlayer(playerId: string, eventName: string, data: any): Promise<void> {
  const ably = getAblyRest();
  if (!ably) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔒 [Ably Mock Private] Channel feto:player:${playerId} Event: ${eventName}`);
    }
    return;
  }

  try {
    const channel = ably.channels.get(`feto:player:${playerId}`);
    await channel.publish(eventName, data);
  } catch (err: any) {
    console.error(`❌ [Ably] Failed to publish to feto:player:${playerId}:`, err.message);
  }
}

/**
 * Generates an Ably Token Request for client-side authentication without
 * ever exposing the master ABLY_API_KEY to the browser.
 */
export async function createAblyTokenRequest(clientId: string): Promise<Ably.TokenRequest> {
  const ably = getAblyRest();
  if (!ably) {
    throw new Error('ABLY_API_KEY is not configured on the server.');
  }

  return ably.auth.createTokenRequest({
    clientId,
    capability: {
      'feto:room:*': ['publish', 'subscribe', 'presence'],
      'feto:player:*': ['subscribe']
    }
  });
}
