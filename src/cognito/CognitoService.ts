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
  AttributeType,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '@nestjs/common';

import {
  CognitoServiceConfig,
  CreateUserParams,
  UpdateEmailParams,
  UpdatePhoneNumberParams,
  SetPasswordParams,
  LoginParams,
  RefreshTokenParams,
  AuthResult,
  VerifyTokenResult,
} from './types';

/**
 * service class to interact with aws cognito
 * @class CognitoService
 * @description provides methods to manage users in AWS Cognito User Pools
 */
export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;
  private readonly enableCognitoEmail: boolean;
  private readonly logger: Logger;

  /**
   * initialize the cognito service
   * @param {Object} config - configuration settings for the cognito service
   * @param {string} config.region - the aws region where the user pool is located
   * @param {string} config.userPoolId - the id of the cognito user pool
   * @param {string} config.clientId - the client id for the cognito app client
   * @param {boolean} config.enableCognitoEmail - whether to allow cognito to send emails to users
   * @param {Logger} [config.logger] - optional nestjs logger instance
   */
  constructor(config: CognitoServiceConfig) {
    this.client = new CognitoIdentityProviderClient({ region: config.region });
    this.userPoolId = config.userPoolId;
    this.clientId = config.clientId;
    this.enableCognitoEmail = config.enableCognitoEmail;
    this.logger = config.logger || new Logger(CognitoService.name);
  }

  /**
   * set a new password for a user (admin side)
   * @param {Object} params - parameters for setting a password
   * @param {string} params.username - the username of the user
   * @param {string} params.password - the new password
   * @param {boolean} params.permanent - whether the password is permanent or temporary
   * @returns {Promise<boolean>} - true if successful, false otherwise
   */
  async setUserPassword(params: SetPasswordParams): Promise<boolean> {
    try {
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: params.username,
        Password: params.password,
        Permanent: params.permanent,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      this.logger.error(`error setting user password: ${error}`);
      return false;
    }
  }

  /**
   * add a new user to the user pool
   * @param {Object} params - parameters for creating a user
   * @param {string} params.username - username for the user
   * @param {string} params.email - email address for the user
   * @param {string} [params.phoneNumber] - optional phone number
   * @param {string} [params.temporaryPassword] - optional temporary password (auto-generated if not provided)
   * @param {boolean} params.isVerified - whether email and phone should be marked as verified
   * @param {Object<string, string>} [params.additionalAttributes] - optional additional user attributes
   * @returns {Promise<boolean>} - true if successful, false otherwise
   */
  async addUser(params: CreateUserParams): Promise<boolean> {
    try {
      // prepare user attributes
      const userAttributes: AttributeType[] = [
        {
          Name: 'email',
          Value: params.email,
        },
        {
          Name: 'email_verified',
          Value: params.isVerified ? 'true' : 'false',
        },
      ];

      if (params.phoneNumber) {
        userAttributes.push({
          Name: 'phone_number',
          Value: params.phoneNumber,
        });
        userAttributes.push({
          Name: 'phone_number_verified',
          Value: params.isVerified ? 'true' : 'false',
        });
      }

      // add any additional attributes
      if (params.additionalAttributes) {
        Object.entries(params.additionalAttributes).forEach(([key, value]) => {
          userAttributes.push({
            Name: key,
            Value: value,
          });
        });
      }

      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: params.username,
        UserAttributes: userAttributes,
        TemporaryPassword: params.temporaryPassword,
        MessageAction: this.enableCognitoEmail ? undefined : 'SUPPRESS',
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      this.logger.error(`error adding user: ${error}`);
      return false;
    }
  }

  /**
   * remove a user from the user pool
   * @param {string} username - the username of the user to remove
   * @returns {Promise<boolean>} - true if successful, false otherwise
   */
  async removeUser(username: string): Promise<boolean> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      this.logger.error(`error removing user: ${error}`);
      return false;
    }
  }

  /**
   * change a user's email address
   * @param {Object} params - parameters for changing email
   * @param {string} params.username - the username of the user
   * @param {string} params.newEmail - the new email address
   * @returns {Promise<boolean>} - true if successful, false otherwise
   */
  async changeUserEmail(params: UpdateEmailParams): Promise<boolean> {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: params.username,
        UserAttributes: [
          {
            Name: 'email',
            Value: params.newEmail,
          },
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      this.logger.error(`error changing user email: ${error}`);
      return false;
    }
  }

  /**
   * change a user's phone number
   * @param {Object} params - parameters for changing phone number
   * @param {string} params.username - the username of the user
   * @param {string} params.newPhoneNumber - the new phone number
   * @returns {Promise<boolean>} - true if successful, false otherwise
   */
  async changePhoneNumber(params: UpdatePhoneNumberParams): Promise<boolean> {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: params.username,
        UserAttributes: [
          {
            Name: 'phone_number',
            Value: params.newPhoneNumber,
          },
          {
            Name: 'phone_number_verified',
            Value: 'true',
          },
        ],
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      this.logger.error(`error changing phone number: ${error}`);
      return false;
    }
  }

  /**
   * verify a user (admin side)
   * @param {string} username - the username of the user to verify
   * @returns {Promise<boolean>} - true if successful, false otherwise
   */
  async verifyUser(username: string): Promise<boolean> {
    try {
      const command = new AdminEnableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      this.logger.error(`error verifying user: ${error}`);
      return false;
    }
  }

  /**
   * refresh a user's tokens
   * @param {Object} params - parameters for refreshing token
   * @param {string} params.refreshToken - the refresh token
   * @returns {Promise<Object>} - authentication result with tokens or error information
   * @returns {boolean} result.success - whether the operation was successful
   * @returns {string} [result.accessToken] - new access token (if successful)
   * @returns {string} [result.idToken] - new id token (if successful)
   * @returns {string} [result.refreshToken] - new refresh token (if successful)
   * @returns {number} [result.expiresIn] - token expiration time in seconds (if successful)
   * @returns {string} [result.tokenType] - token type (if successful)
   * @returns {string} [result.error] - error message (if unsuccessful)
   */
  async refreshToken(params: RefreshTokenParams): Promise<AuthResult> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: params.refreshToken,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        return {
          success: false,
          error: 'no authentication result returned',
        };
      }

      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken || params.refreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
        tokenType: response.AuthenticationResult.TokenType,
      };
    } catch (error) {
      this.logger.error(`error refreshing token: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * login a user
   * @param {Object} params - parameters for login
   * @param {string} params.username - the username
   * @param {string} params.password - the password
   * @returns {Promise<Object>} - authentication result with tokens or error information
   * @returns {boolean} result.success - whether the operation was successful
   * @returns {string} [result.accessToken] - access token (if successful)
   * @returns {string} [result.idToken] - id token (if successful)
   * @returns {string} [result.refreshToken] - refresh token (if successful)
   * @returns {number} [result.expiresIn] - token expiration time in seconds (if successful)
   * @returns {string} [result.tokenType] - token type (if successful)
   * @returns {string} [result.challengeName] - name of the auth challenge (if applicable)
   * @returns {Object} [result.challengeParameters] - parameters for the auth challenge (if applicable)
   * @returns {string} [result.error] - error message (if unsuccessful)
   */
  async login(params: LoginParams): Promise<AuthResult> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: params.username,
          PASSWORD: params.password,
        },
      });

      const response = await this.client.send(command);

      // handle new password required challenge
      if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        return {
          success: false,
          challengeName: response.ChallengeName,
          challengeParameters: response.ChallengeParameters || {},
          error: 'new password required',
        };
      }

      if (!response.AuthenticationResult) {
        return {
          success: false,
          error: 'no authentication result returned',
        };
      }

      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
        tokenType: response.AuthenticationResult.TokenType,
      };
    } catch (error) {
      this.logger.error(`error logging in: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * handle new password required challenge
   * @param {string} username - the username of the user
   * @param {string} newPassword - the new password
   * @param {string} session - the session string from the challenge
   * @returns {Promise<Object>} - authentication result with tokens or error information
   * @returns {boolean} result.success - whether the operation was successful
   * @returns {string} [result.accessToken] - access token (if successful)
   * @returns {string} [result.idToken] - id token (if successful)
   * @returns {string} [result.refreshToken] - refresh token (if successful)
   * @returns {number} [result.expiresIn] - token expiration time in seconds (if successful)
   * @returns {string} [result.tokenType] - token type (if successful)
   * @returns {string} [result.error] - error message (if unsuccessful)
   */
  async respondToNewPasswordChallenge(
    username: string,
    newPassword: string,
    session: string,
  ): Promise<AuthResult> {
    try {
      const command = new AdminRespondToAuthChallengeCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
        },
        Session: session,
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        return {
          success: false,
          error: 'no authentication result returned',
        };
      }

      return {
        success: true,
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
        tokenType: response.AuthenticationResult.TokenType,
      };
    } catch (error) {
      this.logger.error(`error responding to new password challenge: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * get user details
   * @param {string} username - the username of the user
   * @returns {Promise<Object<string, string>|null>} - user attributes as key-value pairs or null if not found
   */
  async getUserDetails(username: string): Promise<Record<string, string> | null> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      const response = await this.client.send(command);

      if (!response.UserAttributes) {
        return null;
      }

      // convert attributes array to an object
      const attributes: Record<string, string> = {};
      response.UserAttributes.forEach((attr) => {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      });

      return attributes;
    } catch (error) {
      this.logger.error(`error getting user details: ${error}`);
      return null;
    }
  }

  /**
   * verify a bearer token
   * @param {string} token - the bearer token to verify
   * @returns {Promise<Object>} - verification result with user information or error
   * @returns {boolean} result.success - whether the token is valid
   * @returns {string} [result.username] - the username of the token owner (if valid)
   * @returns {Object<string, string>} [result.attributes] - user attributes (if valid)
   * @returns {string} [result.error] - error message (if invalid)
   */
  async verifyToken(token: string): Promise<VerifyTokenResult> {
    try {
      const command = new GetUserCommand({
        AccessToken: token,
      });

      const response = await this.client.send(command);

      if (!response.Username || !response.UserAttributes) {
        return {
          success: false,
          error: 'invalid token or missing user information',
        };
      }

      // convert attributes array to an object
      const attributes: Record<string, string> = {};
      response.UserAttributes.forEach((attr) => {
        if (attr.Name && attr.Value) {
          attributes[attr.Name] = attr.Value;
        }
      });

      return {
        success: true,
        username: response.Username,
        attributes,
      };
    } catch (error) {
      this.logger.error(`error verifying token: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
