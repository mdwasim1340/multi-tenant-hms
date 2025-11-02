import { redisClient } from '../config/redis';
import { getRealtimeServer } from '../websocket/server';

export type EventType =
  | 'patient.created'
  | 'patient.updated'
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'user.login'
  | 'usage.updated'
  | 'backup.completed'
  | 'system.alert';

export interface Event {
  type: EventType;
  tenantId: string;
  userId?: number;
  data: any;
  timestamp: Date;
}

export class EventService {
  // Publish event to Redis stream
  async publishEvent(event: Event): Promise<void> {
    try {
      const streamKey = `events:${event.tenantId}`;

      await redisClient.xAdd(streamKey, '*', {
        type: event.type,
        tenantId: event.tenantId,
        userId: event.userId?.toString() || '',
        data: JSON.stringify(event.data),
        timestamp: event.timestamp.toISOString()
      });

      // Also broadcast via WebSocket for immediate delivery
      this.broadcastEvent(event);

      // Store in global events stream for analytics
      await redisClient.xAdd('events:global', '*', {
        type: event.type,
        tenantId: event.tenantId,
        timestamp: event.timestamp.toISOString()
      });

    } catch (error) {
      console.error('Error publishing event:', error);
    }
  }

  // Broadcast event via WebSocket
  private broadcastEvent(event: Event): void {
    try {
      const realtimeServer = getRealtimeServer();
      realtimeServer.broadcastToTenant(event.tenantId, {
        type: 'event',
        event: event
      });
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  // Get recent events for tenant
  async getRecentEvents(tenantId: string, count: number = 50): Promise<Event[]> {
    try {
      const streamKey = `events:${tenantId}`;
      const events = await redisClient.xRevRange(streamKey, '+', '-', { COUNT: count });

      return events.map(event => ({
        type: event.message.type as EventType,
        tenantId: event.message.tenantId,
        userId: event.message.userId ? parseInt(event.message.userId) : undefined,
        data: JSON.parse(event.message.data),
        timestamp: new Date(event.message.timestamp)
      }));
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }

  // Cache data in Redis
  async cacheSet(key: string, value: any, expirySeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (expirySeconds) {
        await redisClient.setEx(key, expirySeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  // Get cached data from Redis
  async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  // Delete cached data
  async cacheDelete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Error deleting cache:', error);
    }
  }

  // Increment counter in Redis
  async incrementCounter(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrBy(key, amount);
    } catch (error) {
      console.error('Error incrementing counter:', error);
      return 0;
    }
  }

  // Get counter value
  async getCounter(key: string): Promise<number> {
    try {
      const value = await redisClient.get(key);
      return value ? parseInt(value) : 0;
    } catch (error) {
      console.error('Error getting counter:', error);
      return 0;
    }
  }
}

export const eventService = new EventService();
