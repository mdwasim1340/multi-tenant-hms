/**
 * Subdomain Validation Utility
 * 
 * Client-side validation for subdomain format and availability.
 * Rules match backend validation for consistency.
 * 
 * Requirements: Phase 6, Task 6.2
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Regex pattern for valid subdomain format
 * - Must start and end with alphanumeric character
 * - Can contain hyphens in the middle
 * - Total length: 3-63 characters
 */
export const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

/**
 * Reserved subdomains that cannot be used by tenants
 * These are typically used for system infrastructure
 */
export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'ftp',
  'smtp',
  'pop',
  'imap',
  'webmail',
  'ns',
  'dns',
  'status',
  'monitor',
  'dashboard',
  'portal',
  'help',
  'support',
  'billing',
  'account',
  'login',
  'signup',
  'signin',
  'register',
  'auth',
];

/**
 * Minimum subdomain length
 */
export const MIN_LENGTH = 3;

/**
 * Maximum subdomain length (DNS standard)
 */
export const MAX_LENGTH = 63;

// ============================================================================
// Types
// ============================================================================

/**
 * Result of subdomain validation
 */
export interface SubdomainValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Sanitize subdomain input by removing invalid characters and trimming
 * 
 * @param input - Raw subdomain input from user
 * @returns Sanitized subdomain (lowercase, trimmed)
 * 
 * @example
 * sanitizeSubdomain('  City-Hospital!  ') // Returns: 'city-hospital'
 */
export function sanitizeSubdomain(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if subdomain is in the reserved list
 * 
 * @param subdomain - Subdomain to check
 * @returns True if subdomain is reserved
 * 
 * @example
 * isReservedSubdomain('admin') // Returns: true
 * isReservedSubdomain('cityhospital') // Returns: false
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase());
}

/**
 * Validate subdomain format against all rules
 * 
 * Validation rules:
 * 1. Length must be between 3 and 63 characters
 * 2. Must contain only lowercase letters, numbers, and hyphens
 * 3. Must start and end with alphanumeric character
 * 4. Cannot be a reserved subdomain
 * 5. Cannot be empty
 * 
 * @param subdomain - Subdomain to validate
 * @returns Validation result with error message if invalid
 * 
 * @example
 * validateSubdomainFormat('cityhospital') // Returns: { isValid: true }
 * validateSubdomainFormat('ab') // Returns: { isValid: false, error: '...', code: 'TOO_SHORT' }
 */
export function validateSubdomainFormat(subdomain: string): SubdomainValidationResult {
  // Check if empty
  if (!subdomain || subdomain.trim().length === 0) {
    return {
      isValid: false,
      error: 'Subdomain is required',
      code: 'EMPTY',
    };
  }

  const normalized = subdomain.toLowerCase().trim();

  // Check length - minimum
  if (normalized.length < MIN_LENGTH) {
    return {
      isValid: false,
      error: `Subdomain must be at least ${MIN_LENGTH} characters long`,
      code: 'TOO_SHORT',
    };
  }

  // Check length - maximum
  if (normalized.length > MAX_LENGTH) {
    return {
      isValid: false,
      error: `Subdomain cannot exceed ${MAX_LENGTH} characters`,
      code: 'TOO_LONG',
    };
  }

  // Check format (regex)
  if (!SUBDOMAIN_REGEX.test(normalized)) {
    // Provide specific error message based on pattern
    if (normalized.startsWith('-')) {
      return {
        isValid: false,
        error: 'Subdomain cannot start with a hyphen',
        code: 'INVALID_START',
      };
    }
    
    if (normalized.endsWith('-')) {
      return {
        isValid: false,
        error: 'Subdomain cannot end with a hyphen',
        code: 'INVALID_END',
      };
    }

    return {
      isValid: false,
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
      code: 'INVALID_FORMAT',
    };
  }

  // Check if reserved
  if (isReservedSubdomain(normalized)) {
    return {
      isValid: false,
      error: `The subdomain "${normalized}" is reserved and cannot be used`,
      code: 'RESERVED',
    };
  }

  // All validations passed
  return {
    isValid: true,
  };
}

/**
 * Generate full subdomain URL for preview
 * 
 * @param subdomain - Subdomain to generate URL for
 * @param includeProtocol - Whether to include https:// prefix
 * @returns Full subdomain URL
 * 
 * @example
 * generateSubdomainUrl('cityhospital') // Returns: 'https://cityhospital.yourhospitalsystem.com'
 * generateSubdomainUrl('cityhospital', false) // Returns: 'cityhospital.yourhospitalsystem.com'
 */
export function generateSubdomainUrl(subdomain: string, includeProtocol: boolean = true): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'yourhospitalsystem.com';
  const url = `${subdomain}.${baseDomain}`;
  return includeProtocol ? `https://${url}` : url;
}

/**
 * Suggest alternative subdomains based on input
 * Used when a subdomain is already taken
 * 
 * @param subdomain - Original subdomain that was taken
 * @returns Array of suggested alternatives
 * 
 * @example
 * suggestAlternatives('cityhospital') 
 * // Returns: ['cityhospital1', 'cityhospital2', 'city-hospital', ...]
 */
export function suggestAlternatives(subdomain: string): string[] {
  const suggestions: string[] = [];
  const normalized = subdomain.toLowerCase().trim();

  // Suggestion 1-3: Add numbers
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${normalized}${i}`);
  }

  // Suggestion 4: Add hyphen between words if possible
  if (!normalized.includes('-') && normalized.length > 4) {
    const middle = Math.floor(normalized.length / 2);
    suggestions.push(`${normalized.slice(0, middle)}-${normalized.slice(middle)}`);
  }

  // Suggestion 5: Add 'hq' suffix
  suggestions.push(`${normalized}-hq`);

  // Filter out invalid suggestions
  return suggestions.filter(s => validateSubdomainFormat(s).isValid);
}

/**
 * Auto-generate subdomain suggestion from hospital name
 * Converts hospital name to a valid subdomain format
 * 
 * @param hospitalName - Full hospital name
 * @returns Suggested subdomain
 * 
 * @example
 * generateSubdomainFromName('City General Hospital')
 * // Returns: 'citygeneral'
 */
export function generateSubdomainFromName(hospitalName: string): string {
  return hospitalName
    .toLowerCase()
    .trim()
    .replace(/hospital|medical|center|clinic|healthcare/gi, '') // Remove common words
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces and special chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, MAX_LENGTH); // Ensure max length
}
