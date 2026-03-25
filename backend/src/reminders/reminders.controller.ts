import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createReminderDto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    return this.remindersService.create(createReminderDto);
  }

  @Get()
  async findAll(@Query('userId') userId: string): Promise<ReminderResponseDto[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.remindersService.findAllByUser(userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
    @Body(ValidationPipe) updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.remindersService.update(id, userId, updateReminderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId') userId: string,
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.remindersService.remove(id, userId);
  }
}
