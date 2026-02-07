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

  static async sendChangeEmailNotify(
    oldEmail: string,
    newEmail: string
  ): Promise<void> {
    const mailOptions = {
      from: config.admin_email_user,
      to: oldEmail,
      subject: 'Your Email Address Has Been Changed',
      text: `Your account email has been changed from ${oldEmail} to ${newEmail}. If you did not make this change, please contact our support team immediately.`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Change email notification sent to ${oldEmail}`);
    } catch (error) {
      console.error('Error sending change email notification:', error);
      throw new Error('Failed to send change email notification.');
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

  static async sendSupportRequestToAdmin(userEmail: string, fullName: string, subject: string, message: string): Promise<void> {
    const mailOptions = {
      from: 'support@servana.com.au',
      to: 'support@servana.com.au',
      subject: `New Support Request from ${fullName}`,
      html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h3 style="color: #007BFF;">New Help Request Received</h3>
        <p><strong>From:</strong> ${fullName} (${userEmail})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
        <p><strong>Message:</strong></p>
        <blockquote style="border-left: 4px solid #007BFF; padding-left: 10px; color: #555;">
          ${message}
        </blockquote>
        <br/>
        <p>Please review and reply through the admin panel or by email.</p>
        <br/>
        <p>— <strong>Support Notification System</strong></p>
      </div>
    `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending support request email to admin:', error);
      throw new Error('Failed to send support request email to admin.');
    }
  }

}