/**
 * Generate a random ID
 * @param length Length of the ID (default: 12)
 * @returns Random ID string
 */
export function generateId(length: number = 12): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Format a timestamp to a human-readable string
 * @param timestamp Timestamp in milliseconds
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatTimestamp(
  timestamp: number,
  options: {
    format?: 'relative' | 'full' | 'date' | 'time';
    locale?: string;
  } = {}
): string {
  const { format = 'relative', locale = 'en-US' } = options;
  const date = new Date(timestamp);
  const now = new Date();
  
  // For relative time (like "2 hours ago")
  if (format === 'relative') {
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }
  
  // For full date and time
  if (format === 'full') {
    return date.toLocaleString(locale);
  }
  
  // For date only
  if (format === 'date') {
    return date.toLocaleDateString(locale);
  }
  
  // For time only
  if (format === 'time') {
    return date.toLocaleTimeString(locale);
  }
  
  // Default to full format
  return date.toLocaleString(locale);
}

/**
 * Format a number as currency
 * @param amount Amount to format
 * @param currency Currency code (default: 'USD')
 * @param locale Locale (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a large number with abbreviations (K, M, B, T)
 * @param num Number to format
 * @param decimals Decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatLargeNumber(num: number, decimals: number = 2): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  if (Math.abs(num) < 1000) {
    return num.toFixed(decimals).replace(/\.00$/, '');
  }
  
  const abbreviations = ['', 'K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
  
  if (tier >= abbreviations.length) {
    return num.toExponential(decimals);
  }
  
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  
  return scaled.toFixed(decimals).replace(/\.00$/, '') + abbreviations[tier];
}

/**
 * Truncate a string to a specified length
 * @param str String to truncate
 * @param maxLength Maximum length (default: 20)
 * @param suffix Suffix to add (default: '...')
 * @returns Truncated string
 */
export function truncateString(
  str: string,
  maxLength: number = 20,
  suffix: string = '...'
): string {
  if (!str) return '';
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength) + suffix;
}

/**
 * Format an address for display (like a wallet address)
 * @param address Address to format
 * @param prefixLength Prefix length (default: 6)
 * @param suffixLength Suffix length (default: 4)
 * @returns Formatted address
 */
export function formatAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!address) return '';
  
  if (address.length <= prefixLength + suffixLength) {
    return address;
  }
  
  const prefix = address.substring(0, prefixLength);
  const suffix = address.substring(address.length - suffixLength);
  
  return `${prefix}...${suffix}`;
}