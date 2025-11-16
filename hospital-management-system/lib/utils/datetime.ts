/**
 * Team Alpha - DateTime Utility Functions
 * Handles timezone-aware datetime operations for appointments
 */

/**
 * Formats a date string to local date (YYYY-MM-DD)
 * @param dateString ISO date string from backend
 * @returns Local date string in YYYY-MM-DD format
 */
export function formatToLocalDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date string to local time (HH:MM)
 * @param dateString ISO date string from backend
 * @returns Local time string in HH:MM format
 */
export function formatToLocalTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Combines local date and time into ISO string WITHOUT timezone conversion
 * This preserves the user's intended time
 * @param date Local date string (YYYY-MM-DD)
 * @param time Local time string (HH:MM)
 * @returns ISO datetime string that represents the local time
 */
export function combineLocalDateTime(date: string, time: string): string {
  // Create datetime string in local timezone
  const localDateTime = `${date}T${time}:00`;
  
  // Parse as local time and format as ISO string
  // This keeps the time as-is without UTC conversion
  const dateObj = new Date(localDateTime);
  
  // Get timezone offset in minutes
  const timezoneOffset = dateObj.getTimezoneOffset();
  
  // Adjust for timezone to get the actual local time
  const localDate = new Date(dateObj.getTime() - (timezoneOffset * 60000));
  
  // Return ISO string (this will be in UTC but represents our local time)
  return localDate.toISOString();
}

/**
 * Alternative: Store datetime as-is without timezone conversion
 * This is simpler and stores exactly what the user entered
 * @param date Local date string (YYYY-MM-DD)
 * @param time Local time string (HH:MM)
 * @returns Datetime string in format YYYY-MM-DDTHH:MM:SS
 */
export function combineLocalDateTimeSimple(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * Parse backend datetime to local date and time components
 * @param dateString ISO datetime string from backend
 * @returns Object with local date and time strings
 */
export function parseToLocalDateTime(dateString: string): { date: string; time: string } {
  const date = new Date(dateString);
  return {
    date: formatToLocalDate(dateString),
    time: formatToLocalTime(dateString),
  };
}

/**
 * Format datetime for display (e.g., "Nov 16, 2025 at 4:30 PM")
 * @param dateString ISO datetime string
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted datetime string in user's locale
 */
export function formatDateTimeForDisplay(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  };
  return date.toLocaleString(undefined, defaultOptions);
}

/**
 * Format date only for display (e.g., "Nov 16, 2025")
 * @param dateString ISO datetime string
 * @returns Formatted date string in user's locale
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time only for display (e.g., "4:30 PM")
 * @param dateString ISO datetime string
 * @returns Formatted time string in user's locale
 */
export function formatTimeForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
