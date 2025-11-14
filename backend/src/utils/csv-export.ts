/**
 * CSV Export Utility
 * 
 * Provides functions to convert data to CSV format with proper escaping
 * and formatting for Excel compatibility.
 */

/**
 * Escape CSV field value
 * Handles quotes, commas, and newlines
 */
export function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map(col => escapeCsvField(col.label)).join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns
      .map(col => {
        const value: any = row[col.key];
        
        // Format dates
        if (value instanceof Date) {
          return escapeCsvField(value.toISOString().split('T')[0]);
        }
        
        // Format objects/arrays as JSON
        if (typeof value === 'object' && value !== null) {
          return escapeCsvField(JSON.stringify(value));
        }
        
        return escapeCsvField(value);
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toISOString().split('T')[0];
}

/**
 * Format datetime for CSV export
 */
export function formatDateTimeForCSV(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toISOString().replace('T', ' ').split('.')[0];
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const today = new Date();
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${prefix}_${timestamp}.csv`;
}
