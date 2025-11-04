import { PoolClient } from 'pg';
import { JwtPayload } from 'jsonwebtoken';
import { SubscriptionWithTier, UsageLimitResult } from './subscription';

declare global {
  namespace Express {
    export interface Request {
      dbClient?: PoolClient;
      user?: string | JwtPayload;
      subscription?: SubscriptionWithTier | null;
      usageInfo?: { [key: string]: UsageLimitResult };
    }
  }
}
