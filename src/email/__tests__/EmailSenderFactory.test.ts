import { EmailSenderFactory } from '../EmailSenderFactory';
import { AwsSender } from '../AwsSender';
import { NodemailerSender } from '../NodemailerSender';
import { SmtpConfigWithType, AwsConfigWithType, EmailConfig } from '../types';

// Mock implementation classes
jest.mock('../AwsSender');
jest.mock('../NodemailerSender');

describe('EmailSenderFactory', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should create an AwsSender instance when type is aws', () => {
    // Arrange
    const awsConfig: AwsConfigWithType = {
      type: 'aws',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      region: 'us-east-1',
    };

    // Act
    const sender = EmailSenderFactory.createSender(awsConfig);

    // Assert
    expect(sender).toBeInstanceOf(AwsSender);
    expect(AwsSender).toHaveBeenCalledWith(awsConfig);
  });

  it('should create a NodemailerSender instance when type is smtp', () => {
    // Arrange
    const smtpConfig: SmtpConfigWithType = {
      type: 'smtp',
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'password123',
      },
    };

    // Act
    const sender = EmailSenderFactory.createSender(smtpConfig);

    // Assert
    expect(sender).toBeInstanceOf(NodemailerSender);
    expect(NodemailerSender).toHaveBeenCalledWith(smtpConfig);
  });

  it('should throw an error for unsupported email sender type', () => {
    // Arrange
    const invalidConfig = {
      type: 'invalid-type',
    } as unknown as EmailConfig;

    // Act & Assert
    expect(() => {
      EmailSenderFactory.createSender(invalidConfig);
    }).toThrow(`unsupported email sender type: invalid-type`);
  });
});
