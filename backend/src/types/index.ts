/**
 * Shared Types & Interfaces
 * Contains common types used across multiple modules
 */

// Multi-tenancy
export type TenantId = string; // userId

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: 'success' | 'error';
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Date range filter
export interface DateRangeFilter {
  startDate?: Date | string;
  endDate?: Date | string;
}

// Common entity properties
export interface BaseEntity {
  id: number | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOwnedEntity extends BaseEntity {
  userId: string;
}
