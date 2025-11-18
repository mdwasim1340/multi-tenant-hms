/**
 * Staff Onboarding Routes
 * Handles new staff member registration with email verification
 */

import { Router, Request, Response } from 'express';
import * as staffOnboarding from '../services/staff-onboarding';

const router = Router();

/**
 * POST /api/staff-onboarding/initiate
 * Step 1: Create staff member and send verification email
 * Requires: Admin authentication
 */
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'X-Tenant-ID header is required'
      });
    }
    
    const data = {
      ...req.body,
      tenant_id: tenantId
    };
    
    const result = await staffOnboarding.initiateStaffOnboarding(data);
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully. Verification email sent.',
      data: result
    });
    
  } catch (error: any) {
    console.error('Error initiating staff onboarding:', error);
    
    let errorMessage = 'Failed to create staff member';
    let statusCode = 500;
    
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      errorMessage = error.message;
      statusCode = 409;
    } else if (error.message.includes('not found')) {
      errorMessage = error.message;
      statusCode = 404;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      message: error.message
    });
  }
});

/**
 * POST /api/staff-onboarding/verify-otp
 * Step 2: Verify OTP code from email
 * Public endpoint (no auth required)
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }
    
    const result = await staffOnboarding.verifyStaffOTP(email, otp);
    
    res.json({
      success: true,
      message: result.message,
      data: {
        reset_token: result.reset_token,
        email: result.email
      }
    });
    
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    
    let statusCode = 400;
    if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('expired')) {
      statusCode = 410; // Gone
    }
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to verify OTP'
    });
  }
});

/**
 * POST /api/staff-onboarding/set-password
 * Step 3: Set password using reset token
 * Public endpoint (no auth required)
 */
router.post('/set-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required'
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }
    
    const result = await staffOnboarding.setStaffPassword(token, password);
    
    res.json({
      success: true,
      message: result.message,
      data: {
        email: result.email
      }
    });
    
  } catch (error: any) {
    console.error('Error setting password:', error);
    
    let statusCode = 400;
    if (error.message.includes('expired') || error.message.includes('Invalid')) {
      statusCode = 410; // Gone
    }
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to set password'
    });
  }
});

/**
 * POST /api/staff-onboarding/resend-otp
 * Resend verification OTP
 * Public endpoint (no auth required)
 */
router.post('/resend-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    const result = await staffOnboarding.resendStaffVerificationOTP(email);
    
    res.json({
      success: true,
      message: result.message
    });
    
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    
    let statusCode = 400;
    if (error.message.includes('not found')) {
      statusCode = 404;
    }
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to resend OTP'
    });
  }
});

export default router;
