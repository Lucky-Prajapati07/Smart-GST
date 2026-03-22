import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGSTFilingDto,
  UpdateGSTFilingDto,
  CalculateGSTDto,
} from './dto/gst-filing.dto';

type FilingWindow = {
  startDate: Date;
  endDate: Date;
};

type GstError = {
  type: string;
  message: string;
  reference?: string;
};

type TaxLine = {
  sourceType: 'invoice' | 'expense';
  entryType: 'sale' | 'purchase';
  reference: string;
  date: Date;
  gstin: string;
  hsn: string;
  taxableValue: number;
  taxRate: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalTax: number;
  totalAmount: number;
  interstate: boolean;
  placeOfSupply: string;
  stateCode: string;
  isB2B: boolean;
  isCreditNote: boolean;
  isDebitNote: boolean;
  isRcm: boolean;
  itcEligible: boolean;
  supplyClass: 'taxable' | 'zero_rated' | 'exempt' | 'nil_rated';
  isMatchedItc?: boolean;
};

type TaxSummary = {
  outward: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    totalTax: number;
    totalAmount: number;
  };
  inward: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    totalTax: number;
    totalAmount: number;
  };
  itcEligible: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    total: number;
  };
  rcmLiability: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    total: number;
  };
  itcMatched: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    total: number;
  };
  itcUnmatched: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    total: number;
  };
  stateWiseSales: Record<string, number>;
};

@Injectable()
export class GstFilingService {
  constructor(private prisma: PrismaService) {}

