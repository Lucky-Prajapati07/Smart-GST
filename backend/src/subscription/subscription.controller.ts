import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto';

@Controller('subscription')
@UsePipes(new ValidationPipe({ transform: true }))
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('razorpay/create-order')
  @HttpCode(HttpStatus.OK)
  async createRazorpayOrder(@Body() dto: CreateRazorpayOrderDto): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    planType: string;
    planAmount: number;
  }> {
    return this.subscriptionService.createRazorpayOrder(dto);
  }

  @Post('razorpay/verify')
  @HttpCode(HttpStatus.OK)
  async verifyRazorpayPayment(@Body() dto: VerifyRazorpayPaymentDto): Promise<{
    message: string;
    subscription: SubscriptionResponseDto;
  }> {
    return this.subscriptionService.verifyRazorpayPayment(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.create(dto);
  }

  @Get('user-status')
  async getUserStatus(@Query('userId') userId: string): Promise<any> {
    return this.subscriptionService.getUserSubscriptionStatus(userId);
  }

  @Get('active')
  async getActiveSubscription(@Query('userId') userId: string): Promise<SubscriptionResponseDto | null> {
    return this.subscriptionService.findActiveSubscription(userId);
  }

  @Get('trial-status')
  async checkTrialStatus(@Query('userId') userId: string): Promise<any> {
    return this.subscriptionService.checkTrialStatus(userId);
  }

  @Get()
  async findAll(@Query('userId') userId: string): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionService.findByUserId(userId);
  }

  @Post('initiate-trial')
  @HttpCode(HttpStatus.OK)
  async initiateTrial(@Query('userId') userId: string): Promise<{ message: string }> {
    return this.subscriptionService.initiateTrial(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.findOne(userId, parseInt(id));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.update(userId, parseInt(id), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<{ message: string }> {
    return this.subscriptionService.cancel(userId, parseInt(id));
  }

  @Post('razorpay/webhook')
  @HttpCode(HttpStatus.OK)
  async handleRazorpayWebhook(@Body() payload: any): Promise<{ status: string }> {
    // Handle Razorpay webhooks for payment failures, refunds, etc.
    return this.subscriptionService.handleRazorpayWebhook(payload);
  }
}
