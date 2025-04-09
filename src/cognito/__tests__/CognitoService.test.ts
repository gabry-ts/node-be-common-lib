import { CognitoService } from '../CognitoService';
import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminEnableUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  InitiateAuthCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '@nestjs/common';
import { mockClient } from 'aws-sdk-client-mock';

// Mock AWS SDK client
const mockCognitoClient = mockClient(CognitoIdentityProviderClient);

// Mock Logger
jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('CognitoService', () => {
  let cognitoService: CognitoService;
  let mockLogger: jest.Mocked<Logger>;

  const config = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_testpool',
    clientId: 'test-client-id',
    enableCognitoEmail: false,
    logger: new Logger() as jest.Mocked<Logger>,
  };

  beforeEach(() => {
    mockCognitoClient.reset();
    mockLogger = new Logger() as jest.Mocked<Logger>;
    cognitoService = new CognitoService({
      ...config,
      logger: mockLogger,
    });
  });

  describe('setUserPassword', () => {
    it('should set a user password successfully', async () => {
      // Arrange
      mockCognitoClient.on(AdminSetUserPasswordCommand).resolves({});

      // Act
      const result = await cognitoService.setUserPassword({
        username: 'testuser',
        password: 'password123',
        permanent: true,
      });

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminSetUserPasswordCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        Username: 'testuser',
        Password: 'password123',
        Permanent: true,
      });
    });

    it('should handle error when setting password', async () => {
      // Arrange
      mockCognitoClient.on(AdminSetUserPasswordCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.setUserPassword({
        username: 'testuser',
        password: 'password123',
        permanent: true,
      });

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('addUser', () => {
    it('should add a user successfully with email only', async () => {
      // Arrange
      mockCognitoClient.on(AdminCreateUserCommand).resolves({});

      // Act
      const result = await cognitoService.addUser({
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
      });

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminCreateUserCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        Username: 'testuser',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'email_verified', Value: 'true' },
        ],
        TemporaryPassword: undefined,
        MessageAction: 'SUPPRESS',
      });
    });

    it('should add a user with phone number', async () => {
      // Arrange
      mockCognitoClient.on(AdminCreateUserCommand).resolves({});

      // Act
      const result = await cognitoService.addUser({
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        isVerified: false,
      });

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminCreateUserCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        Username: 'testuser',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'email_verified', Value: 'false' },
          { Name: 'phone_number', Value: '+1234567890' },
          { Name: 'phone_number_verified', Value: 'false' },
        ],
        TemporaryPassword: undefined,
        MessageAction: 'SUPPRESS',
      });
    });

    it('should add a user with additional attributes', async () => {
      // Arrange
      mockCognitoClient.on(AdminCreateUserCommand).resolves({});

      // Act
      const result = await cognitoService.addUser({
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
        temporaryPassword: 'TempPass123!',
        additionalAttributes: {
          'custom:role': 'admin',
          name: 'Test User',
        },
      });

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminCreateUserCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input.UserAttributes).toEqual(
        expect.arrayContaining([
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:role', Value: 'admin' },
          { Name: 'name', Value: 'Test User' },
        ]),
      );
      expect(commandCalls[0].args[0].input.TemporaryPassword).toBe('TempPass123!');
    });

    it('should handle error when adding a user', async () => {
      // Arrange
      mockCognitoClient.on(AdminCreateUserCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.addUser({
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
      });

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should not suppress Cognito emails if enableCognitoEmail is true', async () => {
      // Arrange
      mockCognitoClient.on(AdminCreateUserCommand).resolves({});
      const cognitoServiceWithEmails = new CognitoService({
        ...config,
        enableCognitoEmail: true,
      });

      // Act
      const result = await cognitoServiceWithEmails.addUser({
        username: 'testuser',
        email: 'test@example.com',
        isVerified: true,
      });

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminCreateUserCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input.MessageAction).toBeUndefined();
    });
  });

  describe('removeUser', () => {
    it('should remove a user successfully', async () => {
      // Arrange
      mockCognitoClient.on(AdminDeleteUserCommand).resolves({});

      // Act
      const result = await cognitoService.removeUser('testuser');

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminDeleteUserCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        Username: 'testuser',
      });
    });

    it('should handle error when removing a user', async () => {
      // Arrange
      mockCognitoClient.on(AdminDeleteUserCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.removeUser('testuser');

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('changeUserEmail', () => {
    it('should change user email successfully', async () => {
      // Arrange
      mockCognitoClient.on(AdminUpdateUserAttributesCommand).resolves({});

      // Act
      const result = await cognitoService.changeUserEmail({
        username: 'testuser',
        newEmail: 'newemail@example.com',
      });

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminUpdateUserAttributesCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        Username: 'testuser',
        UserAttributes: [
          { Name: 'email', Value: 'newemail@example.com' },
          { Name: 'email_verified', Value: 'true' },
        ],
      });
    });

    it('should handle error when changing email', async () => {
      // Arrange
      mockCognitoClient.on(AdminUpdateUserAttributesCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.changeUserEmail({
        username: 'testuser',
        newEmail: 'newemail@example.com',
      });

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('changePhoneNumber', () => {
    it('should change phone number successfully', async () => {
      // Arrange
      mockCognitoClient.on(AdminUpdateUserAttributesCommand).resolves({});

      // Act
      const result = await cognitoService.changePhoneNumber({
        username: 'testuser',
        newPhoneNumber: '+9876543210',
      });

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminUpdateUserAttributesCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        Username: 'testuser',
        UserAttributes: [
          { Name: 'phone_number', Value: '+9876543210' },
          { Name: 'phone_number_verified', Value: 'true' },
        ],
      });
    });

    it('should handle error when changing phone number', async () => {
      // Arrange
      mockCognitoClient.on(AdminUpdateUserAttributesCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.changePhoneNumber({
        username: 'testuser',
        newPhoneNumber: '+9876543210',
      });

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('verifyUser', () => {
    it('should verify a user successfully', async () => {
      // Arrange
      mockCognitoClient.on(AdminEnableUserCommand).resolves({});

      // Act
      const result = await cognitoService.verifyUser('testuser');

      // Assert
      expect(result).toBe(true);
      const commandCalls = mockCognitoClient.commandCalls(AdminEnableUserCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        Username: 'testuser',
      });
    });

    it('should handle error when verifying a user', async () => {
      // Arrange
      mockCognitoClient.on(AdminEnableUserCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.verifyUser('testuser');

      // Assert
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      mockCognitoClient.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          RefreshToken: 'new-refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
      });

      // Act
      const result = await cognitoService.refreshToken({
        refreshToken: 'old-refresh-token',
      });

      // Assert
      expect(result).toEqual({
        success: true,
        accessToken: 'new-access-token',
        idToken: 'new-id-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
      const commandCalls = mockCognitoClient.commandCalls(InitiateAuthCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        ClientId: 'test-client-id',
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: 'old-refresh-token',
        },
      });
    });

    it('should use old refresh token if new one is not provided', async () => {
      // Arrange
      mockCognitoClient.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
      });

      // Act
      const result = await cognitoService.refreshToken({
        refreshToken: 'old-refresh-token',
      });

      // Assert
      expect(result).toEqual({
        success: true,
        accessToken: 'new-access-token',
        idToken: 'new-id-token',
        refreshToken: 'old-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
    });

    it('should handle error when refreshing token', async () => {
      // Arrange
      mockCognitoClient.on(InitiateAuthCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.refreshToken({
        refreshToken: 'old-refresh-token',
      });

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Test error',
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle missing authentication result', async () => {
      // Arrange
      mockCognitoClient.on(InitiateAuthCommand).resolves({});

      // Act
      const result = await cognitoService.refreshToken({
        refreshToken: 'old-refresh-token',
      });

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'no authentication result returned',
      });
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      // Arrange
      mockCognitoClient.on(AdminInitiateAuthCommand).resolves({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
      });

      // Act
      const result = await cognitoService.login({
        username: 'testuser',
        password: 'password',
      });

      // Assert
      expect(result).toEqual({
        success: true,
        accessToken: 'access-token',
        idToken: 'id-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
      const commandCalls = mockCognitoClient.commandCalls(AdminInitiateAuthCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        ClientId: 'test-client-id',
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: 'testuser',
          PASSWORD: 'password',
        },
      });
    });

    it('should handle NEW_PASSWORD_REQUIRED challenge', async () => {
      // Arrange
      mockCognitoClient.on(AdminInitiateAuthCommand).resolves({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ChallengeParameters: {
          userAttributes: '{}',
          requiredAttributes: '[]',
        },
      });

      // Act
      const result = await cognitoService.login({
        username: 'testuser',
        password: 'password',
      });

      // Assert
      expect(result).toEqual({
        success: false,
        challengeName: 'NEW_PASSWORD_REQUIRED',
        challengeParameters: {
          userAttributes: '{}',
          requiredAttributes: '[]',
        },
        error: 'new password required',
      });
    });

    it('should handle error when logging in', async () => {
      // Arrange
      mockCognitoClient.on(AdminInitiateAuthCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.login({
        username: 'testuser',
        password: 'password',
      });

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Test error',
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle missing authentication result', async () => {
      // Arrange
      mockCognitoClient.on(AdminInitiateAuthCommand).resolves({});

      // Act
      const result = await cognitoService.login({
        username: 'testuser',
        password: 'password',
      });

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'no authentication result returned',
      });
    });
  });

  describe('respondToNewPasswordChallenge', () => {
    it('should respond to new password challenge successfully', async () => {
      // Arrange
      mockCognitoClient.on(AdminRespondToAuthChallengeCommand).resolves({
        AuthenticationResult: {
          AccessToken: 'access-token',
          IdToken: 'id-token',
          RefreshToken: 'refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
      });

      // Act
      const result = await cognitoService.respondToNewPasswordChallenge(
        'testuser',
        'new-password',
        'session-string',
      );

      // Assert
      expect(result).toEqual({
        success: true,
        accessToken: 'access-token',
        idToken: 'id-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
      const commandCalls = mockCognitoClient.commandCalls(AdminRespondToAuthChallengeCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        ClientId: 'test-client-id',
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ChallengeResponses: {
          USERNAME: 'testuser',
          NEW_PASSWORD: 'new-password',
        },
        Session: 'session-string',
      });
    });

    it('should handle error when responding to new password challenge', async () => {
      // Arrange
      mockCognitoClient.on(AdminRespondToAuthChallengeCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.respondToNewPasswordChallenge(
        'testuser',
        'new-password',
        'session-string',
      );

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Test error',
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle missing authentication result', async () => {
      // Arrange
      mockCognitoClient.on(AdminRespondToAuthChallengeCommand).resolves({});

      // Act
      const result = await cognitoService.respondToNewPasswordChallenge(
        'testuser',
        'new-password',
        'session-string',
      );

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'no authentication result returned',
      });
    });
  });

  describe('getUserDetails', () => {
    it('should get user details successfully', async () => {
      // Arrange
      mockCognitoClient.on(AdminGetUserCommand).resolves({
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:role', Value: 'admin' },
        ],
      });

      // Act
      const result = await cognitoService.getUserDetails('testuser');

      // Assert
      expect(result).toEqual({
        email: 'test@example.com',
        email_verified: 'true',
        'custom:role': 'admin',
      });
      const commandCalls = mockCognitoClient.commandCalls(AdminGetUserCommand);
      expect(commandCalls.length).toBe(1);
      expect(commandCalls[0].args[0].input).toEqual({
        UserPoolId: 'us-east-1_testpool',
        Username: 'testuser',
      });
    });

    it('should handle missing user attributes', async () => {
      // Arrange
      mockCognitoClient.on(AdminGetUserCommand).resolves({});

      // Act
      const result = await cognitoService.getUserDetails('testuser');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle error when getting user details', async () => {
      // Arrange
      mockCognitoClient.on(AdminGetUserCommand).rejects(new Error('Test error'));

      // Act
      const result = await cognitoService.getUserDetails('testuser');

      // Assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should skip attributes without name or value', async () => {
      // Arrange
      mockCognitoClient.on(AdminGetUserCommand).resolves({
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'phone_number' }, // Missing Value
        ],
      });

      // Act
      const result = await cognitoService.getUserDetails('testuser');

      // Assert
      expect(result).toEqual({
        email: 'test@example.com',
      });
    });
  });
});
