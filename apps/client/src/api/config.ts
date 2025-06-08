// API configuration
export const API_CONFIG = {
  // In production, this would be set via environment variables
  // Vite uses VITE_ prefix for environment variables
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  match: '/api/match',
} as const; 