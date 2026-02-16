import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/reports.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getAllReports(@Query('userId') userId: string) {
    return this.reportsService.getAllReports(userId);
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    return this.reportsService.getReportById(parseInt(id));
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateReport(@Body() generateReportDto: GenerateReportDto) {
    return this.reportsService.generateReport(generateReportDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReport(@Param('id') id: string) {
    return this.reportsService.deleteReport(parseInt(id));
  }
}
