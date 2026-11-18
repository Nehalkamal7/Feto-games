import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { ReconnectTokenPayload } from '@feto-games/shared-types';

export class TokenService {
  /**
   * Generates a signed JWT session reconnect token.
   * Stored by the frontend in `sessionStorage` to allow seamless reconnection.
   */
  public static generateReconnectToken(payload: Omit<ReconnectTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: `${env.JWT_RECONNECT_EXPIRY_SECONDS}s`
    });
  }

  /**
   * Verifies and decodes a reconnect token. Returns null if invalid or expired.
   */
  public static verifyReconnectToken(token: string): ReconnectTokenPayload | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as ReconnectTokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Hashes an optional 4-digit PIN password for private rooms.
   */
  public static async hashPin(pin: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(pin, salt);
  }

  /**
   * Verifies a 4-digit PIN against the stored hash.
   */
  public static async verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  /**
   * Generates a unique 6-character room code in format: "FG-XXXX" (e.g., "FG-8492")
   */
  public static generateRoomCode(): string {
    const characters = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous 0, 1, I, O
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      suffix += characters[randomIndex];
    }
    return `FG-${suffix}`;
  }
}
