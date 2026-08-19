import { NextRequest, NextResponse } from 'next/server';
import { comparePasswords, generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/auth/login - Login user and return JWT token
 */
export async function POST(req: NextRequest) {
  try {
    const { emailOrPhone, password } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email/phone and password are required',
          code: 'MISSING_CREDENTIALS',
        },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await comparePasswords(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is inactive',
          code: 'ACCOUNT_INACTIVE',
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      groupId: user.group_id,
      email: user.email || undefined,
      phone: user.phone || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            groupId: user.group_id,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Login failed',
        code: 'LOGIN_ERROR',
      },
      { status: 500 }
    );
  }
}
