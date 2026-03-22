import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GstFilingService } from './gst-filing.service';
import {
  CreateGSTFilingDto,
  UpdateGSTFilingDto,
  CalculateGSTDto,
} from './dto/gst-filing.dto';
import {
  ValidateGSTFilingDto,
  CreateGSTPaymentDto,
  MarkGSTPaymentPaidDto,
  FinalizeGSTFilingDto,
} from './dto/gst-filing.dto';

@Controller('gst-filing')
export class GstFilingController {
  constructor(private readonly gstFilingService: GstFilingService) {}

  @Get()
  async getAllFilings(@Query('userId') userId: string) {
    return this.gstFilingService.getAllFilings(userId);
  }

  @Get('preview/:userId')
  async getPreview(@Param('userId') userId: string) {
    return this.gstFilingService.getPreviewMetrics(userId);
  }

  @Get('preview')
  async getPreviewByQuery(@Query('userId') userId: string) {
    return this.gstFilingService.getPreviewMetrics(userId);
  }

  @Get(':id')
  async getFiling(@Param('id') id: string) {
    return this.gstFilingService.getFilingById(parseInt(id));
  }

  @Get('period/:userId/:period/:type')
  async getFilingByPeriod(
    @Param('userId') userId: string,
    @Param('period') period: string,
    @Param('type') type: string,
  ) {
    return this.gstFilingService.getFilingByPeriod(userId, period, type);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFiling(@Body() createFilingDto: CreateGSTFilingDto) {
    return this.gstFilingService.createFiling(createFilingDto);
  }

  @Post('calculate')
  async calculateGST(@Body() calculateDto: CalculateGSTDto) {
    return this.gstFilingService.calculateGST(calculateDto);
  }

  @Post('process')
  async processGST(@Body() calculateDto: CalculateGSTDto) {
    return this.gstFilingService.calculateGST(calculateDto);
  }

  @Post(':id/validate')
  async validateFiling(
    @Param('id') id: string,
    @Body() dto: ValidateGSTFilingDto,
  ) {
    return this.gstFilingService.validateFiling(parseInt(id, 10), dto.userId);
  }

  @Post(':id/payment')
  async createPayment(
    @Param('id') id: string,
    @Body() dto: CreateGSTPaymentDto,
  ) {
    return this.gstFilingService.createPaymentRecord(parseInt(id, 10), dto.userId, dto.reference);
  }

  @Post(':id/payment/:paymentId/paid')
  async markPaymentPaid(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: MarkGSTPaymentPaidDto,
  ) {
    return this.gstFilingService.markPaymentPaid(
      parseInt(id, 10),
      parseInt(paymentId, 10),
      dto.userId,
      dto.reference,
    );
  }

  @Post(':id/file')
  async fileReturn(
    @Param('id') id: string,
    @Body() dto: FinalizeGSTFilingDto,
  ) {
    return this.gstFilingService.fileReturn(parseInt(id, 10), dto.userId);
  }

  @Get(':id/export')
  async exportReturn(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Query('format') format: string,
  ) {
    return this.gstFilingService.exportReturn(parseInt(id, 10), userId, format || 'json');
  }

  @Put(':id')
  async updateFiling(
    @Param('id') id: string,
    @Body() updateFilingDto: UpdateGSTFilingDto,
  ) {
    return this.gstFilingService.updateFiling(parseInt(id), updateFilingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFiling(@Param('id') id: string) {
    return this.gstFilingService.deleteFiling(parseInt(id));
  }
}
