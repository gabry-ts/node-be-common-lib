import { EmailData } from './types';
import * as nodemailer from 'nodemailer';

// base email sender abstract class
export abstract class EmailSender {
  // abstract method that must be implemented by subclasses
  abstract send(emailData: EmailData): Promise<nodemailer.SentMessageInfo>;
}
