import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

type ReminderStatus = 'Pending' | 'Sent' | 'Cancelled' | 'Failed';

type ReminderRow = {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  scheduledFor: Date;
  recipientEmail: string;
  status: ReminderStatus;
  sentAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private readonly transporter: nodemailer.Transporter;
  private reminderStoreReady = false;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = this.buildTransporter();
  }

  private async ensureReminderStore(): Promise<void> {
    if (this.reminderStoreReady) {
      return;
    }

    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReminderStatus') THEN
          CREATE TYPE "ReminderStatus" AS ENUM ('Pending', 'Sent', 'Cancelled', 'Failed');
        END IF;
      END $$;
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Reminder" (
        "id" SERIAL NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "scheduledFor" TIMESTAMP(3) NOT NULL,
        "recipientEmail" TEXT NOT NULL,
        "status" "ReminderStatus" NOT NULL DEFAULT 'Pending',
        "sentAt" TIMESTAMP(3),
        "lastError" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
      );
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Reminder_userId_status_idx" ON "Reminder"("userId", "status");
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Reminder_scheduledFor_idx" ON "Reminder"("scheduledFor");
    `);

    this.reminderStoreReady = true;
  }

  async create(createReminderDto: CreateReminderDto): Promise<ReminderResponseDto> {
    await this.ensureReminderStore();

    const reminders = await this.prisma.$queryRawUnsafe<ReminderRow[]>(
      `
      INSERT INTO "Reminder" ("userId", "title", "description", "scheduledFor", "recipientEmail", "status", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      createReminderDto.userId,
      createReminderDto.title,
      createReminderDto.description || null,
      new Date(createReminderDto.scheduledFor),
      createReminderDto.recipientEmail.toLowerCase(),
    );

    const reminder = reminders[0];

    return new ReminderResponseDto(reminder);
  }

  async findAllByUser(userId: string): Promise<ReminderResponseDto[]> {
    await this.ensureReminderStore();

    const reminders = await this.prisma.$queryRawUnsafe<ReminderRow[]>(
      `
      SELECT *
      FROM "Reminder"
      WHERE "userId" = $1
      ORDER BY "scheduledFor" ASC, "createdAt" DESC
      `,
      userId,
    );

    return reminders.map((reminder) => new ReminderResponseDto(reminder));
  }

  async update(
    id: number,
    userId: string,
    updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    await this.ensureReminderStore();

    await this.ensureOwnedReminder(id, userId);

    const updateClauses: string[] = [];
    const values: unknown[] = [];

    if (updateReminderDto.title !== undefined) {
      values.push(updateReminderDto.title);
      updateClauses.push(`"title" = $${values.length}`);
    }

    if (updateReminderDto.description !== undefined) {
      values.push(updateReminderDto.description);
      updateClauses.push(`"description" = $${values.length}`);
    }

    if (updateReminderDto.scheduledFor !== undefined) {
      values.push(new Date(updateReminderDto.scheduledFor));
      updateClauses.push(`"scheduledFor" = $${values.length}`);
    }

    if (updateReminderDto.status !== undefined) {
      values.push(updateReminderDto.status);
      updateClauses.push(`"status" = $${values.length}`);
    }

    if (!updateClauses.length) {
      const existing = await this.ensureOwnedReminder(id, userId);
      return new ReminderResponseDto(existing);
    }

    updateClauses.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    values.push(id);

    const reminders = await this.prisma.$queryRawUnsafe<ReminderRow[]>(
      `
      UPDATE "Reminder"
      SET ${updateClauses.join(', ')}
      WHERE "id" = $${values.length}
      RETURNING *
      `,
      ...values,
    );

    const reminder = reminders[0];

    return new ReminderResponseDto(reminder);
  }

  async remove(id: number, userId: string): Promise<{ message: string }> {
    await this.ensureReminderStore();

    await this.ensureOwnedReminder(id, userId);

    await this.prisma.$executeRawUnsafe(`DELETE FROM "Reminder" WHERE "id" = $1`, id);

    return { message: `Reminder ${id} deleted successfully` };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendDueReminders(): Promise<void> {
    await this.ensureReminderStore();

    const now = new Date();

    const reminders = await this.prisma.$queryRawUnsafe<ReminderRow[]>(
      `
      SELECT *
      FROM "Reminder"
      WHERE "status" = 'Pending' AND "scheduledFor" <= $1
      ORDER BY "scheduledFor" ASC
      LIMIT 100
      `,
      now,
    );

    if (!reminders.length) {
      return;
    }

    for (const reminder of reminders) {
      try {
        await this.sendReminderEmail(reminder.recipientEmail, reminder.title, reminder.description, reminder.scheduledFor);

        await this.prisma.$executeRawUnsafe(
          `
          UPDATE "Reminder"
          SET "status" = 'Sent', "sentAt" = CURRENT_TIMESTAMP, "lastError" = NULL, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = $1
          `,
          reminder.id,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to send reminder ${reminder.id}: ${message}`);

        await this.prisma.$executeRawUnsafe(
          `
          UPDATE "Reminder"
          SET "status" = 'Failed', "lastError" = $2, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = $1
          `,
          reminder.id,
          message,
        );
      }
    }
  }

  private async ensureOwnedReminder(id: number, userId: string): Promise<ReminderRow> {
    const reminders = await this.prisma.$queryRawUnsafe<ReminderRow[]>(
      `
      SELECT *
      FROM "Reminder"
      WHERE "id" = $1 AND "userId" = $2
      LIMIT 1
      `,
      id,
      userId,
    );

    const reminder = reminders[0];

    if (!reminder) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }

    return reminder;
  }

  private buildTransporter(): nodemailer.Transporter {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    }

    this.logger.warn('SMTP is not configured. Using jsonTransport for reminder emails.');
    return nodemailer.createTransport({ jsonTransport: true });
  }

  private async sendReminderEmail(
    to: string,
    title: string,
    description: string | null,
    scheduledFor: Date,
  ): Promise<void> {
    const from = process.env.SMTP_FROM || 'noreply@smartgst.local';
    const scheduledAt = scheduledFor.toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    await this.transporter.sendMail({
      from,
      to,
      subject: `Reminder: ${title}`,
      text: `This is your scheduled reminder.\n\nTask: ${title}\nScheduled at: ${scheduledAt}\n\n${description || ''}`,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">Task Reminder</h2>
        <p style="margin: 0 0 10px;">This is your scheduled reminder from Smart GST.</p>
        <p style="margin: 0;"><strong>Task:</strong> ${title}</p>
        <p style="margin: 0;"><strong>Scheduled at:</strong> ${scheduledAt}</p>
        ${description ? `<p style="margin-top: 10px;"><strong>Notes:</strong> ${description}</p>` : ''}
      </div>`,
    });
  }
}
