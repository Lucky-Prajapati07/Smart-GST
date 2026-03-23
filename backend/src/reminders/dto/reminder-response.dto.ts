type ReminderStatus = 'Pending' | 'Sent' | 'Cancelled' | 'Failed';

type ReminderRecord = {
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

export class ReminderResponseDto {
  id: number;
  userId: string;
  title: string;
  description?: string | null;
  scheduledFor: Date;
  recipientEmail: string;
  status: ReminderStatus;
  sentAt?: Date | null;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(entity: ReminderRecord) {
    this.id = entity.id;
    this.userId = entity.userId;
    this.title = entity.title;
    this.description = entity.description;
    this.scheduledFor = entity.scheduledFor;
    this.recipientEmail = entity.recipientEmail;
    this.status = entity.status;
    this.sentAt = entity.sentAt;
    this.lastError = entity.lastError;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
