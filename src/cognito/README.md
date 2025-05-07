# Cognito Module

This module provides a service to interact with AWS Cognito for user management.

## Exports

The module exports:

- `CognitoService`: Service for managing users in AWS Cognito User Pools
- Types for the service configuration and parameters

## Usage

```typescript
import { CognitoService, CognitoServiceConfig } from '@tinhub/node-be-common-lib';

// Create a configuration
const config: CognitoServiceConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_example',
  clientId: 'your-client-id',
  enableCognitoEmail: false,
};

// Create the service
const cognitoService = new CognitoService(config);

// Example: Add a user
await cognitoService.addUser({
  username: 'user@example.com',
  email: 'user@example.com',
  isVerified: true,
});

// Example: Login
const loginResult = await cognitoService.login({
  username: 'user@example.com',
  password: 'password123',
});
```

## Available Methods

- `setUserPassword`: Set a user's password
- `addUser`: Add a new user to the user pool
- `removeUser`: Remove a user from the user pool
- `changeUserEmail`: Change a user's email address
- `changePhoneNumber`: Change a user's phone number
- `verifyUser`: Verify a user
- `refreshToken`: Refresh a user's tokens
- `login`: Log a user in
- `respondToNewPasswordChallenge`: Handle new password challenge
- `getUserDetails`: Get a user's details
