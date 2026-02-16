import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe,
  Query,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto> {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  async findAll(@Query('userId') userId: string): Promise<TransactionResponseDto[]> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.transactionsService.findAll(userId);
  }

  @Get('stats/by-type')
  async getTotalByType(): Promise<any[]> {
    return this.transactionsService.getTotalByType();
  }

  @Get('type/:transactionType')
  async findByType(@Param('transactionType') transactionType: string): Promise<TransactionResponseDto[]> {
    return this.transactionsService.findByType(transactionType);
  }

  @Get('date-range')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<TransactionResponseDto[]> {
    return this.transactionsService.findByDateRange(startDate, endDate);
  }

  @Get(':id')
  async findOne(
    @Query('userId') userId: string,
    @Param('id', ParseIntPipe) id: number
  ): Promise<TransactionResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.transactionsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @Query('userId') userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.transactionsService.update(userId, id, updateTransactionDto);
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
    return this.transactionsService.remove(userId, id);
  }
}
