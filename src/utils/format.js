/**
 * Convert slug or snake-case string to readable title
 */
export const transformSlugToTitle = slug => {
  if (!slug) return 'N/A';
  const withSpaces = slug.replace(/[-_]/g, ' ');
  return withSpaces.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Format number to short compact form (e.g. 1.2K, 3M)
 */
export const formatNumber = number => {
  return number.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    notation: 'compact',
    compactDisplay: 'short',
  });
};

/**
 * Format ISO date to YYYY-MM-DD
 */
export const formatDate = dateString => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Format last seen as "today", "yesterday", or date
 */
export const formatLastSeen = dateString => {
  const date = new Date(dateString);
  const now = new Date();

  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return `today at ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `yesterday at ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

/**
 * Generate discount code: e.g., ABC12XY45678
 */
export const generateDiscountCode = () => {
  const randomLetter = () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const randomNumber = () => Math.floor(Math.random() * 10).toString();

  const segment1 = Array.from({length: 3}, randomLetter).join('');
  const segment2 = Array.from({length: 2}, randomNumber).join('');
  const segment3 = Array.from({length: 2}, randomLetter).join('');
  const segment4 = Array.from({length: 5}, randomNumber).join('');

  return `${segment1}${segment2}${segment3}${segment4}`;
};

/**
 * Build image URL or fallback to placeholder
 */
import {VITE_API_BASE_URL} from '@env';

export const buildImgUrl = (path = '', name = 'Placeholder') => {
  if (!VITE_API_BASE_URL || !path) {
    return `https://placehold.co/600x400/22c55e/FFFFFF/png?text=${name}`;
  }
  return `${VITE_API_BASE_URL}${path}`;
};
