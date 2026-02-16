import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    try {
      const expense = await this.prisma.expenses.create({
        data: {
          ...createExpenseDto,
          date: new Date(createExpenseDto.date),
        },
      });
      return new ExpenseResponseDto(expense);
    } catch (error) {
      throw new ConflictException('Failed to create expense');
    }
  }

  async findAll(userId: string): Promise<ExpenseResponseDto[]> {
    const expenses = await this.prisma.expenses.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return expenses.map(expense => new ExpenseResponseDto(expense));
  }

  async findOne(userId: string, id: number): Promise<ExpenseResponseDto> {
    const expense = await this.prisma.expenses.findFirst({
      where: { userId, id },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return new ExpenseResponseDto(expense);
  }

  async update(userId: string, id: number, updateExpenseDto: UpdateExpenseDto): Promise<ExpenseResponseDto> {
    await this.findOne(userId, id); // Check if expense exists and belongs to user

    try {
      const updateData: any = { ...updateExpenseDto };
      if (updateExpenseDto.date) {
        updateData.date = new Date(updateExpenseDto.date);
      }

      const expense = await this.prisma.expenses.update({
        where: { id },
        data: updateData,
      });

      return new ExpenseResponseDto(expense);
    } catch (error) {
      throw new ConflictException('Failed to update expense');
    }
  }

  async remove(userId: string, id: number): Promise<{ message: string }> {
    await this.findOne(userId, id); // Check if expense exists and belongs to user

    try {
      await this.prisma.expenses.delete({
        where: { id },
      });

      return { message: `Expense with ID ${id} has been deleted successfully` };
    } catch (error) {
      throw new ConflictException('Failed to delete expense');
    }
  }

  async findByCategory(userId: string, category: string): Promise<ExpenseResponseDto[]> {
    const expenses = await this.prisma.expenses.findMany({
      where: { 
        userId,
        category: {
          contains: category,
          mode: 'insensitive',
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return expenses.map(expense => new ExpenseResponseDto(expense));
  }

  async findByStatus(userId: string, status: string): Promise<ExpenseResponseDto[]> {
    const expenses = await this.prisma.expenses.findMany({
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
    return expenses.map(expense => new ExpenseResponseDto(expense));
  }

  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<ExpenseResponseDto[]> {
    const expenses = await this.prisma.expenses.findMany({
      where: {
        userId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    return expenses.map(expense => new ExpenseResponseDto(expense));
  }

  async findIncompleteExpenses(userId: string): Promise<ExpenseResponseDto[]> {
    const expenses = await this.prisma.expenses.findMany({
      where: {
        userId,
        OR: [
          { status: null },
          { description: null },
          { itc: null },
          { status: '' },
          { description: '' },
          { itc: '' },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return expenses.map(expense => new ExpenseResponseDto(expense));
  }
}
