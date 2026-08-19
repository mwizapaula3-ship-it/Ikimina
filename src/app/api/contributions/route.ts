import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/contributions - Get contributions for the current user's group
 * Query params: memberId (optional), status (optional), dateFrom, dateTo
 */
export const GET = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;
    const { searchParams } = new URL(req.url);

    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filter
    const where: any = {
      group_id: user.groupId,
    };

    if (memberId) {
      where.member_id = memberId;
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.due_date = {};
      if (dateFrom) where.due_date.gte = new Date(dateFrom);
      if (dateTo) where.due_date.lte = new Date(dateTo);
    }

    const contributions = await prisma.contribution.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        due_date: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: contributions,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch contributions',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/contributions - Record a new contribution
 */
export const POST = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    // Check permission - only GROUP_ADMIN and TREASURER can record contributions
    if (!['GROUP_ADMIN', 'TREASURER'].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const { memberId, amount, dueDate, paidDate, status, paymentMethod, notes } =
      await req.json();

    if (!memberId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member ID and amount are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    if (amount < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount cannot be negative',
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Verify member exists in group
    const member = await prisma.user.findUnique({
      where: { id: memberId },
    });

    if (!member || member.group_id !== user.groupId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found in your group',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const contribution = await prisma.contribution.create({
      data: {
        member_id: memberId,
        group_id: user.groupId,
        amount,
        due_date: new Date(dueDate),
        paid_date: paidDate ? new Date(paidDate) : null,
        status: status || 'PAID',
        payment_method: paymentMethod,
        notes,
        recorded_by: user.userId,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: contribution,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to record contribution',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
});
