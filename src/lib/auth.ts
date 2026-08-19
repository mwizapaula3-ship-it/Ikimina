import bcryptjs from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const SALT_ROUNDS = 10;

export interface TokenPayload extends JwtPayload {
  userId: string;
  role: string;
  groupId: string;
  email?: string;
  phone?: string;
}

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(plainPassword, hashedPassword);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: TokenPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  
  return null;
}
