import { Router } from 'express';
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from '../services/roleService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const roles = await getRoles(req.query);
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get roles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const role = await getRole(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get role' });
  }
});

router.post('/', async (req, res) => {
  try {
    const role = await createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create role' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const role = await updateRole(req.params.id, req.body);
    res.json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteRole(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete role' });
  }
});

export default router;
