/**
 * Subdomain Validator Utility
 * Purpose: Validate subdomain format and check against reserved names
 * Requirements: 11.1, 11.2, 11.3, 11.5
 */

// Reserved subdomains that cannot be used by tenants
const RESERVED_SUBDOMAINS = [
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
  'email',
  'support',
  'help',
  'docs',
  'blog',
  'status',
  'cdn',
  'static',
  'assets',
  'files',
  'download',
  'upload',
];

export interface SubdomainValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

/**
 * Validate subdomain format and rules
 * 
 * Rules:
 * - Must be 3-63 characters long
 * - Must contain only lowercase letters, numbers, and hyphens
 * - Cannot start or end with a hyphen
 * - Cannot be a reserved subdomain
 * 
 * @param subdomain - The subdomain to validate
 * @returns Validation result with error details if invalid
 */
export function validateSubdomain(subdomain: string): SubdomainValidationResult {
  // Check if subdomain is provided
  if (!subdomain || subdomain.trim() === '') {
    return {
      valid: false,
      error: 'Subdomain is required',
      code: 'SUBDOMAIN_REQUIRED',
    };
  }

  // Convert to lowercase for validation
  const normalizedSubdomain = subdomain.toLowerCase().trim();

  // Check length (3-63 characters)
  if (normalizedSubdomain.length < 3) {
    return {
      valid: false,
      error: 'Subdomain must be at least 3 characters long',
      code: 'SUBDOMAIN_TOO_SHORT',
    };
  }

  if (normalizedSubdomain.length > 63) {
    return {
      valid: false,
      error: 'Subdomain must be no more than 63 characters long',
      code: 'SUBDOMAIN_TOO_LONG',
    };
  }

  // Check format: lowercase, alphanumeric, hyphens only
  const validFormatRegex = /^[a-z0-9-]+$/;
  if (!validFormatRegex.test(normalizedSubdomain)) {
    return {
      valid: false,
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
      code: 'SUBDOMAIN_INVALID_FORMAT',
    };
  }

  // Check that it doesn't start with a hyphen
  if (normalizedSubdomain.startsWith('-')) {
    return {
      valid: false,
      error: 'Subdomain cannot start with a hyphen',
      code: 'SUBDOMAIN_STARTS_WITH_HYPHEN',
    };
  }

  // Check that it doesn't end with a hyphen
  if (normalizedSubdomain.endsWith('-')) {
    return {
      valid: false,
      error: 'Subdomain cannot end with a hyphen',
      code: 'SUBDOMAIN_ENDS_WITH_HYPHEN',
    };
  }

  // Check against reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(normalizedSubdomain)) {
    return {
      valid: false,
      error: `Subdomain '${normalizedSubdomain}' is reserved and cannot be used`,
      code: 'SUBDOMAIN_RESERVED',
    };
  }

  // Check for consecutive hyphens (optional, but good practice)
  if (normalizedSubdomain.includes('--')) {
    return {
      valid: false,
      error: 'Subdomain cannot contain consecutive hyphens',
      code: 'SUBDOMAIN_CONSECUTIVE_HYPHENS',
    };
  }

  // All validations passed
  return {
    valid: true,
  };
}

/**
 * Normalize subdomain to lowercase and trim whitespace
 * 
 * @param subdomain - The subdomain to normalize
 * @returns Normalized subdomain
 */
export function normalizeSubdomain(subdomain: string): string {
  return subdomain.toLowerCase().trim();
}

/**
 * Check if a subdomain is reserved
 * 
 * @param subdomain - The subdomain to check
 * @returns True if reserved, false otherwise
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase().trim());
}

/**
 * Get list of reserved subdomains
 * 
 * @returns Array of reserved subdomain names
 */
export function getReservedSubdomains(): string[] {
  return [...RESERVED_SUBDOMAINS];
}

/**
 * Suggest alternative subdomains based on common typos
 * 
 * @param subdomain - The invalid subdomain
 * @returns Array of suggested alternatives
 */
export function suggestAlternatives(subdomain: string): string[] {
  const suggestions: string[] = [];
  const normalized = normalizeSubdomain(subdomain);

  // Remove leading/trailing hyphens
  if (normalized.startsWith('-') || normalized.endsWith('-')) {
    suggestions.push(normalized.replace(/^-+|-+$/g, ''));
  }

  // Replace consecutive hyphens with single hyphen
  if (normalized.includes('--')) {
    suggestions.push(normalized.replace(/-+/g, '-'));
  }

  // If it's a reserved subdomain, suggest with suffix
  if (isReservedSubdomain(normalized)) {
    suggestions.push(`${normalized}-hospital`);
    suggestions.push(`${normalized}-health`);
    suggestions.push(`my-${normalized}`);
  }

  // Remove duplicates
  return [...new Set(suggestions)].filter(s => s.length >= 3 && s.length <= 63);
}
