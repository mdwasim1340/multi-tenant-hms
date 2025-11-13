import { Router } from 'express'
import { adminAuthMiddleware } from '../middleware/auth'
import { assignUserToGroup } from '../services/auth'

const router = Router()

router.post('/groups/assign', adminAuthMiddleware, async (req, res) => {
  try {
    const { email, group } = req.body as { email: string; group: string }
    if (!email || !group) {
      return res.status(400).json({ message: 'email and group are required' })
    }
    await assignUserToGroup(email, group)
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to assign group' })
  }
})

export default router
