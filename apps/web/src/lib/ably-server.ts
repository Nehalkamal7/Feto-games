import Ably from 'ably';

const apiKey = process.env.ABLY_API_KEY;

// Server-side Ably REST client (singleton)
let ablyRestInstance: Ably.Rest | null = null;

export const getAblyRest = (): Ably.Rest | null => {
  if (!apiKey) {
    return null;
  }
  if (!ablyRestInstance) {
    ablyRestInstance = new Ably.Rest({ key: apiKey });
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
