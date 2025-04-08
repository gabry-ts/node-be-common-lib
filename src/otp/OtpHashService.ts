import { createHmac, timingSafeEqual } from 'crypto';
import { DEFAULT_HASH_OPTIONS, HashOptions } from './types';

// service for handling otp hashing operations
export class OtpHashService {
  private options: HashOptions;

  constructor(options: HashOptions = DEFAULT_HASH_OPTIONS) {
    this.options = { ...DEFAULT_HASH_OPTIONS, ...options };
  }

  // creates a hash of the given otp
  public createHash(otp: string): string {
    const { algorithm, salt } = this.options;

    // create hmac hash
    const hmac = createHmac(algorithm as string, salt as string);
    hmac.update(otp);

    // return base64 encoded hash
    return hmac.digest('base64');
  }

  // verifies if the given otp matches the hash
  public verifyHash(otp: string, hash: string): boolean {
    // hash the provided otp
    const computedHash = this.createHash(otp);

    // compare hashes using constant time comparison to prevent timing attacks
    return timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  }

  // changes the hash options
  public setOptions(options: HashOptions): void {
    this.options = { ...this.options, ...options };
  }
}
