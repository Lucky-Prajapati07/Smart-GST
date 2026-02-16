import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createExpenseDto: CreateExpenseDto
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  async findAll(
    @Query('userId') userId: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ExpenseResponseDto[]> {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Filter by date range if both dates provided
    if (startDate && endDate) {
      return this.expensesService.findByDateRange(userId, startDate, endDate);
    }
    
    // Filter by category if provided
    if (category) {
      return this.expensesService.findByCategory(userId, category);
    }
    
    // Filter by status if provided
    if (status) {
      return this.expensesService.findByStatus(userId, status);
    }
    
    // Return all expenses if no filters
    return this.expensesService.findAll(userId);
  }

  @Get('incomplete')
  async findIncompleteExpenses(
    @Query('userId') userId: string
  ): Promise<ExpenseResponseDto[]> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.expensesService.findIncompleteExpenses(userId);
  }

  @Get('category/:category')
  async findByCategory(
    @Query('userId') userId: string,
    @Param('category') category: string
  ): Promise<ExpenseResponseDto[]> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.expensesService.findByCategory(userId, category);
  }

  @Get('status/:status')
  async findByStatus(
    @Query('userId') userId: string,
    @Param('status') status: string
  ): Promise<ExpenseResponseDto[]> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.expensesService.findByStatus(userId, status);
  }

  @Get('date-range')
  async findByDateRange(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<ExpenseResponseDto[]> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.expensesService.findByDateRange(userId, startDate, endDate);
  }

  @Get(':id')
  async findOne(
    @Query('userId') userId: string,
    @Param('id', ParseIntPipe) id: number
  ): Promise<ExpenseResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.expensesService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @Query('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateExpenseDto: UpdateExpenseDto
  ): Promise<ExpenseResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.expensesService.update(userId, id, updateExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Query('userId') userId: string,
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.expensesService.remove(userId, id);
  }
}
