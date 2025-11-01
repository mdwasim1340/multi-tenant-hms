import { Router } from 'express';
import { signUp, signIn } from '../services/auth';
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
    const result = await signUp(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to sign up' });
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
