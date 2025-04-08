import { Logger } from '@nestjs/common';

/**
 * configuration options for the cognito service
 */
export interface CognitoServiceConfig {
  /** aws region */
  region: string;
  /** cognito user pool id */
  userPoolId: string;
  /** cognito app client id */
  clientId: string;
  /** whether to allow cognito to send emails */
  enableCognitoEmail: boolean;
  /** optional logger instance (will create new if not provided) */
  logger?: Logger;
}

/**
 * parameters for creating a new user
 */
export interface CreateUserParams {
  /** username for the new user */
  username: string;
  /** email address for the new user */
  email: string;
  /** optional phone number for the new user */
  phoneNumber?: string;
  /** optional temporary password (will be auto-generated if not provided) */
  temporaryPassword?: string;
  /** whether email and phone are already verified */
  isVerified: boolean;
  /** any additional attributes to set */
  additionalAttributes?: Record<string, string>;
}

/**
 * parameters for updating a user's email
 */
export interface UpdateEmailParams {
  /** username of the user */
  username: string;
  /** new email address */
  newEmail: string;
}

/**
 * parameters for updating a user's phone number
 */
export interface UpdatePhoneNumberParams {
  /** username of the user */
  username: string;
  /** new phone number */
  newPhoneNumber: string;
}

/**
 * parameters for setting a user's password
 */
export interface SetPasswordParams {
  /** username of the user */
  username: string;
  /** new password */
  password: string;
  /** whether the password is permanent or temporary */
  permanent: boolean;
}

/**
 * parameters for user login
 */
export interface LoginParams {
  /** username of the user */
  username: string;
  /** password of the user */
  password: string;
}

/**
 * parameters for refreshing tokens
 */
export interface RefreshTokenParams {
  /** refresh token */
  refreshToken: string;
}

/**
 * result of authentication operations
 */
export interface AuthResult {
  /** access token if authentication was successful */
  accessToken?: string;
  /** id token if authentication was successful */
  idToken?: string;
  /** refresh token if authentication was successful */
  refreshToken?: string;
  /** expiration time in seconds */
  expiresIn?: number;
  /** token type (usually "Bearer") */
  tokenType?: string;
  /** whether the operation was successful */
  success: boolean;
  /** challenge name if further action is required */
  challengeName?: string;
  /** challenge parameters if further action is required */
  challengeParameters?: Record<string, string>;
  /** error message if the operation failed */
  error?: string;
}
