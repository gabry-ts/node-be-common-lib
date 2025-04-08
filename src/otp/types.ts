// otp configuration options
export interface OtpOptions {
  length?: number;
  numbersOnly?: boolean;
}

// default otp options
export const DEFAULT_OTP_OPTIONS: OtpOptions = {
  length: 6,
  numbersOnly: true,
};

// otp generation result type
export interface OtpGenerationResult {
  otp: string;
  hash: string;
  expiresAt?: Date;
}

// otp validation result type
export interface OtpValidationResult {
  valid: boolean;
  expired?: boolean;
}

// algorithm for hashing
export type HashAlgorithm = 'sha256' | 'sha512';

// hashing options
export interface HashOptions {
  algorithm?: HashAlgorithm;
  salt?: string;
}

// default hash options
export const DEFAULT_HASH_OPTIONS: HashOptions = {
  algorithm: 'sha256',
  salt: '',
};
