import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import fetch from 'node-fetch';
import { getUserByEmail } from '../services/userService';

let pems: { [key: string]: string } = {};

interface JWK {
  kid: string;
  kty: 'RSA' | 'EC';
  n: string;
  e: string;
}

interface JWKS {
  keys: JWK[];
}

const fetchJWKS = async () => {
  const url = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  try {
    const response = await fetch(url);
    const jwks = await response.json() as JWKS;
    if (jwks && jwks.keys) {
      pems = jwks.keys.reduce((acc: { [key: string]: string }, key: JWK) => {
        if (key.kty === 'RSA') {
          acc[key.kid] = jwkToPem({ kty: key.kty, n: key.n, e: key.e });
        }
        return acc;
      }, {});
    }
  } catch (error) {
    console.error('Error fetching JWKS:', error);
  }
};

fetchJWKS();

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is required' });
  }

  const decodedToken = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
  if (!decodedToken || !decodedToken.header.kid) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Handle Cognito tokens
  const kid = decodedToken.header.kid;
  const pem = pems[kid];

  if (!pem) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  jwt.verify(token, pem, { algorithms: ['RS256'] }, async (err, payload) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const groups = (payload as any)['cognito:groups'];
    if (!groups || !(groups.includes('system-admin') || groups.includes('admin'))) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    req.user = payload;
    // Map JWT to local DB user id when possible
    try {
      const email = (payload as any).email || (payload as any)['cognito:username'];
      const user = email ? await getUserByEmail(email) : null;
      (req as any).userId = user?.id ?? (payload as any).sub ?? (payload as any)['cognito:username'];
    } catch (mapErr) {
      (req as any).userId = (payload as any).sub || (payload as any)['cognito:username'];
    }
    next();
  });
};

export const hospitalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is required' });
  }

  const decodedToken = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
  if (!decodedToken || !decodedToken.header.kid) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const kid = decodedToken.header.kid;
  const pem = pems[kid];

  if (!pem) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  jwt.verify(token, pem, { algorithms: ['RS256'] }, async (err, payload) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = payload;
    
    // Map JWT to local DB user id
    try {
      const email = (payload as any).email || (payload as any)['cognito:username'];
      const user = email ? await getUserByEmail(email) : null;
      (req as any).userId = user?.id ?? (payload as any).sub ?? (payload as any)['cognito:username'];
      
      // Check database roles instead of Cognito groups for hospital access
      // This allows users with database roles to access hospital system
      // even if they don't have Cognito groups set
      if (user?.id) {
        // User found in database - allow access (role-based permissions will be checked by requirePermission middleware)
        return next();
      }
      
      // Fallback to Cognito groups check if user not in database
      const groups = (payload as any)['cognito:groups'];
      if (groups && (groups.includes('hospital-admin') || groups.includes('system-admin') || groups.includes('admin'))) {
        return next();
      }
      
      // If no database user and no Cognito groups, deny access
      return res.status(403).json({ 
        message: 'Forbidden: User not authorized for hospital system',
        hint: 'User must have a database account with assigned roles or be in a Cognito group'
      });
      
    } catch (mapErr) {
      console.error('Error mapping user:', mapErr);
      (req as any).userId = (payload as any).sub || (payload as any)['cognito:username'];
      
      // Fallback to Cognito groups check
      const groups = (payload as any)['cognito:groups'];
      if (!groups || (!groups.includes('hospital-admin') && !groups.includes('system-admin') && !groups.includes('admin'))) {
        return res.status(403).json({ message: 'Forbidden: Hospital admins only' });
      }
      next();
    }
  });
};

export const authMiddleware = adminAuthMiddleware;
