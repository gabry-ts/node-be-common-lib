import { OtpHashService } from './OtpHashService';
import { createHmac, timingSafeEqual } from 'crypto';

// Mock crypto functions
jest.mock('crypto', () => ({
  createHmac: jest.fn(),
  timingSafeEqual: jest.fn(),
}));

describe('OtpHashService', () => {
  // Mock implementation for createHmac
  const mockHmacUpdate = jest.fn();
  const mockHmacDigest = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    // Setup mock implementations
    mockHmacUpdate.mockReturnThis();
    mockHmacDigest.mockReturnValue('hashed-value');

    (createHmac as jest.Mock).mockReturnValue({
      update: mockHmacUpdate,
      digest: mockHmacDigest,
    });

    (timingSafeEqual as jest.Mock).mockReturnValue(true);
  });

  describe('constructor', () => {
    it('should use default options when no options provided', () => {
      // Arrange & Act
      const hashService = new OtpHashService();

      // Assert - test through behavior
      hashService.createHash('123456');
      expect(createHmac).toHaveBeenCalledWith('sha256', '');
    });

    it('should use provided options', () => {
      // Arrange & Act
      const hashService = new OtpHashService({
        algorithm: 'sha512',
        salt: 'my-secret-salt',
      });

      // Assert
      hashService.createHash('123456');
      expect(createHmac).toHaveBeenCalledWith('sha512', 'my-secret-salt');
    });

    it('should merge default options with provided options', () => {
      // Arrange & Act
      const hashService = new OtpHashService({
        // Only provide algorithm, salt should use default
        algorithm: 'sha512',
      });

      // Assert
      hashService.createHash('123456');
      expect(createHmac).toHaveBeenCalledWith('sha512', '');
    });
  });

  describe('createHash', () => {
    it('should create a hash using the configured algorithm and salt', () => {
      // Arrange
      const hashService = new OtpHashService({
        algorithm: 'sha256',
        salt: 'test-salt',
      });

      // Act
      const hash = hashService.createHash('123456');

      // Assert
      expect(createHmac).toHaveBeenCalledWith('sha256', 'test-salt');
      expect(mockHmacUpdate).toHaveBeenCalledWith('123456');
      expect(mockHmacDigest).toHaveBeenCalledWith('base64');
      expect(hash).toBe('hashed-value');
    });

    it('should handle empty OTP', () => {
      // Arrange
      const hashService = new OtpHashService();

      // Act
      const hash = hashService.createHash('');

      // Assert
      expect(mockHmacUpdate).toHaveBeenCalledWith('');
      expect(hash).toBe('hashed-value');
    });
  });

  describe('verifyHash', () => {
    it('should return true when hash matches', () => {
      // Arrange
      const hashService = new OtpHashService();
      mockHmacDigest.mockReturnValue('correct-hash');
      (timingSafeEqual as jest.Mock).mockReturnValue(true);

      // Act
      const result = hashService.verifyHash('123456', 'correct-hash');

      // Assert
      expect(result).toBe(true);
      expect(timingSafeEqual).toHaveBeenCalled();
    });

    it('should return false when hash does not match', () => {
      // Arrange
      const hashService = new OtpHashService();
      mockHmacDigest.mockReturnValue('computed-hash');
      (timingSafeEqual as jest.Mock).mockReturnValue(false);

      // Act
      const result = hashService.verifyHash('123456', 'wrong-hash');

      // Assert
      expect(result).toBe(false);
      expect(timingSafeEqual).toHaveBeenCalled();
    });

    it('should use constant-time comparison to prevent timing attacks', () => {
      // Arrange
      const hashService = new OtpHashService();
      mockHmacDigest.mockReturnValue('computed-hash');

      // Act
      hashService.verifyHash('123456', 'stored-hash');

      // Assert
      expect(timingSafeEqual).toHaveBeenCalledWith(
        Buffer.from('computed-hash'),
        Buffer.from('stored-hash'),
      );
    });
  });

  describe('setOptions', () => {
    it('should update hash service options', () => {
      // Arrange
      const hashService = new OtpHashService({
        algorithm: 'sha256',
        salt: 'old-salt',
      });

      // Act
      hashService.setOptions({
        algorithm: 'sha512',
        salt: 'new-salt',
      });

      // Assert - verify through behavior
      hashService.createHash('123456');
      expect(createHmac).toHaveBeenCalledWith('sha512', 'new-salt');
    });

    it('should partially update options when only some are provided', () => {
      // Arrange
      const hashService = new OtpHashService({
        algorithm: 'sha256',
        salt: 'old-salt',
      });

      // Act - only update algorithm
      hashService.setOptions({
        algorithm: 'sha512',
      });

      // Assert - salt should remain the same
      hashService.createHash('123456');
      expect(createHmac).toHaveBeenCalledWith('sha512', 'old-salt');
    });
  });
});
