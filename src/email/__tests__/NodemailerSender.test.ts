import { NodemailerSender } from '../NodemailerSender';
import * as nodemailer from 'nodemailer';
import { EmailData, SmtpConfig } from '../types';

// Mock nodemailer
jest.mock('nodemailer');

describe('NodemailerSender', () => {
  // Mock implementations
  const mockSendMail = jest.fn();
  const mockVerify = jest.fn();
  const mockTransporter = {
    sendMail: mockSendMail,
    verify: mockVerify,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Setup mock implementation for createTransport
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  const smtpConfig: SmtpConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user@example.com',
      pass: 'password123',
    },
  };

  describe('constructor', () => {
    it('should create a nodemailer transporter with provided config', () => {
      // Arrange & Act
      new NodemailerSender(smtpConfig);

      // Assert
      expect(nodemailer.createTransport).toHaveBeenCalledWith(smtpConfig);
    });
  });

  describe('send', () => {
    it('should send email with single recipient successfully', async () => {
      // Arrange
      const sender = new NodemailerSender(smtpConfig);
      const emailData: EmailData = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content',
        html: '<p>Test HTML content</p>',
      };

      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        envelope: { from: 'sender@example.com', to: ['recipient@example.com'] },
      });

      // Act
      const result = await sender.send(emailData);

      // Assert
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content',
        html: '<p>Test HTML content</p>',
        attachments: undefined,
      });
      expect(result).toEqual({
        messageId: 'test-message-id',
        envelope: { from: 'sender@example.com', to: ['recipient@example.com'] },
      });
    });

    it('should send email with multiple recipients successfully', async () => {
      // Arrange
      const sender = new NodemailerSender(smtpConfig);
      const emailData: EmailData = {
        from: 'sender@example.com',
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Email',
        text: 'Test content',
      };

      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        envelope: {
          from: 'sender@example.com',
          to: ['recipient1@example.com', 'recipient2@example.com'],
        },
      });

      // Act
      const result = await sender.send(emailData);

      // Assert
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'sender@example.com',
        to: 'recipient1@example.com,recipient2@example.com',
        subject: 'Test Email',
        text: 'Test content',
        html: undefined,
        attachments: undefined,
      });
      expect(result).toEqual({
        messageId: 'test-message-id',
        envelope: {
          from: 'sender@example.com',
          to: ['recipient1@example.com', 'recipient2@example.com'],
        },
      });
    });

    it('should send email with attachments successfully', async () => {
      // Arrange
      const sender = new NodemailerSender(smtpConfig);
      const emailData: EmailData = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email with Attachments',
        text: 'Test content',
        attachments: [
          {
            filename: 'test.txt',
            content: 'Hello World!',
          },
        ],
      };

      mockSendMail.mockResolvedValue({
        messageId: 'test-message-id',
        envelope: { from: 'sender@example.com', to: ['recipient@example.com'] },
      });

      // Act
      const result = await sender.send(emailData);

      // Assert
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email with Attachments',
        text: 'Test content',
        html: undefined,
        attachments: [
          {
            filename: 'test.txt',
            content: 'Hello World!',
          },
        ],
      });
      expect(result).toEqual({
        messageId: 'test-message-id',
        envelope: { from: 'sender@example.com', to: ['recipient@example.com'] },
      });
    });

    it('should throw error when sending fails', async () => {
      // Arrange
      const sender = new NodemailerSender(smtpConfig);
      const emailData: EmailData = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'Test content',
      };

      const errorMessage = 'Failed to send email';
      mockSendMail.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(sender.send(emailData)).rejects.toThrow(
        `failed to send email with nodemailer: Error: ${errorMessage}`,
      );
    });
  });

  describe('verifyConnection', () => {
    it('should return true if connection verification succeeds', async () => {
      // Arrange
      const sender = new NodemailerSender(smtpConfig);
      mockVerify.mockResolvedValue(true);

      // Act
      const result = await sender.verifyConnection();

      // Assert
      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should return false if connection verification fails', async () => {
      // Arrange
      const sender = new NodemailerSender(smtpConfig);
      mockVerify.mockRejectedValue(new Error('Connection failed'));

      // Act
      const result = await sender.verifyConnection();

      // Assert
      expect(result).toBe(false);
      expect(mockVerify).toHaveBeenCalled();
    });
  });
});
