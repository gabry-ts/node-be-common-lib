# @tinhub/node-be-common-lib

A fully typed TypeScript library for common utilities including AWS Cognito user management, email sending, and OTP operations.

## Installation

```bash
npm install @tinhub/node-be-common-lib
# or
yarn add @tinhub/node-be-common-lib
```

## Features

- **Cognito Service**: AWS Cognito user management with TypeScript interfaces
- **Email Service**: Email sending abstraction with AWS SES and SMTP implementations
- **OTP Service**: One-Time Password generation and validation

## Usage

### Cognito Service

```typescript
import { CognitoService, CognitoServiceConfig } from '@tinhub/node-be-common-lib';
import { Logger } from '@nestjs/common';

// Create a configuration
const config: CognitoServiceConfig = {
  region: 'eu-west-1',
  userPoolId: 'eu-west-1_xxxxxxxx',
  clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
  enableCognitoEmail: true,
  logger: new Logger('CognitoService'), // Optional
};

// Create an instance
const cognitoService = new CognitoService(config);

// Add a new user
async function addNewUser() {
  const result = await cognitoService.addUser({
    username: 'user@example.com',
    email: 'user@example.com',
    isVerified: false,
    temporaryPassword: 'TemporaryPwd123!',
  });

  console.log(`User added: ${result}`);
}

// Login a user
async function loginUser() {
  const result = await cognitoService.login({
    username: 'user@example.com',
    password: 'Password123!',
  });

  if (result.success) {
    console.log(`User logged in with token: ${result.accessToken}`);
  } else {
    console.log(`Login failed: ${result.error}`);
  }
}
```

### Email Service

```typescript
import { EmailSenderFactory, EmailData } from '@tinhub/node-be-common-lib';

// Create an AWS SES email sender
const awsSender = EmailSenderFactory.createSender({
  type: 'aws',
  accessKeyId: 'YOUR_AWS_ACCESS_KEY',
  secretAccessKey: 'YOUR_AWS_SECRET_KEY',
  region: 'eu-west-1',
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
async function sendEmail() {
  const emailData: EmailData = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Test Email',
    text: 'This is a test email',
    html: '<p>This is a <strong>test</strong> email</p>',
  };

  try {
    const result = await awsSender.send(emailData);
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
```

### OTP Service

```typescript
import { OtpService } from '@tinhub/node-be-common-lib';

// Create OTP service with default options (6-digit numeric OTP)
const otpService = new OtpService();

// Create OTP service with custom options
const customOtpService = new OtpService(
  { length: 8, numbersOnly: false }, // OTP options
  { algorithm: 'sha512', salt: 'your-secret-salt' }, // Hash options
  30 * 60 * 1000, // 30 minutes expiry time in milliseconds
);

// Generate an OTP
function generateOtp() {
  const { otp, hash, expiresAt } = otpService.createOtp();
  console.log(`OTP: ${otp}`);
  console.log(`Hash: ${hash}`);
  console.log(`Expires at: ${expiresAt}`);

  // Store the hash and expiresAt in your database
  // Send the OTP to the user

  return otp;
}

// Validate an OTP
function validateOtp(userProvidedOtp: string, storedHash: string, createdAt: Date) {
  const result = otpService.validateOtp(userProvidedOtp, storedHash, createdAt);

  if (result.valid) {
    console.log('OTP is valid');
    return true;
  } else if (result.expired) {
    console.log('OTP has expired');
    return false;
  } else {
    console.log('Invalid OTP');
    return false;
  }
}
```

## API Reference

See the TypeScript type definitions for detailed API documentation.

## License

MIT
