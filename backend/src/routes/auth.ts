import { Router } from 'express';
import { signUp, signIn, forgotPassword, resetPassword, verifyEmail } from '../services/auth';
import { createTenant } from '../services/tenant';

const router = Router();

router.post('/tenants', async (req, res) => {
  const { tenantId } = req.body;

  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant ID is required' });
  }

  try {
    await createTenant(tenantId);
    res.status(201).json({ message: 'Tenant created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create tenant' });
  }
});

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
  } catch (error)
 {
    console.error(error);
    res.status(500).json({ message: 'Failed to initiate password reset' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    await resetPassword(email, code, newPassword);
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset password' });
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
