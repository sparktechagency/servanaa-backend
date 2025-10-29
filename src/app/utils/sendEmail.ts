/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';
import config from '../config/index';
import catchAsync from '../utils/catchAsync';
import httpStatus from 'http-status';
import AppError from '../errors/AppError';

export class SendEmail {
  private static transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      pass: config.email_app_password,
      user: config.admin_email_user,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  static async sendOTPEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: config.admin_email_user,
      to: email,
      subject: 'Your OTP for Verification',
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send OTP email.');
    }
  }

  static async sendQuoteEmailToClient(email: string, password: any): Promise<void> {
    const mailOptions = {
      from: config.admin_email_user,
      to: email,
      subject: 'Your Account and Quote Is Created',
      text: `Your account and quote are created. Email: ${email} and password: ${password}.`,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Quote email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send quote email.');
    }
  }

  static async sendResetLinkToEmail(email: string, resetLink: string): Promise<void> {
    const mailOptions = {
      from: config.admin_email_user,
      to: email,
      subject: 'Password Reset Link',
      text: `Your password reset link (valid for 10 minutes): ${resetLink}`,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Reset link sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send reset link email.');
    }
  }

  static async sendHelpReplyEmail(email: string, fullName: string, message: string): Promise<void> {
    const mailOptions = {
      from: config.admin_email_user,
      to: email,
      subject: 'Response to Your Help Request',
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h4 style=""><strong>Hello, ${fullName}</strong></h4>
        <p>We’ve reviewed your help request and here’s the admin’s response:</p>
        <blockquote style="border-left: 4px solid #007BFF; padding-left: 10px; color: #555;">
          ${message}
        </blockquote>
        <p>If you have any further questions, feel free to reply to this email.</p>
        <br/>
        <p>Best regards,<br/><strong>The Support Team</strong></p>
      </div>
    `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Help reply sent to ${email}`);
    } catch (error) {
      console.error('Error sending help reply email:', error);
      throw new Error('Failed to send help reply email.');
    }
  }
}