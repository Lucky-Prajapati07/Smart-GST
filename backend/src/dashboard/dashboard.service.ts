import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    // Try to get cached stats
    let stats = await this.prisma.dashboardStats.findUnique({
      where: { userId },
    });

    // If stats don't exist or are older than 5 minutes, recalculate
    if (!stats || this.isStale(stats.lastUpdated)) {
      stats = await this.calculateAndUpdateStats(userId);
    }

    return stats;
  }

  async refreshDashboardStats(userId: string) {
    return this.calculateAndUpdateStats(userId);
  }

  private async calculateAndUpdateStats(userId: string) {
    // Get current month dates
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch all data
    const [invoices, expenses, clients, transactions] = await Promise.all([
      this.prisma.invoices.findMany(),
      this.prisma.expenses.findMany(),
      this.prisma.clients.findMany(),
      this.prisma.transactions.findMany(),
    ]);

    // Calculate total revenue (sales invoices)
    const salesInvoices = invoices.filter(
      (inv) => inv.invoiceType.toLowerCase() === 'sales',
    );
    const totalRevenue = salesInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount || '0'),
      0,
    );

    // Calculate total expenses
    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.totalAmount || exp.amount || '0'),
      0,
    );

    // Calculate pending and overdue invoices
    const pendingInvoices = salesInvoices.filter(
      (inv) => inv.status?.toLowerCase() === 'pending',
    ).length;

    const overdueInvoices = salesInvoices.filter((inv) => {
      if (inv.status?.toLowerCase() !== 'pending') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < now;
    }).length;

    // Calculate GST liability (output tax - input tax)
    const outputTax = salesInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.gst || '0'),
      0,
    );

    const purchaseInvoices = invoices.filter(
      (inv) => inv.invoiceType.toLowerCase() === 'purchase',
    );
    const purchaseGST = purchaseInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.gst || '0'),
      0,
    );

    const expenseGST = expenses
      .filter((exp) => exp.itc === 'yes')
      .reduce((sum, exp) => sum + parseFloat(exp.gst || '0'), 0);

    const inputTax = purchaseGST + expenseGST;
    const gstLiability = Math.max(outputTax - inputTax, 0);

    // Calculate monthly revenue (last 12 months)
    const monthlyRevenue = this.calculateMonthlyRevenue(salesInvoices);

    // Calculate category-wise expenses
    const categoryExpenses = this.calculateCategoryExpenses(expenses);

    // Upsert dashboard stats
    const statsData = {
      userId,
      totalRevenue,
      totalExpenses,
      pendingInvoices,
      overdueInvoices,
      totalClients: clients.length,
      gstLiability,
      monthlyRevenue,
      categoryExpenses,
      lastUpdated: now,
    };

    return this.prisma.dashboardStats.upsert({
      where: { userId },
      update: statsData,
      create: statsData,
    });
  }

  async getRecentActivity(userId: string, limit: number = 10) {
    const [recentInvoices, recentExpenses, recentTransactions] = await Promise.all([
      this.prisma.invoices.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.expenses.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.transactions.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Combine and sort by date
    const activities = [
      ...recentInvoices.map((inv) => ({
        type: 'invoice',
        data: inv,
        date: inv.createdAt,
      })),
      ...recentExpenses.map((exp) => ({
        type: 'expense',
        data: exp,
        date: exp.createdAt,
      })),
      ...recentTransactions.map((txn) => ({
        type: 'transaction',
        data: txn,
        date: txn.createdAt,
      })),
    ];

    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    return activities.slice(0, limit);
  }

  async getTopClients(userId: string, limit: number = 5) {
    const clients = await this.prisma.clients.findMany();
    const invoices = await this.prisma.invoices.findMany({
      where: { invoiceType: 'Sales' },
    });

    const clientStats = clients.map((client) => {
      const clientInvoices = invoices.filter((inv) => inv.party === client.name);
      const totalBusiness = clientInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount || '0'),
        0,
      );

      return {
        client,
        totalBusiness,
        invoiceCount: clientInvoices.length,
      };
    });

    return clientStats
      .sort((a, b) => b.totalBusiness - a.totalBusiness)
      .slice(0, limit);
  }

  async getCashFlowSummary(userId: string, months: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await this.prisma.transactions.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    const monthlyFlow = {};

    transactions.forEach((txn) => {
      const month = new Date(txn.date).toISOString().substr(0, 7);
      if (!monthlyFlow[month]) {
        monthlyFlow[month] = { inflow: 0, outflow: 0, net: 0 };
      }

      const amount = parseFloat(txn.amount || '0');
      if (txn.transactionType.toLowerCase() === 'credit') {
        monthlyFlow[month].inflow += amount;
      } else {
        monthlyFlow[month].outflow += amount;
      }
      monthlyFlow[month].net = monthlyFlow[month].inflow - monthlyFlow[month].outflow;
    });

    return monthlyFlow;
  }

  async getUpcomingDueDates(userId: string, days: number = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcomingInvoices = await this.prisma.invoices.findMany({
      where: {
        status: 'Pending',
        dueDate: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const upcomingGST = await this.prisma.gSTFiling.findMany({
      where: {
        userId,
        status: { not: 'filed' },
        dueDate: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      invoices: upcomingInvoices,
      gstFilings: upcomingGST,
    };
  }

  private calculateMonthlyRevenue(invoices: any[]) {
    const monthlyData = {};
    const now = new Date();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substr(0, 7);
      monthlyData[monthKey] = 0;
    }

    // Calculate actual revenue
    invoices.forEach((inv) => {
      const month = new Date(inv.invoiceDate).toISOString().substr(0, 7);
      if (monthlyData.hasOwnProperty(month)) {
        monthlyData[month] += parseFloat(inv.totalAmount || inv.amount || '0');
      }
    });

    return monthlyData;
  }

  private calculateCategoryExpenses(expenses: any[]) {
    const categoryData = {};

    expenses.forEach((exp) => {
      const category = exp.category || 'Uncategorized';
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += parseFloat(exp.totalAmount || exp.amount || '0');
    });

    return categoryData;
  }

  private isStale(lastUpdated: Date): boolean {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    return lastUpdated < fiveMinutesAgo;
  }
}
