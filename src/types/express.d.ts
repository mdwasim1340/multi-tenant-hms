import { PoolClient } from 'pg';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    export interface Request {
      dbClient?: PoolClient;
      user?: string | JwtPayload;
    }
  }
}
