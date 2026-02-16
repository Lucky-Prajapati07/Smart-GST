import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGSTFilingDto,
  UpdateGSTFilingDto,
  CalculateGSTDto,
} from './dto/gst-filing.dto';

@Injectable()
export class GstFilingService {
  constructor(private prisma: PrismaService) {}

  async getAllFilings(userId: string) {
    return this.prisma.gSTFiling.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFilingById(id: number) {
    const filing = await this.prisma.gSTFiling.findUnique({
      where: { id },
    });

    if (!filing) {
      throw new NotFoundException(`GST Filing with ID ${id} not found`);
    }

    return filing;
  }

  async getFilingByPeriod(userId: string, period: string, type: string) {
    const filing = await this.prisma.gSTFiling.findUnique({
      where: {
        userId_filingPeriod_filingType: {
          userId,
          filingPeriod: period,
          filingType: type,
        },
      },
    });

    return filing;
  }

  async createFiling(createFilingDto: CreateGSTFilingDto) {
    return this.prisma.gSTFiling.create({
      data: {
        ...createFilingDto,
        dueDate: new Date(createFilingDto.dueDate),
      },
    });
  }

  async updateFiling(id: number, updateFilingDto: UpdateGSTFilingDto) {
    const filing = await this.prisma.gSTFiling.findUnique({
      where: { id },
    });

    if (!filing) {
      throw new NotFoundException(`GST Filing with ID ${id} not found`);
    }

    return this.prisma.gSTFiling.update({
      where: { id },
      data: {
        ...updateFilingDto,
        filedDate: updateFilingDto.filedDate
          ? new Date(updateFilingDto.filedDate)
          : undefined,
      },
    });
  }

  async calculateGST(calculateDto: CalculateGSTDto) {
    const { userId, filingPeriod, filingType } = calculateDto;

    // Parse the filing period to get start and end dates
    const { startDate, endDate } = this.parsePeriod(filingPeriod);

    // Fetch all invoices for the period
    const invoices = await this.prisma.invoices.findMany({
      where: {
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Fetch all expenses for the period
    const expenses = await this.prisma.expenses.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate totals
    let totalSales = 0;
    let totalPurchases = 0;
    let salesIGST = 0;
    let salesCGST = 0;
    let salesSGST = 0;
    let purchaseIGST = 0;
    let purchaseCGST = 0;
    let purchaseSGST = 0;
    let itcAvailable = 0;

    // Process Sales Invoices
    invoices
      .filter((inv) => inv.invoiceType.toLowerCase() === 'sales')
      .forEach((invoice) => {
        const amount = parseFloat(invoice.amount || '0');
        const gst = parseFloat(invoice.gst || '0');
        totalSales += amount;

        // Assume equal split between CGST and SGST if not interstate
        // In real scenario, check GSTIN to determine IGST vs CGST/SGST
        const isInterstate = this.isInterstateSale(invoice.partyGstin);
        if (isInterstate) {
          salesIGST += gst;
        } else {
          salesCGST += gst / 2;
          salesSGST += gst / 2;
        }
      });

    // Process Purchase Invoices and Expenses
    const purchases = [
      ...invoices.filter((inv) => inv.invoiceType.toLowerCase() === 'purchase'),
      ...expenses,
    ];

    purchases.forEach((item) => {
      const amount =
        'amount' in item
          ? parseFloat(item.amount || '0')
          : parseFloat((item as any).totalAmount || '0');
      const gst =
        'gst' in item
          ? parseFloat(item.gst || '0')
          : parseFloat((item as any).gst || '0');

      totalPurchases += amount;

      // Check if ITC is available
      const itcEligible = 'itc' in item ? item.itc === 'yes' : true;

      if (itcEligible) {
        itcAvailable += gst;

        // Determine IGST vs CGST/SGST
        const isInterstate =
          'partyGstin' in item
            ? this.isInterstateSale(item.partyGstin)
            : false;
        if (isInterstate) {
          purchaseIGST += gst;
        } else {
          purchaseCGST += gst / 2;
          purchaseSGST += gst / 2;
        }
      }
    });

    // Calculate net tax liability
    const totalIGST = salesIGST;
    const totalCGST = salesCGST;
    const totalSGST = salesSGST;
    const taxLiability =
      salesIGST + salesCGST + salesSGST - Math.min(itcAvailable, salesIGST + salesCGST + salesSGST);

    // Prepare calculation breakdown
    const calculationData = {
      invoices: {
        sales: invoices.filter((inv) => inv.invoiceType.toLowerCase() === 'sales').length,
        purchases: invoices.filter((inv) => inv.invoiceType.toLowerCase() === 'purchase')
          .length,
      },
      expenses: expenses.length,
      breakdown: {
        sales: {
          total: totalSales,
          igst: salesIGST,
          cgst: salesCGST,
          sgst: salesSGST,
        },
        purchases: {
          total: totalPurchases,
          igst: purchaseIGST,
          cgst: purchaseCGST,
          sgst: purchaseSGST,
        },
      },
      itc: {
        available: itcAvailable,
        utilized: Math.min(itcAvailable, salesIGST + salesCGST + salesSGST),
      },
    };

    // Check if filing already exists
    const existingFiling = await this.getFilingByPeriod(
      userId,
      filingPeriod,
      filingType,
    );

    const filingData = {
      userId,
      filingPeriod,
      filingType,
      totalSales,
      totalPurchases,
      igst: totalIGST,
      cgst: totalCGST,
      sgst: totalSGST,
      itcAvailable,
      taxLiability,
      calculationData,
      status: 'calculated',
    };

    if (existingFiling) {
      // Update existing filing
      return this.prisma.gSTFiling.update({
        where: { id: existingFiling.id },
        data: filingData,
      });
    } else {
      // Create new filing
      return this.prisma.gSTFiling.create({
        data: {
          ...filingData,
          dueDate: this.calculateDueDate(filingPeriod, filingType),
        },
      });
    }
  }

  async deleteFiling(id: number) {
    const filing = await this.prisma.gSTFiling.findUnique({
      where: { id },
    });

    if (!filing) {
      throw new NotFoundException(`GST Filing with ID ${id} not found`);
    }

    return this.prisma.gSTFiling.delete({
      where: { id },
    });
  }

  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    // Period format: "2024-01" for monthly, "Q1-2024" for quarterly
    if (period.startsWith('Q')) {
      const [quarter, year] = period.split('-');
      const q = parseInt(quarter.substring(1));
      const startMonth = (q - 1) * 3;
      return {
        startDate: new Date(parseInt(year), startMonth, 1),
        endDate: new Date(parseInt(year), startMonth + 3, 0),
      };
    } else {
      const [year, month] = period.split('-');
      return {
        startDate: new Date(parseInt(year), parseInt(month) - 1, 1),
        endDate: new Date(parseInt(year), parseInt(month), 0),
      };
    }
  }

  private isInterstateSale(gstin: string): boolean {
    // Extract state code from GSTIN (first 2 digits)
    // Compare with your company's GSTIN
    // For now, return false (assuming intrastate)
    return false;
  }

  private calculateDueDate(period: string, type: string): Date {
    const { endDate } = this.parsePeriod(period);
    const dueDate = new Date(endDate);

    // GSTR1 - 11th of next month
    // GSTR3B - 20th of next month
    if (type === 'GSTR1') {
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(11);
    } else if (type === 'GSTR3B') {
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(20);
    } else {
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(15);
    }

    return dueDate;
  }
}
