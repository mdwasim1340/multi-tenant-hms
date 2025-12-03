import { Router } from 'express';
import { signUp, signIn, forgotPassword, resetPassword, verifyEmail, respondToChallenge, refreshToken } from '../services/auth';
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

import { eventService } from '../services/events';
import { getUserByEmail } from '../services/userService';
import { getUserPermissions, getUserRoles, getUserAccessibleApplications } from '../services/authorization';

router.post('/signin', async (req, res) => {
  try {
    // Get tenant context from subdomain/header (optional for backward compatibility)
    const requestedTenantId = req.headers['x-tenant-id'] as string;
    
    // Authenticate with Cognito first
    const result = await signIn(req.body);

    // Get user details from database
    const user = await getUserByEmail(req.body.email);

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'No account found with this email address in our system'
      });
    }

    // SECURITY CHECK: Validate tenant isolation (only if tenant context provided)
    // This allows backward compatibility while still enforcing security when subdomain is used
    if (requestedTenantId && user.tenant_id !== requestedTenantId) {
      console.error(`🚨 TENANT ISOLATION BREACH ATTEMPT: User ${user.email} (tenant: ${user.tenant_id}) tried to access tenant: ${requestedTenantId}`);
      
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to access this hospital. Please use the correct subdomain for your hospital.',
        code: 'TENANT_MISMATCH',
        userTenant: user.tenant_id,
        requestedTenant: requestedTenantId
      });
    }
    
    // If no tenant context provided, log warning but allow login (backward compatibility)
    if (!requestedTenantId) {
      console.warn(`⚠️ Login without tenant context: ${user.email} (tenant: ${user.tenant_id})`);
    }

    // Publish login event
    await eventService.publishEvent({
      type: 'user.login',
      tenantId: user.tenant_id,
      userId: user.id,
      data: {
        email: user.email,
        name: user.name
      },
      timestamp: new Date()
    });

    // Handle MFA challenge
    if ((result as any).ChallengeName) {
      return res.json({
        ChallengeName: (result as any).ChallengeName,
        Session: (result as any).Session
      });
    }

    // Get user permissions and accessible applications
    let permissions: any[] = [];
    let roles: any[] = [];
    let accessibleApplications: any[] = [];
    
    try {
      permissions = await getUserPermissions(user.id);
      roles = await getUserRoles(user.id);
      accessibleApplications = await getUserAccessibleApplications(user.id);
    } catch (authError) {
      console.error('Error fetching user authorization data:', authError);
      // Continue without permissions if there's an error
    }

    console.log(`✅ User ${user.email} successfully signed in to tenant ${user.tenant_id}`);

    // Return token and user info in expected format
    const authResult = (result as any).AuthenticationResult;
    res.json({
      token: authResult.IdToken || authResult.AccessToken,
      refreshToken: authResult.RefreshToken,
      expiresIn: authResult.ExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenant_id: user.tenant_id
      },
      roles: roles,
      permissions: permissions,
      accessibleApplications: accessibleApplications
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    
    // Return specific error messages
    if (error.name === 'NotAuthorizedException') {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        message: 'The email or password you entered is incorrect'
      });
    }
    
    if (error.name === 'UserNotFoundException') {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'No account found with this email address'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to sign in',
      message: error.message || 'An error occurred during sign in'
    });
  }
});

router.post('/respond-to-challenge', async (req, res) => {
  try {
    const { email, mfaCode, session } = req.body;
    const auth = await respondToChallenge(email, mfaCode, session);
    res.json(auth);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to complete MFA challenge' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { email, refreshToken: token } = req.body;
    const auth = await refreshToken(email, token);
    res.json(auth);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

export default router;
