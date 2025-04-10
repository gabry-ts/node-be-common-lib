import { LoggerService, LogLevel } from '../LoggerService';

describe('LoggerService', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // spy on console.log to verify output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should create logger with default settings', () => {
    const logger = new LoggerService('TestService');
    expect(logger).toBeDefined();
  });

  it('should log messages with the correct log level', () => {
    const logger = new LoggerService('TestService');

    logger.log('test log');
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    logger.error('test error');
    expect(consoleSpy).toHaveBeenCalledTimes(2);

    logger.warn('test warn');
    expect(consoleSpy).toHaveBeenCalledTimes(3);

    logger.debug('test debug');
    expect(consoleSpy).toHaveBeenCalledTimes(4);

    logger.verbose('test verbose');
    expect(consoleSpy).toHaveBeenCalledTimes(5);
  });

  it('should respect log level settings', () => {
    const logger = new LoggerService('TestService', { level: LogLevel.WARN });

    logger.verbose('test verbose');
    logger.debug('test debug');
    expect(consoleSpy).not.toHaveBeenCalled();

    logger.log('test log');
    expect(consoleSpy).not.toHaveBeenCalled();

    logger.warn('test warn');
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    logger.error('test error');
    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple arguments correctly', () => {
    const logger = new LoggerService('TestService');

    const obj1 = { key: 'value' };
    const obj2 = { another: 'data' };

    logger.warn('test message', obj1, obj2);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle http logging correctly', () => {
    const logger = new LoggerService('TestService');

    const httpData = {
      method: 'GET',
      path: '/',
      statusCode: 200,
    };

    logger.http(httpData);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('should allow changing log level dynamically', () => {
    const logger = new LoggerService('TestService', { level: LogLevel.ERROR });

    logger.warn('test warn');
    expect(consoleSpy).not.toHaveBeenCalled();

    // change log level
    logger.setLogLevel(LogLevel.WARN);

    logger.warn('test warn after change');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
