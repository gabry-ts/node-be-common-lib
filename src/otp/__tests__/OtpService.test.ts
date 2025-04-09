import { OtpService } from '../OtpService';
import { OtpGenerator } from '../OtpGenerator';
import { OtpHashService } from '../OtpHashService';
import { DEFAULT_OTP_OPTIONS, HashOptions } from '../types';

// Mock dependencies
jest.mock('../OtpGenerator');
jest.mock('../OtpHashService');

describe('OtpService', () => {
  // Mock implementations
  const mockGenerate = jest.fn();
  const mockCreateHash = jest.fn();
  const mockVerifyHash = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    // Setup mock implementations
    mockGenerate.mockReturnValue('123456');
    mockCreateHash.mockReturnValue('hashed-otp');
    mockVerifyHash.mockReturnValue(true);

    // Apply mocks to classes
    (OtpGenerator as any as jest.Mock).mockImplementation(() => ({
      generate: mockGenerate,
      setOptions: jest.fn(),
    }));

    (OtpHashService as jest.Mock).mockImplementation(() => ({
      createHash: mockCreateHash,
      verifyHash: mockVerifyHash,
      setOptions: jest.fn(),
    }));
  });

  describe('constructor', () => {
    it('should create generator and hash service with default options', () => {
      // Arrange & Act
      new OtpService();

      // Assert
      expect(OtpGenerator).toHaveBeenCalledWith(DEFAULT_OTP_OPTIONS);
      expect(OtpHashService).toHaveBeenCalledWith({});
    });

    it('should create generator and hash service with provided options', () => {
      // Arrange
      const otpOptions = { length: 8, numbersOnly: false };
      const hashOptions: HashOptions = { algorithm: 'sha512', salt: 'test-salt' };
      const expiryTimeMs = 10 * 60 * 1000; // 10 minutes

      // Act
      new OtpService(otpOptions, hashOptions, expiryTimeMs);

      // Assert
      expect(OtpGenerator).toHaveBeenCalledWith(otpOptions);
      expect(OtpHashService).toHaveBeenCalledWith(hashOptions);
    });
  });

  describe('createOtp', () => {
    it('should generate an OTP and create its hash', () => {
      // Arrange
      const service = new OtpService();

      // Act
      const result = service.createOtp();

      // Assert
      expect(mockGenerate).toHaveBeenCalled();
      expect(mockCreateHash).toHaveBeenCalledWith('123456');
      expect(result).toEqual({
        otp: '123456',
        hash: 'hashed-otp',
        expiresAt: undefined,
      });
    });

    it('should include expiry time when configured', () => {
      // Arrange
      const expiryTimeMs = 30 * 60 * 1000; // 30 minutes
      const service = new OtpService(undefined, undefined, expiryTimeMs);

      // Mock Date.now to return a fixed timestamp
      const originalNow = Date.now;
      const fixedTimestamp = 1650000000000; // Arbitrary timestamp
      Date.now = jest.fn().mockReturnValue(fixedTimestamp);

      try {
        // Act
        const result = service.createOtp();

        // Assert
        expect(result).toEqual({
          otp: '123456',
          hash: 'hashed-otp',
          expiresAt: new Date(fixedTimestamp + expiryTimeMs),
        });
      } finally {
        // Restore original Date.now
        Date.now = originalNow;
      }
    });
  });

  describe('validateOtp', () => {
    it('should return valid=true when OTP is valid and not expired', () => {
      // Arrange
      const service = new OtpService();
      mockVerifyHash.mockReturnValue(true);

      // Act
      const result = service.validateOtp('123456', 'hashed-otp');

      // Assert
      expect(mockVerifyHash).toHaveBeenCalledWith('123456', 'hashed-otp');
      expect(result).toEqual({ valid: true });
    });

    it('should return valid=false when OTP is invalid', () => {
      // Arrange
      const service = new OtpService();
      mockVerifyHash.mockReturnValue(false);

      // Act
      const result = service.validateOtp('wrong-otp', 'hashed-otp');

      // Assert
      expect(mockVerifyHash).toHaveBeenCalledWith('wrong-otp', 'hashed-otp');
      expect(result).toEqual({ valid: false });
    });

    it('should return valid=false and expired=true when OTP is expired', () => {
      // Arrange
      const expiryTimeMs = 5 * 60 * 1000; // 5 minutes
      const service = new OtpService(undefined, undefined, expiryTimeMs);

      // Create a creation time in the past that would be expired
      const now = new Date();
      const sixMinutesAgo = new Date(now.getTime() - 6 * 60 * 1000);

      // Act
      const result = service.validateOtp('123456', 'hashed-otp', sixMinutesAgo);

      // Assert
      // Hash verification should not be called for expired OTPs
      expect(mockVerifyHash).not.toHaveBeenCalled();
      expect(result).toEqual({ valid: false, expired: true });
    });

    it('should not consider expiry when expiryTimeMs is null', () => {
      // Arrange
      const service = new OtpService(); // No expiry time
      mockVerifyHash.mockReturnValue(true);

      // Create a creation time in the past
      const oldDate = new Date(2020, 0, 1);

      // Act
      const result = service.validateOtp('123456', 'hashed-otp', oldDate);

      // Assert
      expect(mockVerifyHash).toHaveBeenCalledWith('123456', 'hashed-otp');
      expect(result).toEqual({ valid: true });
    });

    it('should not consider expiry when createdAt is not provided', () => {
      // Arrange
      const expiryTimeMs = 5 * 60 * 1000; // 5 minutes
      const service = new OtpService(undefined, undefined, expiryTimeMs);
      mockVerifyHash.mockReturnValue(true);

      // Act - don't provide createdAt
      const result = service.validateOtp('123456', 'hashed-otp');

      // Assert
      expect(mockVerifyHash).toHaveBeenCalledWith('123456', 'hashed-otp');
      expect(result).toEqual({ valid: true });
    });
  });

  describe('checkExpiry (private method tested indirectly)', () => {
    it('should correctly identify non-expired OTPs', () => {
      // Arrange
      const expiryTimeMs = 10 * 60 * 1000; // 10 minutes
      const service = new OtpService(undefined, undefined, expiryTimeMs);
      mockVerifyHash.mockReturnValue(true);

      // Create a recent creation time
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Act
      const result = service.validateOtp('123456', 'hashed-otp', fiveMinutesAgo);

      // Assert
      expect(result).toEqual({ valid: true });
    });
  });
});
