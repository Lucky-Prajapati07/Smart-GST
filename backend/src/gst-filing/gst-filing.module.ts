import { Module } from '@nestjs/common';
import { GstFilingController } from './gst-filing.controller';
import { GstFilingService } from './gst-filing.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GstFilingController],
  providers: [GstFilingService],
  exports: [GstFilingService],
})
export class GstFilingModule {}
