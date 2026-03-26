/**
 * Common Utilities
 * Shared utility functions across modules
 */

/**
 * Pad a number with leading zeros
 */
export function padZero(num: number, length: number = 2): string {
  return String(num).padStart(length, '0');
}

/**
 * Format a date to ISO string
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString();
}

/**
 * Parse string date to Date object
 */
export function parseStringToDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return date;
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Handle Prisma error and map to appropriate HTTP exception
 */
export function mapPrismaErrorToHttpException(
  error: any,
): { statusCode: number; message: string } {
  if (error.code === 'P2025') {
    return {
      statusCode: 404,
      message: 'Resource not found',
    };
  }
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return {
      statusCode: 409,
      message: `Resource with this ${field} already exists`,
    };
  }
  if (error.code === 'P2003') {
    return {
      statusCode: 400,
      message: 'Invalid reference to related resource',
    };
  }
  return {
    statusCode: 500,
    message: 'Database operation failed',
  };
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        result[key] = deepMerge(
          (result[key] as Record<string, any>) || {},
          sourceValue as Record<string, any>,
        ) as T[Extract<keyof T, string>];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  return result;
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flatten nested array
 */
export function flattenArray<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((acc, val) => {
    return acc.concat(Array.isArray(val) ? flattenArray(val) : val);
  }, []);
}

/**
 * Remove duplicates from array
 */
export function getUniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}
