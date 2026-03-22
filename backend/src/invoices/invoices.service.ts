import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private normalizePrefix(prefix?: string | null): string {
    const cleaned = (prefix ?? 'INV').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned || 'INV';
  }

  private extractSequence(invoiceNumber: string, prefix: string): { seq: number; width: number } | null {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = invoiceNumber
      .trim()
      .toUpperCase()
      .match(new RegExp(`^${escapedPrefix}[-/\\s]?(\\d+)$`));

    if (!match) {
      return null;
    }

    return {
      seq: Number.parseInt(match[1], 10),
      width: Math.max(match[1].length, 3),
    };
  }

  private async generateNextInvoiceNumber(userId: string): Promise<string> {
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
      select: { invoicePrefix: true },
    });

    const prefix = this.normalizePrefix(settings?.invoicePrefix);

    const existing = await this.prisma.invoices.findMany({
      where: { userId },
      select: { invoiceNumber: true },
    });

    let maxSeq = 0;
    let width = 3;

    for (const row of existing) {
      const parsed = this.extractSequence(row.invoiceNumber, prefix);
      if (!parsed) {
        continue;
      }
      if (parsed.seq > maxSeq) {
        maxSeq = parsed.seq;
      }
      if (parsed.width > width) {
        width = parsed.width;
      }
    }

    return `${prefix}-${String(maxSeq + 1).padStart(width, '0')}`;
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    const createData: any = {
      ...createInvoiceDto,
      invoiceDate: new Date(createInvoiceDto.invoiceDate),
      dueDate: new Date(createInvoiceDto.dueDate),
    };

    if (createInvoiceDto.documentDate) {
      createData.documentDate = new Date(createInvoiceDto.documentDate);
    }

    if (createInvoiceDto.precedingInvoiceDate) {
      createData.precedingInvoiceDate = new Date(createInvoiceDto.precedingInvoiceDate);
    }

    // Always assign a sequence number from invoice history so numbering remains consistent.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        createData.invoiceNumber = await this.generateNextInvoiceNumber(createInvoiceDto.userId);

        const invoice = await this.prisma.invoices.create({
          data: createData,
        });

        return invoice;
      } catch (error) {
        if (error.code === 'P2002' && attempt < 3) {
          continue;
        }

        if (error.code === 'P2002') {
          const field = error.meta?.target?.[0];
          throw new ConflictException(`Invoice with this ${field} already exists`);
        }

        throw error;
      }
    }

    throw new ConflictException('Failed to generate a unique sequential invoice number');
  }

  async findAll(userId: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: number): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { userId, id },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findByInvoiceNumber(userId: string, invoiceNumber: string): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoices.findFirst({
      where: { 
        userId,
        invoiceNumber 
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
    }

    return invoice;
  }

  async findByPartyGstin(userId: string, partyGstin: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: { 
        userId,
        partyGstin 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByInvoiceType(userId: string, invoiceType: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: { 
        userId,
        invoiceType: {
          equals: invoiceType,
          mode: 'insensitive',
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByStatus(userId: string, status: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: { 
        userId,
        status: {
          equals: status,
          mode: 'insensitive',
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<InvoiceResponseDto[]> {
    return await this.prisma.invoices.findMany({
      where: {
        userId,
        invoiceDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    });
  }

  async update(userId: string, id: number, updateInvoiceDto: UpdateInvoiceDto): Promise<InvoiceResponseDto> {
    // Verify ownership
    await this.findOne(userId, id);
    
    try {
      const updateData: any = { ...updateInvoiceDto };
      
      if (updateInvoiceDto.invoiceDate) {
        updateData.invoiceDate = new Date(updateInvoiceDto.invoiceDate);
      }
      
      if (updateInvoiceDto.dueDate) {
        updateData.dueDate = new Date(updateInvoiceDto.dueDate);
      }

      if (updateInvoiceDto.documentDate) {
        updateData.documentDate = new Date(updateInvoiceDto.documentDate);
      }

      if (updateInvoiceDto.precedingInvoiceDate) {
        updateData.precedingInvoiceDate = new Date(updateInvoiceDto.precedingInvoiceDate);
      }

      const invoice = await this.prisma.invoices.update({
        where: { id },
        data: updateData,
      });
      return invoice;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new ConflictException(`Invoice with this ${field} already exists`);
      }
      throw error;
    }
  }

  async updateByInvoiceNumber(userId: string, invoiceNumber: string, updateInvoiceDto: UpdateInvoiceDto): Promise<InvoiceResponseDto> {
    // Verify ownership
    const existing = await this.findByInvoiceNumber(userId, invoiceNumber);
    
    try {
      const updateData: any = { ...updateInvoiceDto };
      
      if (updateInvoiceDto.invoiceDate) {
        updateData.invoiceDate = new Date(updateInvoiceDto.invoiceDate);
      }
      
      if (updateInvoiceDto.dueDate) {
        updateData.dueDate = new Date(updateInvoiceDto.dueDate);
      }

      if (updateInvoiceDto.documentDate) {
        updateData.documentDate = new Date(updateInvoiceDto.documentDate);
      }

      if (updateInvoiceDto.precedingInvoiceDate) {
        updateData.precedingInvoiceDate = new Date(updateInvoiceDto.precedingInvoiceDate);
      }

      const invoice = await this.prisma.invoices.update({
        where: { id: existing.id },
        data: updateData,
      });
      return invoice;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
      }
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        throw new ConflictException(`Invoice with this ${field} already exists`);
      }
      throw error;
    }
  }

  async remove(userId: string, id: number): Promise<{ message: string }> {
    // Verify ownership
    await this.findOne(userId, id);
    
    try {
      await this.prisma.invoices.delete({
        where: { id },
      });
      return { message: `Invoice with ID ${id} successfully deleted` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }
      throw error;
    }
  }

  async removeByInvoiceNumber(userId: string, invoiceNumber: string): Promise<{ message: string }> {
    // Verify ownership
    const existing = await this.findByInvoiceNumber(userId, invoiceNumber);
    
    try {
      await this.prisma.invoices.delete({
        where: { id: existing.id },
      });
      return { message: `Invoice with number ${invoiceNumber} successfully deleted` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
      }
      throw error;
    }
  }

  async getInvoiceStats(userId: string): Promise<any> {
    const totalInvoices = await this.prisma.invoices.count({
      where: { userId }
    });
    const salesInvoices = await this.prisma.invoices.count({
      where: { userId, invoiceType: 'Sales' },
    });
    const purchaseInvoices = await this.prisma.invoices.count({
      where: { userId, invoiceType: 'Purchase' },
    });

    return {
      totalInvoices,
      salesInvoices,
      purchaseInvoices,
    };
  }
}
