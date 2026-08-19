import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/reminders - Get reminders for current user
 */
export const GET = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    let reminders;
    if (user.role === 'MEMBER') {
      // Members see only their reminders
      reminders = await prisma.reminder.findMany({
        where: {
          member_id: user.userId,
          group_id: user.groupId,
        },
        orderBy: {
          sent_at: 'desc',
        },
      });
    } else {
      // Admins see all reminders in their group
      reminders = await prisma.reminder.findMany({
        where: {
          group_id: user.groupId,
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
        orderBy: {
          sent_at: 'desc',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch reminders',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
});
