import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/shiramine_village',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpiresIn: '7d',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // WebSocket
  wsEnabled: process.env.WS_ENABLED === 'true',
  
  // Village Location
  village: {
    centerLat: parseFloat(process.env.VILLAGE_CENTER_LAT || '36.17773082095139'),
    centerLng: parseFloat(process.env.VILLAGE_CENTER_LNG || '136.62608115875494'),
    radiusKm: parseFloat(process.env.VILLAGE_RADIUS_KM || '5.0'),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // Auth Rate Limiting (stricter)
  authRateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 10,
  },
};
