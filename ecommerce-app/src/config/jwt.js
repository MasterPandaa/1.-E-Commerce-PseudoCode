// PSEUDO: JWT configuration helpers
export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
  issuer: process.env.JWT_ISSUER || 'ecommerce-app',
  audience: process.env.JWT_AUDIENCE || 'ecommerce-users',
  accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
};
