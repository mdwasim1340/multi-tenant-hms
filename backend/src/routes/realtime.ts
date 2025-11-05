import express from 'express';
import { eventService } from '../services/events';
import { getRealtimeServer } from '../websocket/server';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get recent events for tenant
router.get('/events/:tenantId', authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const count = parseInt(req.query.count as string) || 50;

    const events = await eventService.getRecentEvents(tenantId, count);
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get WebSocket connection stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const realtimeServer = getRealtimeServer();
    const totalConnections = realtimeServer.getTotalConnectionCount();

    res.json({
      total_connections: totalConnections,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Test endpoint to publish event
router.post('/test-event', authMiddleware, async (req, res) => {
  try {
    const { tenant_id, event_type, data } = req.body;

    await eventService.publishEvent({
      type: event_type,
      tenantId: tenant_id,
      data: data,
      timestamp: new Date()
    });

    res.json({ message: 'Event published successfully' });
  } catch (error) {
    console.error('Error publishing test event:', error);
    res.status(500).json({ error: 'Failed to publish event' });
  }
});

export default router;
