import { ApiError } from './errors.js';

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate string length
 */
export function validateLength(value, field, min, max) {
  if (!value || value.trim().length === 0) {
    throw new ApiError(`${field} is required`, 400, 'VALIDATION_ERROR', field);
  }
  
  if (value.length < min) {
    throw new ApiError(`${field} must be at least ${min} characters`, 400, 'VALIDATION_ERROR', field);
  }
  
  if (value.length > max) {
    throw new ApiError(`${field} must not exceed ${max} characters`, 400, 'VALIDATION_ERROR', field);
  }
  
  return value.trim();
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError('Invalid email format', 400, 'INVALID_EMAIL', 'email');
  }
  return email.toLowerCase().trim();
}

/**
 * Validate username format
 */
export function validateUsername(username) {
  if (username.length < 3 || username.length > 50) {
    throw new ApiError('Username must be 3-50 characters', 400, 'INVALID_USERNAME', 'username');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new ApiError('Username can only contain letters, numbers, and underscores', 400, 'INVALID_USERNAME', 'username');
  }
  
  return username.trim();
}

/**
 * Validate UUID format
 */
export function validateUUID(value, field = 'id') {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ApiError(`Invalid ${field} format`, 400, 'INVALID_FORMAT', field);
  }
  return value;
}

/**
 * Validate coordinates
 */
export function validateCoordinates(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new ApiError('Invalid latitude', 400, 'INVALID_COORDINATES', 'latitude');
  }
  
  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw new ApiError('Invalid longitude', 400, 'INVALID_COORDINATES', 'longitude');
  }
  
  return { latitude, longitude };
}

/**
 * Validate date
 */
export function validateDate(dateString, field = 'date') {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new ApiError(`Invalid ${field} format`, 400, 'INVALID_DATE', field);
  }
  return date;
}

/**
 * Validate enum value
 */
export function validateEnum(value, allowedValues, field = 'value') {
  if (!allowedValues.includes(value)) {
    throw new ApiError(
      `Invalid ${field}. Allowed values: ${allowedValues.join(', ')}`,
      400,
      'INVALID_ENUM',
      field
    );
  }
  return value;
}
