import { GameRegistry } from './engine/GameRegistry.js';
import { ImposterGameEngine } from './imposter/ImposterGameEngine.js';
import { DrawAndGuessEngine } from './draw/DrawAndGuessEngine.js';
import { QuizBattleEngine } from './quiz/QuizBattleEngine.js';

export const imposterEngine = new ImposterGameEngine();
export const drawAndGuessEngine = new DrawAndGuessEngine();
export const quizBattleEngine = new QuizBattleEngine();

// Register all modular engines with the registry
GameRegistry.register(imposterEngine);
GameRegistry.register(drawAndGuessEngine);
GameRegistry.register(quizBattleEngine);

export { GameRegistry };
export * from './engine/IPartyGameEngine.js';
