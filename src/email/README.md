# Email Module

This module provides services for sending emails using different providers.

## Exports

The module exports:

- `EmailSenderFactory`: Factory for creating email sender instances
- Types for email configuration and data

## Usage

```typescript
import { EmailSenderFactory, EmailData } from '@tinhub/node-be-common-lib';

// Create an AWS SES email sender
const awsSender = EmailSenderFactory.createSender({
  type: 'aws',
  accessKeyId: 'YOUR_AWS_ACCESS_KEY',
  secretAccessKey: 'YOUR_AWS_SECRET_KEY',
  region: 'us-east-1',
});

// Or create an SMTP email sender
const smtpSender = EmailSenderFactory.createSender({
  type: 'smtp',
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'username',
    pass: 'password',
  },
});

// Send an email
const emailData: EmailData = {
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test Email',
  text: 'This is a test email',
  html: '<p>This is a <strong>test</strong> email</p>',
};

await awsSender.send(emailData);
```

## Available Senders

- `AwsSender`: Sends emails using AWS SES
- `NodemailerSender`: Sends emails using Nodemailer (SMTP)

Each sender implements the `EmailSender` abstract class and provides a `send` method.
