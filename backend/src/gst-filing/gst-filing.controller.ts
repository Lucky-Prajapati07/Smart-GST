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

@Controller('gst-filing')
export class GstFilingController {
  constructor(private readonly gstFilingService: GstFilingService) {}

  @Get()
  async getAllFilings(@Query('userId') userId: string) {
    return this.gstFilingService.getAllFilings(userId);
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
