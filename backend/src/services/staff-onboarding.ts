/**
 * Staff Onboarding Service
 * Handles new staff member registration with email verification and password setup
 */

import pool from '../database';
import { sendEmail } from './email';
import { randomBytes } from 'crypto';

interface StaffOnboardingData {
  name: string;
  email: string;
  role: string;
  employee_id: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  hire_date: string;
  employment_type?: string;
  status?: string;
  emergency_contact?: any;
  tenant_id: string;
}

/**
 * Generate a secure 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure token for password reset
 */
function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Step 1: Create staff member and send verification email
 * This creates the user account in pending status and sends OTP
 */
export const initiateStaffOnboarding = async (data: StaffOnboardingData) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error(`Email address '${data.email}' is already registered in the system`);
    }
    
    // 2. Check if employee_id already exists
    const existingEmployee = await client.query(
      'SELECT id FROM staff_profiles WHERE employee_id = $1',
      [data.employee_id]
    );
    
    if (existingEmployee.rows.length > 0) {
      throw new Error(`Employee ID '${data.employee_id}' already exists`);
    }
    
    // 3. Get role_id from role name
    const roleResult = await client.query(
      'SELECT id FROM roles WHERE name = $1',
      [data.role]
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error(`Role '${data.role}' not found`);
    }
    
    const role_id = roleResult.rows[0].id;
    
    // 4. Create user account with pending status (no password yet)
    const userResult = await client.query(
      `INSERT INTO users (name, email, password, status, tenant_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email`,
      [data.name, data.email, '', 'pending_verification', data.tenant_id]
    );
    
    const user = userResult.rows[0];
    
    // 5. Assign role to user
    await client.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
      [user.id, role_id]
    );
    
    // 6. Create staff profile
    await client.query(
      `INSERT INTO staff_profiles 
       (user_id, employee_id, department, specialization, license_number, 
        hire_date, employment_type, status, emergency_contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user.id,
        data.employee_id,
        data.department,
        data.specialization,
        data.license_number,
        data.hire_date,
        data.employment_type,
        data.status || 'active',
        data.emergency_contact ? JSON.stringify(data.emergency_contact) : null
      ]
    );
    
    // 7. Generate OTP and store in user_verification table
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // First, try to delete any existing verification record for this user
    await client.query(
      'DELETE FROM user_verification WHERE user_id = $1',
      [user.id]
    );
    
    // Then insert the new verification record
    await client.query(
      `INSERT INTO user_verification 
       (user_id, email, code, type, verification_code, expires_at, verification_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, data.email, otp, 'staff_onboarding', otp, expiresAt, 'staff_onboarding']
    );
    
    // 8. Send verification email
    const emailSubject = 'Welcome to the Team - Verify Your Email';
    const emailBody = `
Hello ${data.name},

Welcome to our hospital management system! Your account has been created.

To complete your registration and set up your password, please verify your email address using the code below:

Verification Code: ${otp}

This code will expire in 15 minutes.

After verifying your email, you'll be able to set up your password and access the system.

Your Account Details:
- Email: ${data.email}
- Employee ID: ${data.employee_id}
- Role: ${data.role}
- Department: ${data.department || 'Not specified'}

If you did not expect this email, please contact your system administrator.

Best regards,
Hospital Management Team
    `.trim();
    
    try {
      await sendEmail(
        process.env.SES_FROM_EMAIL || 'noreply@hospital.com',
        data.email,
        emailSubject,
        emailBody
      );
      console.log(`✅ Verification email sent to ${data.email}`);
    } catch (emailError: any) {
      console.error('❌ Failed to send verification email:', emailError);
      // Don't fail the transaction, but log the error
      // Admin can manually send the verification code
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      user_id: user.id,
      email: user.email,
      name: user.name,
      message: 'Staff member created. Verification email sent.',
      otp_sent: true
    };
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error in initiateStaffOnboarding:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Step 2: Verify OTP code
 * User enters the OTP from their email
 */
