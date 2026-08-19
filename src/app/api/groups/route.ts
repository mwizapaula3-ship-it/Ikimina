import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { ForbiddenError } from '@/lib/errors';

/**
 * GET /api/groups - Get all groups for the current user (super admin sees all, others see their group)
 */
export const GET = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    let groups;
    if (user.role === 'SUPER_ADMIN') {
      // Super admin sees all groups
      groups = await prisma.group.findMany({
        include: {
          _count: {
            select: { users: true },
          },
        },
      });
    } else {
      // Others see only their group
      groups = await prisma.group.findMany({
        where: { id: user.groupId },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch groups',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/groups - Create a new group (super admin only)
 */
export const POST = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only super admins can create groups',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const {
      name,
      description,
      contributionAmount,
      contributionFrequency,
      interestRate,
      cycleStartDate,
      cycleEndDate,
    } = await req.json();

    if (!name || !contributionAmount || !contributionFrequency || !interestRate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        contribution_amount: contributionAmount,
        contribution_frequency: contributionFrequency,
        interest_rate: interestRate,
        cycle_start_date: new Date(cycleStartDate),
        cycle_end_date: cycleEndDate ? new Date(cycleEndDate) : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: group,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create group',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
});
