/**
 * Format currency based on currency code
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - ISO 4217 currency code (e.g., 'USD', 'TZS', 'KES', 'UGX')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatCurrency(0, currencyCode);
  }

  // Map currency codes to locale for better formatting
  const localeMap = {
    USD: 'en-US',
    TZS: 'en-TZ', // Tanzanian Shilling
    KES: 'en-KE', // Kenyan Shilling
    UGX: 'en-UG', // Ugandan Shilling
    EUR: 'en-EU',
    GBP: 'en-GB',
  };

  const locale = localeMap[currencyCode] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to simple formatting if Intl.NumberFormat fails
    return `${currencyCode} ${Number(amount).toFixed(2)}`;
  }
}

/**
 * Get currency symbol for a currency code
 * @param {string} currencyCode - ISO 4217 currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode = 'USD') {
  const symbolMap = {
    USD: '$',
    TZS: 'TSh',
    KES: 'KSh',
    UGX: 'USh',
    EUR: '€',
    GBP: '£',
  };

  return symbolMap[currencyCode] || currencyCode;
}

/**
 * Common currencies list for dropdowns
 */
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
];

