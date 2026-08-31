import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'orderkare-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, getJwtSecret());
};
