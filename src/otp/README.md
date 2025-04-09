# OTP Module

This module provides services for generating and validating One-Time Passwords (OTPs).

## Exports

The module exports:

- `OtpService`: Service for creating and validating OTPs

## Usage

```typescript
import { OtpService } from '@tih/common';

// Create OTP service with default options (6-digit numeric OTP)
const otpService = new OtpService();

// Create OTP service with custom options
const customOtpService = new OtpService(
  { length: 8, numbersOnly: false }, // OTP options
  { algorithm: 'sha512', salt: 'your-secret-salt' }, // Hash options
  30 * 60 * 1000, // 30 minutes expiry time in milliseconds
);

// Generate an OTP
const { otp, hash, expiresAt } = otpService.createOtp();

// Validate an OTP
const result = otpService.validateOtp(userProvidedOtp, storedHash, createdAt);
if (result.valid) {
  // OTP is valid
} else if (result.expired) {
  // OTP has expired
} else {
  // OTP is invalid
}
```

## Components

- `OtpService`: Main service for creating and validating OTPs
- `OtpGenerator`: Service for generating random OTPs
- `OtpHashService`: Service for hashing and verifying OTPs
