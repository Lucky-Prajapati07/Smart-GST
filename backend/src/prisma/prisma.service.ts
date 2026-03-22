import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: PrismaService.buildDatabaseUrl(),
        },
      },
    });
  }

  private static buildDatabaseUrl(): string {
    const rawUrl = process.env.DATABASE_URL?.trim();

    if (!rawUrl) {
      throw new Error(
        'DATABASE_URL is not set. Add it to backend/.env before starting the API.',
      );
    }

    const parsedUrl = new URL(rawUrl);

    if (!parsedUrl.port) {
      parsedUrl.port = '5432';
    }

    if (!parsedUrl.searchParams.has('sslmode')) {
      parsedUrl.searchParams.set('sslmode', 'require');
    }

    if (
      parsedUrl.hostname.includes('neon.tech') &&
      parsedUrl.hostname.includes('pooler') &&
      !parsedUrl.searchParams.has('pgbouncer')
    ) {
      parsedUrl.searchParams.set('pgbouncer', 'true');
    }

    if (!parsedUrl.searchParams.has('connect_timeout')) {
      parsedUrl.searchParams.set('connect_timeout', '15');
    }

    return parsedUrl.toString();
  }

  private static async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onModuleInit() {
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        this.logger.log(`Database connected on attempt ${attempt}/${maxAttempts}.`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (attempt === maxAttempts) {
          this.logger.error(
            `Database connection failed after ${maxAttempts} attempts. ${message}`,
          );
          throw error;
        }

        const delayMs = Math.min(1000 * 2 ** (attempt - 1), 10000);
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxAttempts} failed. Retrying in ${delayMs}ms.`,
        );
        await PrismaService.sleep(delayMs);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
