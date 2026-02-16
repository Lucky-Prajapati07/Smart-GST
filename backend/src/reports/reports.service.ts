import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateReportDto } from './dto/reports.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getAllReports(userId: string) {
    return this.prisma.report.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async getReportById(id: number) {
    return this.prisma.report.findUnique({
      where: { id },
    });
  }

  async generateReport(generateReportDto: GenerateReportDto) {
    const { userId, reportType, reportName, period, startDate, endDate, parameters } =
      generateReportDto;

    let reportData: any = {};

    switch (reportType) {
      case 'sales':
        reportData = await this.generateSalesReport(userId, new Date(startDate), new Date(endDate));
        break;
      case 'purchase':
        reportData = await this.generatePurchaseReport(userId, new Date(startDate), new Date(endDate));
        break;
      case 'gst':
        reportData = await this.generateGSTReport(userId, new Date(startDate), new Date(endDate));
        break;
      case 'profit-loss':
        reportData = await this.generateProfitLossReport(userId, new Date(startDate), new Date(endDate));
        break;
      case 'expense':
        reportData = await this.generateExpenseReport(userId, new Date(startDate), new Date(endDate));
        break;
      case 'client':
        reportData = await this.generateClientReport(userId);
        break;
      case 'transaction':
        reportData = await this.generateTransactionReport(userId, new Date(startDate), new Date(endDate));
        break;
    }

    // Save report
    return this.prisma.report.create({
      data: {
        userId,
        reportType,
        reportName,
        period,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        data: reportData,
        parameters,
      },
    });
  }

  async deleteReport(id: number) {
    return this.prisma.report.delete({
      where: { id },
    });
  }

  private async generateSalesReport(userId: string, startDate: Date, endDate: Date) {
    const salesInvoices = await this.prisma.invoices.findMany({
      where: {
        userId,
        invoiceType: 'Sales',
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    const totalSales = salesInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount || '0'),
      0,
    );
    const totalGST = salesInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.gst || '0'),
      0,
    );

    const monthlyBreakdown = this.groupByMonth(salesInvoices, 'invoiceDate');
    const partyWiseBreakdown = this.groupByParty(salesInvoices);
    const statusBreakdown = this.groupByStatus(salesInvoices);

    return {
      summary: {
        totalInvoices: salesInvoices.length,
        totalSales,
        totalGST,
        averageInvoiceValue: totalSales / (salesInvoices.length || 1),
      },
      invoices: salesInvoices,
      monthlyBreakdown,
      partyWiseBreakdown,
      statusBreakdown,
    };
  }

  private async generatePurchaseReport(userId: string, startDate: Date, endDate: Date) {
    const purchaseInvoices = await this.prisma.invoices.findMany({
      where: {
        userId,
        invoiceType: 'Purchase',
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    const totalPurchases = purchaseInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount || '0'),
      0,
    );
    const totalGST = purchaseInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.gst || '0'),
      0,
    );

    return {
      summary: {
        totalInvoices: purchaseInvoices.length,
        totalPurchases,
        totalGST,
        averageInvoiceValue: totalPurchases / (purchaseInvoices.length || 1),
      },
      invoices: purchaseInvoices,
      monthlyBreakdown: this.groupByMonth(purchaseInvoices, 'invoiceDate'),
      partyWiseBreakdown: this.groupByParty(purchaseInvoices),
    };
  }

  private async generateGSTReport(userId: string, startDate: Date, endDate: Date) {
    const invoices = await this.prisma.invoices.findMany({
      where: {
        userId,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const expenses = await this.prisma.expenses.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const salesGST = invoices
      .filter((inv) => inv.invoiceType === 'Sales')
      .reduce((sum, inv) => sum + parseFloat(inv.gst || '0'), 0);

    const purchaseGST = invoices
      .filter((inv) => inv.invoiceType === 'Purchase')
      .reduce((sum, inv) => sum + parseFloat(inv.gst || '0'), 0);

    const expenseGST = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.gst || '0'),
      0,
    );

    const itcAvailable = expenses
      .filter((exp) => exp.itc === 'yes')
      .reduce((sum, exp) => sum + parseFloat(exp.gst || '0'), 0) + purchaseGST;

    const netGSTLiability = salesGST - itcAvailable;

    return {
      summary: {
        salesGST,
        purchaseGST,
        expenseGST,
        totalITC: itcAvailable,
        netLiability: Math.max(netGSTLiability, 0),
      },
      breakdown: {
        sales: this.groupByMonth(
          invoices.filter((inv) => inv.invoiceType === 'Sales'),
          'invoiceDate',
        ),
        purchases: this.groupByMonth(
          invoices.filter((inv) => inv.invoiceType === 'Purchase'),
          'invoiceDate',
        ),
        expenses: this.groupByMonth(expenses, 'date'),
      },
    };
  }

  private async generateProfitLossReport(userId: string, startDate: Date, endDate: Date) {
    const salesInvoices = await this.prisma.invoices.findMany({
      where: {
        userId,
        invoiceType: 'Sales',
        invoiceDate: { gte: startDate, lte: endDate },
      },
    });

    const purchaseInvoices = await this.prisma.invoices.findMany({
      where: {
        userId,
        invoiceType: 'Purchase',
        invoiceDate: { gte: startDate, lte: endDate },
      },
    });

    const expenses = await this.prisma.expenses.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalRevenue = salesInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.amount || '0'),
      0,
    );

    const costOfGoods = purchaseInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.amount || '0'),
      0,
    );

    const operatingExpenses = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount || '0'),
      0,
    );

    const grossProfit = totalRevenue - costOfGoods;
    const netProfit = grossProfit - operatingExpenses;
    const profitMargin = (netProfit / totalRevenue) * 100;

    return {
      summary: {
        totalRevenue,
        costOfGoods,
        grossProfit,
        operatingExpenses,
        netProfit,
        profitMargin: profitMargin.toFixed(2),
      },
      expenseBreakdown: this.groupByCategory(expenses),
      monthlyTrend: this.calculateMonthlyProfitLoss(
        salesInvoices,
        purchaseInvoices,
        expenses,
      ),
    };
  }

  private async generateExpenseReport(userId: string, startDate: Date, endDate: Date) {
    const expenses = await this.prisma.expenses.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.totalAmount || exp.amount || '0'),
      0,
    );

    return {
      summary: {
        totalExpenses,
        totalCount: expenses.length,
        averageExpense: totalExpenses / (expenses.length || 1),
      },
      expenses,
      categoryBreakdown: this.groupByCategory(expenses),
      monthlyBreakdown: this.groupByMonth(expenses, 'date'),
      paymentModeBreakdown: this.groupByPaymentMode(expenses),
    };
  }

  private async generateClientReport(userId: string) {
    const clients = await this.prisma.clients.findMany({
      where: { userId },
    });
    const invoices = await this.prisma.invoices.findMany({
      where: { userId },
    });

    const clientStats = clients.map((client) => {
      const clientInvoices = invoices.filter((inv) => inv.party === client.name);
      const totalBusiness = clientInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.totalAmount || inv.amount || '0'),
        0,
      );
      const pendingInvoices = clientInvoices.filter(
        (inv) => inv.status === 'Pending',
      ).length;

      return {
        ...client,
        totalInvoices: clientInvoices.length,
        totalBusiness,
        pendingInvoices,
      };
    });

    return {
      summary: {
        totalClients: clients.length,
        activeClients: clientStats.filter((c) => c.totalInvoices > 0).length,
      },
      clients: clientStats,
    };
  }

  private async generateTransactionReport(userId: string, startDate: Date, endDate: Date) {
    const transactions = await this.prisma.transactions.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });

    const credits = transactions
      .filter((t) => t.transactionType === 'Credit')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    const debits = transactions
      .filter((t) => t.transactionType === 'Debit')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

    return {
      summary: {
        totalTransactions: transactions.length,
        totalCredits: credits,
        totalDebits: debits,
        netCashFlow: credits - debits,
      },
      transactions,
      typeBreakdown: {
        credits: transactions.filter((t) => t.transactionType === 'Credit').length,
        debits: transactions.filter((t) => t.transactionType === 'Debit').length,
      },
      modeBreakdown: this.groupByMode(transactions),
      monthlyBreakdown: this.groupByMonth(transactions, 'date'),
    };
  }

  // Helper functions
  private groupByMonth(data: any[], dateField: string) {
    const grouped = {};
    data.forEach((item) => {
      const date = new Date(item[dateField]);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[month]) {
        grouped[month] = { count: 0, total: 0 };
      }
      grouped[month].count++;
      grouped[month].total += parseFloat(
        item.totalAmount || item.amount || '0',
      );
    });
    return grouped;
  }

  private groupByParty(invoices: any[]) {
    const grouped = {};
    invoices.forEach((inv) => {
      if (!grouped[inv.party]) {
        grouped[inv.party] = { count: 0, total: 0 };
      }
      grouped[inv.party].count++;
      grouped[inv.party].total += parseFloat(
        inv.totalAmount || inv.amount || '0',
      );
    });
    return grouped;
  }

  private groupByStatus(invoices: any[]) {
    const grouped = {};
    invoices.forEach((inv) => {
      const status = inv.status || 'Unknown';
      if (!grouped[status]) {
        grouped[status] = 0;
      }
      grouped[status]++;
    });
    return grouped;
  }

  private groupByCategory(expenses: any[]) {
    const grouped = {};
    expenses.forEach((exp) => {
      const category = exp.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = { count: 0, total: 0 };
      }
      grouped[category].count++;
      grouped[category].total += parseFloat(
        exp.totalAmount || exp.amount || '0',
      );
    });
    return grouped;
  }

  private groupByPaymentMode(expenses: any[]) {
    const grouped = {};
    expenses.forEach((exp) => {
      const mode = exp.paymentMode || 'Unknown';
      if (!grouped[mode]) {
        grouped[mode] = { count: 0, total: 0 };
      }
      grouped[mode].count++;
      grouped[mode].total += parseFloat(
        exp.totalAmount || exp.amount || '0',
      );
    });
    return grouped;
  }

  private groupByMode(transactions: any[]) {
    const grouped = {};
    transactions.forEach((t) => {
      const mode = t.mode || 'Unknown';
      if (!grouped[mode]) {
        grouped[mode] = { count: 0, total: 0 };
      }
      grouped[mode].count++;
      grouped[mode].total += parseFloat(t.amount || '0');
    });
    return grouped;
  }

  private calculateMonthlyProfitLoss(sales: any[], purchases: any[], expenses: any[]) {
    const months = {};

    // Process sales
    sales.forEach((inv) => {
      const month = new Date(inv.invoiceDate).toISOString().substr(0, 7);
      if (!months[month]) {
        months[month] = { revenue: 0, cogs: 0, expenses: 0 };
      }
      months[month].revenue += parseFloat(inv.amount || '0');
    });

    // Process purchases
    purchases.forEach((inv) => {
      const month = new Date(inv.invoiceDate).toISOString().substr(0, 7);
      if (!months[month]) {
        months[month] = { revenue: 0, cogs: 0, expenses: 0 };
      }
      months[month].cogs += parseFloat(inv.amount || '0');
    });

    // Process expenses
    expenses.forEach((exp) => {
      const month = new Date(exp.date).toISOString().substr(0, 7);
      if (!months[month]) {
        months[month] = { revenue: 0, cogs: 0, expenses: 0 };
      }
      months[month].expenses += parseFloat(exp.amount || '0');
    });

    // Calculate profit for each month
    Object.keys(months).forEach((month) => {
      const data = months[month];
      months[month].profit =
        data.revenue - data.cogs - data.expenses;
    });

    return months;
  }
}
