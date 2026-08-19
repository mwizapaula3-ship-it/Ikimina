import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * POST /api/reminders/check - Check and send reminders (run reminder job)
 * This is the manual trigger for the reminder check
 */
export const POST = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    // Only TREASURER and GROUP_ADMIN can trigger reminders
    if (!['GROUP_ADMIN', 'TREASURER'].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only admins and treasurers can send reminders',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const remindersToSend: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get members with upcoming/overdue contributions
    const allMembers = await prisma.user.findMany({
      where: {
        group_id: user.groupId,
        role: 'MEMBER',
      },
    });

    const group = await prisma.group.findUnique({
      where: { id: user.groupId },
    });

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          error: 'Group not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check each member's contributions and loans
    for (const member of allMembers) {
      // Check for overdue contributions
      const overdueContributions = await prisma.contribution.findMany({
        where: {
          member_id: member.id,
          group_id: user.groupId,
          status: { in: ['LATE', 'MISSED'] },
          due_date: {
            lt: today,
          },
        },
      });

      if (overdueContributions.length > 0) {
        // Check if we already sent a reminder today
        const existingReminder = await prisma.reminder.findFirst({
          where: {
            member_id: member.id,
            group_id: user.groupId,
            message_type: 'contribution_overdue',
            sent_at: {
              gte: new Date(today),
            },
          },
        });

        if (!existingReminder) {
          const message = `Hello ${member.name}, you have ${overdueContributions.length} overdue contribution(s). Please pay as soon as possible.`;

          const reminder = await prisma.reminder.create({
            data: {
              member_id: member.id,
              group_id: user.groupId,
              channel: 'mock_sms',
              message,
              message_type: 'contribution_overdue',
              status: 'sent',
              recorded_by: user.userId,
            },
          });

          remindersToSend.push(reminder);
        }
      }

      // Check for upcoming contributions (due within 3 days)
      const upcomingContributions = await prisma.contribution.findMany({
        where: {
          member_id: member.id,
          group_id: user.groupId,
          status: 'MISSED',
          due_date: {
            gte: today,
            lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (upcomingContributions.length > 0) {
        const existingReminder = await prisma.reminder.findFirst({
          where: {
            member_id: member.id,
            group_id: user.groupId,
            message_type: 'contribution_due',
            sent_at: {
              gte: new Date(today),
            },
          },
        });

        if (!existingReminder) {
          const dueAmount = upcomingContributions[0].amount;
          const message = `Hello ${member.name}, your contribution of ${dueAmount} RWF is due on ${upcomingContributions[0].due_date.toLocaleDateString()}. Please contribute on time.`;

          const reminder = await prisma.reminder.create({
            data: {
              member_id: member.id,
              group_id: user.groupId,
              channel: 'mock_sms',
              message,
              message_type: 'contribution_due',
              status: 'sent',
              recorded_by: user.userId,
            },
          });

          remindersToSend.push(reminder);
        }
      }

      // Check for overdue loans
      const overdueLoans = await prisma.loan.findMany({
        where: {
          member_id: member.id,
          group_id: user.groupId,
          status: 'ACTIVE',
          due_date: {
            lt: today,
          },
        },
        include: {
          repayments: true,
        },
      });

      for (const loan of overdueLoans) {
        const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
        const totalOwed = loan.principal + (loan.total_interest || 0);

        if (totalRepaid < totalOwed) {
          const existingReminder = await prisma.reminder.findFirst({
            where: {
              member_id: member.id,
              group_id: user.groupId,
              message_type: 'loan_overdue',
              sent_at: {
                gte: new Date(today),
              },
            },
          });

          if (!existingReminder) {
            const remainingBalance = totalOwed - totalRepaid;
            const message = `Hello ${member.name}, your loan repayment is overdue. Remaining balance: ${remainingBalance} RWF. Please repay urgently.`;

            const reminder = await prisma.reminder.create({
              data: {
                member_id: member.id,
                group_id: user.groupId,
                channel: 'mock_sms',
                message,
                message_type: 'loan_overdue',
                status: 'sent',
                recorded_by: user.userId,
              },
            });

            remindersToSend.push(reminder);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        remindersSent: remindersToSend.length,
        reminders: remindersToSend,
      },
    });
  } catch (error: any) {
    console.error('Reminder check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send reminders',
        code: 'REMINDER_ERROR',
      },
      { status: 500 }
    );
  }
});
