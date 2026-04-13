import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private getTransporter(): nodemailer.Transporter {
    const host = process.env['SMTP_HOST'];
    const port = parseInt(process.env['SMTP_PORT'] ?? '587', 10);
    const secure = process.env['SMTP_SECURE'] === 'true';
    const user = process.env['SMTP_USER'];
    const pass = process.env['SMTP_PASS'];

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured — emails will be logged to console only');
      return {
        sendMail: async (opts: nodemailer.SendMailOptions) => {
          this.logger.log(`[EMAIL MOCK] To: ${String(opts.to)} | Subject: ${opts.subject}\n${opts.text ?? opts.html}`);
        },
      } as unknown as nodemailer.Transporter;
    }

    this.logger.debug(`Creating SMTP transport: ${host}:${port} secure=${secure} user=${user}`);

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  private get appUrl(): string {
    return process.env['APP_URL'] ?? 'http://localhost:3000';
  }

  private get from(): string {
    return process.env['SMTP_FROM'] ?? `StockHome <${process.env['SMTP_USER']}>`;
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${this.appUrl}/auth/verify-email?token=${token}`;
    try {
      await this.getTransporter().sendMail({
        from: this.from,
        to: email,
        subject: 'Confirm your StockHome account',
        text: `Click the link below to confirm your email address:\n\n${link}\n\nThis link expires in 48 hours.`,
        html: `<p>Click the link below to confirm your email address:</p><p><a href="${link}">${link}</a></p><p>This link expires in 48 hours.</p>`,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${email}: ${(err as Error).message}`);
    }
  }

  async sendAdminPasswordEmail(email: string, password: string, isReset: boolean): Promise<void> {
    const subject = isReset
      ? 'Your StockHome admin password has been reset'
      : 'Your StockHome admin account has been created';
    const action = isReset ? 'reset' : 'created';
    try {
      await this.getTransporter().sendMail({
        from: this.from,
        to: email,
        subject,
        text: `Your StockHome admin account has been ${action}.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease log in and change your password immediately.\nSet FIRST_LAUNCH=false in your .env to prevent accidental resets.`,
        html: `<p>Your StockHome admin account has been <strong>${action}</strong>.</p><table><tr><td><strong>Email</strong></td><td>${email}</td></tr><tr><td><strong>Password</strong></td><td><code>${password}</code></td></tr></table><p>Please log in and change your password immediately.</p><p>Set <code>FIRST_LAUNCH=false</code> in your <code>.env</code> to prevent accidental resets.</p>`,
      });
      this.logger.log(`Admin password email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send admin password email to ${email}: ${(err as Error).message}`);
    }
  }

  async sendInvitationEmail(invitedEmail: string, householdName: string, inviterName: string, token: string): Promise<void> {
    const link = `${this.appUrl}/invitations/accept?token=${token}`;
    try {
      await this.getTransporter().sendMail({
        from: this.from,
        to: invitedEmail,
        subject: `${inviterName} invited you to join ${householdName} on StockHome`,
        text: `${inviterName} has invited you to join "${householdName}" on StockHome.\n\nAccept invitation: ${link}\n\nThis invitation expires in 7 days.`,
        html: `<p>${inviterName} has invited you to join <strong>${householdName}</strong> on StockHome.</p><p><a href="${link}">Accept invitation</a></p><p>This invitation expires in 7 days.</p>`,
      });
      this.logger.log(`Invitation email sent to ${invitedEmail}`);
    } catch (err) {
      this.logger.error(`Failed to send invitation email to ${invitedEmail}: ${(err as Error).message}`);
    }
  }
}
