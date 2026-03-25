import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './clients/clients.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ExpensesModule } from './expenses/expenses.module';
import { InvoicesModule } from './invoices/invoices.module';
import { SettingsModule } from './settings/settings.module';
import { GstFilingModule } from './gst-filing/gst-filing.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BusinessModule } from './business/business.module';
import { AdminModule } from './admin/admin.module';
import { RemindersModule } from './reminders/reminders.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    ClientsModule,
    TransactionsModule,
    ExpensesModule,
    InvoicesModule,
    SettingsModule,
    GstFilingModule,
    ReportsModule,
    DashboardModule,
    BusinessModule,
    AdminModule,
    RemindersModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
