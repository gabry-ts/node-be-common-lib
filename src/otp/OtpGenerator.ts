import { randomBytes } from 'crypto';
import { OtpOptions, DEFAULT_OTP_OPTIONS } from './types';

// service for generating otp codes
export class OtpGenerator {
  private options: OtpOptions;

  // characters allowed in otp
  private static readonly NUMBERS = '0123456789';
  private static readonly ALPHA_NUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  constructor(options: OtpOptions = DEFAULT_OTP_OPTIONS) {
    this.options = { ...DEFAULT_OTP_OPTIONS, ...options };
  }

  // generates a random otp based on current options
  public generate(): string {
    const { length, numbersOnly } = this.options;
    const chars = numbersOnly ? OtpGenerator.NUMBERS : OtpGenerator.ALPHA_NUMERIC;

    let otp = '';
    const randomBytesNeeded = length as number;

    // use cryptographically secure random values
    const randomValues = new Uint8Array(randomBytesNeeded);

    // fill array with random values
    randomValues.set(randomBytes(randomBytesNeeded));
    // generate otp using the random values
    for (let i = 0; i < length!; i++) {
      const randomIndex = randomValues[i] % chars.length;
      otp += chars.charAt(randomIndex);
    }

    return otp;
  }

  // changes the generation options
  public setOptions(options: OtpOptions): void {
    this.options = { ...this.options, ...options };
  }
}
