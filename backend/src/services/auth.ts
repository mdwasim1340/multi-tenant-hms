import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminConfirmSignUpCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
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

// Check if user exists in Cognito
const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const username = email.replace('@', '_').replace(/\./g, '_');
    const command = new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
    });
    
    await cognitoClient.send(command);
    return true; // User exists
  } catch (error: any) {
    if (error.name === 'UserNotFoundException') {
      return false; // User does not exist
    }
    // For other errors, we'll assume user might exist to avoid security issues
    console.error('Error checking user existence:', error.message);
    return true;
  }
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

  const fromEmail = tenantId === 'admin' ? 'noreply@exo.com.np' : process.env.EMAIL_SENDER || 'noreply@exo.com.np';
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

export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM user_verification WHERE email = $1 AND code = $2 AND type = $3 AND expires_at > NOW()',
      [email, code, 'reset']
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const username = email.replace('@', '_').replace(/\./g, '_');

    const command = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
      Password: newPassword,
      Permanent: true,
    });

    try {
      await cognitoClient.send(command);
      console.log(`✅ Password reset successfully for user: ${email}`);
    } catch (cognitoError: any) {
      console.error(`❌ Cognito password reset error for ${email}:`, cognitoError.message);
      
      // Handle specific Cognito password policy errors
      if (cognitoError.name === 'InvalidPasswordException') {
        throw new Error('Password does not meet security requirements. Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      } else if (cognitoError.name === 'InvalidParameterException') {
        throw new Error('Invalid password format. Please ensure your password meets the security requirements.');
      } else if (cognitoError.name === 'UserNotFoundException') {
        throw new Error('User account not found. Please contact support.');
      } else if (cognitoError.name === 'NotAuthorizedException') {
        throw new Error('Not authorized to reset password. Please try requesting a new reset code.');
      } else {
        // Re-throw with a more user-friendly message
        throw new Error(`Password reset failed: ${cognitoError.message}`);
      }
    }

    // Only clean up the verification record if password reset was successful
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
  // First, check if user exists in Cognito
  const userExists = await checkUserExists(email);
  
  if (!userExists) {
    throw new Error(`No account found with email address ${email}. Please check your email address or create an account first.`);
  }

  const resetToken = generateVerificationCode();
  const client = await pool.connect();
  
  try {
    // Insert verification record first
    await client.query(
      'INSERT INTO user_verification (email, code, type) VALUES ($1, $2, $3)',
      [email, resetToken, 'reset']
    );

    // Try to send email
    const fromEmail = tenantId === 'admin' ? 'noreply@exo.com.np' : process.env.EMAIL_SENDER || 'noreply@exo.com.np';
    
    try {
      await sendEmail(
        fromEmail,
        email,
        'Reset your password',
        `Your password reset token is: ${resetToken}`
      );
      console.log(`✅ Password reset email sent successfully to ${email}`);
    } catch (emailError) {
      const error = emailError as Error;
      console.error(`❌ Failed to send password reset email to ${email}:`, error.message);
      
      // Clean up the verification record if email fails
      await client.query('DELETE FROM user_verification WHERE email = $1 AND code = $2 AND type = $3', [
        email, resetToken, 'reset'
      ]);
      
      // Check if it's a SES sandbox issue
      if ((error as any).name === 'MessageRejected' || error.message.includes('Email address not verified')) {
        throw new Error(`Email address ${email} is not verified. In SES sandbox mode, only verified email addresses can receive emails. Please verify this email address in the AWS SES console or contact your administrator.`);
      }
      
      // Re-throw other email errors
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  } finally {
    client.release();
  }
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
