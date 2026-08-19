import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/members - Get all members in the current user's group
 */
export const GET = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    const members = await prisma.user.findMany({
      where: {
        group_id: user.groupId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch members',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/members - Add a new member (GROUP_ADMIN only)
 */
export const POST = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    // Check permission
    if (user.role !== 'GROUP_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only group admins can add members',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const { name, phone, email, password, role } = await req.json();

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
          code: 'NO_CONTACT',
        },
        { status: 400 }
      );
    }

    // Check for existing user with email or phone
    if (email) {
      const existing = await prisma.user.findUnique({
        where: { email },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already exists',
            code: 'EMAIL_EXISTS',
          },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const existing = await prisma.user.findUnique({
        where: { phone },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Phone already exists',
            code: 'PHONE_EXISTS',
          },
          { status: 409 }
        );
      }
    }

    // Hash password (import at top)
    const { hashPassword } = await import('@/lib/auth');
    const passwordHash = await hashPassword(password);

    const member = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password_hash: passwordHash,
        role: role || 'MEMBER',
        group_id: user.groupId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: member,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add member',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
});
