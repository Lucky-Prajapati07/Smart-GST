import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto> {
    try {
      const transaction = await this.prisma.transactions.create({
        data: {
          ...createTransactionDto,
          date: new Date(createTransactionDto.date),
        },
      });

      return new TransactionResponseDto(transaction);
    } catch (error) {
      throw new BadRequestException('Failed to create transaction');
    }
  }

  async findAll(userId: string): Promise<TransactionResponseDto[]> {
    const transactions = await this.prisma.transactions.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions.map(transaction => new TransactionResponseDto(transaction));
  }

  async findOne(userId: string, id: number): Promise<TransactionResponseDto> {
    const transaction = await this.prisma.transactions.findFirst({
      where: { userId, id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return new TransactionResponseDto(transaction);
  }

  async update(userId: string, id: number, updateTransactionDto: UpdateTransactionDto): Promise<TransactionResponseDto> {
    // Check if transaction exists and belongs to user
    await this.findOne(userId, id);

    try {
      const updateData: any = { ...updateTransactionDto };
      if (updateTransactionDto.date) {
        updateData.date = new Date(updateTransactionDto.date);
      }

      const transaction = await this.prisma.transactions.update({
        where: { id },
        data: updateData,
      });

      return new TransactionResponseDto(transaction);
    } catch (error) {
      throw new BadRequestException('Failed to update transaction');
    }
  }

  async remove(userId: string, id: number): Promise<{ message: string }> {
    // Check if transaction exists and belongs to user
    await this.findOne(userId, id);

    try {
      await this.prisma.transactions.delete({
        where: { id },
      });

      return { message: `Transaction with ID ${id} has been deleted successfully` };
    } catch (error) {
      throw new BadRequestException('Failed to delete transaction');
    }
  }

  // Additional utility methods
  async findByType(transactionType: string): Promise<TransactionResponseDto[]> {
    const transactions = await this.prisma.transactions.findMany({
      where: { transactionType },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(transaction => new TransactionResponseDto(transaction));
  }

  async findByDateRange(startDate: string, endDate: string): Promise<TransactionResponseDto[]> {
    const transactions = await this.prisma.transactions.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map(transaction => new TransactionResponseDto(transaction));
  }

  async getTotalByType(): Promise<any[]> {
    const result = await this.prisma.transactions.groupBy({
      by: ['transactionType'],
      _count: {
        _all: true,
      },
    });

    return result.map(item => ({
      transactionType: item.transactionType,
      count: item._count._all || 0,
    }));
  }
}
