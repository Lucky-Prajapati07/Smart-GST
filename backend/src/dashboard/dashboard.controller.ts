import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats/:userId')
  async getDashboardStats(@Param('userId') userId: string) {
    return this.dashboardService.getDashboardStats(userId);
  }

  @Post('stats/:userId/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshStats(@Param('userId') userId: string) {
    return this.dashboardService.refreshDashboardStats(userId);
  }

  @Get('revenue/:userId')
  async getRevenueSummary(@Param('userId') userId: string) {
    return this.dashboardService.getRevenueSummary(userId);
  }

  @Get('activity/:userId')
  async getRecentActivity(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getRecentActivity(
      userId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('top-clients/:userId')
  async getTopClients(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getTopClients(
      userId,
      limit ? parseInt(limit) : 5,
    );
  }

  @Get('cash-flow/:userId')
  async getCashFlow(
    @Param('userId') userId: string,
    @Query('months') months?: string,
  ) {
    return this.dashboardService.getCashFlowSummary(
      userId,
      months ? parseInt(months) : 6,
    );
  }

  @Get('upcoming/:userId')
  async getUpcomingDueDates(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getUpcomingDueDates(
      userId,
      days ? parseInt(days) : 30,
    );
  }
}
