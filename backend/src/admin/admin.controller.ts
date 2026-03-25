import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  Res,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import {
  CreateManagedUserDto,
  UserListQueryDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  ResetPasswordDto,
  ImpersonateUserDto,
  BusinessListQueryDto,
  UpdateBusinessStatusDto,
  UpdateBusinessDto,
  FilingListQueryDto,
  UpdateFilingStatusDto,
  DocumentListQueryDto,
  UpdateDocumentStatusDto,
  AdminSubscriptionListQueryDto,
  UpdateAdminSubscriptionDto,
  CreateAdminNotificationDto,
  NotificationListQueryDto,
  UserNotificationsQueryDto,
  CreateAdminDto,
} from './dto';
import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  UpdateSystemSettingsDto,
} from './dto';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ===== AUTHENTICATION ROUTES =====

  /**
   * GET /admin/auth/profile
   * Get admin profile
   */
  @Get('auth/profile')
  async getProfile(@Query('email') email: string, @Res() res: Response) {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const result = await this.adminService.getAdminProfile(email);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch profile',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/auth/login
   * Admin login
   */
  @Post('auth/login')
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() body: any, @Res() res: Response) {
    try {
      // In production, verify credentials with a proper auth service
      // This is simplified - actual implementation would use Auth0 or similar

      if (!body.email) {
        throw new BadRequestException('Email is required');
      }

      // Update last login
      await this.adminService.updateAdminLastLogin(body.email);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Admin login successful',
        data: {
          email: body.email,
          token: `admin_token_${Date.now()}`,
        },
      });
    } catch (error: any) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message || 'Login failed',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/auth/logout
   * Admin logout
   */
  @Post('auth/logout')
  async logout(@Res() res: Response) {
    try {
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Admin logout successful',
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Logout failed',
        error: error.message,
      });
    }
  }

  // ===== USER MANAGEMENT ROUTES =====

  /**
   * POST /admin/users
   * Create a managed user record and bootstrap related business/settings records.
   */
  @Post('users')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(
    @Body() createUserDto: CreateManagedUserDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.createManagedUser(createUserDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create user',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/users
   * Get all users with pagination and filtering
   */
  @Get('users')
  async getAllUsers(
    @Query() query: UserListQueryDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.getAllUsers(query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch users',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/users/:id/access-status
   * Get user access status for login gating
   */
  @Get('users/:id/access-status')
  async getUserAccessStatus(@Param('id') userId: string, @Res() res: Response) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.getUserAccessStatus(userId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch user access status',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/users/:id
   * Get single user details
   */
  @Get('users/:id')
  async getUserDetails(@Param('id') userId: string, @Res() res: Response) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.getUserDetails(userId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch user details',
        error: error.message,
      });
    }
  }

  /**
   * PUT /admin/users/:id
   * Update user details
   */
  @Put('users/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.updateUser(userId, updateUserDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update user',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /admin/users/:id
   * Delete user
   */
  @Delete('users/:id')
  async deleteUser(@Param('id') userId: string, @Res() res: Response) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.deleteUser(userId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete user',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/users/:id/status
   * Activate/Deactivate user
   */
  @Patch('users/:id/status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() statusDto: UpdateUserStatusDto,
    @Res() res: Response
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.updateUserStatus(userId, statusDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update user status',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/users/:id/reset-password
   * Send password reset email to user
   */
  @Post('users/:id/reset-password')
  @UsePipes(new ValidationPipe({ transform: true }))
  async resetUserPassword(
    @Param('id') userId: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response
  ) {
    try {
      if (!userId || !resetPasswordDto.email) {
        throw new BadRequestException('User ID and email are required');
      }

      const result = await this.adminService.resetUserPassword(resetPasswordDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to reset password',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/users/:id/impersonate
   * Impersonate a user
   */
  @Post('users/:id/impersonate')
  @UsePipes(new ValidationPipe({ transform: true }))
  async impersonateUser(
    @Param('id') userId: string,
    @Body() impersonateUserDto: ImpersonateUserDto,
    @Res() res: Response
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.impersonateUser(userId, impersonateUserDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to impersonate user',
        error: error.message,
      });
    }
  }

  // ===== DASHBOARD / ANALYTICS ROUTES =====

  /**
   * GET /admin/dashboard/stats
   * Get dashboard statistics (KPIs)
   */
  @Get('dashboard/stats')
  async getDashboardStats(@Res() res: Response) {
    try {
      const result = await this.adminService.getDashboardStats();
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch dashboard stats',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/dashboard/filings-chart
   * Get filing statistics by month
   */
  @Get('dashboard/filings-chart')
  async getFilingStats(@Res() res: Response) {
    try {
      const result = await this.adminService.getFilingStats();
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch filing stats',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/dashboard/users-by-state
   * Get users distribution by state
   */
  @Get('dashboard/users-by-state')
  async getUsersByState(@Res() res: Response) {
    try {
      const result = await this.adminService.getUsersByState();
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch users by state',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/dashboard/active-users
   * Get most active users
   */
  @Get('dashboard/active-users')
  async getMostActiveUsers(@Res() res: Response) {
    try {
      const result = await this.adminService.getMostActiveUsers();
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch active users',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/dashboard/recent-registrations
   * Get recent user registrations
   */
  @Get('dashboard/recent-registrations')
  async getRecentRegistrations(@Res() res: Response) {
    try {
      const result = await this.adminService.getRecentRegistrations();
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch recent registrations',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/dashboard/system-alerts
   * Get system alerts and notification feed for dashboard
   */
  @Get('dashboard/system-alerts')
  async getDashboardSystemAlerts(@Res() res: Response) {
    try {
      const result = await this.adminService.getDashboardSystemAlerts();
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch system alerts',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/analytics/overview
   * Get analytics and reports snapshot for admin analytics page
   */
  @Get('analytics/overview')
  async getAnalyticsOverview(
    @Query('dateRange') dateRange: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.getAnalyticsOverview(dateRange);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch analytics overview',
        error: error.message,
      });
    }
  }

  // ===== GST FILING MONITORING ROUTES =====

  /**
   * GET /admin/filings
   * Get all GST filings with filters
   */
  @Get('filings')
  async getAllFilings(
    @Query() query: FilingListQueryDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.getAllFilings(query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch filings',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/filings/:id
   * Get GST filing details
   */
  @Get('filings/:id')
  async getFilingDetails(@Param('id') filingId: string, @Res() res: Response) {
    try {
      if (!filingId) {
        throw new BadRequestException('Filing ID is required');
      }

      const result = await this.adminService.getFilingDetails(filingId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch filing details',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/filings/:id/status
   * Update GST filing status with transition rules
   */
  @Patch('filings/:id/status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateFilingStatus(
    @Param('id') filingId: string,
    @Body() statusDto: UpdateFilingStatusDto,
    @Res() res: Response
  ) {
    try {
      if (!filingId) {
        throw new BadRequestException('Filing ID is required');
      }

      const result = await this.adminService.updateFilingStatus(filingId, statusDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update filing status',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/filings/:id/retry
   * Retry filing by resetting status to draft
   */
  @Post('filings/:id/retry')
  async retryFiling(@Param('id') filingId: string, @Res() res: Response) {
    try {
      if (!filingId) {
        throw new BadRequestException('Filing ID is required');
      }

      const result = await this.adminService.retryFiling(filingId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retry filing',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/filings/user/:userId
   * Get user's GST filings
   */
  @Get('filings/user/:userId')
  async getUserFilings(
    @Param('userId') userId: string,
    @Res() res: Response
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.getUserFilings(userId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch user filings',
        error: error.message,
      });
    }
  }

  // ===== SUBSCRIPTION MANAGEMENT ROUTES =====

  /**
   * GET /admin/subscriptions
   * Get subscriptions with user-wise trial and plan details
   */
  @Get('subscriptions')
  async getAllSubscriptions(
    @Query() query: AdminSubscriptionListQueryDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.getAllSubscriptions(query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch subscriptions',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/subscriptions/:id
   * Get single subscription with user and trial details
   */
  @Get('subscriptions/:id')
  async getSubscriptionDetails(@Param('id') id: string, @Res() res: Response) {
    try {
      const subscriptionId = parseInt(id, 10);
      if (!subscriptionId) {
        throw new BadRequestException('Valid subscription ID is required');
      }

      const result = await this.adminService.getSubscriptionDetails(subscriptionId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch subscription details',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/subscriptions/:id
   * Update subscription fields from admin module
   */
  @Patch('subscriptions/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdminSubscriptionDto,
    @Res() res: Response
  ) {
    try {
      const subscriptionId = parseInt(id, 10);
      if (!subscriptionId) {
        throw new BadRequestException('Valid subscription ID is required');
      }

      const result = await this.adminService.updateSubscription(subscriptionId, updateDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update subscription',
        error: error.message,
      });
    }
  }

  // ===== DOCUMENT ACCESS ROUTES =====

  /**
   * GET /admin/documents
   * Get all managed documents with filters
   */
  @Get('documents')
  async getAllDocuments(@Query() query: DocumentListQueryDto, @Res() res: Response) {
    try {
      const result = await this.adminService.getAllDocuments(query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch documents',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/documents/:id
   * Get managed document details
   */
  @Get('documents/:id')
  async getDocumentDetails(@Param('id') docId: string, @Res() res: Response) {
    try {
      if (!docId) {
        throw new BadRequestException('Document ID is required');
      }

      const result = await this.adminService.getDocumentDetails(docId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch document details',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/documents/:id/status
   * Update document review status
   */
  @Patch('documents/:id/status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateDocumentStatus(
    @Param('id') docId: string,
    @Body() statusDto: UpdateDocumentStatusDto,
    @Res() res: Response
  ) {
    try {
      if (!docId) {
        throw new BadRequestException('Document ID is required');
      }

      const result = await this.adminService.updateDocumentStatus(docId, statusDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update document status',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/documents/:id/download
   * Log admin download action for document
   */
  @Post('documents/:id/download')
  async logDocumentDownload(@Param('id') docId: string, @Res() res: Response) {
    try {
      if (!docId) {
        throw new BadRequestException('Document ID is required');
      }

      const result = await this.adminService.logDocumentDownload(docId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to log document download',
        error: error.message,
      });
    }
  }

  // ===== AUDIT LOGS ROUTES =====

  // ===== ALERTS & NOTIFICATIONS ROUTES =====

  /**
   * POST /admin/notifications
   * Create and dispatch a notification to target users
   */
  @Post('notifications')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createNotification(
    @Body() createDto: CreateAdminNotificationDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.createNotification(createDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create notification',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/notifications
   * List notifications with stats and pagination
   */
  @Get('notifications')
  async getNotifications(
    @Query() query: NotificationListQueryDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.getNotifications(query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch notifications',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/notifications/user/:userId
   * Fetch user inbox notifications for bell icon and notification center
   */
  @Get('notifications/user/:userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query() query: UserNotificationsQueryDto,
    @Res() res: Response
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.getUserNotifications(userId, query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch user notifications',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/notifications/user/:userId/:notificationId/read
   * Mark one notification as read for a user
   */
  @Patch('notifications/user/:userId/:notificationId/read')
  async markNotificationRead(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
    @Res() res: Response
  ) {
    try {
      if (!userId || !notificationId) {
        throw new BadRequestException('User ID and Notification ID are required');
      }

      const result = await this.adminService.markUserNotificationRead(userId, notificationId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to mark notification read',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/notifications/user/:userId/:notificationId/click
   * Mark one notification as clicked for analytics
   */
  @Patch('notifications/user/:userId/:notificationId/click')
  async markNotificationClicked(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
    @Res() res: Response
  ) {
    try {
      if (!userId || !notificationId) {
        throw new BadRequestException('User ID and Notification ID are required');
      }

      const result = await this.adminService.markUserNotificationClicked(userId, notificationId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to mark notification clicked',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/notifications/user/:userId/read-all
   * Mark all delivered notifications as read for a user
   */
  @Patch('notifications/user/:userId/read-all')
  async markAllNotificationsRead(
    @Param('userId') userId: string,
    @Res() res: Response
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const result = await this.adminService.markAllUserNotificationsRead(userId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to mark notifications read',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/audit-logs
   * Get audit logs with filtering
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query() query: AuditLogQueryDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.getAuditLogs(query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch audit logs',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/audit-logs
   * Create audit log entry
   */
  @Post('audit-logs')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createAuditLog(
    @Body() createAuditLogDto: CreateAuditLogDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.createAuditLog(createAuditLogDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create audit log',
        error: error.message,
      });
    }
  }

  // ===== SYSTEM SETTINGS ROUTES =====

  /**
   * GET /admin/settings
   * Get system settings
   */
  @Get('settings')
  async getSystemSettings(@Res() res: Response) {
    try {
      const result = await this.adminService.getSystemSettings();
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch system settings',
        error: error.message,
      });
    }
  }

  /**
   * PUT /admin/settings
   * Update system settings
   */
  @Put('settings')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSystemSettings(
    @Body() updateDto: UpdateSystemSettingsDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.updateSystemSettings(updateDto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update system settings',
        error: error.message,
      });
    }
  }

  // ===== ADMIN USERS MANAGEMENT ROUTES =====

  /**
   * GET /admin/admins
   * Get all admin users
   */
  @Get('admins')
  async getAllAdmins(@Query() query: any, @Res() res: Response) {
    try {
      const result = await this.adminService.getAllAdmins(query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch admin users',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/admins/:id
   * Get admin user by ID
   */
  @Get('admins/:id')
  async getAdminById(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.adminService.getAdminById(parseInt(id, 10));
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch admin user',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/admins
   * Create a new admin user
   */
  @Post('admins')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createAdminUser(@Body() createAdminDto: CreateAdminDto, @Res() res: Response) {
    try {
      const result = await this.adminService.createAdminUser(createAdminDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to create admin user',
        error: error.message,
      });
    }
  }

  /**
   * PUT /admin/admins/:id
   * Update admin user
   */
  @Put('admins/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateAdminUser(
    @Param('id') id: string,
    @Body() updateData: any,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.updateAdminUser(parseInt(id, 10), updateData);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update admin user',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/admins/:id/status
   * Update admin user status
   */
  @Patch('admins/:id/status')
  async updateAdminStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.updateAdminStatus(parseInt(id, 10), status);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to update admin status',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /admin/admins/:id
   * Delete admin user
   */
  @Delete('admins/:id')
  async deleteAdminUser(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.adminService.deleteAdminUser(parseInt(id, 10));
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to delete admin user',
        error: error.message,
      });
    }
  }

  // ===== BUSINESSES MANAGEMENT ROUTES =====

  /**
   * GET /admin/businesses
   * Get all businesses
   */
  @Get('businesses')
  async getAllBusinesses(
    @Query() query: BusinessListQueryDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.adminService.getAllBusinesses(query);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to fetch businesses',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/businesses/:id
   * Get business details
   */
  @Get('businesses/:id')
  async getBusinessDetails(
    @Param('id') businessId: string,
    @Res() res: Response
  ) {
    try {
      if (!businessId) {
        throw new BadRequestException('Business ID is required');
      }

      const result = await this.adminService.getBusinessDetails(businessId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch business details',
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/businesses/:id/status
   * Update business review status
   */
  @Patch('businesses/:id/status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateBusinessStatus(
    @Param('id') businessId: string,
    @Body() updateStatusDto: UpdateBusinessStatusDto,
    @Res() res: Response
  ) {
    try {
      if (!businessId) {
        throw new BadRequestException('Business ID is required');
      }

      const result = await this.adminService.updateBusinessStatus(
        businessId,
        updateStatusDto
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update business status',
        error: error.message,
      });
    }
  }

  /**
   * PUT /admin/businesses/:id
   * Update business profile details
   */
  @Put('businesses/:id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateBusinessDetails(
    @Param('id') businessId: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @Res() res: Response
  ) {
    try {
      if (!businessId) {
        throw new BadRequestException('Business ID is required');
      }

      const result = await this.adminService.updateBusinessDetails(
        businessId,
        updateBusinessDto
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update business details',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /admin/businesses/:id
   * Archive business from admin active management
   */
  @Delete('businesses/:id')
  async deleteBusiness(@Param('id') businessId: string, @Res() res: Response) {
    try {
      if (!businessId) {
        throw new BadRequestException('Business ID is required');
      }

      const result = await this.adminService.deleteBusiness(businessId);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to archive business',
        error: error.message,
      });
    }
  }
}
