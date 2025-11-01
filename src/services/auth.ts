import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { SignUpRequest, SignInRequest } from '../types/auth';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const signUp = async (user: SignUpRequest) => {
  const command = new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: user.email,
    Password: user.password,
    UserAttributes: [{ Name: 'email', Value: user.email }],
  });

  return cognitoClient.send(command);
};

export const signIn = async (user: SignInRequest) => {
  const command = new InitiateAuthCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: user.email,
      PASSWORD: user.password,
    },
  });

  return cognitoClient.send(command);
};
