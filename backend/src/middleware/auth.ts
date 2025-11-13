import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import fetch from 'node-fetch';

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

  jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, payload) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const groups = (payload as any)['cognito:groups'];
    if (!groups || !(groups.includes('system-admin') || groups.includes('admin'))) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    req.user = payload;
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

  jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, payload) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const groups = (payload as any)['cognito:groups'];
    if (!groups || (!groups.includes('hospital-admin') && !groups.includes('system-admin') && !groups.includes('admin'))) {
      return res.status(403).json({ message: 'Forbidden: Hospital admins only' });
    }

    req.user = payload;
    next();
  });
};

export const authMiddleware = adminAuthMiddleware;
