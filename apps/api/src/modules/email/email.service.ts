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

  private baseTemplate(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:22px;font-weight:700;color:#6366f1;letter-spacing:-0.5px;">&#128230; StockHome</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                You received this email from StockHome. If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${this.appUrl}/auth/verify-email?token=${token}`;
    const html = this.baseTemplate('Confirm your StockHome account', `
      <div style="padding:32px 32px 8px;border-bottom:4px solid #6366f1;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Confirm your email</h1>
        <p style="margin:0;font-size:15px;color:#6b7280;">One quick step to activate your StockHome account.</p>
      </div>
      <div style="padding:24px 32px 32px;">
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
          Click the button below to verify your email address. This link expires in <strong>48 hours</strong>.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="border-radius:8px;background-color:#6366f1;">
              <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                Verify my email
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:13px;color:#9ca3af;">Or copy this link into your browser:<br/>
          <span style="color:#6366f1;word-break:break-all;">${link}</span>
        </p>
      </div>
    `);
    try {
      await this.getTransporter().sendMail({
        from: this.from,
        to: email,
        subject: 'Confirm your StockHome account',
        text: `Click the link below to confirm your email address:\n\n${link}\n\nThis link expires in 48 hours.`,
        html,
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
    const html = this.baseTemplate(subject, `
      <div style="padding:32px 32px 8px;border-bottom:4px solid #ef4444;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Admin account ${action}</h1>
        <p style="margin:0;font-size:15px;color:#6b7280;">Your StockHome administrator credentials.</p>
      </div>
      <div style="padding:24px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
          Your StockHome admin account has been <strong>${action}</strong>. Here are your credentials:
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <span style="display:block;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Email</span>
              <span style="font-size:14px;color:#111827;">${email}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;">
              <span style="display:block;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;">Temporary Password</span>
              <code style="font-size:15px;color:#111827;font-family:monospace;background-color:#f3f4f6;padding:2px 6px;border-radius:4px;">${password}</code>
            </td>
          </tr>
        </table>
        <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
          <p style="margin:0;font-size:13px;color:#dc2626;line-height:1.5;">
            <strong>Security notice:</strong> Please log in and change your password immediately.<br/>
            Set <code>FIRST_LAUNCH=false</code> in your <code>.env</code> to prevent accidental resets.
          </p>
        </div>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="border-radius:8px;background-color:#6366f1;">
              <a href="${this.appUrl}/auth/login" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                Log in to StockHome
              </a>
            </td>
          </tr>
        </table>
      </div>
    `);
    try {
      await this.getTransporter().sendMail({
        from: this.from,
        to: email,
        subject,
        text: `Your StockHome admin account has been ${action}.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease log in and change your password immediately.\nSet FIRST_LAUNCH=false in your .env to prevent accidental resets.`,
        html,
      });
      this.logger.log(`Admin password email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send admin password email to ${email}: ${(err as Error).message}`);
    }
  }

  async sendInvitationEmail(invitedEmail: string, householdName: string, inviterName: string, token: string): Promise<void> {
    const link = `${this.appUrl}/invitations/accept?token=${token}`;
    const html = this.baseTemplate(`Invitation to join ${householdName}`, `
      <div style="padding:32px 32px 8px;border-bottom:4px solid #6366f1;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">You've been invited!</h1>
        <p style="margin:0;font-size:15px;color:#6b7280;">${inviterName} wants you to join their household.</p>
      </div>
      <div style="padding:24px 32px 32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
          <strong>${inviterName}</strong> has invited you to join <strong>${householdName}</strong> on StockHome — a shared home inventory app.
        </p>
        <div style="background-color:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:0.05em;">Household</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#4c1d95;">${householdName}</p>
        </div>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="border-radius:8px;background-color:#6366f1;">
              <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                Accept invitation
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:13px;color:#9ca3af;">
          This invitation expires in <strong>7 days</strong>. If you don't have an account yet, you'll be able to create one after clicking the link above.
        </p>
      </div>
    `);
    try {
      await this.getTransporter().sendMail({
        from: this.from,
        to: invitedEmail,
        subject: `${inviterName} invited you to join ${householdName} on StockHome`,
        text: `${inviterName} has invited you to join "${householdName}" on StockHome.\n\nAccept invitation: ${link}\n\nThis invitation expires in 7 days.`,
        html,
      });
      this.logger.log(`Invitation email sent to ${invitedEmail}`);
    } catch (err) {
      this.logger.error(`Failed to send invitation email to ${invitedEmail}: ${(err as Error).message}`);
    }
  }
}
