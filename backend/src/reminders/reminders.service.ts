import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

type ReminderStatus = 'Pending' | 'Completed' | 'Sent' | 'Cancelled' | 'Failed';

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
  private reminderStoreReady = false;

  constructor(private readonly prisma: PrismaService) {}

  private async ensureReminderStore(): Promise<void> {
    if (this.reminderStoreReady) {
      return;
    }

    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReminderStatus') THEN
          CREATE TYPE "ReminderStatus" AS ENUM ('Pending', 'Completed', 'Sent', 'Cancelled', 'Failed');
        END IF;
      END $$;
    `);

    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReminderStatus')
          AND NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'ReminderStatus' AND e.enumlabel = 'Completed'
          ) THEN
          ALTER TYPE "ReminderStatus" ADD VALUE 'Completed';
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

    const reminder = await this.prisma.reminder.create({
      data: {
        userId: createReminderDto.userId,
        title: createReminderDto.title,
        description: createReminderDto.description || null,
        scheduledFor: new Date(createReminderDto.scheduledFor),
        recipientEmail: (createReminderDto.recipientEmail || 'noreply@smartgst.local').toLowerCase(),
        status: 'Pending',
      },
    });

    return new ReminderResponseDto(reminder as ReminderRow);
  }

  async findAllByUser(userId: string): Promise<ReminderResponseDto[]> {
    await this.ensureReminderStore();

    const reminders = await this.prisma.reminder.findMany({
      where: { userId },
      orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'desc' }],
    });

    return reminders.map((reminder) => new ReminderResponseDto(reminder as ReminderRow));
  }

  async update(
    id: number,
    userId: string,
    updateReminderDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    await this.ensureReminderStore();

    await this.ensureOwnedReminder(id, userId);

    if (
      updateReminderDto.title === undefined &&
      updateReminderDto.description === undefined &&
      updateReminderDto.scheduledFor === undefined &&
      updateReminderDto.recipientEmail === undefined &&
      updateReminderDto.status === undefined
    ) {
      const existing = await this.ensureOwnedReminder(id, userId);
      return new ReminderResponseDto(existing);
    }

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

    if (updateReminderDto.recipientEmail !== undefined) {
      values.push(updateReminderDto.recipientEmail.toLowerCase());
      updateClauses.push(`"recipientEmail" = $${values.length}`);
    }

    if (updateReminderDto.status !== undefined) {
      values.push(updateReminderDto.status);
      updateClauses.push(`"status" = $${values.length}::"ReminderStatus"`);
    }

    updateClauses.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    values.push(id);

    let reminders: ReminderRow[];

    try {
      reminders = await this.prisma.$queryRawUnsafe<ReminderRow[]>(
        `
        UPDATE "Reminder"
        SET ${updateClauses.join(', ')}
        WHERE "id" = $${values.length}
        RETURNING *
        `,
        ...values,
      );
    } catch (error) {
      const shouldRetryWithEnumPatch =
        updateReminderDto.status === 'Completed' && this.isMissingCompletedStatusEnumError(error);

      if (!shouldRetryWithEnumPatch) {
        throw error;
      }

      this.logger.warn('ReminderStatus enum is missing Completed; applying enum patch and retrying update.');
      await this.ensureCompletedStatusEnumValue();

      reminders = await this.prisma.$queryRawUnsafe<ReminderRow[]>(
        `
        UPDATE "Reminder"
        SET ${updateClauses.join(', ')}
        WHERE "id" = $${values.length}
        RETURNING *
        `,
        ...values,
      );
    }

    return new ReminderResponseDto(reminders[0]);
  }

  private isMissingCompletedStatusEnumError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    return (
      message.includes('invalid input value for enum') &&
      message.includes('reminderstatus') &&
      message.includes('completed')
    );
  }

  private async ensureCompletedStatusEnumValue(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      ALTER TYPE "ReminderStatus" ADD VALUE IF NOT EXISTS 'Completed';
    `);
  }

  async remove(id: number, userId: string): Promise<{ message: string }> {
    await this.ensureReminderStore();

    await this.ensureOwnedReminder(id, userId);

    await this.prisma.reminder.delete({ where: { id } });

    return { message: `Reminder ${id} deleted successfully` };
  }

  private async ensureOwnedReminder(id: number, userId: string): Promise<ReminderRow> {
    const reminder = (await this.prisma.reminder.findFirst({
      where: { id, userId },
    })) as ReminderRow | null;

    if (!reminder) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }

    return reminder;
  }

}
