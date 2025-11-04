import { Router } from 'express';
import { signUp, signIn, forgotPassword, resetPassword, verifyEmail } from '../services/auth';
import { createTenant } from '../services/tenant';

const router = Router();

router.post('/tenants', createTenant);

router.post('/signup', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const result = await signUp(req.body, tenantId);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to sign up' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    await verifyEmail(email, code);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify email' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    await forgotPassword(req.body.email, tenantId);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Provide specific error messages for different scenarios
    if (error instanceof Error && error.message.includes('No account found')) {
      res.status(404).json({ 
        message: 'Account not found', 
        details: error.message 
      });
    } else if (error instanceof Error && error.message.includes('not verified')) {
      res.status(400).json({ 
        message: 'Email address not verified', 
        details: error.message 
      });
    } else if (error instanceof Error && error.message.includes('Failed to send')) {
      res.status(500).json({ 
        message: 'Email service error', 
        details: 'Unable to send password reset email. Please try again later.' 
      });
    } else {
      res.status(500).json({ message: 'Failed to initiate password reset' });
    }
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    await resetPassword(email, code, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    
    // Provide specific error messages for different scenarios
    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired reset token')) {
        res.status(400).json({ 
          message: 'Invalid verification code', 
          details: 'The verification code is invalid or has expired. Please request a new password reset.' 
        });
      } else if (error.message.includes('Password does not meet security requirements')) {
        res.status(400).json({ 
          message: 'Password requirements not met', 
          details: error.message,
          requirements: [
            'At least 8 characters long',
            'At least one uppercase letter (A-Z)',
            'At least one lowercase letter (a-z)', 
            'At least one number (0-9)',
            'At least one special character (!@#$%^&*)'
          ]
        });
      } else if (error.message.includes('Invalid password format')) {
        res.status(400).json({ 
          message: 'Invalid password format', 
          details: error.message,
          requirements: [
            'At least 8 characters long',
            'At least one uppercase letter (A-Z)',
            'At least one lowercase letter (a-z)', 
            'At least one number (0-9)',
            'At least one special character (!@#$%^&*)'
          ]
        });
      } else if (error.message.includes('User account not found')) {
        res.status(404).json({ 
          message: 'User not found', 
          details: error.message 
        });
      } else if (error.message.includes('Not authorized')) {
        res.status(401).json({ 
          message: 'Authorization failed', 
          details: error.message 
        });
      } else {
        res.status(500).json({ 
          message: 'Password reset failed', 
          details: error.message 
        });
      }
    } else {
      res.status(500).json({ message: 'Failed to reset password' });
    }
  }
});

router.post('/signin', async (req, res) => {
  try {
    const result = await signIn(req.body);
    res.json(result.AuthenticationResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to sign in' });
  }
});

export default router;
