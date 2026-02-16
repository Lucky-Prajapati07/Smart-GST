import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Check if we're in development mode (SMTP not configured)
  private get isDevelopmentMode(): boolean {
    return (
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      process.env.SMTP_USER === 'your-email@gmail.com' ||
      process.env.SMTP_PASS === 'your-gmail-app-password'
    );
  }

  // Generate 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP
  async sendOtp(sendOtpDto: SendOtpDto) {
    const { identifier, method, purpose = 'signup' } = sendOtpDto;

    // Only email method is supported
    if (method !== 'email') {
      throw new BadRequestException('Only email verification is supported');
    }

    // Validate email format
    if (!this.isValidEmail(identifier)) {
      throw new BadRequestException('Invalid email format');
    }

    // Check rate limiting: Max 3 OTPs per hour per identifier
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await this.prisma.otp.count({
      where: {
        identifier,
        purpose,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentOtps >= 3) {
      throw new BadRequestException(
        'Too many OTP requests. Please try again after 1 hour.',
      );
    }

    // Generate OTP
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to database
    await this.prisma.otp.create({
      data: {
        identifier,
        otp,
        purpose,
        expiresAt,
      },
    });

    // Send OTP via email
    await this.sendOtpEmail(identifier, otp, purpose);

    return {
      success: true,
      message: `OTP sent successfully to ${identifier}`,
      expiresIn: '10 minutes',
    };
  }

  // Verify OTP
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { identifier, otp, purpose = 'signup' } = verifyOtpDto;

    // Find the most recent OTP for this identifier and purpose
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        identifier,
        purpose,
        isVerified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException(
        'No OTP found. Please request a new OTP.',
      );
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    // Check attempt limit (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempt count
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      throw new BadRequestException(
        `Invalid OTP. ${5 - (otpRecord.attempts + 1)} attempts remaining.`,
      );
    }

    // Mark OTP as verified
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isVerified: true },
    });

    return {
      success: true,
      message: 'OTP verified successfully',
      identifier,
    };
  }

  // Send OTP via Email
  private async sendOtpEmail(email: string, otp: string, purpose: string) {
    const subject = `Your Smart GST Verification Code - ${otp}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Smart GST</h1>
            <p>Verification Code</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>You requested a verification code for <strong>${purpose}</strong>.</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
            </div>
            
            <p>Enter this code in the verification page to continue.</p>
            
            <div class="warning">
              <strong>⚠️ Security Warning:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Never share this code with anyone</li>
                <li>Smart GST will never ask for your OTP</li>
                <li>This code expires in 10 minutes</li>
              </ul>
            </div>
            
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 Smart GST. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Development mode: Log OTP to console instead of sending email
    if (this.isDevelopmentMode) {
      console.log('\n' + '='.repeat(60));
      console.log('📧 DEVELOPMENT MODE - OTP EMAIL');
      console.log('='.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Purpose: ${purpose}`);
      console.log(`Expires: 10 minutes`);
      console.log('='.repeat(60) + '\n');
      console.log('ℹ️  To send real emails, configure SMTP_USER and SMTP_PASS in .env');
      console.log('ℹ️  Get Gmail App Password: https://myaccount.google.com/apppasswords\n');
      return;
    }

    // Production mode: Send actual email
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Smart GST" <noreply@smartgst.com>',
        to: email,
        subject,
        html,
      });
      console.log(`✅ OTP email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      throw new BadRequestException(
        'Failed to send OTP email. Please check your email address and try again.',
      );
    }
  }

  // Cleanup expired OTPs (can be called periodically)
  async cleanupExpiredOtps() {
    const result = await this.prisma.otp.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return {
      success: true,
      deletedCount: result.count,
    };
  }

  // Validation helper
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
