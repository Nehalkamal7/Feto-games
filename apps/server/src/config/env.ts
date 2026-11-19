import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from workspace root or local directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.union([z.string(), z.number()]).transform((val) => Number(val)).default(4000),
  FRONTEND_URL: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://feto_admin:feto_super_secret_pass_2026@localhost:5432/feto_games_db?schema=public'),
  REDIS_URL: z.string().default('redis://:feto_redis_secure_pass_2026@localhost:6379'),
  JWT_SECRET: z.string().min(16).default('feto_games_jwt_reconnection_secret_super_key_32chars!'),
  JWT_RECONNECT_EXPIRY_SECONDS: z.string().transform(Number).default('300'),
  GRACE_PERIOD_SECONDS: z.string().transform(Number).default('45'),
  MAX_PLAYERS_PER_ROOM: z.string().transform(Number).default('15'),
  MIN_PLAYERS_TO_START: z.string().transform(Number).default('2'),
  ROOM_CODE_LENGTH: z.string().transform(Number).default('6'),
  ROOM_IDLE_TIMEOUT_SECONDS: z.string().transform(Number).default('1800'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid server environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
