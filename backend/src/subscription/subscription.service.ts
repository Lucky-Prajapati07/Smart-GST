import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, SubscriptionPlanType } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  private calculateRemainingDays(endDate?: Date | null): number {
    if (!endDate) {
      return 0;
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, daysRemaining);
  }

  // Calculate end date based on plan type
  private calculateEndDate(startDate: Date, planType: SubscriptionPlanType): Date {
    const end = new Date(startDate);
    if (planType === SubscriptionPlanType.Monthly) {
      end.setMonth(end.getMonth() + 1);
    } else if (planType === SubscriptionPlanType.HalfYearly) {
      end.setMonth(end.getMonth() + 6);
    } else if (planType === SubscriptionPlanType.Yearly) {
      end.setFullYear(end.getFullYear() + 1);
    }
    return end;
  }

  // Get pricing based on plan type
  private getPricing(planType: SubscriptionPlanType): { price: number; currency: string } {
    const pricing = {
      [SubscriptionPlanType.Monthly]: { price: 999, currency: 'INR' },
      [SubscriptionPlanType.HalfYearly]: { price: 5499, currency: 'INR' },
      [SubscriptionPlanType.Yearly]: { price: 9999, currency: 'INR' },
    };
    return pricing[planType] || { price: 0, currency: 'INR' };
  }

  private async activatePremiumForUser(userId: string): Promise<void> {
    await this.prisma.userManagement.upsert({
      where: { userId },
      update: {
        plan: 'Pro',
        isTrialActive: false,
      },
      create: {
        userId,
        fullName: userId,
        email: `${userId}@local.smartgst`,
        plan: 'Pro',
        status: 'Pending',
        isTrialActive: false,
      },
    });
  }

  private async createSubscriptionRecord(
    userId: string,
    planType: SubscriptionPlanType,
    paymentId?: string,
    notes?: string,
  ) {
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, planType);
    const pricing = this.getPricing(planType);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planType,
        price: pricing.price,
        currency: pricing.currency,
        status: 'Active',
        startDate,
        endDate,
        autoRenew: true,
        paymentId,
        notes,
      },
    });

    await this.activatePremiumForUser(userId);

    return subscription;
  }

  async createRazorpayOrder(dto: CreateRazorpayOrderDto): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    planType: string;
    planAmount: number;
  }> {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new BadRequestException('Razorpay is not configured on server');
    }

    const pricing = this.getPricing(dto.planType);
    if (!pricing.price) {
      throw new BadRequestException('Invalid subscription plan selected');
    }

    const amountInPaise = pricing.price * 100;
    const receipt = `sub_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          userId: dto.userId,
          planType: dto.planType,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadRequestException(`Unable to create Razorpay order: ${errorBody}`);
    }

    const order = await response.json();

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      planType: dto.planType,
      planAmount: pricing.price,
    };
  }

  async verifyRazorpayPayment(dto: VerifyRazorpayPaymentDto): Promise<{
    message: string;
    subscription: SubscriptionResponseDto;
  }> {
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      throw new BadRequestException('Razorpay is not configured on server');
    }

    const generatedSignature = createHmac('sha256', razorpayKeySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const existing = await this.prisma.subscription.findFirst({
      where: { paymentId: dto.razorpayPaymentId },
    });

    if (existing) {
      return {
        message: 'Payment already verified and subscription is active',
        subscription: this.formatResponse(existing),
      };
    }

    const created = await this.createSubscriptionRecord(
      dto.userId,
      dto.planType,
      dto.razorpayPaymentId,
      dto.notes || `Razorpay order: ${dto.razorpayOrderId}`,
    );

    return {
      message: 'Payment verified and subscription activated',
      subscription: this.formatResponse(created),
    };
  }

  async create(dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    try {
      const subscription = await this.createSubscriptionRecord(
        dto.userId,
        dto.planType,
        dto.paymentId,
        dto.notes,
      );

      return this.formatResponse(subscription);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Subscription already exists for this user');
      }
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions.map((sub) => this.formatResponse(sub));
  }

  async findActiveSubscription(userId: string): Promise<SubscriptionResponseDto | null> {
    const now = new Date();
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'Active',
        endDate: { gt: now },
      },
      orderBy: { endDate: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    return this.formatResponse(subscription);
  }

  async findOne(userId: string, id: number): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.formatResponse(subscription);
  }

  async update(
    userId: string,
    id: number,
    dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    // Verify ownership
    await this.findOne(userId, id);

    const updateData: any = { ...dto };

    // If plan type is changed, recalculate end date
    if (dto.planType) {
      const subscription = await this.prisma.subscription.findFirst({
        where: { userId, id },
      });
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }
      updateData.endDate = this.calculateEndDate(subscription.startDate, dto.planType);
    }

    try {
      const subscription = await this.prisma.subscription.update({
        where: { id },
        data: updateData,
      });

      return this.formatResponse(subscription);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Subscription not found');
      }
      throw error;
    }
  }

  async cancel(userId: string, id: number): Promise<{ message: string }> {
    // Verify ownership
    await this.findOne(userId, id);

    await this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'Cancelled',
        autoRenew: false,
      },
    });

    return { message: 'Subscription cancelled successfully' };
  }

  async checkTrialStatus(userId: string): Promise<{
    isTrialActive: boolean;
    trialEndDate: Date | null;
    daysRemaining: number | null;
  }> {
    const userManagement = await this.prisma.userManagement.findUnique({
      where: { userId },
    });

    if (!userManagement) {
      throw new NotFoundException('User not found');
    }

    if (!userManagement.isTrialActive || !userManagement.trialEndDate) {
      return {
        isTrialActive: false,
        trialEndDate: null,
        daysRemaining: null,
      };
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (userManagement.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      isTrialActive: daysRemaining > 0,
      trialEndDate: userManagement.trialEndDate,
      daysRemaining: Math.max(0, daysRemaining),
    };
  }

  async initiateTrial(userId: string): Promise<{ message: string }> {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30);

    try {
      await this.prisma.userManagement.update({
        where: { userId },
        data: {
          trialStartDate: now,
          trialEndDate: trialEnd,
          isTrialActive: true,
        },
      });

      return { message: '30-day trial initiated successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async getUserSubscriptionStatus(userId: string): Promise<{
    plan: string;
    isTrialActive: boolean;
    activeSubscription: SubscriptionResponseDto | null;
    trialEndDate: Date | null;
    subscriptionEndDate: Date | null;
    trialDaysRemaining: number;
    subscriptionDaysRemaining: number;
    currentAccessType: 'trial' | 'subscription' | 'expired';
    currentPlanLabel: string;
    accessEndsAt: Date | null;
  }> {
    let userManagement = await this.prisma.userManagement.findUnique({
      where: { userId },
    });

    if (!userManagement) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 30);

      userManagement = await this.prisma.userManagement.create({
        data: {
          userId,
          fullName: userId,
          email: `${userId}@local.smartgst`,
          status: 'Pending',
          plan: 'Basic',
          trialStartDate: now,
          trialEndDate: trialEnd,
          isTrialActive: true,
        },
      });
    }

    if (!userManagement.trialStartDate && !userManagement.trialEndDate && userManagement.plan === 'Basic') {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 30);

      userManagement = await this.prisma.userManagement.update({
        where: { userId },
        data: {
          trialStartDate: now,
          trialEndDate: trialEnd,
          isTrialActive: true,
        },
      });
    }

    const now = new Date();

    // Keep subscription status consistent if any active plan has passed end date.
    await this.prisma.subscription.updateMany({
      where: {
        userId,
        status: 'Active',
        endDate: { lte: now },
      },
      data: { status: 'Expired' },
    });

    const activeSubscription = await this.findActiveSubscription(userId);
    const trialStatus = await this.checkTrialStatus(userId);

    // Auto-disable trial when it has passed.
    if (userManagement.isTrialActive && trialStatus.daysRemaining === 0) {
      userManagement = await this.prisma.userManagement.update({
        where: { userId },
        data: { isTrialActive: false },
      });
    }

    const trialDaysRemaining = trialStatus.daysRemaining ?? 0;
    const subscriptionDaysRemaining = this.calculateRemainingDays(activeSubscription?.endDate ?? null);

    const currentAccessType: 'trial' | 'subscription' | 'expired' = trialStatus.isTrialActive
      ? 'trial'
      : activeSubscription
        ? 'subscription'
        : 'expired';

    const currentPlanLabel = currentAccessType === 'trial'
      ? 'Basic Trial'
      : currentAccessType === 'subscription'
        ? `${activeSubscription?.planType} Plan`
        : 'No Active Plan';

    const accessEndsAt = currentAccessType === 'trial'
      ? trialStatus.trialEndDate
      : activeSubscription?.endDate ?? null;

    return {
      plan: userManagement.plan,
      isTrialActive: trialStatus.isTrialActive,
      activeSubscription,
      trialEndDate: trialStatus.trialEndDate,
      subscriptionEndDate: activeSubscription?.endDate || null,
      trialDaysRemaining,
      subscriptionDaysRemaining,
      currentAccessType,
      currentPlanLabel,
      accessEndsAt,
    };
  }

  async handleRazorpayWebhook(payload: any): Promise<{ status: string }> {
    const event = payload.event;
    const data = payload.data;

    console.log(`Razorpay webhook received: ${event}`, data);

    switch (event) {
      case 'payment.failed':
        // Handle payment failure
        return this.handlePaymentFailure(data);

      case 'payment.authorized':
        // Handle payment authorized
        return this.handlePaymentAuthorized(data);

      case 'refund.created':
        // Handle refund created
        return this.handleRefundCreated(data);

      default:
        console.log(`Unhandled webhook event: ${event}`);
        return { status: 'unhandled' };
    }
  }

  private async handlePaymentFailure(data: any): Promise<{ status: string }> {
    const paymentId = data.payment?.id;
    const errorDescription = data.payment?.error_description;

    console.log(`Payment failed: ${paymentId} - ${errorDescription}`);

    // Log payment failure for customer support
    if (paymentId) {
      try {
        // Update notes or create a log entry for support team
        // For now, just log the failure
        console.error(`Payment failure logged: ${paymentId} - ${errorDescription}`);
      } catch (error) {
        console.error('Error logging payment failure:', error);
      }
    }

    return { status: 'logged' };
  }

  private async handlePaymentAuthorized(data: any): Promise<{ status: string }> {
    const paymentId = data.payment?.id;
    const orderId = data.payment?.order_id;

    console.log(`Payment authorized: ${paymentId} for order ${orderId}`);

    return { status: 'processed' };
  }

  private async handleRefundCreated(data: any): Promise<{ status: string }> {
    const refundId = data.refund?.id;
    const paymentId = data.refund?.payment_id;
    const amount = data.refund?.amount;

    console.log(
      `Refund created: ${refundId} for payment ${paymentId}, amount: ${amount}`,
    );

    // Log refund for customer support
    try {
      // Find subscription by payment ID and update notes with refund information
      const subscription = await this.prisma.subscription.findFirst({
        where: { paymentId },
      });

      if (subscription) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            notes: `${subscription.notes || ''}\n[Admin] Refund ${refundId} processed for amount ₹${amount / 100}. Refund will be credited within 5-7 working days.`,
          },
        });
      }
    } catch (error) {
      console.error('Error logging refund:', error);
    }

    return { status: 'logged' };
  }

  private formatResponse(subscription: any): SubscriptionResponseDto {
    return {
      id: subscription.id,
      userId: subscription.userId,
      planType: subscription.planType,
      price: subscription.price.toString(),
      currency: subscription.currency,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      paymentId: subscription.paymentId,
      notes: subscription.notes,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
