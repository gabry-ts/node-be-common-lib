import { EmailData } from './types';

// base email sender abstract class
export abstract class EmailSender {
  // abstract method that must be implemented by subclasses
  abstract send(emailData: EmailData): Promise<any>;
}
