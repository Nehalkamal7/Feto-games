import { CorsOptions } from 'cors';

/**
 * Returns the list of permitted origins, combining static fallbacks,
 * Vercel domain patterns, and environment variables (FRONTEND_URL, CLIENT_URL).
 */
export const getAllowedOrigins = (): (string | RegExp)[] => {
  const origins: (string | RegExp)[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    /\.vercel\.app$/ // Automatically allow all Vercel branch & production deployments
  ];

  // FRONTEND_URL can be a single domain or comma-separated list
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
  if (frontendUrl) {
    frontendUrl.split(',').forEach((url) => {
      const trimmed = url.trim();
      if (trimmed) {
        origins.push(trimmed);
        origins.push(trimmed.replace(/\/$/, ''));
      }
    });
  }

  return origins;
};

/**
 * Validates whether an incoming HTTP request or Socket.IO handshake origin is permitted.
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  // Allow requests without Origin header (curl, mobile apps, server-to-server health probes)
  if (!origin) return true;

  const allowedList = getAllowedOrigins();
  return allowedList.some((allowed) => {
    if (typeof allowed === 'string') {
      return origin === allowed || origin.replace(/\/$/, '') === allowed.replace(/\/$/, '');
    }
    return allowed.test(origin);
  });
};

/**
 * Express CORS middleware options.
 */
export const expressCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ [CORS] Blocked request from origin: ${origin}`);
      if (process.env.NODE_ENV !== 'production') {
        // Fallback in development
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};
