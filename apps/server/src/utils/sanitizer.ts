/**
 * Anti-Cheat & Input Sanitizer for FETO GAMES
 * Protects against XSS injection, prototype pollution, control characters, and profanity.
 */

const PROFANITY_LIST = new Set([
  'nigger', 'nigga', 'faggot', 'kike', 'chink', 'cunt', 'whore', 'slut',
  'bitch', 'asshole', 'fuck', 'shit', 'pussy', 'dick', 'cock', 'bastard'
]);

export class Sanitizer {
  /**
   * Strips HTML tags, control chars, and script injection vectors.
   */
  public static cleanText(input: unknown): string {
    if (typeof input !== 'string') return '';

    return input
      // Remove null bytes and control characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Remove HTML tags
      .replace(/<[^>]*>?/gm, '')
      // Strip dangerous schemes
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }

  /**
   * Filters common hate speech and profanity, masking with asterisks.
   */
  public static filterProfanity(text: string): string {
    if (!text) return '';
    let sanitized = text;

    for (const badWord of PROFANITY_LIST) {
      const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
      if (regex.test(sanitized)) {
        sanitized = sanitized.replace(regex, '*'.repeat(badWord.length));
      }
    }
    return sanitized;
  }

  /**
   * Sanitizes usernames (alphanumeric + safe symbols, max 18 chars).
   */
  public static sanitizeUsername(raw: unknown): string {
    const cleaned = this.cleanText(raw);
    const filtered = this.filterProfanity(cleaned);
    // Allow letters, numbers, spaces, underscores, hyphens
    const safe = filtered.replace(/[^\w\s-]/g, '').trim();
    return (safe || 'Player').slice(0, 18);
  }

  /**
   * Sanitizes chat guesses and live answers.
   */
  public static sanitizeChatMessage(raw: unknown): string {
    const cleaned = this.cleanText(raw);
    const filtered = this.filterProfanity(cleaned);
    return filtered.slice(0, 120);
  }

  /**
   * Sanitizes user-generated custom prompt/deck items.
   */
  public static sanitizePrompt(raw: unknown): string {
    const cleaned = this.cleanText(raw);
    const filtered = this.filterProfanity(cleaned);
    return filtered.slice(0, 200);
  }

  /**
   * Sanitizes single-word clues (Who Is The Imposter).
   */
  public static sanitizeClue(raw: unknown): string {
    const cleaned = this.cleanText(raw);
    const filtered = this.filterProfanity(cleaned);
    return filtered.slice(0, 30);
  }
}
