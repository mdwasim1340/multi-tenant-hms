import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import { SignUpRequest, SignInRequest } from '../types/auth';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

// Generate secret hash for Cognito client with secret
const generateSecretHash = (username: string): string => {
  const clientId = process.env.COGNITO_CLIENT_ID!;
  const clientSecret = process.env.COGNITO_SECRET!;
  
  return createHmac('sha256', clientSecret)
    .update(username + clientId)
    .digest('base64');
};

export const signUp = async (user: SignUpRequest) => {
  // Generate a username from email (replace @ and . with _)
  const username = user.email.replace('@', '_').replace(/\./g, '_');
  const secretHash = generateSecretHash(username);
  
  const command = new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: username,
    Password: user.password,
    SecretHash: secretHash,
    UserAttributes: [{ Name: 'email', Value: user.email }],
  });

  return cognitoClient.send(command);
};

export const signIn = async (user: SignInRequest) => {
  // Generate the same username format as signup
  const username = user.email.replace('@', '_').replace(/\./g, '_');
  const secretHash = generateSecretHash(username);
  
  // Use USER_PASSWORD_AUTH flow (now enabled in Cognito)
  const command = new InitiateAuthCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: username,
      PASSWORD: user.password,
      SECRET_HASH: secretHash,
    },
  });

  return cognitoClient.send(command);
};
