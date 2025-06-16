// User roles
export const USER_ROLES = {
  CLIENT: 'client',
  SUPPLIER: 'supplier',
  SERVICE_PROVIDER: 'service_provider',
};

// Regex patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CNIC: /^\d{5}-\d{7}-\d$/, // 12345-1234567-1
  PHONE: /^\+?\d{10,15}$/, // +923001234567
  USERNAME: /^[a-z0-9_]+$/,
};

// Placeholder texts
export const PLACEHOLDERS = {
  PROFILE_IMAGE: 'https://placehold.co/200x200?text=User',
  BANNER_IMAGE: 'https://placehold.co/1200x400?text=Banner',
};

// App messages
export const MESSAGES = {
  SESSION_EXPIRED: 'Session expired. Please login again.',
  FORM_ERROR: 'Please correct the errors in the form.',
  NETWORK_ERROR: 'Something went wrong. Please check your internet connection.',
};

// Limits
export const LIMITS = {
  MAX_CERTIFICATES: 5,
  MAX_FILE_SIZE_MB: 10,
  MAX_INTRO_LENGTH: 600,
  MIN_INTRO_LENGTH: 100,
};
