import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * POST /api/loans - Issue a new loan
 */
export const POST = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    // Check permission - only GROUP_ADMIN can issue loans
    if (user.role !== 'GROUP_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only group admins can issue loans',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const { memberId, principal, interestRate, dueDate, notes } = await req.json();

    if (!memberId || !principal || !interestRate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member ID, principal, and interest rate are required',
          code: 'MISSING_FIELDS',
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

    // Get member's total savings
    const contributions = await prisma.contribution.findMany({
      where: {
        member_id: memberId,
        group_id: user.groupId,
        status: 'PAID',
      },
    });

    const totalSavings = contributions.reduce((sum, c) => sum + c.amount, 0);

    // Check loan-to-savings ratio (max 3x)
    const maxLoan = totalSavings * 3;
    if (principal > maxLoan) {
      return NextResponse.json(
        {
          success: false,
          error: `Loan amount exceeds maximum (${maxLoan} RWF)`,
          code: 'EXCEEDS_LIMIT',
        },
        { status: 400 }
      );
    }

    const totalInterest = Math.floor((principal * interestRate) / 100);

    const loan = await prisma.loan.create({
      data: {
        member_id: memberId,
        group_id: user.groupId,
        principal,
        interest_rate: interestRate,
        total_interest: totalInterest,
        issue_date: new Date(),
        due_date: new Date(dueDate),
        status: 'ACTIVE',
        notes,
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
        data: loan,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to issue loan',
        code: 'CREATE_ERROR',
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/loans - Get loans for the current user's group
 */
export const GET = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;
    const { searchParams } = new URL(req.url);

    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');

    const where: any = {
      group_id: user.groupId,
    };

    if (memberId) {
      where.member_id = memberId;
    }

    if (status) {
      where.status = status;
    }

    const loans = await prisma.loan.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        repayments: {
          select: {
            id: true,
            amount: true,
            paid_date: true,
          },
        },
      },
      orderBy: {
        due_date: 'desc',
      },
    });

    // Calculate remaining balance for each loan
    const loansWithBalance = loans.map((loan) => {
      const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
      const totalOwed = (loan.principal + (loan.total_interest || 0));
      const remainingBalance = totalOwed - totalRepaid;

      return {
        ...loan,
        totalRepaid,
        remainingBalance,
      };
    });

    return NextResponse.json({
      success: true,
      data: loansWithBalance,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch loans',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
});
