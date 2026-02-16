import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettingsDto, UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettingsByUserId(userId: string) {
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Return default settings if none exist
      return this.createDefaultSettings(userId);
    }

    return settings;
  }

  async createSettings(createSettingsDto: CreateSettingsDto) {
    // Check if settings already exist for this user
    const existing = await this.prisma.settings.findUnique({
      where: { userId: createSettingsDto.userId },
    });

    if (existing) {
      // Update existing settings instead of creating new
      return this.updateSettings(createSettingsDto.userId, createSettingsDto);
    }

    return this.prisma.settings.create({
      data: createSettingsDto,
    });
  }

  async updateSettings(userId: string, updateSettingsDto: UpdateSettingsDto) {
    // Check if settings exist
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      throw new NotFoundException(`Settings for user ${userId} not found`);
    }

    return this.prisma.settings.update({
      where: { userId },
      data: updateSettingsDto,
    });
  }

  async deleteSettings(userId: string) {
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      throw new NotFoundException(`Settings for user ${userId} not found`);
    }

    return this.prisma.settings.delete({
      where: { userId },
    });
  }

  private async createDefaultSettings(userId: string) {
    return this.prisma.settings.create({
      data: {
        userId,
        invoicePrefix: 'INV',
        dueDays: 30,
        invoiceTemplate: 'standard',
        einvoiceEnabled: false,
        gstr1Alerts: true,
        gstr3bAlerts: true,
        paymentDueAlerts: true,
        remindBeforeDays: 3,
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: false,
        theme: 'light',
        compactMode: false,
        accentColor: '#2563eb',
        dateFormat: 'DD/MM/YYYY',
        currencyFormat: 'INR',
        numberFormat: 'indian',
      },
    });
  }
}
