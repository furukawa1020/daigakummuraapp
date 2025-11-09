import { config } from '../config/index.js';

/**
 * Startup security checks
 */
export function performSecurityChecks() {
  const warnings = [];
  const errors = [];

  // Check JWT secret
  if (!config.jwtSecret || config.jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
    errors.push('🚨 CRITICAL: JWT_SECRET is not set or using default value! This is a major security risk.');
  }

  if (config.jwtSecret && config.jwtSecret.length < 32) {
    warnings.push('⚠️  WARNING: JWT_SECRET is too short. Use at least 32 characters.');
  }

  // Check production settings
  if (config.nodeEnv === 'production') {
    if (config.corsOrigin === '*') {
      errors.push('🚨 CRITICAL: CORS_ORIGIN must not be "*" in production!');
    }

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost')) {
      warnings.push('⚠️  WARNING: DATABASE_URL appears to be pointing to localhost in production.');
    }
  }

  // Check database URL
  if (!config.databaseUrl || config.databaseUrl.includes('user:password')) {
    errors.push('🚨 CRITICAL: DATABASE_URL is not properly configured!');
  }

  // Display results
  if (errors.length > 0) {
    console.error('\n❌ Security Check Failed:\n');
    errors.forEach(err => console.error(err));
    console.error('\n');
    
    if (config.nodeEnv === 'production') {
      throw new Error('Cannot start server with critical security issues in production');
    }
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Security Warnings:\n');
    warnings.forEach(warn => console.warn(warn));
    console.warn('\n');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Security checks passed\n');
  }
}
