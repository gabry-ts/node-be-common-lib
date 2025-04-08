import { Attachment } from 'nodemailer/lib/mailer';

// define email data interface
export interface EmailData {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
}

// define configuration interfaces
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

// configuration with type discriminator
export interface SmtpConfigWithType extends SmtpConfig {
  type: 'smtp';
}

export interface AwsConfigWithType extends AwsConfig {
  type: 'aws';
}

export type EmailConfig = SmtpConfigWithType | AwsConfigWithType;
