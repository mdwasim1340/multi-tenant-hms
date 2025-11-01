import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AdminConfirmSignUpCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac, randomBytes } from 'crypto';
import { SignUpRequest, SignInRequest } from '../types/auth';
import { sendEmail } from './email';
import pool from '../database';

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

const generateVerificationCode = () => {
  return randomBytes(3).toString('hex').toUpperCase();
};

export const signUp = async (user: SignUpRequest, tenantId: string) => {
  const username = user.email.replace('@', '_').replace(/\./g, '_');
  const secretHash = generateSecretHash(username);
  
  const command = new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: username,
    Password: user.password,
    SecretHash: secretHash,
    UserAttributes: [{ Name: 'email', Value: user.email }],
  });

  const cognitoResponse = await cognitoClient.send(command);

  const verificationCode = generateVerificationCode();
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO user_verification (email, code, type) VALUES ($1, $2, $3)',
      [user.email, verificationCode, 'verification']
    );
  } finally {
    client.release();
  }

  const fromEmail = tenantId === 'admin' ? 'noreply@exo.com.np' : process.env.EMAIL_SENDER;
  await sendEmail(
    fromEmail,
    user.email,
    'Verify your email address',
    `Your verification code is: ${verificationCode}`
  );

  return cognitoResponse;
};

export const verifyEmail = async (email: string, code: string) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM user_verification WHERE email = $1 AND code = $2 AND type = $3 AND expires_at > NOW()',
      [email, code, 'verification']
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid verification code');
    }

    const username = email.replace('@', '_').replace(/\./g, '_');
    const command = new AdminConfirmSignUpCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
    });

    await cognitoClient.send(command);

    await client.query('DELETE FROM user_verification WHERE email = $1 AND code = $2 AND type = $3', [
      email,
      code,
      'verification',
    ]);
  } finally {
    client.release();
  }
};

export const resetPassword = async (email, code, newPassword) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM user_verification WHERE email = $1 AND code = $2 AND type = $3 AND expires_at > NOW()',
      [email, code, 'reset']
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid reset token');
    }

    const username = email.replace('@', '_').replace(/\./g, '_');

    const command = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
      Password: newPassword,
      Permanent: true,
    });

    await cognitoClient.send(command);

    await client.query('DELETE FROM user_verification WHERE email = $1 AND code = $2 AND type = $3', [
      email,
      code,
      'reset',
    ]);
  } finally {
    client.release();
  }
};

export const forgotPassword = async (email: string, tenantId: string) => {
  const resetToken = generateVerificationCode();
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO user_verification (email, code, type) VALUES ($1, $2, $3)',
      [email, resetToken, 'reset']
    );
  } finally {
    client.release();
  }

  const fromEmail = tenantId === 'admin' ? 'noreply@exo.com.np' : process.env.EMAIL_SENDER;
  await sendEmail(
    fromEmail,
    email,
    'Reset your password',
    `Your password reset token is: ${resetToken}`
  );
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
