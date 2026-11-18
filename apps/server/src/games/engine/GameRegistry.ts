import { GameMode } from '@feto-games/shared-types';
import { IPartyGameEngine } from './IPartyGameEngine.js';

export class GameRegistry {
  private static engines = new Map<GameMode, IPartyGameEngine>();

  public static register(engine: IPartyGameEngine): void {
    this.engines.set(engine.gameMode, engine);
    console.log(`🎮 [GameRegistry] Registered plugin engine: ${engine.name} (${engine.gameMode})`);
  }

  public static get(gameMode: GameMode): IPartyGameEngine | undefined {
    return this.engines.get(gameMode);
  }

  public static getAll(): IPartyGameEngine[] {
    return Array.from(this.engines.values());
  }

  public static has(gameMode: GameMode): boolean {
    return this.engines.has(gameMode);
  }
}
