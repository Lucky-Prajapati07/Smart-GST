import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getRevenueSummary(userId: string) {
    const invoices = await this.prisma.invoices.findMany({
      where: { userId },
      select: {
        totalAmount: true,
        amount: true,
        assessableValue: true,
        gst: true,
        igstValue: true,
        cgstValue: true,
        sgstValue: true,
        items: true,
      },
    });

    const totalInvoiceAmount = invoices.reduce(
      (sum, invoice) => sum + this.getInvoiceTotalAmount(invoice),
      0,
    );

    return {
      userId,
      totalInvoiceAmount,
      invoiceCount: invoices.length,
    };
  }

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

    // Fetch all data
    const [invoices, expenses, clients, transactions, pendingInvoices, overdueInvoices] = await Promise.all([
      this.prisma.invoices.findMany({ where: { userId } }),
      this.prisma.expenses.findMany({ where: { userId } }),
      this.prisma.clients.findMany({ where: { userId } }),
      this.prisma.transactions.findMany({ where: { userId } }),
      this.prisma.invoices.count({
        where: {
          userId,
          status: {
            equals: 'pending',
            mode: 'insensitive',
          },
        },
      }),
      this.prisma.invoices.count({
        where: {
          userId,
          status: {
            equals: 'pending',
            mode: 'insensitive',
          },
          dueDate: {
            lt: now,
          },
        },
      }),
    ]);

    // Calculate total revenue from all invoices (sum of totalAmount/amount)
    const revenueSummary = await this.getRevenueSummary(userId);
    const totalRevenue = revenueSummary.totalInvoiceAmount;

    // Calculate total expenses
    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + this.parseAmount(exp.totalAmount || exp.amount),
      0,
    );

    const gstLiability = await this.resolveGstLiability(userId, invoices, expenses);

    // Calculate monthly revenue (last 12 months)
    const monthlyRevenue = this.calculateMonthlyRevenue(invoices);

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
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.expenses.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.transactions.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const invoiceItems = recentInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      partyName: inv.party,
      totalAmount: this.getInvoiceTotalAmount(inv).toString(),
      status: inv.status || 'Pending',
      invoiceDate: inv.invoiceDate.toISOString(),
    }));

    const expenseItems = recentExpenses.map((exp) => ({
      id: exp.id,
      title: exp.title,
      vendor: exp.vendor || '',
      totalAmount: this.parseAmount(exp.totalAmount || exp.amount).toString(),
      status: exp.status || 'Pending',
      date: exp.date.toISOString(),
    }));

    // Keep combined stream for compatibility/debug.
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

    return {
      invoices: invoiceItems,
      expenses: expenseItems,
      transactions: recentTransactions,
      activities: activities.slice(0, limit),
    };
  }

  async getTopClients(userId: string, limit: number = 5) {
    const clients = await this.prisma.clients.findMany({
      where: { userId },
    });
    const invoices = await this.prisma.invoices.findMany({
      where: {
        userId,
        invoiceType: {
          equals: 'Sales',
          mode: 'insensitive',
        },
      },
    });

    const clientStats = clients.map((client) => {
      const clientInvoices = invoices.filter((inv) => inv.party === client.name);
      const totalBusiness = clientInvoices.reduce(
        (sum, inv) => sum + this.getInvoiceTotalAmount(inv),
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
        userId,
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
        userId,
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
        monthlyData[month] += this.getInvoiceTotalAmount(inv);
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
      categoryData[category] += this.parseAmount(exp.totalAmount || exp.amount);
    });

    return categoryData;
  }

  private isStale(lastUpdated: Date): boolean {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    return lastUpdated < fiveMinutesAgo;
  }

  private parseAmount(value?: string | null): number {
    if (!value) {
      return 0;
    }

    const normalized = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getInvoiceTotalAmount(invoice: any): number {
    const directAmount = this.parseAmount(invoice.totalAmount || invoice.amount);
    if (directAmount > 0) {
      return directAmount;
    }

    const itemsAmount = this.calculateItemsTotal(invoice.items);
    if (itemsAmount > 0) {
      return itemsAmount;
    }

    const assessable = this.parseAmount(invoice.assessableValue);
    const taxFromFields =
      this.parseAmount(invoice.gst) ||
      this.parseAmount(invoice.igstValue) +
        this.parseAmount(invoice.cgstValue) +
        this.parseAmount(invoice.sgstValue);

    const derivedAmount = assessable + taxFromFields;
    return derivedAmount > 0 ? derivedAmount : 0;
  }

  private calculateItemsTotal(items: unknown): number {
    if (!Array.isArray(items)) {
      return 0;
    }

    return items.reduce((sum: number, item: any) => {
      if (!item || typeof item !== 'object') {
        return sum;
      }

      const itemAmount = Number(item.amount);
      if (Number.isFinite(itemAmount) && itemAmount > 0) {
        return sum + itemAmount;
      }

      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const discountPct = Number(item.discount) || 0;
      const taxRatePct = Number(item.taxRate) || 0;

      const baseAmount = quantity * price;
      const discountAmount = (baseAmount * discountPct) / 100;
      const taxableAmount = Math.max(baseAmount - discountAmount, 0);
      const taxAmount = (taxableAmount * taxRatePct) / 100;

      return sum + taxableAmount + taxAmount;
    }, 0);
  }

  private async resolveGstLiability(
    userId: string,
    invoices: any[],
    expenses: any[],
  ): Promise<number> {
    const latestComputedFiling = await this.prisma.gSTFiling.findFirst({
      where: {
        userId,
        status: {
          in: ['calculated', 'validated', 'filed', 'submitted'],
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (latestComputedFiling) {
      const fromFiling = this.extractLiabilityFromFiling(latestComputedFiling);
      if (fromFiling > 0) {
        return fromFiling;
      }
    }

    // Fallback: invoices contribute outward GST, expenses with eligible ITC reduce liability.
    const outputTax = invoices.reduce(
      (sum, inv) => sum + this.getInvoiceTaxAmount(inv),
      0,
    );

    const eligibleExpenseTax = expenses
      .filter((exp) => this.isItcEligible(exp.itc))
      .reduce((sum, exp) => sum + this.parseAmount(exp.gst), 0);

    return this.round2(Math.max(outputTax - eligibleExpenseTax, 0));
  }

  private extractLiabilityFromFiling(filing: any): number {
    const calculationData =
      filing?.calculationData && typeof filing.calculationData === 'object'
        ? (filing.calculationData as Record<string, any>)
        : {};

    const totalPayable = this.parseAmount(
      calculationData?.gstr3b?.net_tax_payable?.total_payable,
    );
    if (totalPayable > 0) {
      return this.round2(totalPayable);
    }

    const summaryNetPayable = this.parseAmount(calculationData?.summary?.net_payable);
    if (summaryNetPayable > 0) {
      return this.round2(summaryNetPayable);
    }

    const directTaxLiability = this.parseAmount(filing?.taxLiability?.toString());
    return this.round2(Math.max(directTaxLiability, 0));
  }

  private getInvoiceTaxAmount(invoice: any): number {
    const directTax = this.parseAmount(invoice.gst);
    if (directTax > 0) {
      return directTax;
    }

    const componentTax =
      this.parseAmount(invoice.igstValue) +
      this.parseAmount(invoice.cgstValue) +
      this.parseAmount(invoice.sgstValue);

    if (componentTax > 0) {
      return componentTax;
    }

    const totalAmount = this.getInvoiceTotalAmount(invoice);
    const taxableAmount =
      this.parseAmount(invoice.assessableValue) || this.parseAmount(invoice.amount);

    if (totalAmount > taxableAmount && taxableAmount > 0) {
      return this.round2(totalAmount - taxableAmount);
    }

    return 0;
  }

  private isItcEligible(value: unknown): boolean {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    return ['yes', 'y', 'true', '1', 'eligible', 'claimed'].includes(normalized);
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
