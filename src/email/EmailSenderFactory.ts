import { EmailSender } from './EmailSender';
import { EmailConfig, SmtpConfig, AwsConfig } from './types';
import { AwsSender } from './AwsSender';
import { NodemailerSender } from './NodemailerSender';

// email sender factory
export class EmailSenderFactory {
  // create email sender based on configuration type
  static createSender(config: EmailConfig): EmailSender {
    if (config.type === 'smtp') {
      return new NodemailerSender(config as SmtpConfig);
    } else if (config.type === 'aws') {
      return new AwsSender(config as AwsConfig);
    } else {
      throw new Error(
        `unsupported email sender type: ${(config as unknown as Record<string, string>)?.type}`,
      );
    }
  }
}
