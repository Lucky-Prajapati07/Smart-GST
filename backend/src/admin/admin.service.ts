import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateManagedUserDto,
  UserListQueryDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  ResetPasswordDto,
  ImpersonateUserDto,
  AdminManagedUserStatus,
  AdminManagedUserPlan,
  BusinessListQueryDto,
  UpdateBusinessStatusDto,
  UpdateBusinessDto,
  AdminManagedBusinessStatus,
  FilingListQueryDto,
  UpdateFilingStatusDto,
  AdminFilingStatus,
  DocumentListQueryDto,
  UpdateDocumentStatusDto,
  AdminManagedDocumentStatus,
  CreateAdminNotificationDto,
  NotificationListQueryDto,
  UserNotificationsQueryDto,
  AdminNotificationTargetGroup,
} from './dto';
import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  UpdateSystemSettingsDto,
} from './dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private async hasBusinessManagementColumns() {
    const columns = await this.prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Business'
        AND column_name IN ('managementStatus', 'deletedAt', 'reviewNotes', 'reviewedBy', 'reviewedAt')
    `;

    const columnSet = new Set(columns.map((column) => column.column_name));
    return columnSet.has('managementStatus') && columnSet.has('deletedAt');
  }

  private async ensureManagedUserForUserId(userId: string) {
    const existing = await this.prisma.userManagement.findUnique({
      where: { userId },
    });

    const business = await this.prisma.business.findFirst({
      where: { userId },
      select: {
        userId: true,
        businessName: true,
        signatoryName: true,
        contactEmail: true,
        contactMobile: true,
      },
    });

    const settings = await this.prisma.settings.findUnique({
      where: { userId },
      select: { email: true, phone: true },
    });

    if (existing?.deletedAt) {
      // Deleted user has not signed up again yet: keep blocked.
      if (!business && !settings) {
        return existing;
      }

      // User started signup again (new profile data exists): restore as Pending for admin approval.
      return this.prisma.userManagement.update({
        where: { userId },
        data: {
          fullName: business?.signatoryName || business?.businessName || existing.fullName,
          email: settings?.email || business?.contactEmail || existing.email,
          mobile: settings?.phone || business?.contactMobile || existing.mobile,
          status: AdminManagedUserStatus.Pending as any,
          deletedAt: null,
          deactivatedAt: null,
        },
      });
    }

    if (existing) {
      return existing;
    }

    // If user exists in business/settings but not managed yet, default to Pending until admin approval.
    if (business || settings) {
      return this.prisma.userManagement.create({
        data: {
          userId,
          fullName: business?.signatoryName || business?.businessName || userId,
          email: settings?.email || business?.contactEmail || `${userId}@local.smartgst`,
          mobile: settings?.phone || business?.contactMobile || null,
          status: AdminManagedUserStatus.Pending as any,
          plan: AdminManagedUserPlan.Pro,
          deactivatedAt: null,
        },
      });
    }

    return null;
  }

  private async syncManagedUsersFromBusinesses() {
    const businesses = await this.prisma.business.findMany({
      select: {
        userId: true,
        businessName: true,
        signatoryName: true,
        contactEmail: true,
        contactMobile: true,
        isActive: true,
      },
    });

    for (const business of businesses) {
      const existing = await this.prisma.userManagement.findUnique({
        where: { userId: business.userId },
      });

      if (existing?.deletedAt) {
        continue;
      }

      const settings = await this.prisma.settings.findUnique({
        where: { userId: business.userId },
        select: { email: true, phone: true },
      });

      const email = settings?.email || business.contactEmail || `${business.userId}@local.smartgst`;
      const mobile = settings?.phone || business.contactMobile || null;

      if (!existing) {
        await this.prisma.userManagement.create({
          data: {
            userId: business.userId,
            fullName: business.signatoryName || business.businessName,
            email,
            mobile,
            // New signups are kept pending until admin explicitly approves/rejects from User Management.
            status: AdminManagedUserStatus.Pending as any,
            plan: AdminManagedUserPlan.Pro,
            deactivatedAt: null,
          },
        });
        continue;
      }

      await this.prisma.userManagement.update({
        where: { userId: business.userId },
        data: {
          fullName: existing.fullName || business.signatoryName || business.businessName,
          email,
          mobile,
          // Keep status under admin control only; sync updates profile fields only.
          status: existing.status,
          deactivatedAt: existing.deactivatedAt,
        },
      });
    }
  }

  // ===== AUTHENTICATION =====

  /**
   * Get admin profile
   */
  async getAdminProfile(adminEmail: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return {
      success: true,
      message: 'Admin profile fetched successfully',
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        lastLogin: admin.lastLogin,
      },
    };
  }

  /**
   * Update admin last login timestamp
   */
  async updateAdminLastLogin(adminEmail: string) {
    await this.prisma.admin.update({
      where: { email: adminEmail },
      data: { lastLogin: new Date() },
    });

    return {
      success: true,
      message: 'Last login updated',
    };
  }

  // ===== USER MANAGEMENT =====

  /**
   * Create a managed user record for admin operations.
   */
  async createManagedUser(createUserDto: CreateManagedUserDto) {
    const resolvedUserId =
      createUserDto.userId?.trim() ||
      `usr_${createUserDto.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}_${Date.now().toString().slice(-6)}`;

    const existing = await this.prisma.userManagement.findUnique({
      where: { userId: resolvedUserId },
    });

    if (existing && !existing.deletedAt) {
      throw new BadRequestException('Managed user already exists for this userId');
    }

    const managedUser = existing
      ? await this.prisma.userManagement.update({
          where: { userId: resolvedUserId },
          data: {
            fullName: createUserDto.name,
            email: createUserDto.email,
            mobile: createUserDto.mobile,
            status: (createUserDto.status ?? AdminManagedUserStatus.Pending) as any,
            plan: createUserDto.plan ?? AdminManagedUserPlan.Basic,
            deletedAt: null,
            deactivatedAt:
              (createUserDto.status ?? AdminManagedUserStatus.Pending) === AdminManagedUserStatus.Inactive
                ? new Date()
                : null,
          },
        })
      : await this.prisma.userManagement.create({
          data: {
            userId: resolvedUserId,
            fullName: createUserDto.name,
            email: createUserDto.email,
            mobile: createUserDto.mobile,
            status: (createUserDto.status ?? AdminManagedUserStatus.Pending) as any,
            plan: createUserDto.plan ?? AdminManagedUserPlan.Basic,
            deactivatedAt:
              (createUserDto.status ?? AdminManagedUserStatus.Pending) === AdminManagedUserStatus.Inactive
                ? new Date()
                : null,
          },
        });

    await this.prisma.settings.upsert({
      where: { userId: resolvedUserId },
      create: {
        userId: resolvedUserId,
        companyName: createUserDto.businessName,
        gstin: createUserDto.gstin,
        phone: createUserDto.mobile,
        email: createUserDto.email,
      },
      update: {
        companyName: createUserDto.businessName,
        gstin: createUserDto.gstin,
        phone: createUserDto.mobile,
        email: createUserDto.email,
      },
    });

    await this.createAuditLog({
      adminId: 'admin',
      action: 'CREATE',
      targetType: 'User',
      targetId: resolvedUserId,
      targetEmail: createUserDto.email,
      description: `Created managed user ${resolvedUserId}`,
      changes: { ...createUserDto, userId: resolvedUserId },
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Managed user created successfully',
      data: managedUser,
    };
  }

  async getUserAccessStatus(userId: string) {
    const managedUser = (await this.ensureManagedUserForUserId(userId)) ||
      (await this.prisma.userManagement.findUnique({ where: { userId } }));

    if (!managedUser) {
      return {
        success: true,
        message: 'User access status fetched successfully',
        data: {
          userId,
          status: AdminManagedUserStatus.Pending,
          accessAllowed: false,
          reason: 'User is not approved by admin yet',
        },
      };
    }

    if (managedUser.deletedAt) {
      return {
        success: true,
        message: 'User access status fetched successfully',
        data: {
          userId,
          status: 'Deleted',
          accessAllowed: false,
          reason: 'User account was deleted by admin. Please signup again.',
        },
      };
    }

    const accessAllowed = managedUser.status === AdminManagedUserStatus.Active;

    return {
      success: true,
      message: 'User access status fetched successfully',
      data: {
        userId,
        status: managedUser.status,
        accessAllowed,
        reason: accessAllowed ? null : 'User is not approved by admin yet',
      },
    };
  }

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(query: UserListQueryDto) {
    await this.syncManagedUsersFromBusinesses();

    const {
      search = '',
      status,
      plan,
      page = '1',
      limit = '10',
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (plan) {
      where.plan = plan;
    }

    if (search) {
      where.OR = [
        { userId: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    const managedUsers = await this.prisma.userManagement.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.userManagement.count({ where });

    const users = await Promise.all(
      managedUsers.map(async (managedUser) => {
        const business = await this.prisma.business.findFirst({
          where: { userId: managedUser.userId },
          select: {
            businessName: true,
            gstin: true,
            createdAt: true,
            isActive: true,
          },
        });

        const settings = await this.prisma.settings.findUnique({
          where: { userId: managedUser.userId },
          select: {
            email: true,
            phone: true,
            companyName: true,
            gstin: true,
          },
        });

        const invoiceCount = await this.prisma.invoices.count({
          where: { userId: managedUser.userId },
        });

        const filingCount = await this.prisma.gSTFiling.count({
          where: { userId: managedUser.userId },
        });

        return {
          id: managedUser.userId,
          name: managedUser.fullName,
          email: settings?.email || managedUser.email,
          business: business?.businessName || settings?.companyName || 'N/A',
          gstin: business?.gstin || settings?.gstin || 'N/A',
          mobile: settings?.phone || managedUser.mobile || 'N/A',
          signupDate: business?.createdAt || managedUser.createdAt,
          lastLogin: managedUser.lastLoginAt,
          status: managedUser.status,
          plan: managedUser.plan,
          filings: filingCount,
          invoices: invoiceCount,
          isActiveBusiness: business?.isActive ?? null,
        };
      })
    );

    const [activeUsers, inactiveUsers, pendingUsers] = await Promise.all([
      this.prisma.userManagement.count({ where: { deletedAt: null, status: AdminManagedUserStatus.Active } }),
      this.prisma.userManagement.count({ where: { deletedAt: null, status: AdminManagedUserStatus.Inactive } }),
      this.prisma.userManagement.count({ where: { deletedAt: null, status: AdminManagedUserStatus.Pending } }),
    ]);

    return {
      success: true,
      message: 'Users fetched successfully',
      data: {
        users,
        summary: {
          totalUsers: total,
          activeUsers,
          inactiveUsers,
          pendingUsers,
        },
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  /**
   * Get single user details by userId
   */
  async getUserDetails(userId: string) {
    await this.syncManagedUsersFromBusinesses();

    const managedUser = await this.prisma.userManagement.findUnique({
      where: { userId },
    });

    if (!managedUser || managedUser.deletedAt) {
      throw new NotFoundException('Managed user not found');
    }

    const business = await this.prisma.business.findFirst({
      where: { userId },
      select: {
        businessName: true,
        gstin: true,
        pan: true,
        state: true,
        city: true,
        contactMobile: true,
      },
    });

    const invoiceCount = await this.prisma.invoices.count({
      where: { userId },
    });

    const filingCount = await this.prisma.gSTFiling.count({
      where: { userId },
    });

    const clientCount = await this.prisma.clients.count({
      where: { userId },
    });

    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });

    const invoices = await this.prisma.invoices.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        party: true,
        amount: true,
        status: true,
      },
    });

    const filings = await this.prisma.gSTFiling.findMany({
      where: { userId },
      orderBy: { dueDate: 'desc' },
      take: 5,
      select: {
        id: true,
        filingPeriod: true,
        filingType: true,
        status: true,
        dueDate: true,
      },
    });

    return {
      success: true,
      message: 'User details fetched successfully',
      data: {
        userId,
        name: managedUser.fullName,
        email: settings?.email || managedUser.email || 'N/A',
        business: business?.businessName || settings?.companyName || 'N/A',
        gstin: business?.gstin || settings?.gstin || 'N/A',
        pan: business?.pan || null,
        state: business?.state || null,
        city: business?.city || null,
        phone: settings?.phone || managedUser.mobile || business?.contactMobile || null,
        invoiceCount,
        filingCount,
        clientCount,
        recentInvoices: invoices,
        recentFilings: filings,
        createdAt: managedUser.createdAt,
        lastLoginAt: managedUser.lastLoginAt,
        status: managedUser.status,
        planStatus: managedUser.plan,
      },
    };
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const managedUser = await this.prisma.userManagement.findUnique({ where: { userId } });

    if (!managedUser || managedUser.deletedAt) {
      throw new NotFoundException('Managed user not found');
    }

    const updated = await this.prisma.userManagement.update({
      where: { userId },
      data: {
        fullName: updateUserDto.name,
        email: updateUserDto.email,
        mobile: updateUserDto.mobile,
        plan: updateUserDto.plan,
        status: updateUserDto.status as any,
        deactivatedAt:
          updateUserDto.status === AdminManagedUserStatus.Inactive
            ? new Date()
            : updateUserDto.status
              ? null
              : managedUser.deactivatedAt,
      },
    });

    if (updateUserDto.business || updateUserDto.gstin) {
      const business = await this.prisma.business.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (business) {
        await this.prisma.business.update({
          where: { id: business.id },
          data: {
            businessName: updateUserDto.business,
            gstin: updateUserDto.gstin,
          },
        });
      }
    }

    if (updateUserDto.email || updateUserDto.mobile || updateUserDto.business || updateUserDto.gstin) {
      await this.prisma.settings.upsert({
        where: { userId },
        create: {
          userId,
          email: updateUserDto.email,
          phone: updateUserDto.mobile,
          companyName: updateUserDto.business,
          gstin: updateUserDto.gstin,
        },
        update: {
          email: updateUserDto.email,
          phone: updateUserDto.mobile,
          companyName: updateUserDto.business,
          gstin: updateUserDto.gstin,
        },
      });
    }

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: 'UPDATE',
      targetType: 'User',
      targetId: userId,
      description: `Updated user ${userId}`,
      changes: updateUserDto,
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'User updated successfully',
      data: updated,
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    const managedUser = await this.prisma.userManagement.findUnique({ where: { userId } });
    if (!managedUser || managedUser.deletedAt) {
      throw new NotFoundException('Managed user not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Permanently remove user domain data from backend.
      await tx.dashboardStats.deleteMany({ where: { userId } });
      await tx.report.deleteMany({ where: { userId } });
      await tx.gSTPayment.deleteMany({ where: { userId } });
      await tx.gSTFiling.deleteMany({ where: { userId } });
      await tx.transactions.deleteMany({ where: { userId } });
      await tx.expenses.deleteMany({ where: { userId } });
      await tx.invoices.deleteMany({ where: { userId } });
      await tx.clients.deleteMany({ where: { userId } });
      await tx.business.deleteMany({ where: { userId } });
      await tx.settings.deleteMany({ where: { userId } });

      // Keep only minimal marker in user-management row to enforce signup-again behavior.
      await tx.userManagement.update({
        where: { userId },
        data: {
          fullName: managedUser.fullName,
          email: managedUser.email,
          mobile: null,
          status: AdminManagedUserStatus.Inactive as any,
          deletedAt: new Date(),
          deactivatedAt: new Date(),
        },
      });
    });

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: 'DELETE',
      targetType: 'User',
      targetId: userId,
      description: `Deleted user ${userId}`,
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  /**
   * Activate/Deactivate user
   */
  async updateUserStatus(userId: string, statusDto: UpdateUserStatusDto) {
    const managedUser = await this.prisma.userManagement.findUnique({ where: { userId } });
    if (!managedUser || managedUser.deletedAt) {
      throw new NotFoundException('Managed user not found');
    }

    const isActive = statusDto.status === AdminManagedUserStatus.Active;

    await this.prisma.userManagement.update({
      where: { userId },
      data: {
        status: statusDto.status as any,
        deactivatedAt: isActive ? null : new Date(),
      },
    });

    await this.prisma.business.updateMany({
      where: { userId },
      data: { isActive },
    });

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      targetType: 'User',
      targetId: userId,
      description: `${isActive ? 'Activated' : 'Deactivated'} user ${userId}`,
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: `User ${statusDto.status} successfully`,
      data: { userId, status: statusDto.status },
    };
  }

  /**
   * Reset user password
   */
  async resetUserPassword(resetPasswordDto: ResetPasswordDto) {
    const managedUser = await this.prisma.userManagement.findFirst({
      where: {
        email: { equals: resetPasswordDto.email, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (!managedUser) {
      throw new NotFoundException('Managed user not found for this email');
    }

    // In real implementation, this would trigger email with password reset link via Auth0
    // Here we just log the action

    await this.createAuditLog({
      adminId: 'admin',
      action: 'RESET_PASSWORD',
      targetType: 'User',
      targetId: managedUser.userId,
      targetEmail: resetPasswordDto.email,
      description: `Password reset requested for ${resetPasswordDto.email}`,
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Password reset email sent successfully',
      data: { email: resetPasswordDto.email },
    };
  }

  /**
   * Impersonate user
   */
  async impersonateUser(userId: string, impersonateUserDto: ImpersonateUserDto) {
    const managedUser = await this.prisma.userManagement.findUnique({
      where: { userId },
    });

    if (!managedUser || managedUser.deletedAt) {
      throw new NotFoundException('Managed user not found');
    }

    if (managedUser.status === AdminManagedUserStatus.Inactive) {
      throw new BadRequestException('Cannot impersonate inactive user');
    }

    const business = await this.prisma.business.findFirst({
      where: { userId },
      select: { businessName: true },
    });

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: 'IMPERSONATE',
      targetType: 'User',
      targetId: userId,
      description: `Admin impersonated user ${userId}`,
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Impersonation session started',
      data: {
        userId,
        businessName: business?.businessName || 'N/A',
        impersonationToken: `tmp_${userId}_${Date.now()}`, // Placeholder token
      },
    };
  }

  // ===== DASHBOARD / ANALYTICS =====

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    const hasBusinessManagementColumns = await this.hasBusinessManagementColumns();

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      inactiveUsers,
      totalBusinesses,
      activeBusinesses,
      totalFilings,
      pendingFilings,
      totalInvoices,
      invoices,
    ] = await Promise.all([
      this.prisma.userManagement.count({ where: { deletedAt: null } }),
      this.prisma.userManagement.count({
        where: { deletedAt: null, status: AdminManagedUserStatus.Active },
      }),
      this.prisma.userManagement.count({
        where: { deletedAt: null, status: AdminManagedUserStatus.Pending },
      }),
      this.prisma.userManagement.count({
        where: { deletedAt: null, status: AdminManagedUserStatus.Inactive },
      }),
      hasBusinessManagementColumns
        ? this.prisma
            .$queryRaw<Array<{ count: bigint | number }>>`
              SELECT COUNT(*) AS count FROM "Business" WHERE "deletedAt" IS NULL
            `
            .then((rows) => Number(rows[0]?.count || 0))
        : this.prisma.business.count(),
      hasBusinessManagementColumns
        ? this.prisma
            .$queryRaw<Array<{ count: bigint | number }>>`
              SELECT COUNT(*) AS count FROM "Business" WHERE "deletedAt" IS NULL AND "isActive" = true
            `
            .then((rows) => Number(rows[0]?.count || 0))
        : this.prisma.business.count({ where: { isActive: true } }),
      this.prisma.gSTFiling.count(),
      this.prisma.gSTFiling.count({
        where: { status: { in: ['draft', 'validated', 'calculated', 'filed'] } as any },
      }),
      this.prisma.invoices.count(),
      this.prisma.invoices.findMany({
        select: { amount: true, totalAmount: true },
      }),
    ]);

    const revenue = invoices.reduce((sum, inv) => {
      const numericAmount = parseFloat(inv.totalAmount || inv.amount || '0');
      return sum + (Number.isNaN(numericAmount) ? 0 : numericAmount);
    }, 0);

    return {
      success: true,
      message: 'Dashboard stats fetched successfully',
      data: {
        totalUsers,
        activeUsers,
        pendingUsers,
        inactiveUsers,
        totalBusinesses,
        activeBusinesses,
        totalFilings,
        pendingFilings,
        totalInvoices,
        revenue: Math.round(revenue * 100) / 100,
      },
    };
  }

  /**
   * Get filing statistics by month
   */
  async getFilingStats() {
    const filings = await this.prisma.gSTFiling.findMany({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, status: true },
      take: 500,
    });

    // Group by YYYY-MM to avoid mixing years for same month name.
    const statsByMonth: Record<string, { key: string; month: string; success: number; failed: number }> = {};
    filings.forEach((filing) => {
      const date = new Date(filing.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const month = date.toLocaleString('default', { month: 'short' });

      if (!statsByMonth[key]) {
        statsByMonth[key] = { key, month, success: 0, failed: 0 };
      }

      if (filing.status === 'filed' || filing.status === 'submitted') {
        statsByMonth[key].success++;
      } else {
        statsByMonth[key].failed++;
      }
    });

    const data = Object.values(statsByMonth)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
      .map((entry) => ({ month: entry.month, success: entry.success, failed: entry.failed }));

    return {
      success: true,
      message: 'Filing stats fetched successfully',
      data,
    };
  }

  /**
   * Get users distribution by state
   */
  async getUsersByState() {
    const hasBusinessManagementColumns = await this.hasBusinessManagementColumns();

    const rows = hasBusinessManagementColumns
      ? await this.prisma.$queryRaw<Array<{ state: string | null; users: bigint | number }>>`
          SELECT b."state" AS state, COUNT(DISTINCT b."userId") AS users
          FROM "Business" b
          WHERE b."deletedAt" IS NULL
          GROUP BY b."state"
        `
      : await this.prisma.$queryRaw<Array<{ state: string | null; users: bigint | number }>>`
          SELECT b."state" AS state, COUNT(DISTINCT b."userId") AS users
          FROM "Business" b
          GROUP BY b."state"
        `;

    const stateColors = [
      '#0088FE',
      '#00C49F',
      '#FFBB28',
      '#FF8042',
      '#8884D8',
      '#82ca9d',
      '#ffc658',
    ];

    const result = rows
      .map((item) => ({
        state: item.state || 'Unknown',
        users: Number(item.users || 0),
      }))
      .filter((item) => item.users > 0)
      .sort((a, b) => b.users - a.users)
      .slice(0, 5)
      .map((item, index) => ({
        state: item.state,
        users: item.users,
        color: stateColors[index % stateColors.length],
      }));

    return {
      success: true,
      message: 'Users by state fetched successfully',
      data: result,
    };
  }

  /**
   * Get most active users
   */
  async getMostActiveUsers() {
    const managedUsers = await this.prisma.userManagement.findMany({
      where: { deletedAt: null },
      select: { userId: true, fullName: true },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    const fallbackBusinesses = managedUsers.length
      ? []
      : await this.prisma.business.findMany({
          select: { userId: true, signatoryName: true },
          distinct: ['userId'],
          take: 100,
          orderBy: { createdAt: 'desc' },
        });

    const userSeeds = managedUsers.length
      ? managedUsers.map((u) => ({ userId: u.userId, name: u.fullName }))
      : fallbackBusinesses.map((b) => ({ userId: b.userId, name: b.signatoryName }));

    const userActivity = await Promise.all(
      userSeeds.map(async (seed) => {
        const [invoices, filings, business] = await Promise.all([
          this.prisma.invoices.count({ where: { userId: seed.userId } }),
          this.prisma.gSTFiling.count({ where: { userId: seed.userId } }),
          this.prisma.business.findFirst({
            where: { userId: seed.userId },
            select: { businessName: true },
          }),
        ]);

        return {
          id: seed.userId,
          name: seed.name || seed.userId,
          business: business?.businessName || 'N/A',
          filings,
          invoices,
          activity: filings + invoices,
        };
      })
    );

    const sorted = userActivity
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 5)
      .map((user) => ({
        id: user.id,
        name: user.name,
        business: user.business,
        filings: user.filings,
        invoices: user.invoices,
      }));

    return {
      success: true,
      message: 'Most active users fetched successfully',
      data: sorted,
    };
  }

  /**
   * Get recent registrations
   */
  async getRecentRegistrations() {
    const managedUsers = await this.prisma.userManagement.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        userId: true,
        fullName: true,
        email: true,
        mobile: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    const result = await Promise.all(
      managedUsers.map(async (managedUser) => {
        const [settings, business] = await Promise.all([
          this.prisma.settings.findUnique({
            where: { userId: managedUser.userId },
            select: { email: true },
          }),
          this.prisma.business.findFirst({
            where: { userId: managedUser.userId },
            select: { businessName: true, contactEmail: true, contactMobile: true },
          }),
        ]);

        return {
          id: managedUser.userId,
          name: managedUser.fullName,
          email: managedUser.email || settings?.email || business?.contactEmail || 'N/A',
          business: business?.businessName || 'N/A',
          mobile: managedUser.mobile || business?.contactMobile || 'N/A',
          signupDate: managedUser.createdAt,
          lastLogin: managedUser.lastLoginAt,
          status: managedUser.status,
        };
      })
    );

    return {
      success: true,
      message: 'Recent registrations fetched successfully',
      data: result,
    };
  }

  /**
   * Get system alerts for admin dashboard
   */
  async getDashboardSystemAlerts() {
    const now = new Date();

    const [pendingApprovals, overdueFilings, failedNotifications, recentNotifications] = await Promise.all([
      this.prisma.userManagement.count({
        where: { deletedAt: null, status: AdminManagedUserStatus.Pending },
      }),
      this.prisma.gSTFiling.count({
        where: {
          dueDate: { lt: now },
          status: { in: ['draft', 'validated', 'calculated', 'filed'] as any },
        },
      }),
      this.hasNotificationDelegates()
        ? (this.prisma as any).adminNotification.count({ where: { status: 'Failed' } })
        : Promise.resolve(0),
      this.hasNotificationDelegates()
        ? (this.prisma as any).adminNotification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true, title: true, status: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    const alerts: Array<{ id: string; type: 'info' | 'success' | 'warning' | 'error'; title: string; time: string }> = [];

    if (pendingApprovals > 0) {
      alerts.push({
        id: 'pending-approvals',
        type: 'warning',
        title: `${pendingApprovals} user approval${pendingApprovals > 1 ? 's' : ''} pending review`,
        time: now.toISOString(),
      });
    }

    if (overdueFilings > 0) {
      alerts.push({
        id: 'overdue-filings',
        type: 'error',
        title: `${overdueFilings} GST filing${overdueFilings > 1 ? 's are' : ' is'} overdue`,
        time: now.toISOString(),
      });
    }

    if (failedNotifications > 0) {
      alerts.push({
        id: 'failed-notifications',
        type: 'error',
        title: `${failedNotifications} admin notification${failedNotifications > 1 ? 's' : ''} failed to send`,
        time: now.toISOString(),
      });
    }

    recentNotifications.forEach((notification: any) => {
      alerts.push({
        id: `notif-${notification.id}`,
        type:
          notification.status === 'Failed'
            ? 'error'
            : notification.status === 'Sent'
              ? 'success'
              : 'info',
        title: notification.title,
        time: notification.createdAt?.toISOString?.() || now.toISOString(),
      });
    });

    return {
      success: true,
      message: 'Dashboard alerts fetched successfully',
      data: alerts.slice(0, 8),
    };
  }

  private normalizeAnalyticsDateRange(dateRange?: string) {
    const value = String(dateRange || '12months').toLowerCase();
    if (value === '3months') return 3;
    if (value === '6months') return 6;
    return 12;
  }

  private buildMonthKeys(start: Date, monthCount: number) {
    const keys: string[] = [];
    const cursor = new Date(start);

    for (let index = 0; index < monthCount; index += 1) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      keys.push(key);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return keys;
  }

  private toMonthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private toMonthLabel(key: string) {
    const [year, month] = key.split('-').map((part) => parseInt(part, 10));
    return new Date(year, (month || 1) - 1, 1).toLocaleString('default', { month: 'short' });
  }

  private parseMoney(value?: string | null) {
    const amount = parseFloat(String(value || '0'));
    return Number.isNaN(amount) ? 0 : amount;
  }

  private toPercentChange(current: number, previous: number) {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }

  private toTrend(change: number) {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'stable';
  }

  /**
   * Get analytics and report snapshot for admin analytics page
   */
  async getAnalyticsOverview(dateRange?: string) {
    const monthCount = this.normalizeAnalyticsDateRange(dateRange);
    const now = new Date();

    const rangeStart = new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1, 0, 0, 0, 0);
    const prevRangeStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth() - monthCount, 1, 0, 0, 0, 0);
    const prevRangeEnd = new Date(rangeStart.getTime() - 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const [
      usersInRange,
      usersInPrevRange,
      invoicesInRange,
      invoicesInPrevRange,
      filingsInRange,
      filingsInPrevRange,
      activeSubscriptions,
      monthlyFilings,
      pendingApprovals,
    ] = await Promise.all([
      this.prisma.userManagement.findMany({
        where: { deletedAt: null, createdAt: { gte: rangeStart } },
        select: { userId: true, createdAt: true },
      }),
      this.prisma.userManagement.findMany({
        where: { deletedAt: null, createdAt: { gte: prevRangeStart, lte: prevRangeEnd } },
        select: { userId: true, createdAt: true },
      }),
      this.prisma.invoices.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { userId: true, createdAt: true, amount: true, totalAmount: true },
      }),
      this.prisma.invoices.findMany({
        where: { createdAt: { gte: prevRangeStart, lte: prevRangeEnd } },
        select: { amount: true, totalAmount: true },
      }),
      this.prisma.gSTFiling.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { userId: true, createdAt: true, status: true, filingType: true },
      }),
      this.prisma.gSTFiling.findMany({
        where: { createdAt: { gte: prevRangeStart, lte: prevRangeEnd } },
        select: { status: true },
      }),
      this.prisma.userManagement.count({
        where: { deletedAt: null, status: AdminManagedUserStatus.Active },
      }),
      this.prisma.gSTFiling.count({
        where: { createdAt: { gte: currentMonthStart } },
      }),
      this.prisma.userManagement.count({
        where: { deletedAt: null, status: AdminManagedUserStatus.Pending },
      }),
    ]);

    const totalRevenue = invoicesInRange.reduce((sum, invoice) => {
      return sum + this.parseMoney(invoice.totalAmount || invoice.amount);
    }, 0);

    const previousRevenue = invoicesInPrevRange.reduce((sum, invoice) => {
      return sum + this.parseMoney(invoice.totalAmount || invoice.amount);
    }, 0);

    const successfulFilings = filingsInRange.filter(
      (filing) => filing.status === 'filed' || filing.status === 'submitted'
    ).length;
    const successRate = filingsInRange.length > 0
      ? Math.round((successfulFilings / filingsInRange.length) * 100)
      : 0;

    const previousSuccessfulFilings = filingsInPrevRange.filter(
      (filing) => filing.status === 'filed' || filing.status === 'submitted'
    ).length;
    const previousSuccessRate = filingsInPrevRange.length > 0
      ? Math.round((previousSuccessfulFilings / filingsInPrevRange.length) * 100)
      : 0;

    const monthKeys = this.buildMonthKeys(rangeStart, monthCount);

    const signupsByMonth = new Map<string, number>();
    const activeUsersByMonth = new Map<string, Set<string>>();
    const filingsByTypeByMonth = new Map<string, { gstr1: number; gstr3b: number; gstr9: number }>();
    const revenueByMonth = new Map<string, { revenue: number; subscriptions: number }>();

    monthKeys.forEach((key) => {
      signupsByMonth.set(key, 0);
      activeUsersByMonth.set(key, new Set());
      filingsByTypeByMonth.set(key, { gstr1: 0, gstr3b: 0, gstr9: 0 });
      revenueByMonth.set(key, { revenue: 0, subscriptions: 0 });
    });

    usersInRange.forEach((user) => {
      const monthKey = this.toMonthKey(new Date(user.createdAt));
      if (!signupsByMonth.has(monthKey)) {
        return;
      }

      signupsByMonth.set(monthKey, (signupsByMonth.get(monthKey) || 0) + 1);
      const monthRevenue = revenueByMonth.get(monthKey);
      if (monthRevenue) {
        monthRevenue.subscriptions += 1;
      }
    });

    invoicesInRange.forEach((invoice) => {
      const monthKey = this.toMonthKey(new Date(invoice.createdAt));
      const monthRevenue = revenueByMonth.get(monthKey);
      if (monthRevenue) {
        monthRevenue.revenue += this.parseMoney(invoice.totalAmount || invoice.amount);
      }

      const activeUsers = activeUsersByMonth.get(monthKey);
      if (activeUsers) {
        activeUsers.add(invoice.userId);
      }
    });

    filingsInRange.forEach((filing) => {
      const monthKey = this.toMonthKey(new Date(filing.createdAt));
      const activeUsers = activeUsersByMonth.get(monthKey);
      if (activeUsers) {
        activeUsers.add(filing.userId);
      }

      const monthFilings = filingsByTypeByMonth.get(monthKey);
      if (!monthFilings) {
        return;
      }

      if (filing.filingType === 'GSTR1') monthFilings.gstr1 += 1;
      if (filing.filingType === 'GSTR3B') monthFilings.gstr3b += 1;
      if (filing.filingType === 'GSTR9') monthFilings.gstr9 += 1;
    });

    const monthlySignups = monthKeys.map((key) => ({
      month: this.toMonthLabel(key),
      signups: signupsByMonth.get(key) || 0,
      active: activeUsersByMonth.get(key)?.size || 0,
    }));

    const filingTrends = monthKeys.map((key) => {
      const item = filingsByTypeByMonth.get(key) || { gstr1: 0, gstr3b: 0, gstr9: 0 };
      return {
        month: this.toMonthLabel(key),
        gstr1: item.gstr1,
        gstr3b: item.gstr3b,
        gstr9: item.gstr9,
      };
    });

    const revenueData = monthKeys.map((key) => {
      const item = revenueByMonth.get(key) || { revenue: 0, subscriptions: 0 };
      return {
        month: this.toMonthLabel(key),
        revenue: Math.round(item.revenue * 100) / 100,
        subscriptions: item.subscriptions,
      };
    });

    const hasBusinessManagementColumns = await this.hasBusinessManagementColumns();
    const stateRows = hasBusinessManagementColumns
      ? await this.prisma.$queryRaw<Array<{ state: string | null; users: bigint | number }>>`
          SELECT b."state" AS state, COUNT(DISTINCT b."userId") AS users
          FROM "Business" b
          WHERE b."deletedAt" IS NULL AND b."isActive" = true
          GROUP BY b."state"
        `
      : await this.prisma.$queryRaw<Array<{ state: string | null; users: bigint | number }>>`
          SELECT b."state" AS state, COUNT(DISTINCT b."userId") AS users
          FROM "Business" b
          WHERE b."isActive" = true
          GROUP BY b."state"
        `;

    const stateColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];
    const usersByState = stateRows
      .map((row, index) => ({
        state: row.state || 'Unknown',
        users: Number(row.users || 0),
        color: stateColors[index % stateColors.length],
      }))
      .filter((row) => row.users > 0)
      .sort((a, b) => b.users - a.users)
      .slice(0, 7);

    const topPerformingStates = usersByState
      .slice(0, 5)
      .map((state) => ({
        state: state.state,
        users: state.users,
      }));

    const revenueChange = this.toPercentChange(totalRevenue, previousRevenue);
    const successRateChange = successRate - previousSuccessRate;
    const avgRevenuePerActiveUser = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0;

    const kpis = [
      {
        metric: 'Avg Revenue / Active User',
        value: `INR ${Math.round(avgRevenuePerActiveUser).toLocaleString()}`,
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`,
        trend: this.toTrend(revenueChange),
      },
      {
        metric: 'Filing Completion Rate',
        value: `${successRate}%`,
        change: `${successRateChange >= 0 ? '+' : ''}${successRateChange}%`,
        trend: this.toTrend(successRateChange),
      },
      {
        metric: 'Pending Approvals',
        value: String(pendingApprovals),
        change: pendingApprovals > 0 ? 'Action required' : 'Healthy',
        trend: pendingApprovals > 0 ? 'down' : 'up',
      },
      {
        metric: 'Current Active Subscriptions',
        value: activeSubscriptions.toLocaleString(),
        change: `${usersInRange.length.toLocaleString()} new in range`,
        trend: usersInRange.length > usersInPrevRange.length ? 'up' : usersInRange.length < usersInPrevRange.length ? 'down' : 'stable',
      },
    ];

    return {
      success: true,
      message: 'Analytics overview fetched successfully',
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          activeSubscriptions,
          monthlyFilings,
          successRate,
        },
        monthlySignups,
        filingTrends,
        usersByState,
        revenueData,
        topPerformingStates,
        kpis,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  // ===== GST FILING MONITORING =====

  private normalizeFilingStatus(raw?: string | null): AdminFilingStatus | null {
    if (!raw) {
      return null;
    }

    const lowered = raw.toLowerCase().trim();
    if (
      lowered === AdminFilingStatus.draft ||
      lowered === AdminFilingStatus.validated ||
      lowered === AdminFilingStatus.calculated ||
      lowered === AdminFilingStatus.filed ||
      lowered === AdminFilingStatus.submitted
    ) {
      return lowered as AdminFilingStatus;
    }

    return null;
  }

  private canTransitionFilingStatus(current: AdminFilingStatus, next: AdminFilingStatus) {
    if (current === next) {
      return true;
    }

    const allowedMap: Record<AdminFilingStatus, AdminFilingStatus[]> = {
      draft: [AdminFilingStatus.validated],
      validated: [AdminFilingStatus.calculated, AdminFilingStatus.draft],
      calculated: [AdminFilingStatus.filed, AdminFilingStatus.draft],
      filed: [AdminFilingStatus.submitted, AdminFilingStatus.draft],
      submitted: [AdminFilingStatus.draft],
    };

    return allowedMap[current].includes(next);
  }

  private getFilingErrorType(status: AdminFilingStatus, dueDate: Date) {
    if (status === AdminFilingStatus.draft && dueDate < new Date()) {
      return 'Missed deadline';
    }
    if (status === AdminFilingStatus.validated && dueDate < new Date()) {
      return 'Validation pending overdue';
    }
    if (status === AdminFilingStatus.calculated && dueDate < new Date()) {
      return 'Not filed before due date';
    }
    return null;
  }

  /**
   * Get all GST filings with filters
   */
  async getAllFilings(query: FilingListQueryDto = {}) {
    const {
      userId = null,
      search = null,
      status = null,
      filingType = null,
      dateRange = 'all',
      page = '1',
      limit = '10',
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) where.userId = userId;
    const normalizedStatus = this.normalizeFilingStatus(status);
    if (normalizedStatus) where.status = normalizedStatus;
    if (filingType) where.filingType = filingType;

    const now = new Date();
    if (dateRange && dateRange !== 'all') {
      const start = new Date(now);
      if (dateRange === 'today') {
        start.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        start.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        start.setMonth(now.getMonth() - 1);
      }
      where.createdAt = { gte: start };
    }

    const filings = await this.prisma.gSTFiling.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { dueDate: 'desc' },
      select: {
        id: true,
        userId: true,
        filingPeriod: true,
        filingType: true,
        status: true,
        dueDate: true,
        filedDate: true,
        totalSales: true,
        totalPurchases: true,
        taxLiability: true,
        arn: true,
        createdAt: true,
      },
    });

    const userIds = Array.from(new Set(filings.map((filing) => filing.userId)));

    const businesses = userIds.length
      ? await this.prisma.business.findMany({
          where: { userId: { in: userIds } },
          orderBy: { createdAt: 'desc' },
          select: {
            userId: true,
            businessName: true,
            signatoryName: true,
          },
        })
      : [];

    const businessByUserId = new Map<string, { businessName: string; signatoryName: string }>();
    for (const business of businesses) {
      if (!businessByUserId.has(business.userId)) {
        businessByUserId.set(business.userId, {
          businessName: business.businessName,
          signatoryName: business.signatoryName,
        });
      }
    }

    const mappedFilings = filings
      .map((filing) => {
        const business = businessByUserId.get(filing.userId);
        return {
          id: filing.id,
          filingId: `FIL-${String(filing.id).padStart(5, '0')}`,
          userId: filing.userId,
          userName: business?.signatoryName || filing.userId,
          business: business?.businessName || 'N/A',
          filingPeriod: filing.filingPeriod,
          filingType: filing.filingType,
          status: filing.status,
          dueDate: filing.dueDate,
          filedDate: filing.filedDate,
          arnNo: filing.arn,
          amount: Number(filing.taxLiability || 0),
          totalSales: Number(filing.totalSales || 0),
          totalPurchases: Number(filing.totalPurchases || 0),
          createdAt: filing.createdAt,
          errorType: this.getFilingErrorType(filing.status as AdminFilingStatus, filing.dueDate),
        };
      })
      .filter((item) => {
        if (!search) {
          return true;
        }
        const s = String(search).toLowerCase();
        return (
          item.userName.toLowerCase().includes(s) ||
          item.business.toLowerCase().includes(s) ||
          String(item.arnNo || '').toLowerCase().includes(s) ||
          item.filingType.toLowerCase().includes(s) ||
          item.filingPeriod.toLowerCase().includes(s)
        );
      });

    const total = mappedFilings.length;
    const paged = mappedFilings.slice(skip, skip + limitNum);

    const successStatuses = [AdminFilingStatus.filed, AdminFilingStatus.submitted];
    const processingStatuses = [
      AdminFilingStatus.draft,
      AdminFilingStatus.validated,
      AdminFilingStatus.calculated,
    ];

    const successCount = mappedFilings.filter((item) => successStatuses.includes(item.status as AdminFilingStatus)).length;
    const failedCount = mappedFilings.filter((item) => Boolean(item.errorType)).length;
    const processingCount = mappedFilings.filter((item) =>
      processingStatuses.includes(item.status as AdminFilingStatus)
    ).length;

    const errorFrequency = new Map<string, number>();
    mappedFilings.forEach((filing) => {
      if (!filing.errorType) {
        return;
      }
      errorFrequency.set(filing.errorType, (errorFrequency.get(filing.errorType) || 0) + 1);
    });

    const commonErrors = Array.from(errorFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([error, count]) => ({
        error,
        count,
        percentage: total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
      }));

    return {
      success: true,
      message: 'GST Filings fetched successfully',
      data: {
        filings: paged,
        summary: {
          totalFilings: total,
          successRate: total > 0 ? Math.round((successCount / total) * 100) : 0,
          failedFilings: failedCount,
          processingFilings: processingCount,
        },
        commonErrors,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  /**
   * Get GST filing details
   */
  async getFilingDetails(filingId: string) {
    const parsedFilingId = parseInt(filingId, 10);
    if (Number.isNaN(parsedFilingId)) {
      throw new BadRequestException('Invalid filing ID');
    }

    const filing = await this.prisma.gSTFiling.findUnique({
      where: { id: parsedFilingId },
    });

    if (!filing) {
      throw new NotFoundException('GST Filing not found');
    }

    const business = await this.prisma.business.findFirst({
      where: { userId: filing.userId },
      select: {
        businessName: true,
        signatoryName: true,
      },
    });

    const invoices = await this.prisma.invoices.findMany({
      where: { userId: filing.userId },
    });

    const expenses = await this.prisma.expenses.findMany({
      where: { userId: filing.userId },
    });

    return {
      success: true,
      message: 'Filing details fetched successfully',
      data: {
        id: filing.id,
        filingId: `FIL-${String(filing.id).padStart(5, '0')}`,
        userId: filing.userId,
        filingPeriod: filing.filingPeriod,
        filingType: filing.filingType,
        status: filing.status,
        dueDate: filing.dueDate,
        filedDate: filing.filedDate,
        arn: filing.arn,
        totalSales: Number(filing.totalSales || 0),
        totalPurchases: Number(filing.totalPurchases || 0),
        taxLiability: Number(filing.taxLiability || 0),
        taxPaid: Number(filing.taxPaid || 0),
        itcAvailable: Number(filing.itcAvailable || 0),
        igst: Number(filing.igst || 0),
        cgst: Number(filing.cgst || 0),
        sgst: Number(filing.sgst || 0),
        cess: Number(filing.cess || 0),
        createdAt: filing.createdAt,
        updatedAt: filing.updatedAt,
        business: business?.businessName,
        signatory: business?.signatoryName,
        invoiceCount: invoices.length,
        expenseCount: expenses.length,
      },
    };
  }

  async updateFilingStatus(filingId: string, statusDto: UpdateFilingStatusDto) {
    const parsedFilingId = parseInt(filingId, 10);
    if (Number.isNaN(parsedFilingId)) {
      throw new BadRequestException('Invalid filing ID');
    }

    const filing = await this.prisma.gSTFiling.findUnique({
      where: { id: parsedFilingId },
    });

    if (!filing) {
      throw new NotFoundException('GST Filing not found');
    }

    const currentStatus = filing.status as AdminFilingStatus;
    const nextStatus = this.normalizeFilingStatus(statusDto.status);

    if (!nextStatus) {
      throw new BadRequestException('Invalid filing status');
    }

    if (!this.canTransitionFilingStatus(currentStatus, nextStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${nextStatus}`
      );
    }

    const updated = await this.prisma.gSTFiling.update({
      where: { id: parsedFilingId },
      data: {
        status: nextStatus,
        filedDate:
          nextStatus === AdminFilingStatus.filed || nextStatus === AdminFilingStatus.submitted
            ? new Date()
            : nextStatus === AdminFilingStatus.draft
              ? null
              : filing.filedDate,
      },
    });

    await this.createAuditLog({
      adminId: 'admin',
      action: 'UPDATE',
      targetType: 'GSTFiling',
      targetId: String(updated.id),
      description: `Updated filing status from ${currentStatus} to ${nextStatus}`,
      changes: {
        before: currentStatus,
        after: nextStatus,
        notes: statusDto.notes || null,
      },
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Filing status updated successfully',
      data: {
        id: updated.id,
        status: updated.status,
        filedDate: updated.filedDate,
      },
    };
  }

  async retryFiling(filingId: string) {
    return this.updateFilingStatus(filingId, {
      status: AdminFilingStatus.draft,
      notes: 'Retry initiated by admin',
    });
  }

  // ===== DOCUMENT ACCESS MANAGEMENT =====

  private async canUseManagedDocumentStore() {
    const prismaAny = this.prisma as any;
    const hasDelegate = Boolean(prismaAny.managedDocument);

    if (!hasDelegate) {
      return false;
    }

    const tables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'ManagedDocument'
    `;

    return tables.length > 0;
  }

  private getDocumentCategoryByType(documentType: string) {
    if (documentType === 'PAN Card') return 'Identity';
    if (documentType === 'GST Certificate') return 'Registration';
    if (documentType === 'Business License') return 'License';
    if (documentType === 'Expense Receipt') return 'Financial';
    return 'Other';
  }

  private async buildDocumentInventory() {
    const [businesses, expenses] = await Promise.all([
      this.prisma.business.findMany({
        select: {
          id: true,
          userId: true,
          businessName: true,
          signatoryName: true,
          panCardUrl: true,
          gstCertificateUrl: true,
          businessLicenseUrl: true,
          createdAt: true,
        },
      }),
      this.prisma.expenses.findMany({
        where: { uploadReceipt: { not: null } },
        select: {
          id: true,
          userId: true,
          vendor: true,
          title: true,
          uploadReceipt: true,
          createdAt: true,
        },
      }),
    ]);

    const documents: Array<any> = [];

    for (const business of businesses) {
      const businessDocuments = [
        {
          id: `BUS-${business.id}-PAN`,
          fileName: 'PAN Card',
          documentType: 'PAN Card',
          url: business.panCardUrl,
        },
        {
          id: `BUS-${business.id}-GST`,
          fileName: 'GST Certificate',
          documentType: 'GST Certificate',
          url: business.gstCertificateUrl,
        },
        {
          id: `BUS-${business.id}-LIC`,
          fileName: 'Business License',
          documentType: 'Business License',
          url: business.businessLicenseUrl,
        },
      ].filter((doc) => Boolean(doc.url));

      businessDocuments.forEach((doc) => {
        documents.push({
          id: doc.id,
          sourceType: 'Business',
          sourceId: String(business.id),
          userId: business.userId,
          userName: business.signatoryName || business.userId,
          business: business.businessName || 'N/A',
          fileName: doc.fileName,
          url: doc.url,
          fileSize: 'N/A',
          documentType: doc.documentType,
          category: this.getDocumentCategoryByType(doc.documentType),
          uploadDate: business.createdAt,
          status: AdminManagedDocumentStatus.Pending,
        });
      });
    }

    for (const expense of expenses) {
      const fileName = String(expense.uploadReceipt || '').split('/').pop() || `expense-${expense.id}-receipt`;
      documents.push({
        id: `EXP-${expense.id}-RCP`,
        sourceType: 'Expense',
        sourceId: String(expense.id),
        userId: expense.userId,
        userName: expense.vendor || expense.userId,
        business: expense.title || 'Expense Upload',
        fileName,
        url: expense.uploadReceipt,
        fileSize: 'N/A',
        documentType: 'Expense Receipt',
        category: this.getDocumentCategoryByType('Expense Receipt'),
        uploadDate: expense.createdAt,
        status: AdminManagedDocumentStatus.Pending,
      });
    }

    const docIds = documents.map((doc) => doc.id);
    if (docIds.length === 0) {
      return documents;
    }

    const useDocumentStore = await this.canUseManagedDocumentStore();

    const statusMap = new Map<string, { status: AdminManagedDocumentStatus; notes?: string | null }>();

    if (useDocumentStore) {
      const prismaAny = this.prisma as any;
      const managedDocs = await prismaAny.managedDocument.findMany({
        where: { docKey: { in: docIds } },
        select: {
          docKey: true,
          status: true,
          notes: true,
        },
      });

      managedDocs.forEach((entry: any) => {
        statusMap.set(entry.docKey, {
          status: entry.status,
          notes: entry.notes,
        });
      });
    } else {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          targetType: 'Document',
          targetId: { in: docIds },
          action: 'UPDATE',
        },
        orderBy: { timestamp: 'desc' },
        select: {
          targetId: true,
          changes: true,
        },
      });

      logs.forEach((log) => {
        const key = log.targetId || '';
        if (!key || statusMap.has(key)) {
          return;
        }

        const changes: any = log.changes || {};
        const nextStatus = changes?.after || changes?.status;
        if (!nextStatus) {
          return;
        }

        statusMap.set(key, {
          status: nextStatus,
          notes: changes?.notes || null,
        });
      });
    }

    return documents.map((doc) => ({
      ...doc,
      status: statusMap.get(doc.id)?.status || doc.status,
      notes: statusMap.get(doc.id)?.notes || null,
    }));
  }

  async getAllDocuments(query: DocumentListQueryDto = {}) {
    const {
      search = null,
      status = 'all',
      documentType = 'all',
      category = 'all',
      page = '1',
      limit = '20',
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const allDocuments = await this.buildDocumentInventory();

    const normalizedStatus = String(status).toLowerCase();
    const normalizedType = String(documentType).toLowerCase();
    const normalizedCategory = String(category).toLowerCase();

    const filtered = allDocuments.filter((doc) => {
      const s = String(search || '').toLowerCase();
      const matchesSearch =
        !s ||
        doc.userName.toLowerCase().includes(s) ||
        doc.business.toLowerCase().includes(s) ||
        doc.fileName.toLowerCase().includes(s) ||
        doc.documentType.toLowerCase().includes(s);

      const matchesStatus = normalizedStatus === 'all' || doc.status.toLowerCase() === normalizedStatus;
      const matchesType = normalizedType === 'all' || doc.documentType.toLowerCase() === normalizedType;
      const matchesCategory = normalizedCategory === 'all' || doc.category.toLowerCase() === normalizedCategory;

      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limitNum);

    const summary = {
      totalDocuments: total,
      verifiedDocuments: filtered.filter((doc) => doc.status === AdminManagedDocumentStatus.Verified).length,
      pendingDocuments: filtered.filter((doc) => doc.status === AdminManagedDocumentStatus.Pending).length,
      flaggedDocuments: filtered.filter((doc) => doc.status === AdminManagedDocumentStatus.Flagged).length,
    };

    const categoryMap = new Map<string, number>();
    filtered.forEach((doc) => {
      categoryMap.set(doc.category, (categoryMap.get(doc.category) || 0) + 1);
    });

    const categoryStats = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([categoryName, count]) => ({
        category: categoryName,
        count,
      }));

    return {
      success: true,
      message: 'Documents fetched successfully',
      data: {
        documents: paged,
        summary,
        categoryStats,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  async getDocumentDetails(documentId: string) {
    const allDocuments = await this.buildDocumentInventory();
    const document = allDocuments.find((item) => item.id === documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      success: true,
      message: 'Document details fetched successfully',
      data: document,
    };
  }

  async updateDocumentStatus(documentId: string, updateDto: UpdateDocumentStatusDto) {
    const allDocuments = await this.buildDocumentInventory();
    const document = allDocuments.find((item) => item.id === documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const useDocumentStore = await this.canUseManagedDocumentStore();

    if (useDocumentStore) {
      const prismaAny = this.prisma as any;
      await prismaAny.managedDocument.upsert({
        where: { docKey: documentId },
        create: {
          docKey: documentId,
          userId: document.userId,
          sourceType: document.sourceType,
          sourceId: document.sourceId,
          fileName: document.fileName,
          documentType: document.documentType,
          category: document.category,
          status: updateDto.status,
          notes: updateDto.notes || null,
          reviewedBy: 'admin',
          reviewedAt: new Date(),
        },
        update: {
          status: updateDto.status,
          notes: updateDto.notes || null,
          reviewedBy: 'admin',
          reviewedAt: new Date(),
        },
      });
    }

    await this.createAuditLog({
      adminId: 'admin',
      action: 'UPDATE',
      targetType: 'Document',
      targetId: documentId,
      description: `Updated document status to ${updateDto.status}`,
      changes: {
        before: document.status,
        after: updateDto.status,
        notes: updateDto.notes || null,
      },
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Document status updated successfully',
      data: {
        id: documentId,
        status: updateDto.status,
      },
    };
  }

  async logDocumentDownload(documentId: string) {
    const allDocuments = await this.buildDocumentInventory();
    const document = allDocuments.find((item) => item.id === documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.createAuditLog({
      adminId: 'admin',
      action: 'READ',
      targetType: 'Document',
      targetId: documentId,
      description: `Downloaded document ${document.fileName}`,
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Document download logged successfully',
      data: {
        id: documentId,
        url: document.url,
        fileName: document.fileName,
      },
    };
  }

  /**
   * Get user's GST filings
   */
  async getUserFilings(userId: string) {
    const filings = await this.prisma.gSTFiling.findMany({
      where: { userId },
      orderBy: { dueDate: 'desc' },
    });

    return {
      success: true,
      message: 'User filings fetched successfully',
      data: filings,
    };
  }

  // ===== ALERTS & NOTIFICATIONS MANAGEMENT =====

  private hasNotificationDelegates() {
    const prismaAny = this.prisma as any;
    return Boolean(prismaAny.adminNotification && prismaAny.userNotification);
  }

  private async ensureNotificationStoreTables() {
    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminNotificationStatus') THEN
          CREATE TYPE "AdminNotificationStatus" AS ENUM ('Draft', 'Sent', 'Failed');
        END IF;
      END $$;
    `);

    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserNotificationStatus') THEN
          CREATE TYPE "UserNotificationStatus" AS ENUM ('Delivered', 'Read', 'Clicked');
        END IF;
      END $$;
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminNotification" (
        "id" SERIAL PRIMARY KEY,
        "notificationKey" TEXT NOT NULL UNIQUE,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "targetGroup" TEXT NOT NULL,
        "deliveryTypes" JSONB NOT NULL,
        "status" "AdminNotificationStatus" NOT NULL DEFAULT 'Sent',
        "createdBy" TEXT,
        "sentAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserNotification" (
        "id" SERIAL PRIMARY KEY,
        "adminNotificationId" INTEGER NOT NULL,
        "userId" TEXT NOT NULL,
        "status" "UserNotificationStatus" NOT NULL DEFAULT 'Delivered',
        "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "readAt" TIMESTAMP(3),
        "clickedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserNotification_adminNotificationId_fkey"
          FOREIGN KEY ("adminNotificationId") REFERENCES "AdminNotification"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UserNotification_adminNotificationId_userId_key"
      ON "UserNotification"("adminNotificationId", "userId");
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AdminNotification_status_idx" ON "AdminNotification"("status");
    `);
    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AdminNotification_targetGroup_idx" ON "AdminNotification"("targetGroup");
    `);
    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");
    `);
    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserNotification_userId_status_idx" ON "UserNotification"("userId", "status");
    `);
    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "UserNotification_adminNotificationId_idx" ON "UserNotification"("adminNotificationId");
    `);
  }

  private async canUseNotificationStore() {
    const currentTables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('AdminNotification', 'UserNotification')
    `;

    const currentNames = new Set(currentTables.map((table) => table.table_name));
    if (currentNames.has('AdminNotification') && currentNames.has('UserNotification')) {
      return true;
    }

    await this.ensureNotificationStoreTables();

    const tables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('AdminNotification', 'UserNotification')
    `;

    const names = new Set(tables.map((table) => table.table_name));
    return names.has('AdminNotification') && names.has('UserNotification');
  }

  private normalizeDeliveryTypes(input: string[]) {
    const allowed = new Set(['Email', 'SMS', 'In-App']);
    const normalized = Array.from(
      new Set(
        (input || [])
          .map((item) => String(item || '').trim())
          .filter((item) => allowed.has(item))
      )
    );
    return normalized;
  }

  private async getTargetUserIds(targetGroup: AdminNotificationTargetGroup) {
    await this.syncManagedUsersFromBusinesses();

    const where: any = { deletedAt: null };

    if (targetGroup === 'verified') {
      where.status = AdminManagedUserStatus.Active;
    }
    if (targetGroup === 'unverified') {
      where.status = AdminManagedUserStatus.Pending;
    }
    if (targetGroup === 'pro') {
      where.plan = AdminManagedUserPlan.Pro;
      where.status = AdminManagedUserStatus.Active;
    }
    if (targetGroup === 'enterprise') {
      where.plan = AdminManagedUserPlan.Enterprise;
      where.status = AdminManagedUserStatus.Active;
    }
    if (targetGroup === 'inactive') {
      where.status = AdminManagedUserStatus.Inactive;
    }

    const managedUsers = await this.prisma.userManagement.findMany({
      where,
      select: { userId: true },
    });

    return managedUsers.map((item) => item.userId);
  }

  async createNotification(createDto: CreateAdminNotificationDto) {
    const useStore = await this.canUseNotificationStore();
    if (!useStore) {
      throw new BadRequestException('Notification storage is not available. Please run migrations.');
    }

    const deliveryTypes = this.normalizeDeliveryTypes(createDto.deliveryTypes || []);
    if (deliveryTypes.length === 0) {
      throw new BadRequestException('At least one valid delivery type is required');
    }

    const targetUserIds = await this.getTargetUserIds(createDto.targetGroup);
    const prismaAny = this.prisma as any;
    const hasDelegates = this.hasNotificationDelegates();
    const notificationKey = `NTF-${Date.now()}`;
    const shouldDeliverInApp = deliveryTypes.includes('In-App');

    let notification: any;

    if (hasDelegates) {
      notification = await prismaAny.adminNotification.create({
        data: {
          notificationKey,
          title: createDto.title,
          message: createDto.message,
          targetGroup: createDto.targetGroup,
          deliveryTypes,
          status: 'Sent',
          createdBy: createDto.createdBy || 'admin',
          sentAt: new Date(),
        },
      });

      if (shouldDeliverInApp && targetUserIds.length > 0) {
        await prismaAny.userNotification.createMany({
          data: targetUserIds.map((userId) => ({
            adminNotificationId: notification.id,
            userId,
            status: 'Delivered',
            deliveredAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }
    } else {
      const inserted = await this.prisma.$queryRawUnsafe<Array<{ id: number; notificationKey: string; status: string }>>(
        `
          INSERT INTO "AdminNotification"
          ("notificationKey", title, message, "targetGroup", "deliveryTypes", status, "createdBy", "sentAt", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5::jsonb, 'Sent', $6, NOW(), NOW(), NOW())
          RETURNING id, "notificationKey", status
        `,
        notificationKey,
        createDto.title,
        createDto.message,
        createDto.targetGroup,
        JSON.stringify(deliveryTypes),
        createDto.createdBy || 'admin'
      );

      notification = inserted[0];

      if (shouldDeliverInApp && targetUserIds.length > 0) {
        for (const userId of targetUserIds) {
          await this.prisma.$executeRawUnsafe(
            `
              INSERT INTO "UserNotification"
              ("adminNotificationId", "userId", status, "deliveredAt", "createdAt", "updatedAt")
              VALUES ($1, $2, 'Delivered', NOW(), NOW(), NOW())
              ON CONFLICT ("adminNotificationId", "userId") DO NOTHING
            `,
            notification.id,
            userId
          );
        }
      }
    }

    await this.createAuditLog({
      adminId: createDto.createdBy || 'admin',
      action: 'CREATE',
      targetType: 'Notification',
      targetId: String(notification.id),
      description: `Created notification ${notification.notificationKey}`,
      changes: {
        title: createDto.title,
        targetGroup: createDto.targetGroup,
        deliveryTypes,
        recipients: shouldDeliverInApp ? targetUserIds.length : 0,
      },
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Notification created and dispatched successfully',
      data: {
        id: notification.id,
        notificationId: notification.notificationKey,
        recipients: shouldDeliverInApp ? targetUserIds.length : 0,
        status: notification.status,
      },
    };
  }

  async getNotifications(query: NotificationListQueryDto = {}) {
    const useStore = await this.canUseNotificationStore();
    if (!useStore) {
      return {
        success: true,
        message: 'Notifications fetched successfully',
        data: {
          notifications: [],
          summary: {
            totalSent: 0,
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0,
          },
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 0,
          },
        },
      };
    }

    const {
      search = null,
      status = 'all',
      targetGroup = 'all',
      page = '1',
      limit = '10',
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const prismaAny = this.prisma as any;
    const hasDelegates = this.hasNotificationDelegates();

    if (!hasDelegates) {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `
          SELECT id, "notificationKey", title, message, "targetGroup", "deliveryTypes", status, "sentAt", "createdAt"
          FROM "AdminNotification"
          ORDER BY "createdAt" DESC
        `
      );

      const recipientCountsRaw = await this.prisma.$queryRawUnsafe<any[]>(
        `
          SELECT "adminNotificationId", COUNT(*)::int AS count
          FROM "UserNotification"
          GROUP BY "adminNotificationId"
        `
      );
      const readCountsRaw = await this.prisma.$queryRawUnsafe<any[]>(
        `
          SELECT "adminNotificationId", COUNT(*)::int AS count
          FROM "UserNotification"
          WHERE status IN ('Read', 'Clicked')
          GROUP BY "adminNotificationId"
        `
      );
      const clickCountsRaw = await this.prisma.$queryRawUnsafe<any[]>(
        `
          SELECT "adminNotificationId", COUNT(*)::int AS count
          FROM "UserNotification"
          WHERE status = 'Clicked'
          GROUP BY "adminNotificationId"
        `
      );

      const recipientsById = new Map<number, number>(
        recipientCountsRaw.map((item) => [Number(item.adminNotificationId), Number(item.count)])
      );
      const openedById = new Map<number, number>(
        readCountsRaw.map((item) => [Number(item.adminNotificationId), Number(item.count)])
      );
      const clickedById = new Map<number, number>(
        clickCountsRaw.map((item) => [Number(item.adminNotificationId), Number(item.count)])
      );

      const filteredRows = rows.filter((row) => {
        const matchesStatus = status === 'all' || String(row.status) === status;
        const matchesGroup = targetGroup === 'all' || String(row.targetGroup) === targetGroup;
        const s = String(search || '').toLowerCase();
        const matchesSearch =
          !s ||
          String(row.title || '').toLowerCase().includes(s) ||
          String(row.message || '').toLowerCase().includes(s);
        return matchesStatus && matchesGroup && matchesSearch;
      });

      const pagedRows = filteredRows.slice(skip, skip + limitNum);
      const notifications = pagedRows.map((row) => {
        const recipients = recipientsById.get(Number(row.id)) || 0;
        const opened = openedById.get(Number(row.id)) || 0;
        const clicked = clickedById.get(Number(row.id)) || 0;
        return {
          id: Number(row.id),
          notificationId: row.notificationKey,
          title: row.title,
          message: row.message,
          targetGroup: row.targetGroup,
          deliveryType: Array.isArray(row.deliveryTypes)
            ? row.deliveryTypes
            : typeof row.deliveryTypes === 'string'
              ? JSON.parse(row.deliveryTypes || '[]')
              : [],
          sentDate: row.sentAt || row.createdAt,
          status: row.status === 'Sent' ? 'Delivered' : row.status,
          recipients,
          opened,
          clicked,
        };
      });

      const totalNotifications = rows.length;
      const totalDeliveries = Array.from(recipientsById.values()).reduce((sum, value) => sum + value, 0);
      const totalOpened = Array.from(openedById.values()).reduce((sum, value) => sum + value, 0);
      const totalClicked = Array.from(clickedById.values()).reduce((sum, value) => sum + value, 0);

      const deliveryRate = totalDeliveries > 0 ? 100 : 0;
      const openRate = totalDeliveries > 0 ? Math.round((totalOpened / totalDeliveries) * 100) : 0;
      const clickRate = totalDeliveries > 0 ? Math.round((totalClicked / totalDeliveries) * 100) : 0;

      return {
        success: true,
        message: 'Notifications fetched successfully',
        data: {
          notifications,
          summary: {
            totalSent: totalNotifications,
            deliveryRate,
            openRate,
            clickRate,
          },
          pagination: {
            total: filteredRows.length,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(filteredRows.length / limitNum),
          },
        },
      };
    }

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (targetGroup && targetGroup !== 'all') {
      where.targetGroup = targetGroup;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      prismaAny.adminNotification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prismaAny.adminNotification.count({ where }),
    ]);

    const ids = rows.map((row: any) => row.id);
    const [recipientCounts, readCounts, clickCounts] = await Promise.all([
      ids.length
        ? prismaAny.userNotification.groupBy({
            by: ['adminNotificationId'],
            where: { adminNotificationId: { in: ids } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      ids.length
        ? prismaAny.userNotification.groupBy({
            by: ['adminNotificationId'],
            where: {
              adminNotificationId: { in: ids },
              status: { in: ['Read', 'Clicked'] },
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      ids.length
        ? prismaAny.userNotification.groupBy({
            by: ['adminNotificationId'],
            where: {
              adminNotificationId: { in: ids },
              status: 'Clicked',
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const recipientsById = new Map<number, number>(
      (recipientCounts as any[]).map((item: any) => [item.adminNotificationId, item._count._all])
    );
    const openedById = new Map<number, number>(
      (readCounts as any[]).map((item: any) => [item.adminNotificationId, item._count._all])
    );
    const clickedById = new Map<number, number>(
      (clickCounts as any[]).map((item: any) => [item.adminNotificationId, item._count._all])
    );

    const notifications = rows.map((row: any) => {
      const recipients = recipientsById.get(row.id) || 0;
      const opened = openedById.get(row.id) || 0;
      const clicked = clickedById.get(row.id) || 0;
      return {
        id: row.id,
        notificationId: row.notificationKey,
        title: row.title,
        message: row.message,
        targetGroup: row.targetGroup,
        deliveryType: Array.isArray(row.deliveryTypes) ? row.deliveryTypes : [],
        sentDate: row.sentAt || row.createdAt,
        status: row.status === 'Sent' ? 'Delivered' : row.status,
        recipients,
        opened,
        clicked,
      };
    });

    const [totalNotifications, totalDeliveries, totalOpened, totalClicked] = await Promise.all([
      prismaAny.adminNotification.count(),
      prismaAny.userNotification.count(),
      prismaAny.userNotification.count({
        where: { status: { in: ['Read', 'Clicked'] } },
      }),
      prismaAny.userNotification.count({
        where: { status: 'Clicked' },
      }),
    ]);

    const deliveryRate = totalDeliveries > 0 ? 100 : 0;
    const openRate = totalDeliveries > 0 ? Math.round((totalOpened / totalDeliveries) * 100) : 0;
    const clickRate = totalDeliveries > 0 ? Math.round((totalClicked / totalDeliveries) * 100) : 0;

    return {
      success: true,
      message: 'Notifications fetched successfully',
      data: {
        notifications,
        summary: {
          totalSent: totalNotifications,
          deliveryRate,
          openRate,
          clickRate,
        },
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  async getUserNotifications(userId: string, query: UserNotificationsQueryDto = {}) {
    const useStore = await this.canUseNotificationStore();
    if (!useStore) {
      return {
        success: true,
        message: 'User notifications fetched successfully',
        data: {
          notifications: [],
          unreadCount: 0,
          pagination: { total: 0, page: 1, limit: 10, pages: 0 },
        },
      };
    }

    const { onlyUnread = 'false', page = '1', limit = '10' } = query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const prismaAny = this.prisma as any;
    const hasDelegates = this.hasNotificationDelegates();

    if (!hasDelegates) {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `
          SELECT
            u.id,
            u.status,
            u."createdAt",
            u."deliveredAt",
            u."readAt",
            u."clickedAt",
            a."notificationKey",
            a.title,
            a.message,
            a."targetGroup",
            a."deliveryTypes"
          FROM "UserNotification" u
          JOIN "AdminNotification" a ON a.id = u."adminNotificationId"
          WHERE u."userId" = $1
          ORDER BY u."createdAt" DESC
        `,
        userId
      );

      const filteredRows = String(onlyUnread).toLowerCase() === 'true'
        ? rows.filter((row) => row.status === 'Delivered')
        : rows;

      const unreadCountRow = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `
          SELECT COUNT(*)::int AS count
          FROM "UserNotification"
          WHERE "userId" = $1 AND status = 'Delivered'
        `,
        userId
      );

      const notifications = filteredRows.slice(skip, skip + limitNum).map((row) => ({
        id: Number(row.id),
        notificationId: row.notificationKey,
        title: row.title,
        message: row.message,
        targetGroup: row.targetGroup,
        deliveryTypes: Array.isArray(row.deliveryTypes)
          ? row.deliveryTypes
          : typeof row.deliveryTypes === 'string'
            ? JSON.parse(row.deliveryTypes || '[]')
            : [],
        status: row.status,
        createdAt: row.createdAt,
        deliveredAt: row.deliveredAt,
        readAt: row.readAt,
        clickedAt: row.clickedAt,
      }));

      return {
        success: true,
        message: 'User notifications fetched successfully',
        data: {
          notifications,
          unreadCount: Number(unreadCountRow[0]?.count || 0),
          pagination: {
            total: filteredRows.length,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(filteredRows.length / limitNum),
          },
        },
      };
    }

    const where: any = { userId };
    if (String(onlyUnread).toLowerCase() === 'true') {
      where.status = 'Delivered';
    }

    const [rows, total, unreadCount] = await Promise.all([
      prismaAny.userNotification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          adminNotification: true,
        },
      }),
      prismaAny.userNotification.count({ where }),
      prismaAny.userNotification.count({ where: { userId, status: 'Delivered' } }),
    ]);

    const notifications = rows.map((row: any) => ({
      id: row.id,
      notificationId: row.adminNotification.notificationKey,
      title: row.adminNotification.title,
      message: row.adminNotification.message,
      targetGroup: row.adminNotification.targetGroup,
      deliveryTypes: Array.isArray(row.adminNotification.deliveryTypes)
        ? row.adminNotification.deliveryTypes
        : [],
      status: row.status,
      createdAt: row.createdAt,
      deliveredAt: row.deliveredAt,
      readAt: row.readAt,
      clickedAt: row.clickedAt,
    }));

    return {
      success: true,
      message: 'User notifications fetched successfully',
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  async markUserNotificationRead(userId: string, notificationId: string) {
    const useStore = await this.canUseNotificationStore();
    if (!useStore) {
      throw new BadRequestException('Notification storage is not available. Please run migrations.');
    }

    const id = parseInt(notificationId, 10);
    if (Number.isNaN(id)) {
      throw new BadRequestException('Invalid notification ID');
    }

    const hasDelegates = this.hasNotificationDelegates();
    if (!hasDelegates) {
      const existing = await this.prisma.$queryRawUnsafe<any[]>(
        `
          SELECT id, status
          FROM "UserNotification"
          WHERE id = $1 AND "userId" = $2
          LIMIT 1
        `,
        id,
        userId
      );

      if (!existing.length) {
        throw new NotFoundException('User notification not found');
      }

      if (existing[0].status === 'Read' || existing[0].status === 'Clicked') {
        return {
          success: true,
          message: 'Notification already marked as read',
          data: { id, status: existing[0].status },
        };
      }

      const updated = await this.prisma.$queryRawUnsafe<any[]>(
        `
          UPDATE "UserNotification"
          SET status = 'Read', "readAt" = NOW(), "updatedAt" = NOW()
          WHERE id = $1 AND "userId" = $2
          RETURNING id, status, "readAt"
        `,
        id,
        userId
      );

      return {
        success: true,
        message: 'Notification marked as read',
        data: { id: Number(updated[0].id), status: updated[0].status, readAt: updated[0].readAt },
      };
    }

    const prismaAny = this.prisma as any;
    const existing = await prismaAny.userNotification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('User notification not found');
    }

    if (existing.status === 'Read' || existing.status === 'Clicked') {
      return {
        success: true,
        message: 'Notification already marked as read',
        data: { id, status: existing.status },
      };
    }

    const updated = await prismaAny.userNotification.update({
      where: { id },
      data: {
        status: 'Read',
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Notification marked as read',
      data: { id: updated.id, status: updated.status, readAt: updated.readAt },
    };
  }

  async markUserNotificationClicked(userId: string, notificationId: string) {
    const useStore = await this.canUseNotificationStore();
    if (!useStore) {
      throw new BadRequestException('Notification storage is not available. Please run migrations.');
    }

    const id = parseInt(notificationId, 10);
    if (Number.isNaN(id)) {
      throw new BadRequestException('Invalid notification ID');
    }

    const hasDelegates = this.hasNotificationDelegates();
    if (!hasDelegates) {
      const existing = await this.prisma.$queryRawUnsafe<any[]>(
        `
          SELECT id, status, "readAt"
          FROM "UserNotification"
          WHERE id = $1 AND "userId" = $2
          LIMIT 1
        `,
        id,
        userId
      );

      if (!existing.length) {
        throw new NotFoundException('User notification not found');
      }

      const updated = await this.prisma.$queryRawUnsafe<any[]>(
        `
          UPDATE "UserNotification"
          SET status = 'Clicked',
              "readAt" = COALESCE("readAt", NOW()),
              "clickedAt" = NOW(),
              "updatedAt" = NOW()
          WHERE id = $1 AND "userId" = $2
          RETURNING id, status, "clickedAt"
        `,
        id,
        userId
      );

      return {
        success: true,
        message: 'Notification marked as clicked',
        data: { id: Number(updated[0].id), status: updated[0].status, clickedAt: updated[0].clickedAt },
      };
    }

    const prismaAny = this.prisma as any;
    const existing = await prismaAny.userNotification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('User notification not found');
    }

    const updated = await prismaAny.userNotification.update({
      where: { id },
      data: {
        status: 'Clicked',
        readAt: existing.readAt || new Date(),
        clickedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Notification marked as clicked',
      data: { id: updated.id, status: updated.status, clickedAt: updated.clickedAt },
    };
  }

  async markAllUserNotificationsRead(userId: string) {
    const useStore = await this.canUseNotificationStore();
    if (!useStore) {
      throw new BadRequestException('Notification storage is not available. Please run migrations.');
    }

    const hasDelegates = this.hasNotificationDelegates();
    let updatedCount = 0;

    if (!hasDelegates) {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `
          UPDATE "UserNotification"
          SET status = 'Read', "readAt" = NOW(), "updatedAt" = NOW()
          WHERE "userId" = $1 AND status = 'Delivered'
          RETURNING id
        `,
        userId
      );
      updatedCount = rows.length;
    } else {
      const prismaAny = this.prisma as any;
      const result = await prismaAny.userNotification.updateMany({
        where: { userId, status: 'Delivered' },
        data: { status: 'Read', readAt: new Date() },
      });
      updatedCount = result.count;
    }

    return {
      success: true,
      message: 'All notifications marked as read',
      data: { updatedCount },
    };
  }

  // ===== AUDIT LOGS =====

  /**
   * Create audit log entry
   */
  async createAuditLog(auditLogDto: CreateAuditLogDto) {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminId: auditLogDto.adminId,
          action: auditLogDto.action as any,
          targetType: auditLogDto.targetType,
          targetId: auditLogDto.targetId,
          targetEmail: auditLogDto.targetEmail,
          description: auditLogDto.description,
          changes: auditLogDto.changes,
          ipAddress: auditLogDto.ipAddress,
          userAgent: auditLogDto.userAgent,
          status: auditLogDto.status || 'success',
          errorMessage: auditLogDto.errorMessage,
        },
      });

      return { success: true, message: 'Audit log created' };
    } catch (error) {
      console.error('Error creating audit log:', error);
      return { success: false, message: 'Failed to create audit log' };
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(query: AuditLogQueryDto) {
    const {
      action = null,
      targetType = null,
      adminId = null,
      startDate = null,
      endDate = null,
      page = '1',
      limit = '10',
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action) where.action = action as any;
    if (targetType) where.targetType = targetType;
    if (adminId) where.adminId = adminId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { timestamp: 'desc' },
    });

    const total = await this.prisma.auditLog.count({ where });

    return {
      success: true,
      message: 'Audit logs fetched successfully',
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  // ===== SYSTEM SETTINGS =====

  /**
   * Get system settings
   */
  async getSystemSettings() {
    const settings = await this.prisma.systemSettings.findFirst();

    return {
      success: true,
      message: 'System settings fetched successfully',
      data: settings,
    };
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(updateDto: UpdateSystemSettingsDto) {
    let settings = await this.prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          ...updateDto,
        },
      });
    } else {
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: updateDto,
      });
    }

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: 'UPDATE',
      targetType: 'SystemSettings',
      description: 'Updated system settings',
      changes: updateDto,
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'System settings updated successfully',
      data: settings,
    };
  }

  // ===== ADMIN USERS MANAGEMENT =====

  /**
   * Get all admin users
   */
  async getAllAdmins(query: any = {}) {
    const { page = '1', limit = '10', search = null } = query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const admins = await this.prisma.admin.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.admin.count({ where });

    return {
      success: true,
      message: 'Admin users fetched successfully',
      data: {
        admins,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  /**
   * Get admin user by ID
   */
  async getAdminById(adminId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    return {
      success: true,
      message: 'Admin user fetched successfully',
      data: admin,
    };
  }

  /**
   * Create a new admin user
   */
  async createAdminUser(createAdminDto: any) {
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email: createAdminDto.email },
    });

    if (existingAdmin) {
      throw new BadRequestException('Admin with this email already exists');
    }

    const newAdmin = await this.prisma.admin.create({
      data: {
        email: createAdminDto.email,
        name: createAdminDto.name,
        role: createAdminDto.role || 'admin',
        status: createAdminDto.status || 'Active',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: 'CREATE',
      targetType: 'Admin',
      targetId: String(newAdmin.id),
      targetEmail: newAdmin.email,
      description: `Created admin user ${newAdmin.email}`,
      changes: { email: newAdmin.email, name: newAdmin.name, role: newAdmin.role },
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Admin user created successfully',
      data: newAdmin,
    };
  }

  /**
   * Update admin user
   */
  async updateAdminUser(adminId: number, updateData: any) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    const updatedAdmin = await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        name: updateData.name || admin.name,
        role: updateData.role || admin.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: 'UPDATE',
      targetType: 'Admin',
      targetId: String(adminId),
      targetEmail: admin.email,
      description: `Updated admin user ${admin.email}`,
      changes: updateData,
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Admin user updated successfully',
      data: updatedAdmin,
    };
  }

  /**
   * Update admin status
   */
  async updateAdminStatus(adminId: number, status: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    if (!['Active', 'Inactive'].includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    const updatedAdmin = await this.prisma.admin.update({
      where: { id: adminId },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: 'UPDATE',
      targetType: 'Admin',
      targetId: String(adminId),
      targetEmail: admin.email,
      description: `Updated admin status to ${status}`,
      changes: { status },
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: `Admin user status updated to ${status}`,
      data: updatedAdmin,
    };
  }

  /**
   * Delete admin user
   */
  async deleteAdminUser(adminId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    await this.prisma.admin.delete({
      where: { id: adminId },
    });

    // Create audit log
    await this.createAuditLog({
      adminId: 'admin',
      action: 'DELETE',
      targetType: 'Admin',
      targetId: String(adminId),
      targetEmail: admin.email,
      description: `Deleted admin user ${admin.email}`,
      changes: { email: admin.email, name: admin.name },
      status: 'success',
    } as CreateAuditLogDto);

    return {
      success: true,
      message: 'Admin user deleted successfully',
    };
  }

  // ===== BUSINESSES MANAGEMENT =====

  private normalizeBusinessStatus(rawStatus?: string | null) {
    if (!rawStatus) {
      return 'all';
    }

    const lowered = rawStatus.trim().toLowerCase();
    if (
      lowered === 'pending' ||
      lowered === 'verified' ||
      lowered === 'flagged' ||
      lowered === 'rejected' ||
      lowered === 'inactive'
    ) {
      return lowered;
    }

    return 'all';
  }

  private toBusinessStatusEnum(status: string): AdminManagedBusinessStatus | null {
    if (status === 'pending') return AdminManagedBusinessStatus.Pending;
    if (status === 'verified') return AdminManagedBusinessStatus.Verified;
    if (status === 'flagged') return AdminManagedBusinessStatus.Flagged;
    if (status === 'rejected') return AdminManagedBusinessStatus.Rejected;
    if (status === 'inactive') return AdminManagedBusinessStatus.Inactive;
    return null;
  }

  /**
   * Get all businesses
   */
  async getAllBusinesses(query: BusinessListQueryDto = {}) {
    const prismaAny = this.prisma as any;
    const hasManagementColumns = await this.hasBusinessManagementColumns();

    const {
      search = null,
      state = null,
      type = null,
      status = 'all',
      page = '1',
      limit = '10',
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const normalizedStatus = this.normalizeBusinessStatus(status);

    const where: any = hasManagementColumns ? { deletedAt: null } : {};

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } },
        { signatoryName: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (state && state.toLowerCase() !== 'all') {
      where.state = state;
    }

    if (type && type.toLowerCase() !== 'all') {
      where.businessType = type;
    }

    if (normalizedStatus !== 'all' && hasManagementColumns) {
      where.managementStatus = this.toBusinessStatusEnum(normalizedStatus);
    }

    const businesses = await prismaAny.business.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        businessName: true,
        businessType: true,
        city: true,
        gstin: true,
        signatoryName: true,
        contactEmail: true,
        contactMobile: true,
        state: true,
        isActive: true,
        panCardUrl: true,
        gstCertificateUrl: true,
        businessLicenseUrl: true,
        createdAt: true,
        ...(hasManagementColumns
          ? {
              managementStatus: true,
              deletedAt: true,
            }
          : {}),
      },
    });

    const total = await prismaAny.business.count({ where });

    const userIds: string[] = Array.from(
      new Set((businesses as any[]).map((business: any) => String(business.userId)))
    );

    const [invoiceCounts, filingCounts, clientCounts] = await Promise.all([
      userIds.length
        ? this.prisma.invoices.groupBy({
            by: ['userId'],
            where: { userId: { in: userIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? this.prisma.gSTFiling.groupBy({
            by: ['userId'],
            where: { userId: { in: userIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? this.prisma.clients.groupBy({
            by: ['userId'],
            where: { userId: { in: userIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const invoicesByUserId = new Map<string, number>(
      (invoiceCounts as any[]).map((item) => [item.userId, item._count._all] as [string, number])
    );
    const filingsByUserId = new Map<string, number>(
      (filingCounts as any[]).map((item) => [item.userId, item._count._all] as [string, number])
    );
    const clientsByUserId = new Map<string, number>(
      (clientCounts as any[]).map((item) => [item.userId, item._count._all] as [string, number])
    );

    const summary = (businesses as any[]).reduce(
      (acc, business: any) => {
        const effectiveStatus = hasManagementColumns
          ? business.managementStatus
          : business.isActive
            ? 'Verified'
            : 'Inactive';

        acc.totalBusinesses += 1;
        if (effectiveStatus === 'Verified') acc.verifiedBusinesses += 1;
        if (effectiveStatus === 'Pending') acc.pendingReviewBusinesses += 1;
        if (effectiveStatus === 'Flagged') acc.flaggedBusinesses += 1;
        return acc;
      },
      {
        totalBusinesses: 0,
        verifiedBusinesses: 0,
        pendingReviewBusinesses: 0,
        flaggedBusinesses: 0,
      }
    );

    const mappedBusinesses = (businesses as any[]).map((business: any) => {
      const documents = [
        { label: 'PAN Card', url: business.panCardUrl },
        { label: 'GST Certificate', url: business.gstCertificateUrl },
        { label: 'Business License', url: business.businessLicenseUrl },
      ].filter((document) => Boolean(document.url));

      return {
        id: business.id,
        businessId: `BUS-${String(business.id).padStart(5, '0')}`,
        userId: business.userId,
        name: business.businessName,
        type: business.businessType,
        gstin: business.gstin,
        state: business.state,
        city: business.city,
        signatory: business.signatoryName,
        email: business.contactEmail,
        mobile: business.contactMobile,
        status: hasManagementColumns
          ? business.managementStatus
          : business.isActive
            ? 'Verified'
            : 'Inactive',
        isActive: business.isActive,
        documents,
        createdAt: business.createdAt,
        metrics: {
          invoices: invoicesByUserId.get(business.userId) || 0,
          filings: filingsByUserId.get(business.userId) || 0,
          clients: clientsByUserId.get(business.userId) || 0,
        },
      };
    });

    return {
      success: true,
      message: 'Businesses fetched successfully',
      data: {
        businesses: mappedBusinesses,
        summary,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  /**
   * Get business details
   */
  async getBusinessDetails(businessId: string) {
    const prismaAny = this.prisma as any;
    const hasManagementColumns = await this.hasBusinessManagementColumns();

    const business = await prismaAny.business.findUnique({
      where: { id: parseInt(businessId, 10) },
      select: {
        id: true,
        userId: true,
        businessName: true,
        businessType: true,
        natureOfBusiness: true,
        pan: true,
        gstin: true,
        state: true,
        city: true,
        pincode: true,
        address: true,
        contactMobile: true,
        contactEmail: true,
        signatoryName: true,
        signatoryMobile: true,
        panCardUrl: true,
        gstCertificateUrl: true,
        businessLicenseUrl: true,
        isActive: true,
        turnover: true,
        createdAt: true,
        updatedAt: true,
        ...(hasManagementColumns
          ? {
              managementStatus: true,
              reviewNotes: true,
              reviewedBy: true,
              reviewedAt: true,
              deletedAt: true,
            }
          : {}),
      },
    });

    if (!business || (hasManagementColumns && business.deletedAt)) {
      throw new NotFoundException('Business not found');
    }

    const invoiceCount = await this.prisma.invoices.count({
      where: { userId: business.userId },
    });

    const filingCount = await this.prisma.gSTFiling.count({
      where: { userId: business.userId },
    });

    const clientCount = await this.prisma.clients.count({
      where: { userId: business.userId },
    });

    const expenseCount = await this.prisma.expenses.count({
      where: { userId: business.userId },
    });

    const transactionCount = await this.prisma.transactions.count({
      where: { userId: business.userId },
    });

    const documents = [
      { label: 'PAN Card', url: business.panCardUrl },
      { label: 'GST Certificate', url: business.gstCertificateUrl },
      { label: 'Business License', url: business.businessLicenseUrl },
    ].filter((document) => Boolean(document.url));

    return {
      success: true,
      message: 'Business details fetched successfully',
      data: {
        id: business.id,
        businessId: `BUS-${String(business.id).padStart(5, '0')}`,
        userId: business.userId,
        businessName: business.businessName,
        businessType: business.businessType,
        natureOfBusiness: business.natureOfBusiness,
        pan: business.pan,
        gstin: business.gstin,
        state: business.state,
        city: business.city,
        pincode: business.pincode,
        address: business.address,
        contactMobile: business.contactMobile,
        contactEmail: business.contactEmail,
        signatoryName: business.signatoryName,
        signatoryMobile: business.signatoryMobile,
        turnover: business.turnover,
        status: hasManagementColumns
          ? business.managementStatus
          : business.isActive
            ? 'Verified'
            : 'Inactive',
        reviewNotes: hasManagementColumns ? business.reviewNotes : null,
        reviewedBy: hasManagementColumns ? business.reviewedBy : null,
        reviewedAt: hasManagementColumns ? business.reviewedAt : null,
        documents,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
        metrics: {
          invoices: invoiceCount,
          filings: filingCount,
          clients: clientCount,
          expenses: expenseCount,
          transactions: transactionCount,
        },
      },
    };
  }

  /**
   * Update business review status
   */
  async updateBusinessStatus(businessId: string, updateDto: UpdateBusinessStatusDto) {
    const prismaAny = this.prisma as any;

    const parsedBusinessId = parseInt(businessId, 10);
    if (Number.isNaN(parsedBusinessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    const existing = await prismaAny.business.findUnique({
      where: { id: parsedBusinessId },
      select: { id: true, isActive: true },
    });

    if (!existing) {
      throw new NotFoundException('Business not found');
    }

    const status = updateDto.status;
    const nextIsActive =
      status === AdminManagedBusinessStatus.Verified ||
      status === AdminManagedBusinessStatus.Pending ||
      status === AdminManagedBusinessStatus.Flagged;

    let usedManagementColumns = true;
    let updated: any;

    try {
      updated = await prismaAny.business.update({
        where: { id: parsedBusinessId },
        data: {
          managementStatus: status as any,
          isActive: nextIsActive,
          reviewedBy: updateDto.reviewedBy || 'admin',
          reviewNotes: updateDto.notes ?? null,
          reviewedAt: new Date(),
        },
        select: {
          id: true,
          isActive: true,
          managementStatus: true,
          reviewedAt: true,
          reviewedBy: true,
        },
      });
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      const hasMissingColumnError =
        message.includes('column') &&
        (message.includes('managementstatus') ||
          message.includes('reviewedby') ||
          message.includes('reviewnotes') ||
          message.includes('reviewedat'));

      if (!hasMissingColumnError) {
        throw error;
      }

      usedManagementColumns = false;
      updated = await prismaAny.business.update({
        where: { id: parsedBusinessId },
        data: {
          isActive: nextIsActive,
        },
        select: {
          id: true,
          isActive: true,
        },
      });
    }

    return {
      success: true,
      message: 'Business status updated successfully',
      data: {
        id: updated.id,
        status: usedManagementColumns
          ? updated.managementStatus
          : nextIsActive
            ? 'Verified'
            : 'Inactive',
        reviewedAt: usedManagementColumns ? updated.reviewedAt : null,
        reviewedBy: usedManagementColumns ? updated.reviewedBy : null,
      },
    };
  }

  /**
   * Update business details
   */
  async updateBusinessDetails(businessId: string, updateDto: UpdateBusinessDto) {
    const prismaAny = this.prisma as any;
    const hasManagementColumns = await this.hasBusinessManagementColumns();

    const parsedBusinessId = parseInt(businessId, 10);
    if (Number.isNaN(parsedBusinessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    const existing = await prismaAny.business.findUnique({
      where: { id: parsedBusinessId },
      select: {
        id: true,
        ...(hasManagementColumns ? { deletedAt: true } : {}),
      },
    });

    if (!existing || (hasManagementColumns && existing.deletedAt)) {
      throw new NotFoundException('Business not found');
    }

    const updateData: any = hasManagementColumns
      ? {
          reviewedBy: updateDto.reviewedBy || 'admin',
          reviewedAt: new Date(),
        }
      : {};

    if (typeof updateDto.businessName === 'string') updateData.businessName = updateDto.businessName;
    if (typeof updateDto.businessType === 'string') updateData.businessType = updateDto.businessType;
    if (typeof updateDto.natureOfBusiness === 'string') updateData.natureOfBusiness = updateDto.natureOfBusiness;
    if (typeof updateDto.pan === 'string') updateData.pan = updateDto.pan;
    if (typeof updateDto.gstin === 'string') updateData.gstin = updateDto.gstin;
    if (typeof updateDto.state === 'string') updateData.state = updateDto.state;
    if (typeof updateDto.city === 'string') updateData.city = updateDto.city;
    if (typeof updateDto.pincode === 'string') updateData.pincode = updateDto.pincode;
    if (typeof updateDto.address === 'string') updateData.address = updateDto.address;
    if (typeof updateDto.contactMobile === 'string') updateData.contactMobile = updateDto.contactMobile;
    if (typeof updateDto.contactEmail === 'string') updateData.contactEmail = updateDto.contactEmail;
    if (typeof updateDto.signatoryName === 'string') updateData.signatoryName = updateDto.signatoryName;
    if (typeof updateDto.signatoryMobile === 'string') updateData.signatoryMobile = updateDto.signatoryMobile;
    if (typeof updateDto.turnover === 'number') updateData.turnover = updateDto.turnover;
    if (hasManagementColumns && typeof updateDto.notes === 'string') {
      updateData.reviewNotes = updateDto.notes;
    }

    const updated = await prismaAny.business.update({
      where: { id: parsedBusinessId },
      data: updateData,
    });

    return {
      success: true,
      message: 'Business profile updated successfully',
      data: {
        id: updated.id,
        businessName: updated.businessName,
        gstin: updated.gstin,
        state: updated.state,
        city: updated.city,
        updatedAt: updated.updatedAt,
      },
    };
  }

  /**
   * Archive business
   */
  async deleteBusiness(businessId: string) {
    const prismaAny = this.prisma as any;
    const hasManagementColumns = await this.hasBusinessManagementColumns();

    const parsedBusinessId = parseInt(businessId, 10);
    if (Number.isNaN(parsedBusinessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    const existing = await prismaAny.business.findUnique({
      where: { id: parsedBusinessId },
      select: {
        id: true,
        ...(hasManagementColumns ? { deletedAt: true } : {}),
      },
    });

    if (!existing || (hasManagementColumns && existing.deletedAt)) {
      throw new NotFoundException('Business not found');
    }

    await prismaAny.business.update({
      where: { id: parsedBusinessId },
      data: hasManagementColumns
        ? {
            isActive: false,
            managementStatus: AdminManagedBusinessStatus.Inactive as any,
            deletedAt: new Date(),
            reviewedBy: 'admin',
            reviewedAt: new Date(),
          }
        : {
            isActive: false,
          },
    });

    return {
      success: true,
      message: 'Business archived successfully',
    };
  }
}
