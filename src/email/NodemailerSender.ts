import * as nodemailer from 'nodemailer';
import { EmailSender } from './EmailSender';
import { EmailData, SmtpConfig } from './types';

// nodemailer implementation
export class NodemailerSender extends EmailSender {
  private transporter: nodemailer.Transporter;

  constructor(config: SmtpConfig) {
    super();
    // create reusable transporter object using smtp configuration
    this.transporter = nodemailer.createTransport(config);
  }

  // send email using nodemailer
  async send(emailData: EmailData): Promise<any> {
    try {
      // send mail with defined transport object
      const info = await this.transporter.sendMail({
        from: emailData.from,
        to: Array.isArray(emailData.to) ? emailData.to.join(',') : emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments: emailData.attachments,
      });

      return info;
    } catch (error) {
      throw new Error(`failed to send email with nodemailer: ${error}`);
    }
  }

  // verify smtp connection
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}