  async getAllFilings(userId: string) {
    return this.prisma.gSTFiling.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPreviewMetrics(userId: string) {
    const fetchRecentFilings = () =>
      this.prisma.gSTFiling.findMany({
        where: { userId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        take: 50,
      });

    let filings = await fetchRecentFilings();

    if (!filings.length) {
      return {
        filingId: null,
        filingPeriod: null,
        filingType: null,
        status: null,
        taxableSales: 0,
        outputTax: 0,
        itcUtilized: 0,
        netPayable: 0,
        hasComputedData: false,
      };
    }

    let filingsWithMetrics = filings.map((filing) => ({
      filing,
      metrics: this.extractPreviewMetricsFromFiling(filing),
    }));

    const hasAnyNonZeroMetrics = filingsWithMetrics.some(
      (entry) =>
        entry.metrics.taxableSales > 0 ||
        entry.metrics.outputTax > 0 ||
        entry.metrics.itcUtilized > 0 ||
        entry.metrics.netPayable > 0,
    );

    if (!hasAnyNonZeroMetrics) {
      const latest = filings[0];
      try {
        await this.calculateGST({
          userId,
          filingPeriod: latest.filingPeriod,
          filingType: latest.filingType,
        });
        filings = await fetchRecentFilings();
        filingsWithMetrics = filings.map((filing) => ({
          filing,
          metrics: this.extractPreviewMetricsFromFiling(filing),
        }));
      } catch {
        // Keep existing snapshot if recalculation fails.
      }
    }

    const preferred =
      filingsWithMetrics.find(
        (entry) =>
          entry.metrics.taxableSales > 0 ||
          entry.metrics.outputTax > 0 ||
          entry.metrics.itcUtilized > 0 ||
          entry.metrics.netPayable > 0,
      ) ||
      filingsWithMetrics.find((entry) => entry.metrics.hasComputedData) ||
      filingsWithMetrics[0];

    return {
      filingId: preferred.filing.id,
      filingPeriod: preferred.filing.filingPeriod,
      filingType: preferred.filing.filingType,
      status: preferred.filing.status,
      ...preferred.metrics,
    };
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
    const filingType = this.normalizeFilingType(type);
    const filing = await this.prisma.gSTFiling.findUnique({
      where: {
        userId_filingPeriod_filingType: {
          userId,
          filingPeriod: period,
          filingType,
        },
      },
    });

    return filing;
  }

  async createFiling(createFilingDto: CreateGSTFilingDto) {
    const filingPeriod = String(createFilingDto.filingPeriod || '').trim();
    if (!filingPeriod) {
      throw new BadRequestException('filingPeriod is required');
    }

    const filingType = this.normalizeFilingType(createFilingDto.filingType);
    const dueDate = createFilingDto.dueDate
      ? new Date(createFilingDto.dueDate)
      : this.calculateDueDate(filingPeriod, filingType);

    return this.prisma.gSTFiling.upsert({
      where: {
        userId_filingPeriod_filingType: {
          userId: createFilingDto.userId,
          filingPeriod,
          filingType,
        },
      },
      create: {
        userId: createFilingDto.userId,
        filingPeriod,
        filingType,
        dueDate,
        status: 'draft',
      },
      update: {
        dueDate,
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
        status: this.normalizeStatus(updateFilingDto.status),
        filedDate: updateFilingDto.filedDate
          ? new Date(updateFilingDto.filedDate)
          : undefined,
      },
    });
  }

  async calculateGST(calculateDto: CalculateGSTDto) {
    const { userId } = calculateDto;
    const filingPeriod = calculateDto.filingPeriod;
    const filingType = this.normalizeFilingType(calculateDto.filingType);

    const { startDate, endDate } = this.resolveDateWindow(calculateDto);
    const normalizedPeriod = filingPeriod || this.derivePeriod(startDate, endDate);
    const errors: GstError[] = [];

    const dataset = await this.fetchDataByDateRange(userId, startDate, endDate);

    const invoiceMap = new Map<string, number>();
    dataset.allInvoices.forEach((invoice) => {
      const key = String(invoice.invoiceNumber || '').trim().toUpperCase();
      if (!key) {
        return;
      }
      const count = invoiceMap.get(key) || 0;
      invoiceMap.set(key, count + 1);
    });

    invoiceMap.forEach((count, reference) => {
      if (count > 1) {
        errors.push({
          type: 'duplicate_invoice',
          reference,
          message: `Duplicate invoice number detected in period: ${reference}`,
        });
      }
    });

    // As requested, invoices contribute to taxable sales/output tax.
    const salesLines = dataset.allInvoices.flatMap((invoice) =>
      this.calculateTax(invoice, 'sale', dataset.sellerStateCode, startDate, endDate, errors),
    );
    const expenseLines = dataset.expenses.flatMap((expense) =>
      this.calculateExpenseTax(expense, dataset.sellerStateCode, startDate, endDate, errors),
    );

    // Taxable purchases are derived only from expense entries carrying GST.
    const purchaseLines = expenseLines.filter((line) => line.totalTax > 0);
    const itcMatch = this.matchItc(purchaseLines);
    const taxSummary = this.aggregateTax(salesLines, purchaseLines, itcMatch.matched);
    errors.push(...this.validateData(salesLines, purchaseLines));
    const gstr1 = this.generateGSTR1(salesLines);

    const carryForward = await this.getCarryForwardCredits(userId, normalizedPeriod);
    const gstr3b = this.generateGSTR3B(taxSummary, carryForward);

    const summary = {
      period: {
        filingPeriod: normalizedPeriod,
        filingType,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      },
      taxes: {
        output: {
          igst: this.round2(taxSummary.outward.igst),
          cgst: this.round2(taxSummary.outward.cgst),
          sgst: this.round2(taxSummary.outward.sgst),
          cess: this.round2(taxSummary.outward.cess),
          total: this.round2(taxSummary.outward.totalTax),
        },
        input: {
          igst: this.round2(taxSummary.inward.igst),
          cgst: this.round2(taxSummary.inward.cgst),
          sgst: this.round2(taxSummary.inward.sgst),
          cess: this.round2(taxSummary.inward.cess),
          total: this.round2(taxSummary.inward.totalTax),
        },
        itc_eligible: {
          igst: this.round2(taxSummary.itcEligible.igst),
          cgst: this.round2(taxSummary.itcEligible.cgst),
          sgst: this.round2(taxSummary.itcEligible.sgst),
          cess: this.round2(taxSummary.itcEligible.cess),
          total: this.round2(taxSummary.itcEligible.total),
        },
      },
      totals: {
        salesCount: dataset.allInvoices.length,
        purchaseCount: purchaseLines.length,
        expenseCount: dataset.expenses.length,
        totalSalesTaxable: this.round2(taxSummary.outward.taxableValue),
        totalPurchasesTaxable: this.round2(taxSummary.inward.taxableValue),
        totalSalesTax: this.round2(taxSummary.outward.totalTax),
        totalPurchaseTax: this.round2(taxSummary.inward.totalTax),
        outputIgst: this.round2(taxSummary.outward.igst),
        outputCgst: this.round2(taxSummary.outward.cgst),
        outputSgst: this.round2(taxSummary.outward.sgst),
        outputCess: this.round2(taxSummary.outward.cess),
        inputIgst: this.round2(taxSummary.inward.igst),
        inputCgst: this.round2(taxSummary.inward.cgst),
        inputSgst: this.round2(taxSummary.inward.sgst),
        inputCess: this.round2(taxSummary.inward.cess),
        netPayableIgst: this.round2(gstr3b.net_tax_payable.igst),
        netPayableCgst: this.round2(gstr3b.net_tax_payable.cgst),
        netPayableSgst: this.round2(gstr3b.net_tax_payable.sgst),
        netPayableCess: this.round2(gstr3b.net_tax_payable.cess),
        netPayableTotal: this.round2(
          gstr3b.net_tax_payable.igst +
            gstr3b.net_tax_payable.cgst +
            gstr3b.net_tax_payable.sgst +
            gstr3b.net_tax_payable.cess,
        ),
      },
      taxable_sales: this.round2(taxSummary.outward.taxableValue),
      taxable_purchases: this.round2(taxSummary.inward.taxableValue),
      output_tax: this.round2(taxSummary.outward.totalTax),
      input_tax: this.round2(taxSummary.inward.totalTax),
      itc_utilized: this.round2(taxSummary.itcMatched.total),
      net_payable: this.round2(
        gstr3b.net_tax_payable.igst +
          gstr3b.net_tax_payable.cgst +
          gstr3b.net_tax_payable.sgst +
          gstr3b.net_tax_payable.cess,
      ),
      state_wise_sales: taxSummary.stateWiseSales,
      itc_matching: {
        matched_count: itcMatch.matched.length,
        unmatched_count: itcMatch.unmatched.length,
      },
      carry_forward: {
        input: carryForward,
        output: gstr3b.carry_forward,
      },
    };

    const calculationData = {
      summary,
      gstr1,
      gstr3b,
      itc_matching: {
        matched: itcMatch.matched.map((line) => ({
          reference: line.reference,
          gstin: line.gstin,
          date: line.date.toISOString().slice(0, 10),
          total_tax: line.totalTax,
        })),
        unmatched: itcMatch.unmatched.map((line) => ({
          reference: line.reference,
          gstin: line.gstin,
          date: line.date.toISOString().slice(0, 10),
          total_tax: line.totalTax,
        })),
      },
      edge_cases: this.buildEdgeCaseSummary(salesLines, purchaseLines),
      errors,
    };

    const existingFiling = await this.getFilingByPeriod(
      userId,
      normalizedPeriod,
      filingType,
    );

    const filingData = {
      userId,
      filingPeriod: normalizedPeriod,
      filingType,
      totalSales: this.round2(taxSummary.outward.taxableValue),
      totalPurchases: this.round2(taxSummary.inward.taxableValue),
      igst: this.round2(taxSummary.outward.igst),
      cgst: this.round2(taxSummary.outward.cgst),
      sgst: this.round2(taxSummary.outward.sgst),
      cess: this.round2(taxSummary.outward.cess),
      itcAvailable: this.round2(taxSummary.itcEligible.total),
      taxLiability: this.round2(
        gstr3b.net_tax_payable.igst +
          gstr3b.net_tax_payable.cgst +
          gstr3b.net_tax_payable.sgst +
          gstr3b.net_tax_payable.cess,
      ),
      calculationData: calculationData as Prisma.InputJsonValue,
      status: errors.length > 0 ? 'draft' as const : 'calculated' as const,
    };

    if (existingFiling) {
      return this.prisma.gSTFiling.update({
        where: { id: existingFiling.id },
        data: filingData,
      });
    }

    return this.prisma.gSTFiling.create({
      data: {
        ...filingData,
        dueDate: this.calculateDueDate(normalizedPeriod, filingType),
      },
    });
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

  async validateFiling(id: number, userId: string) {
    const filing = await this.prisma.gSTFiling.findFirst({
      where: { id, userId },
    });

    if (!filing) {
      throw new NotFoundException(`GST Filing with ID ${id} not found`);
    }

    const calculationData = (filing.calculationData || {}) as Record<string, any>;
    const errors = Array.isArray(calculationData.errors) ? calculationData.errors : [];

    const status = errors.length === 0 ? 'validated' : 'draft';
    const updated = await this.prisma.gSTFiling.update({
      where: { id },
      data: { status },
    });

    return {
      filing: updated,
      valid: errors.length === 0,
      errors,
    };
  }

  async createPaymentRecord(id: number, userId: string, reference?: string) {
    const filing = await this.prisma.gSTFiling.findFirst({ where: { id, userId } });
    if (!filing) {
      throw new NotFoundException(`GST Filing with ID ${id} not found`);
    }

    const amount = this.toNumber(filing.taxLiability);
    if (amount <= 0) {
      return {
        message: 'No payment required. Net GST payable is zero.',
        amount,
        paymentRequired: false,
      };
    }

    const payment = await this.prisma.gSTPayment.create({
      data: {
        userId,
        filingId: id,
        amount,
        status: 'pending',
        reference: reference || `GST-PAY-${Date.now()}`,
      },
    });

    return {
      paymentRequired: true,
      payment,
    };
  }

  async markPaymentPaid(id: number, paymentId: number, userId: string, reference?: string) {
    const payment = await this.prisma.gSTPayment.findFirst({
      where: { id: paymentId, filingId: id, userId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment record ${paymentId} not found for filing ${id}`);
    }

    const updatedPayment = await this.prisma.gSTPayment.update({
      where: { id: paymentId },
      data: {
        status: 'paid',
        paymentDate: new Date(),
        reference: reference || payment.reference,
      },
    });

    await this.prisma.gSTFiling.update({
      where: { id },
      data: {
        taxPaid: payment.amount,
      },
    });

    return updatedPayment;
  }

  async fileReturn(id: number, userId: string) {
    const filing = await this.prisma.gSTFiling.findFirst({ where: { id, userId } });
    if (!filing) {
      throw new NotFoundException(`GST Filing with ID ${id} not found`);
    }

    const calcData = (filing.calculationData || {}) as Record<string, any>;
    const errors = Array.isArray(calcData.errors) ? calcData.errors : [];
    if (errors.length > 0) {
      throw new BadRequestException('Cannot file return with validation errors. Please validate and fix data.');
    }

    const paymentRequired = this.toNumber(filing.taxLiability) > 0;
    if (paymentRequired) {
      const paid = await this.prisma.gSTPayment.findFirst({
        where: {
          filingId: id,
          userId,
          status: 'paid',
        },
      });

      if (!paid) {
        throw new BadRequestException('Payment pending. Mark payment as paid before filing.');
      }
    }

    const finalPayload = {
      filing_id: filing.id,
      user_id: filing.userId,
      period: filing.filingPeriod,
      filing_type: filing.filingType,
      generated_at: new Date().toISOString(),
      gstr1: calcData.gstr1 || {},
      gstr3b: calcData.gstr3b || {},
      summary: calcData.summary || {},
      status: 'FILED',
      payments: await this.prisma.gSTPayment.findMany({
        where: { filingId: id, userId },
        orderBy: { createdAt: 'desc' },
      }),
    };

    const updated = await this.prisma.gSTFiling.update({
      where: { id },
      data: {
        status: 'filed',
        filedDate: new Date(),
        arn: `ARN-${Date.now()}`,
        calculationData: {
          ...(calcData as Record<string, unknown>),
          final_payload: finalPayload,
          locked: true,
          locked_at: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return {
      filing: updated,
      final_payload: finalPayload,
    };
  }

  async exportReturn(id: number, userId: string, format: string) {
    const filing = await this.prisma.gSTFiling.findFirst({ where: { id, userId } });
    if (!filing) {
      throw new NotFoundException(`GST Filing with ID ${id} not found`);
    }

    const calcData = (filing.calculationData || {}) as Record<string, any>;
    const exportPayload = {
      filing: {
        id: filing.id,
        filingPeriod: filing.filingPeriod,
        filingType: filing.filingType,
        status: filing.status,
        dueDate: filing.dueDate,
      },
      summary: calcData.summary || {},
      gstr1: calcData.gstr1 || {},
      gstr3b: calcData.gstr3b || {},
      errors: calcData.errors || [],
      payments: await this.prisma.gSTPayment.findMany({
        where: { filingId: id, userId },
        orderBy: { createdAt: 'desc' },
      }),
      format: (format || 'json').toLowerCase(),
      generated_at: new Date().toISOString(),
    };

    return exportPayload;
  }

  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    // Period format: "2024-01" for monthly, "Q1-2024" for quarterly
    if (period.startsWith('Q')) {
      const [quarter, year] = period.split('-');
      const q = parseInt(quarter.substring(1));
      const startMonth = (q - 1) * 3;
      return {
        startDate: this.startOfDay(new Date(parseInt(year), startMonth, 1)),
        endDate: this.endOfDay(new Date(parseInt(year), startMonth + 3, 0)),
      };
    } else {
      const [year, month] = period.split('-');
      return {
        startDate: this.startOfDay(new Date(parseInt(year), parseInt(month) - 1, 1)),
        endDate: this.endOfDay(new Date(parseInt(year), parseInt(month), 0)),
      };
    }
  }

  private resolveDateWindow(calculateDto: CalculateGSTDto): FilingWindow {
    const typedDto = calculateDto as CalculateGSTDto & {
      startDate?: string;
      endDate?: string;
      start_date?: string;
      end_date?: string;
      filingFrequency?: string;
      filing_frequency?: string;
    };

    const startInput = typedDto.startDate || typedDto.start_date;
    const endInput = typedDto.endDate || typedDto.end_date;

    if (startInput && endInput) {
      return {
        startDate: this.startOfDay(new Date(startInput)),
        endDate: this.endOfDay(new Date(endInput)),
      };
    }

    if (calculateDto.filingPeriod) {
      return this.parsePeriod(calculateDto.filingPeriod);
    }

    const now = new Date();
    return {
      startDate: this.startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: this.endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }

  private async fetchDataByDateRange(userId: string, startDate: Date, endDate: Date) {
    const [settings, invoices, expenses] = await Promise.all([
      this.prisma.settings.findUnique({ where: { userId } }),
      this.prisma.invoices.findMany({
        where: {
          userId,
          invoiceDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      this.prisma.expenses.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    return {
      allInvoices: invoices,
      expenses,
      sellerStateCode: this.getStateCode(
        settings?.supplierStateCode || settings?.gstin || invoices[0]?.supplierStateCode || '',
      ),
    };
  }

  private calculateTax(
    invoice: any,
    entryType: 'sale' | 'purchase',
    sellerStateCode: string,
    startDate: Date,
    endDate: Date,
    errors: GstError[],
  ): TaxLine[] {
    const invoiceDate = new Date(invoice.invoiceDate);
    const reference = String(invoice.invoiceNumber || `INV-${invoice.id}`);

    if (invoiceDate < startDate || invoiceDate > endDate) {
      errors.push({
        type: 'out_of_period',
        reference,
        message: `Invoice date is outside selected period for ${reference}`,
      });
    }

    if (invoice.partyGstin && !this.isValidGstin(invoice.partyGstin)) {
      errors.push({
        type: 'invalid_gstin',
        reference,
        message: `Invalid GSTIN format for ${reference}`,
      });
    }

    const isCreditNote = /credit/i.test(String(invoice.documentTypeCode || ''));
    const isDebitNote = /debit/i.test(String(invoice.documentTypeCode || ''));
    const sign = isCreditNote ? -1 : 1;

    const placeOfSupply =
      String(invoice.placeOfSupplyStateCode || invoice.recipientStateCode || '').trim() ||
      this.getStateCode(invoice.partyGstin || '');
    const stateCode = this.getStateCode(placeOfSupply);
    const interstate = Boolean(sellerStateCode && stateCode && sellerStateCode !== stateCode);

    const parsedItems = this.parseInvoiceItems(invoice.items);
    const gstLegacy = this.toNumber(invoice.gst);
    const totalLegacy = this.toNumber(invoice.totalAmount);
    const amountLegacy = this.toNumber(invoice.amount);
    const fallbackTaxable =
      this.toNumber(invoice.assessableValue) ||
      amountLegacy ||
      (totalLegacy > 0 && gstLegacy > 0 ? this.round2(totalLegacy - gstLegacy) : 0);
    const fallbackRate =
      this.toNumber(invoice.gstRate) ||
      (fallbackTaxable > 0 && gstLegacy > 0
        ? this.round2((gstLegacy / fallbackTaxable) * 100)
        : 0);
    const itemSources = parsedItems.length
      ? parsedItems
      : [
          {
            hsn: '',
            taxableValue: fallbackTaxable,
            taxRate: fallbackRate,
            igst: this.toNumber(invoice.igstValue),
            cgst: this.toNumber(invoice.cgstValue),
            sgst: this.toNumber(invoice.sgstValue),
            cess: 0,
          },
        ];

    const lines = itemSources.map((item, index) => {
      const lineTaxable = this.round2(item.taxableValue);
      const lineRate = this.round2(item.taxRate);
      if (!this.isAllowedRate(lineRate)) {
        errors.push({
          type: 'invalid_gst_rate',
          reference,
          message: `Invalid GST rate ${lineRate}% in ${reference}`,
        });
      }

      if (!String(item.hsn || '').trim()) {
        errors.push({
          type: 'missing_hsn',
          reference: `${reference}#${index + 1}`,
          message: `Missing HSN code in ${reference} item ${index + 1}`,
        });
      }

      let igst = this.round2(item.igst);
      let cgst = this.round2(item.cgst);
      let sgst = this.round2(item.sgst);
      let cess = this.round2(item.cess);

      if (igst === 0 && cgst === 0 && sgst === 0) {
        const taxTotal = this.round2(
          lineRate > 0
            ? (lineTaxable * lineRate) / 100
            : parsedItems.length === 0 && gstLegacy > 0
              ? gstLegacy
              : 0,
        );
        if (interstate) {
          igst = taxTotal;
        } else {
          cgst = this.round2(taxTotal / 2);
          sgst = this.round2(taxTotal / 2);
        }
      }

      const totalTax = this.round2(igst + cgst + sgst + cess);
      const totalAmount = this.round2(lineTaxable + totalTax);

      return {
        sourceType: 'invoice',
        entryType,
        reference,
        date: invoiceDate,
        gstin: String(invoice.partyGstin || ''),
        hsn: String(item.hsn || ''),
        taxableValue: this.round2(sign * lineTaxable),
        taxRate: lineRate,
        igst: this.round2(sign * igst),
        cgst: this.round2(sign * cgst),
        sgst: this.round2(sign * sgst),
        cess: this.round2(sign * cess),
        totalTax: this.round2(sign * totalTax),
        totalAmount: this.round2(sign * totalAmount),
        interstate,
        placeOfSupply,
        stateCode,
        isB2B: this.isValidGstin(String(invoice.partyGstin || '')),
        isCreditNote,
        isDebitNote,
        isRcm: /rcm/i.test(String(invoice.supplyTypeCode || invoice.notes || '')),
        itcEligible: entryType === 'purchase',
        supplyClass: this.resolveSupplyClass(invoice.supplyTypeCode, lineRate),
      } as TaxLine;
    });

    return lines;
  }

  private calculateExpenseTax(
    expense: any,
    sellerStateCode: string,
    startDate: Date,
    endDate: Date,
    errors: GstError[],
  ): TaxLine[] {
    const expenseDate = new Date(expense.date);
    const reference = `EXP-${expense.id}`;

    if (expenseDate < startDate || expenseDate > endDate) {
      errors.push({
        type: 'out_of_period',
        reference,
        message: `Expense date is outside selected period for ${reference}`,
      });
    }

    const taxableValue = this.toNumber(expense.amount);
    const gst = this.toNumber(expense.gst);
    const totalAmount = this.toNumber(expense.totalAmount) || taxableValue + gst;
    const rate = taxableValue > 0 ? this.round2((gst / taxableValue) * 100) : 0;

    if (rate && !this.isAllowedRate(rate)) {
      errors.push({
        type: 'invalid_gst_rate',
        reference,
        message: `Invalid GST rate ${rate}% in ${reference}`,
      });
    }

    const vendorState = this.extractStateFromText(String(expense.description || expense.notes || ''));
    const interstate = Boolean(sellerStateCode && vendorState && sellerStateCode !== vendorState);
    const igst = interstate ? gst : 0;
    const cgst = interstate ? 0 : this.round2(gst / 2);
    const sgst = interstate ? 0 : this.round2(gst / 2);
    const itcEligible = this.isItcEligible(expense.itc);

    return [
      {
        sourceType: 'expense',
        entryType: 'purchase',
        reference,
        date: expenseDate,
        gstin: '',
        hsn: String(expense.category || ''),
        taxableValue: this.round2(taxableValue),
        taxRate: rate,
        igst: this.round2(igst),
        cgst: this.round2(cgst),
        sgst: this.round2(sgst),
        cess: 0,
        totalTax: this.round2(gst),
        totalAmount: this.round2(totalAmount),
        interstate,
        placeOfSupply: vendorState,
        stateCode: vendorState,
        isB2B: false,
        isCreditNote: false,
        isDebitNote: false,
        isRcm: /rcm/i.test(String(expense.notes || expense.description || '')),
        itcEligible,
        supplyClass: rate === 0 ? 'exempt' : 'taxable',
      },
    ];
  }

  private aggregateTax(
    salesLines: TaxLine[],
    purchaseLines: TaxLine[],
    matchedItcLines: TaxLine[],
  ): TaxSummary {
    const stateWiseSales: Record<string, number> = {};

    const outward = salesLines.reduce(
      (acc, line) => {
        acc.taxableValue += line.taxableValue;
        acc.igst += line.igst;
        acc.cgst += line.cgst;
        acc.sgst += line.sgst;
        acc.cess += line.cess;
        acc.totalTax += line.totalTax;
        acc.totalAmount += line.totalAmount;
        const stateKey = line.stateCode || 'NA';
        stateWiseSales[stateKey] = this.round2((stateWiseSales[stateKey] || 0) + line.totalAmount);
        return acc;
      },
      {
        taxableValue: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
        totalTax: 0,
        totalAmount: 0,
      },
    );

    const inward = purchaseLines.reduce(
      (acc, line) => {
        acc.taxableValue += line.taxableValue;
        acc.igst += line.igst;
        acc.cgst += line.cgst;
        acc.sgst += line.sgst;
        acc.cess += line.cess;
        acc.totalTax += line.totalTax;
        acc.totalAmount += line.totalAmount;
        return acc;
      },
      {
        taxableValue: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
        totalTax: 0,
        totalAmount: 0,
      },
    );

    const itcEligible = purchaseLines
      .filter((line) => line.itcEligible)
      .reduce(
        (acc, line) => {
          acc.igst += line.igst;
          acc.cgst += line.cgst;
          acc.sgst += line.sgst;
          acc.cess += line.cess;
          acc.total += line.totalTax;
          return acc;
        },
        { igst: 0, cgst: 0, sgst: 0, cess: 0, total: 0 },
      );

    const itcMatched = matchedItcLines
      .filter((line) => line.itcEligible)
      .reduce(
        (acc, line) => {
          acc.igst += line.igst;
          acc.cgst += line.cgst;
          acc.sgst += line.sgst;
          acc.cess += line.cess;
          acc.total += line.totalTax;
          return acc;
        },
        { igst: 0, cgst: 0, sgst: 0, cess: 0, total: 0 },
      );

    const itcUnmatched = {
      igst: this.round2(itcEligible.igst - itcMatched.igst),
      cgst: this.round2(itcEligible.cgst - itcMatched.cgst),
      sgst: this.round2(itcEligible.sgst - itcMatched.sgst),
      cess: this.round2(itcEligible.cess - itcMatched.cess),
      total: this.round2(itcEligible.total - itcMatched.total),
    };

    const rcmLiability = purchaseLines
      .filter((line) => line.isRcm)
      .reduce(
        (acc, line) => {
          acc.igst += line.igst;
          acc.cgst += line.cgst;
          acc.sgst += line.sgst;
          acc.cess += line.cess;
          acc.total += line.totalTax;
          return acc;
        },
        { igst: 0, cgst: 0, sgst: 0, cess: 0, total: 0 },
      );

    return {
      outward: {
        taxableValue: this.round2(outward.taxableValue),
        igst: this.round2(outward.igst),
        cgst: this.round2(outward.cgst),
        sgst: this.round2(outward.sgst),
        cess: this.round2(outward.cess),
        totalTax: this.round2(outward.totalTax),
        totalAmount: this.round2(outward.totalAmount),
      },
      inward: {
        taxableValue: this.round2(inward.taxableValue),
        igst: this.round2(inward.igst),
        cgst: this.round2(inward.cgst),
        sgst: this.round2(inward.sgst),
        cess: this.round2(inward.cess),
        totalTax: this.round2(inward.totalTax),
        totalAmount: this.round2(inward.totalAmount),
      },
      itcEligible: {
        igst: this.round2(itcEligible.igst),
        cgst: this.round2(itcEligible.cgst),
        sgst: this.round2(itcEligible.sgst),
        cess: this.round2(itcEligible.cess),
        total: this.round2(itcEligible.total),
      },
      itcMatched: {
        igst: this.round2(itcMatched.igst),
        cgst: this.round2(itcMatched.cgst),
        sgst: this.round2(itcMatched.sgst),
        cess: this.round2(itcMatched.cess),
        total: this.round2(itcMatched.total),
      },
      itcUnmatched,
      rcmLiability: {
        igst: this.round2(rcmLiability.igst),
        cgst: this.round2(rcmLiability.cgst),
        sgst: this.round2(rcmLiability.sgst),
        cess: this.round2(rcmLiability.cess),
        total: this.round2(rcmLiability.total),
      },
      stateWiseSales,
    };
  }

  private generateGSTR1(salesLines: TaxLine[]) {
    const invoiceMap = new Map<string, TaxLine[]>();
    salesLines.forEach((line) => {
      const lines = invoiceMap.get(line.reference) || [];
      lines.push(line);
      invoiceMap.set(line.reference, lines);
    });

    const b2b: Array<Record<string, unknown>> = [];
    const b2cLarge: Array<Record<string, unknown>> = [];
    const b2cSmall: Array<Record<string, unknown>> = [];

    invoiceMap.forEach((lines) => {
      const first = lines[0];
      const taxableValue = this.round2(lines.reduce((s, line) => s + line.taxableValue, 0));
      const igst = this.round2(lines.reduce((s, line) => s + line.igst, 0));
      const cgst = this.round2(lines.reduce((s, line) => s + line.cgst, 0));
      const sgst = this.round2(lines.reduce((s, line) => s + line.sgst, 0));
      const totalValue = this.round2(lines.reduce((s, line) => s + line.totalAmount, 0));

      const invoiceRow = {
        invoice_no: first.reference,
        invoice_date: first.date.toISOString().slice(0, 10),
        recipient_gstin: first.gstin || null,
        place_of_supply: first.placeOfSupply || null,
        taxable_value: taxableValue,
        igst,
        cgst,
        sgst,
        total_value: totalValue,
        note_type: first.isCreditNote ? 'credit' : first.isDebitNote ? 'debit' : 'invoice',
      };

      if (first.isB2B) {
        b2b.push(invoiceRow);
      } else if (first.interstate && Math.abs(totalValue) > 250000) {
        b2cLarge.push(invoiceRow);
      } else {
        b2cSmall.push(invoiceRow);
      }
    });

    const hsnMap = new Map<string, {
      hsn: string;
      description: string;
      quantity: number;
      taxable_value: number;
      igst: number;
      cgst: number;
      sgst: number;
      cess: number;
      total_value: number;
    }>();

    salesLines.forEach((line) => {
      const key = line.hsn || 'NA';
      const existing = hsnMap.get(key) || {
        hsn: key,
        description: '',
        quantity: 0,
        taxable_value: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        cess: 0,
        total_value: 0,
      };

      existing.quantity += 1;
      existing.taxable_value = this.round2(existing.taxable_value + line.taxableValue);
      existing.igst = this.round2(existing.igst + line.igst);
      existing.cgst = this.round2(existing.cgst + line.cgst);
      existing.sgst = this.round2(existing.sgst + line.sgst);
      existing.cess = this.round2(existing.cess + line.cess);
      existing.total_value = this.round2(existing.total_value + line.totalAmount);
      hsnMap.set(key, existing);
    });

    return {
      b2b,
      b2c_large: b2cLarge,
      b2c_small: b2cSmall,
      hsn_summary: Array.from(hsnMap.values()),
    };
  }

  private generateGSTR3B(
    taxSummary: TaxSummary,
    carryForward: { igst: number; cgst: number; sgst: number; cess: number },
  ) {
    const outwardTax = {
      igst: this.round2(taxSummary.outward.igst + taxSummary.rcmLiability.igst),
      cgst: this.round2(taxSummary.outward.cgst + taxSummary.rcmLiability.cgst),
      sgst: this.round2(taxSummary.outward.sgst + taxSummary.rcmLiability.sgst),
      cess: this.round2(taxSummary.outward.cess + taxSummary.rcmLiability.cess),
    };

    const totalItc = {
      igst: this.round2(taxSummary.itcMatched.igst + carryForward.igst),
      cgst: this.round2(taxSummary.itcMatched.cgst + carryForward.cgst),
      sgst: this.round2(taxSummary.itcMatched.sgst + carryForward.sgst),
      cess: this.round2(taxSummary.itcMatched.cess + carryForward.cess),
    };

    const payable = {
      igst: outwardTax.igst,
      cgst: outwardTax.cgst,
      sgst: outwardTax.sgst,
      cess: outwardTax.cess,
    };

    const itcBalance = {
      igst: totalItc.igst,
      cgst: totalItc.cgst,
      sgst: totalItc.sgst,
      cess: totalItc.cess,
    };

    const useFromIgstToIgst = Math.min(itcBalance.igst, payable.igst);
    payable.igst = this.round2(payable.igst - useFromIgstToIgst);
    itcBalance.igst = this.round2(itcBalance.igst - useFromIgstToIgst);

    const useFromIgstToCgst = Math.min(itcBalance.igst, payable.cgst);
    payable.cgst = this.round2(payable.cgst - useFromIgstToCgst);
    itcBalance.igst = this.round2(itcBalance.igst - useFromIgstToCgst);

    const useFromIgstToSgst = Math.min(itcBalance.igst, payable.sgst);
    payable.sgst = this.round2(payable.sgst - useFromIgstToSgst);
    itcBalance.igst = this.round2(itcBalance.igst - useFromIgstToSgst);

    const useFromCgstToCgst = Math.min(itcBalance.cgst, payable.cgst);
    payable.cgst = this.round2(payable.cgst - useFromCgstToCgst);
    itcBalance.cgst = this.round2(itcBalance.cgst - useFromCgstToCgst);

    const useFromCgstToIgst = Math.min(itcBalance.cgst, payable.igst);
    payable.igst = this.round2(payable.igst - useFromCgstToIgst);
    itcBalance.cgst = this.round2(itcBalance.cgst - useFromCgstToIgst);

    const useFromSgstToSgst = Math.min(itcBalance.sgst, payable.sgst);
    payable.sgst = this.round2(payable.sgst - useFromSgstToSgst);
    itcBalance.sgst = this.round2(itcBalance.sgst - useFromSgstToSgst);

    const useFromSgstToIgst = Math.min(itcBalance.sgst, payable.igst);
    payable.igst = this.round2(payable.igst - useFromSgstToIgst);
    itcBalance.sgst = this.round2(itcBalance.sgst - useFromSgstToIgst);

    const useFromCess = Math.min(itcBalance.cess, payable.cess);
    payable.cess = this.round2(payable.cess - useFromCess);
    itcBalance.cess = this.round2(itcBalance.cess - useFromCess);

    return {
      outward_taxable_supplies: {
        taxable_value: this.round2(taxSummary.outward.taxableValue),
        igst: this.round2(outwardTax.igst),
        cgst: this.round2(outwardTax.cgst),
        sgst: this.round2(outwardTax.sgst),
        cess: this.round2(outwardTax.cess),
        total_tax: this.round2(
          outwardTax.igst +
            outwardTax.cgst +
            outwardTax.sgst +
            outwardTax.cess,
        ),
      },
      input_tax_credit: {
        igst: this.round2(totalItc.igst),
        cgst: this.round2(totalItc.cgst),
        sgst: this.round2(totalItc.sgst),
        cess: this.round2(totalItc.cess),
        total_itc: this.round2(
          totalItc.igst + totalItc.cgst + totalItc.sgst + totalItc.cess,
        ),
      },
      net_tax_payable: {
        igst: this.round2(Math.max(0, payable.igst)),
        cgst: this.round2(Math.max(0, payable.cgst)),
        sgst: this.round2(Math.max(0, payable.sgst)),
        cess: this.round2(Math.max(0, payable.cess)),
        total_payable: this.round2(
          Math.max(0, payable.igst) +
            Math.max(0, payable.cgst) +
            Math.max(0, payable.sgst) +
            Math.max(0, payable.cess),
        ),
      },
      carry_forward: {
        igst: this.round2(Math.max(0, itcBalance.igst)),
        cgst: this.round2(Math.max(0, itcBalance.cgst)),
        sgst: this.round2(Math.max(0, itcBalance.sgst)),
        cess: this.round2(Math.max(0, itcBalance.cess)),
      },
    };
  }

  private async getCarryForwardCredits(
    userId: string,
    filingPeriod: string,
  ): Promise<{ igst: number; cgst: number; sgst: number; cess: number }> {
    const previous = await this.prisma.gSTFiling.findFirst({
      where: {
        userId,
        filingType: 'GSTR3B',
        filingPeriod: {
          not: filingPeriod,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!previous || !previous.calculationData || typeof previous.calculationData !== 'object') {
      return { igst: 0, cgst: 0, sgst: 0, cess: 0 };
    }

    const calculationData = previous.calculationData as Record<string, any>;
    const carry = calculationData?.gstr3b?.carry_forward;

    if (!carry) {
      return { igst: 0, cgst: 0, sgst: 0, cess: 0 };
    }

    return {
      igst: this.toNumber(carry.igst),
      cgst: this.toNumber(carry.cgst),
      sgst: this.toNumber(carry.sgst),
      cess: this.toNumber(carry.cess),
    };
  }

  private parseInvoiceItems(items: unknown): Array<{
    hsn: string;
    taxableValue: number;
    taxRate: number;
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
  }> {
    if (!items) {
      return [];
    }

    let parsed = items;
    if (typeof items === 'string') {
      try {
        parsed = JSON.parse(items);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item: any) => ({
      hsn: String(item.hsn || item.hsnCode || item.hsn_code || ''),
      taxableValue: this.toNumber(
        item.taxableValue ||
          item.assessableValue ||
          item.assessable_value ||
          (() => {
            const quantity = this.toNumber(item.quantity);
            const unitPrice = this.toNumber(item.rate || item.unitPrice || item.price);
            const discountPct = this.toNumber(item.discount);
            const gross = quantity * unitPrice;
            const discountValue = (gross * discountPct) / 100;
            const taxable = gross - discountValue;
            if (taxable > 0) {
              return taxable;
            }
            return item.amount;
          })(),
      ),
      taxRate: this.toNumber(item.gstRate || item.gst_rate || item.ratePercent || item.taxRate),
      igst: this.toNumber(item.igst || item.igstValue || item.igst_value),
      cgst: this.toNumber(item.cgst || item.cgstValue || item.cgst_value),
      sgst: this.toNumber(item.sgst || item.sgstValue || item.sgst_value),
      cess: this.toNumber(item.cess || item.cessValue || item.cess_value),
    }));
  }

  private normalizeFilingType(type?: string): 'GSTR1' | 'GSTR3B' | 'GSTR9' {
    const normalized = String(type || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized === 'GSTR1') {
      return 'GSTR1';
    }
    if (normalized === 'GSTR3B') {
      return 'GSTR3B';
    }
    if (normalized === 'GSTR9') {
      return 'GSTR9';
    }
    return 'GSTR3B';
  }

  private normalizeStatus(
    status?: string,
  ): 'draft' | 'validated' | 'calculated' | 'filed' | 'submitted' | undefined {
    if (!status) {
      return undefined;
    }

    const normalized = String(status).trim().toLowerCase();
    if (normalized === 'draft') {
      return 'draft';
    }
    if (normalized === 'calculated') {
      return 'calculated';
    }
    if (normalized === 'validated') {
      return 'validated';
    }
    if (normalized === 'filed') {
      return 'filed';
    }
    if (normalized === 'submitted') {
      return 'submitted';
    }

    return undefined;
  }

  private derivePeriod(startDate: Date, endDate: Date): string {
    const fullQuarter =
      startDate.getDate() === 1 &&
      endDate.getDate() >= 28 &&
      endDate.getMonth() - startDate.getMonth() === 2;

    if (fullQuarter) {
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      return `Q${quarter}-${startDate.getFullYear()}`;
    }

    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    return `${startDate.getFullYear()}-${month}`;
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const raw = String(value).trim();
    if (!raw) {
      return 0;
    }

    // Handle accounting negatives like (123.45)
    const isBracketNegative = /^\(.*\)$/.test(raw);
    const cleaned = raw
      .replace(/[₹,\s]/g, '')
      .replace(/%/g, '')
      .replace(/[()]/g, '');

    // Keep digits, decimal and minus sign only.
    const normalized = cleaned.replace(/[^0-9.-]/g, '');
    if (!normalized) {
      return 0;
    }

    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    if (isBracketNegative && parsed > 0) {
      return -parsed;
    }

    return Number.isFinite(parsed) ? parsed : 0;
  }

  private extractPreviewMetricsFromFiling(filing: any) {
    const calculationData = (filing?.calculationData || {}) as Record<string, any>;
    const summary = calculationData?.summary || {};
    const totals = summary?.totals || {};
    const gstr3b = calculationData?.gstr3b || {};

    const taxableSales = this.toNumber(
      totals?.totalSalesTaxable ?? summary?.taxable_sales ?? filing?.totalSales,
    );

    const outputTax = this.toNumber(
      totals?.totalSalesTax ??
        summary?.output_tax ??
        gstr3b?.outward_taxable_supplies?.total_tax ??
        this.toNumber(filing?.igst) +
          this.toNumber(filing?.cgst) +
          this.toNumber(filing?.sgst) +
          this.toNumber(filing?.cess),
    );

    const itcUtilized = this.toNumber(
      summary?.itc_utilized ??
        summary?.taxes?.itc_eligible?.total ??
        gstr3b?.input_tax_credit?.total_itc ??
        filing?.itcAvailable,
    );

    const netPayable = this.toNumber(
      totals?.netPayableTotal ??
        summary?.net_payable ??
        gstr3b?.net_tax_payable?.total_payable ??
        filing?.taxLiability,
    );

    const status = String(filing?.status || '').toLowerCase();
    const statusHasComputation = ['calculated', 'validated', 'filed', 'submitted'].includes(status);
    const hasComputedData =
      statusHasComputation ||
      (summary && Object.keys(summary).length > 0) ||
      (gstr3b && Object.keys(gstr3b).length > 0) ||
      taxableSales > 0 ||
      outputTax > 0 ||
      itcUtilized > 0 ||
      netPayable > 0;

    return {
      taxableSales: this.round2(taxableSales),
      outputTax: this.round2(outputTax),
      itcUtilized: this.round2(itcUtilized),
      netPayable: this.round2(netPayable),
      hasComputedData,
    };
  }

  private isAllowedRate(rate: number): boolean {
    const allowedRates = new Set([0, 5, 12, 18, 28]);
    return allowedRates.has(this.round2(rate));
  }

  private isValidGstin(gstin: string): boolean {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(
      String(gstin || '').trim(),
    );
  }

  private getStateCode(value: string): string {
    const cleaned = String(value || '').trim();
    if (!cleaned) {
      return '';
    }

    if (/^[0-9]{2}/.test(cleaned)) {
      return cleaned.slice(0, 2);
    }

    const match = cleaned.match(/[0-9]{2}/);
    return match ? match[0] : '';
  }

  private extractStateFromText(text: string): string {
    const match = String(text || '').match(/\b([0-9]{2})\b/);
    return match ? match[1] : '';
  }

  private isItcEligible(value: unknown): boolean {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
      return true;
    }
    return ['yes', 'y', 'true', '1', 'eligible'].includes(normalized);
  }

  private resolveSupplyClass(
    supplyTypeCode?: string | null,
    taxRate: number = 0,
  ): 'taxable' | 'zero_rated' | 'exempt' | 'nil_rated' {
    const normalized = String(supplyTypeCode || '').trim().toUpperCase();
    if (normalized.startsWith('EXP') || normalized.startsWith('SEZWOP')) {
      return 'zero_rated';
    }
    if (normalized.includes('EXEMPT')) {
      return 'exempt';
    }
    if (taxRate === 0) {
      return 'nil_rated';
    }
    return 'taxable';
  }

  private validateData(salesLines: TaxLine[], purchaseLines: TaxLine[]): GstError[] {
    const issues: GstError[] = [];
    const all = [...salesLines, ...purchaseLines];

    all.forEach((line) => {
      if (line.taxableValue < 0 && !line.isCreditNote) {
        issues.push({
          type: 'negative_value',
          reference: line.reference,
          message: `Negative taxable value found in ${line.reference}`,
        });
      }

      if (!line.reference || !/[A-Z0-9-]+/i.test(line.reference)) {
        issues.push({
          type: 'invalid_invoice_format',
          reference: line.reference,
          message: `Invalid invoice/expense reference format in ${line.reference}`,
        });
      }

      const computed = this.round2(line.taxableValue + line.totalTax);
      if (Math.abs(computed - line.totalAmount) > 1) {
        issues.push({
          type: 'mismatched_total',
          reference: line.reference,
          message: `Mismatched total amount in ${line.reference}`,
        });
      }

      if (line.totalTax !== 0 && line.igst === 0 && line.cgst === 0 && line.sgst === 0) {
        issues.push({
          type: 'incomplete_tax',
          reference: line.reference,
          message: `Incomplete tax split in ${line.reference}`,
        });
      }

      if (line.isB2B && !this.isValidGstin(line.gstin)) {
        issues.push({
          type: 'missing_or_invalid_gstin',
          reference: line.reference,
          message: `Missing/invalid GSTIN for B2B transaction ${line.reference}`,
        });
      }
    });

    return issues;
  }

  private matchItc(purchaseLines: TaxLine[]) {
    const matched: TaxLine[] = [];
    const unmatched: TaxLine[] = [];

    purchaseLines.forEach((line) => {
      const hasRequiredData =
        Boolean(line.reference) &&
        line.totalTax > 0 &&
        line.date instanceof Date &&
        !Number.isNaN(line.date.getTime()) &&
        (!line.gstin || this.isValidGstin(line.gstin));

      if (line.itcEligible && hasRequiredData) {
        matched.push({ ...line, isMatchedItc: true });
      } else if (line.itcEligible) {
        unmatched.push({ ...line, isMatchedItc: false });
      }
    });

    return { matched, unmatched };
  }

  private buildEdgeCaseSummary(salesLines: TaxLine[], purchaseLines: TaxLine[]) {
    const all = [...salesLines, ...purchaseLines];
    return {
      rcm_count: all.filter((line) => line.isRcm).length,
      zero_rated_count: all.filter((line) => line.supplyClass === 'zero_rated').length,
      exempt_count: all.filter((line) => line.supplyClass === 'exempt').length,
      nil_rated_count: all.filter((line) => line.supplyClass === 'nil_rated').length,
      credit_note_count: all.filter((line) => line.isCreditNote).length,
      debit_note_count: all.filter((line) => line.isDebitNote).length,
    };
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private startOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
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