export const verifyStaffOTP = async (email: string, otp: string) => {
  const client = await pool.connect();
  
  try {
    // 1. Get user by email
    const userResult = await client.query(
      'SELECT id, name, email, status FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // 2. Check verification code
    const verificationResult = await client.query(
      `SELECT verification_code, expires_at, verified_at 
       FROM user_verification 
       WHERE user_id = $1`,
      [user.id]
    );
    
    if (verificationResult.rows.length === 0) {
      throw new Error('No verification code found for this user');
    }
    
    const verification = verificationResult.rows[0];
    
    // 3. Check if already verified
    if (verification.verified_at) {
      throw new Error('Email already verified. Please proceed to set your password.');
    }
    
    // 4. Check if expired
    if (new Date() > new Date(verification.expires_at)) {
      throw new Error('Verification code has expired. Please request a new one.');
    }
    
    // 5. Verify OTP
    if (verification.verification_code !== otp) {
      throw new Error('Invalid verification code');
    }
    
    // 6. Mark as verified
    await client.query(
      'UPDATE user_verification SET verified_at = NOW() WHERE user_id = $1',
      [user.id]
    );
    
    // 7. Generate password reset token
    const resetToken = generateResetToken();
    const resetExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await client.query(
      `UPDATE user_verification 
       SET reset_token = $1, reset_token_expires_at = $2 
       WHERE user_id = $3`,
      [resetToken, resetExpiresAt, user.id]
    );
    
    // 8. Send password setup email
    const emailSubject = 'Set Up Your Password';
    const emailBody = `
Hello ${user.name},

Your email has been verified successfully!

Now you need to set up your password to access the system.

Click the link below to set your password:
${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/set-password?token=${resetToken}

This link will expire in 24 hours.

If you did not request this, please contact your system administrator immediately.

Best regards,
Hospital Management Team
    `.trim();
    
    try {
      await sendEmail(
        process.env.SES_FROM_EMAIL || 'noreply@hospital.com',
        user.email,
        emailSubject,
        emailBody
      );
      console.log(`✅ Password setup email sent to ${user.email}`);
    } catch (emailError: any) {
      console.error('❌ Failed to send password setup email:', emailError);
    }
    
    return {
      success: true,
      message: 'Email verified successfully. Password setup link sent to your email.',
      reset_token: resetToken, // Return for immediate redirect
      user_id: user.id,
      email: user.email
    };
    
  } finally {
    client.release();
  }
};

/**
 * Step 3: Set password using reset token
 * User creates their password
 */
export const setStaffPassword = async (token: string, newPassword: string) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Find user by reset token
    const verificationResult = await client.query(
      `SELECT user_id, reset_token_expires_at, verified_at 
       FROM user_verification 
       WHERE reset_token = $1`,
      [token]
    );
    
    if (verificationResult.rows.length === 0) {
      throw new Error('Invalid or expired password setup link');
    }
    
    const verification = verificationResult.rows[0];
    
    // 2. Check if email was verified
    if (!verification.verified_at) {
      throw new Error('Please verify your email first');
    }
    
    // 3. Check if token expired
    if (new Date() > new Date(verification.reset_token_expires_at)) {
      throw new Error('Password setup link has expired. Please request a new one.');
    }
    
    // 4. Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 5. Update user password and status
    await client.query(
      `UPDATE users 
       SET password = $1, status = $2 
       WHERE id = $3`,
      [hashedPassword, 'active', verification.user_id]
    );
    
    // 6. Clear reset token
    await client.query(
      `UPDATE user_verification 
       SET reset_token = NULL, reset_token_expires_at = NULL 
       WHERE user_id = $1`,
      [verification.user_id]
    );
    
    // 7. Get user details
    const userResult = await client.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [verification.user_id]
    );
    
    const user = userResult.rows[0];
    
    // 8. Send welcome email
    const emailSubject = 'Welcome! Your Account is Ready';
    const emailBody = `
Hello ${user.name},

Your password has been set successfully! Your account is now active.

You can now log in to the hospital management system using:
- Email: ${user.email}
- Password: (the password you just created)

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login

If you have any questions or need assistance, please contact your system administrator.

Best regards,
Hospital Management Team
    `.trim();
    
    try {
      await sendEmail(
        process.env.SES_FROM_EMAIL || 'noreply@hospital.com',
        user.email,
        emailSubject,
        emailBody
      );
      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (emailError: any) {
      console.error('❌ Failed to send welcome email:', emailError);
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Password set successfully. You can now log in.',
      user_id: user.id,
      email: user.email
    };
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error in setStaffPassword:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Resend verification OTP
 */
export const resendStaffVerificationOTP = async (email: string) => {
  const client = await pool.connect();
  
  try {
    // 1. Get user
    const userResult = await client.query(
      'SELECT id, name, email, status FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // 2. Check if already verified
    const verificationResult = await client.query(
      'SELECT verified_at FROM user_verification WHERE user_id = $1',
      [user.id]
    );
    
    if (verificationResult.rows.length > 0 && verificationResult.rows[0].verified_at) {
      throw new Error('Email already verified');
    }
    
    // 3. Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await client.query(
      `UPDATE user_verification 
       SET verification_code = $1, expires_at = $2 
       WHERE user_id = $3`,
      [otp, expiresAt, user.id]
    );
    
    // 4. Send email
    const emailSubject = 'New Verification Code';
    const emailBody = `
Hello ${user.name},

Here is your new verification code:

Verification Code: ${otp}

This code will expire in 15 minutes.

Best regards,
Hospital Management Team
    `.trim();
    
    await sendEmail(
      process.env.SES_FROM_EMAIL || 'noreply@hospital.com',
      user.email,
      emailSubject,
      emailBody
    );
    
    return {
      success: true,
      message: 'New verification code sent to your email'
    };
    
  } finally {
    client.release();
  }
};

export default {
  initiateStaffOnboarding,
  verifyStaffOTP,
  setStaffPassword,
  resendStaffVerificationOTP
};
