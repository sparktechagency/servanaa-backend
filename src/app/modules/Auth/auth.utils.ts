/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

export const createToken = (
  jwtPayload: Record<string, unknown>,
  // jwtPayload: { userEmail: string; role: string },
  secret: string,
  expiresIn: any,
) => {
  return jwt.sign(jwtPayload, secret, 
    { expiresIn: expiresIn },
    // expiresIn,
  );
};

export const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload;
};
