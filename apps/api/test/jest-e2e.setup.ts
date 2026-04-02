import 'dotenv/config';

/**
 * Ensure auth env vars exist for e2e (CI / fresh clones).
 */
process.env.JWT_SECRET ??=
  'test-jwt-access-secret-minimum-32-characters-long!!';
process.env.JWT_REFRESH_SECRET ??=
  'test-jwt-refresh-secret-minimum-32-characters-long!!';
