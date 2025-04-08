# AWS Cognito Service

A fully typed TypeScript service for AWS Cognito user management operations.

## Installation

```bash
npm install aws-cognito-service
```

## Features

- Strongly typed TypeScript interfaces
- AWS SDK v3 support
- NestJS logger integration
- Complete user lifecycle management
- Authentication flows
- Token refresh

## Usage

### TypeScript Usage

```typescript
import { CognitoService, CognitoServiceConfig } from "aws-cognito-service";
import { Logger } from "@nestjs/common";

// Create a configuration
const config: CognitoServiceConfig = {
  region: "eu-west-1",
  userPoolId: "eu-west-1_xxxxxxxx",
  clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  enableCognitoEmail: true,
  logger: new Logger("CognitoService"), // Optional
};

// Create an instance
const cognitoService = new CognitoService(config);

// Add a new user
async function addNewUser() {
  const result = await cognitoService.addUser({
    username: "user@example.com",
    email: "user@example.com",
    isVerified: false,
    temporaryPassword: "TemporaryPwd123!",
  });

  console.log(`User added: ${result}`);
}

// Login a user
async function loginUser() {
  const result = await cognitoService.login({
    username: "user@example.com",
    password: "Password123!",
  });

  if (result.success) {
    console.log(`User logged in with token: ${result.accessToken}`);
  } else {
    console.log(`Login failed: ${result.error}`);

    // Check if we need to handle a challenge
    if (result.challengeName === "NEW_PASSWORD_REQUIRED") {
      // Handle new password challenge
    }
  }
}
```

### JavaScript Usage

```javascript
const { CognitoService } = require("aws-cognito-service");

// Create an instance
const cognitoService = new CognitoService({
  region: "eu-west-1",
  userPoolId: "eu-west-1_xxxxxxxx",
  clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  enableCognitoEmail: true,
});

// Available methods
// cognitoService.addUser()
// cognitoService.removeUser()
// cognitoService.setUserPassword()
// cognitoService.changeUserEmail()
// cognitoService.changePhoneNumber()
// cognitoService.verifyUser()
// cognitoService.login()
// cognitoService.refreshToken()
// cognitoService.respondToNewPasswordChallenge()
// cognitoService.getUserDetails()
```

## API Reference

### Constructor

```typescript
new CognitoService(config: CognitoServiceConfig)
```

#### CognitoServiceConfig

| Property           | Type    | Description                      |
| ------------------ | ------- | -------------------------------- |
| region             | string  | AWS region                       |
| userPoolId         | string  | Cognito User Pool ID             |
| clientId           | string  | Cognito App Client ID            |
| enableCognitoEmail | boolean | Whether to enable Cognito emails |
| logger             | Logger  | Optional NestJS logger instance  |

### Methods

Each method returns a Promise with a typed response.

- `setUserPassword(params: SetPasswordParams): Promise<boolean>`
- `addUser(params: CreateUserParams): Promise<boolean>`
- `removeUser(username: string): Promise<boolean>`
- `changeUserEmail(params: UpdateEmailParams): Promise<boolean>`
- `changePhoneNumber(params: UpdatePhoneNumberParams): Promise<boolean>`
- `verifyUser(username: string): Promise<boolean>`
- `refreshToken(params: RefreshTokenParams): Promise<AuthResult>`
- `login(params: LoginParams): Promise<AuthResult>`
- `respondToNewPasswordChallenge(username: string, newPassword: string, session: string): Promise<AuthResult>`
- `getUserDetails(username: string): Promise<Record<string, string> | null>`

## License

MIT
