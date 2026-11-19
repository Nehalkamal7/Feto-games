// Pinned & Creative Nicknames System for FETO GAMES

export const PINNED_NICKNAMES = [
  'FetoFox',
  'Zukoboko',
  'Hy00x',
  'Rodii'
] as const;

export type PinnedNickname = (typeof PINNED_NICKNAMES)[number];

export const CREATIVE_NICKNAMES_POOL: readonly string[] = [
  'TurboRider',
  'CyberPhantom',
  'PixelVibe',
  'BlazeAce',
  'GlitchNova',
  'AstroDrift',
  'VortexStrike',
  'ShadowByte',
  'HyperChaos',
  'SonicPulse',
  'NeonKnight',
  'QuantumFox',
  'EchoTitan',
  'ZeroGravity',
  'PartyMenace',
  'CosmicJoker',
  'LaserFang',
  'NeonSamurai',
  'VoltSurge',
  'RogueSpecter',
  'AlphaOmega',
  'PixelPirate',
  'SipMaster',
  'ChaiChaser',
  'CouchChamp',
  'SneakyNinja',
  'ApexPredator',
  'ChillVibes',
  'ChaosRebel',
  'RetroFalcon',
  'BuzzerBeater',
  'AtomicBlitz',
  'ThunderGamer',
  'PranksterPro',
  'LuckyStrike',
  'MegaPixel',
  'SilentStorm',
  'FrostBite',
  'MysticRune',
  'SolarFlare',
  'NightCrawler',
  'OrbitClash',
  'ArcadeWizard',
  'DangerZone',
  'CaptainClutch',
  'VibeCheck',
  'WiredGhost',
  'TacoBandit',
  'SpeedDemon',
  'MatrixMage',
  'WildCard',
  'TurboTurtle',
  'NeonNomad',
  'CyberWolf',
  'LavaLord'
];

/**
 * Returns `count` unique random nicknames from the creative pool,
 * guaranteeing no overlap with pinned nicknames or optionally `excludeNames`.
 */
export function rollDynamicNicknames(excludeNames: string[] = [], count = 4): string[] {
  const pinnedSet = new Set<string>(PINNED_NICKNAMES.map((n) => n.toLowerCase()));
  const excludeSet = new Set<string>(excludeNames.map((n) => n.toLowerCase()));

  // Filter pool
  const candidates = CREATIVE_NICKNAMES_POOL.filter(
    (name) => !pinnedSet.has(name.toLowerCase()) && !excludeSet.has(name.toLowerCase())
  );

  // If pool runs low due to excludes, fallback to entire pool excluding pinned
  const poolToUse = candidates.length >= count
    ? candidates
    : CREATIVE_NICKNAMES_POOL.filter((name) => !pinnedSet.has(name.toLowerCase()));

  // Fisher-Yates shuffle copy
  const shuffled = [...poolToUse];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
