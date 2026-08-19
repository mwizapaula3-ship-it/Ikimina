/**
 * API middleware for Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { TokenPayload, extractTokenFromHeader, verifyToken } from './auth';
import { UnauthorizedError, ForbiddenError } from './errors';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export function withAuth<Context = unknown>(
  handler: (req: AuthenticatedRequest, context: Context) => Promise<Response>
) {
  return async (req: NextRequest, context: Context) => {
    try {
      const token = extractTokenFromHeader(req.headers.get('authorization'));

      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Missing authentication token', code: 'NO_TOKEN' },
          { status: 401 }
        );
      }

      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
          { status: 401 }
        );
      }

      // Attach user to request-like object
      (req as AuthenticatedRequest).user = payload;

      return handler(req as AuthenticatedRequest, context);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Authorization middleware - checks if user has required role
 */
export function withRole<Context = unknown>(
  allowedRoles: Role[],
  handler: (req: AuthenticatedRequest, context: Context) => Promise<Response>
) {
  return async (req: AuthenticatedRequest, context: Context) => {
    if (!req.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated', code: 'NO_USER' },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}

/**
 * Combined auth + role middleware
 */
export function withAuthAndRole<Context = unknown>(
  allowedRoles: Role[],
  handler: (req: AuthenticatedRequest, context: Context) => Promise<Response>
) {
  return withAuth<Context>(withRole<Context>(allowedRoles, handler));
}
