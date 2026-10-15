import type { RequestHandler } from 'express';

// Single-process limit. Each address can attempt ten logins per fifteen minutes.
export function adminLoginLimit(): RequestHandler {
  const attempts = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
    const key = req.ip ?? 'unknown';
    let entry = attempts.get(key);
    if (!entry) {
      if (attempts.size >= 10000) return void res.status(429).json({ error: 'Demasiados intentos. Intenta más tarde.' });
      entry = { count: 0, expires: now + 15 * 60 * 1000 }; attempts.set(key, entry);
    }
    if (++entry.count > 10) {
      res.setHeader('Retry-After', String(Math.ceil((entry.expires - now) / 1000)));
      return void res.status(429).json({ error: 'Demasiados intentos. Intenta más tarde.' });
    }
    next();
  };
}
