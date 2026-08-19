import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken, comparePasswords } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ValidationError, ConflictError } from '@/lib/errors';

/**
 * POST /api/auth/register - Register a new user
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, groupId, role } = await req.json();

    // Validation
    if (!name || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and password are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email or phone number is required',
          code: 'NO_CONTACT_INFO',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already registered',
            code: 'EMAIL_EXISTS',
          },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            error: 'Phone number already registered',
            code: 'PHONE_EXISTS',
          },
          { status: 409 }
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password_hash: passwordHash,
        role: role || 'MEMBER',
        group_id: groupId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        group_id: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Registration failed',
        code: 'REGISTRATION_ERROR',
      },
      { status: 500 }
    );
  }
}
