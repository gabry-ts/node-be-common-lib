import { OtpGenerator } from './OtpGenerator';
import { OtpHashService } from './OtpHashService';
import {
  HashOptions,
  OtpOptions,
  DEFAULT_OTP_OPTIONS,
  OtpGenerationResult,
  OtpValidationResult,
} from './types';

// main service for otp operations
export class OtpService {
  private generator: OtpGenerator;
  private hashService: OtpHashService;
  private expiryTimeMs: number | null;

  constructor(
    options: OtpOptions = DEFAULT_OTP_OPTIONS,
    hashOptions: HashOptions = {},
    expiryTimeMs: number | null = null,
  ) {
    this.generator = new OtpGenerator(options);
    this.hashService = new OtpHashService(hashOptions);
    this.expiryTimeMs = expiryTimeMs;
  }

  /**
   * Creates a new OTP and its corresponding hash
   * @returns An object containing the otp, hash, and expiry date if set
   */
  public createOtp(): OtpGenerationResult {
    // generate random otp
    const otp = this.generator.generate();

    // create hash for the otp
    const hash = this.hashService.createHash(otp);

    // calculate expiry time if set
    let expiresAt: Date | undefined = undefined;
    if (this.expiryTimeMs) {
      expiresAt = new Date(Date.now() + this.expiryTimeMs);
    }

    return {
      otp,
      hash,
      expiresAt,
    };
  }

  /**
   * Validates if the provided OTP matches the stored hash
   * @param otp The OTP to validate
   * @param hash The hash to validate against
   * @param createdAt Optional creation timestamp for expiry checking
   * @returns Object with validation result
   */
  public validateOtp(otp: string, hash: string, createdAt?: Date): OtpValidationResult {
    // check if otp has expired
    if (this.checkExpiry(createdAt)) return { valid: false, expired: true };

    // verify the hash
    return { valid: this.hashService.verifyHash(otp, hash) };
  }

  private checkExpiry(createdAt?: Date): boolean {
    if (this.expiryTimeMs && createdAt) {
      const expiryTime = new Date(createdAt.getTime() + this.expiryTimeMs);
      return new Date() > expiryTime;
    }
    return false;
  }
}
