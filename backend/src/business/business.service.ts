import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(createBusinessDto: CreateBusinessDto) {
    // Check if GSTIN already exists
    const existing = await this.prisma.business.findUnique({
      where: { gstin: createBusinessDto.gstin },
    });

    if (existing) {
      throw new ConflictException('Business with this GSTIN already exists');
    }

    return this.prisma.business.create({
      data: createBusinessDto,
    });
  }

  async findAll() {
    return this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  async findByGstin(gstin: string) {
    const business = await this.prisma.business.findUnique({
      where: { gstin },
    });

    if (!business) {
      throw new NotFoundException(`Business with GSTIN ${gstin} not found`);
    }

    return business;
  }

  async findByUserId(userId: string) {
    const businesses = await this.prisma.business.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

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

    const turnover = invoices.reduce(
      (sum, invoice) => sum + this.getInvoiceTotalAmount(invoice),
      0,
    );

    return businesses.map((business) => ({
      ...business,
      turnover,
    }));
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto) {
    await this.findOne(id); // Check if exists

    // If updating GSTIN, check uniqueness
    if (updateBusinessDto.gstin) {
      const existing = await this.prisma.business.findUnique({
        where: { gstin: updateBusinessDto.gstin },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Business with this GSTIN already exists');
      }
    }

    return this.prisma.business.update({
      where: { id },
      data: updateBusinessDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return this.prisma.business.delete({
      where: { id },
    });
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

      const itemAmount = this.parseAmount(item.amount?.toString());
      if (itemAmount > 0) {
        return sum + itemAmount;
      }

      const quantity = this.parseAmount(item.quantity?.toString());
      const price = this.parseAmount(item.price?.toString());
      const discountPct = this.parseAmount(item.discount?.toString());
      const taxRatePct = this.parseAmount(item.taxRate?.toString());

      const baseAmount = quantity * price;
      const discountAmount = (baseAmount * discountPct) / 100;
      const taxableAmount = Math.max(baseAmount - discountAmount, 0);
      const taxAmount = (taxableAmount * taxRatePct) / 100;

      return sum + taxableAmount + taxAmount;
    }, 0);
  }
}
