import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/analytics - Get analytics data for the current user's group
 */
export const GET = withAuth(async (req: NextRequest & { user?: any }) => {
  try {
    const user = (req as any).user;

    // Analytics are group-wide aggregates — Members only ever see their own data
    if (user.role === 'MEMBER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const dateFromStr = searchParams.get('dateFrom');
    const dateToStr = searchParams.get('dateTo');

    const dateFrom = dateFromStr ? new Date(dateFromStr) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const dateTo = dateToStr ? new Date(dateToStr) : new Date();

    // Get group info
    const group = await prisma.group.findUnique({
      where: { id: user.groupId },
      include: {
        _count: {
          select: {
            users: {
              where: { role: 'MEMBER' },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get all contributions in date range
    const contributions = await prisma.contribution.findMany({
      where: {
        group_id: user.groupId,
        due_date: { gte: dateFrom, lte: dateTo },
      },
    });

    // Get all loans
    const loans = await prisma.loan.findMany({
      where: {
        group_id: user.groupId,
      },
      include: {
        repayments: true,
      },
    });

    // Calculate metrics
    const totalSavings = contributions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalDue = contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = contributions.filter((c) => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);
    const complianceRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

    let totalLoansIssued = 0;
    let totalLoansRepaid = 0;
    let totalOutstandingLoan = 0;
    let defaultRate = 0;

    const loansByStatus = { ACTIVE: 0, REPAID: 0, DEFAULTED: 0 };

    loans.forEach((loan) => {
      totalLoansIssued += loan.principal;
      const totalOwed = loan.principal + (loan.total_interest || 0);
      const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);

      if (loan.status === 'REPAID') {
        totalLoansRepaid += loan.principal;
        loansByStatus.REPAID += 1;
      } else if (loan.status === 'DEFAULTED') {
        loansByStatus.DEFAULTED += 1;
        defaultRate += 1;
      } else {
        loansByStatus.ACTIVE += 1;
        totalOutstandingLoan += Math.max(0, totalOwed - totalRepaid);
      }
    });

    const defaultRatePercentage = loans.length > 0 ? (defaultRate / loans.length) * 100 : 0;

    // Contribution status summary
    const contributionSummary = {
      paid: contributions.filter((c) => c.status === 'PAID').length,
      late: contributions.filter((c) => c.status === 'LATE').length,
      missed: contributions.filter((c) => c.status === 'MISSED').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        period: { from: dateFrom, to: dateTo },
        group: {
          id: group.id,
          name: group.name,
          totalMembers: group._count.users,
          contributionAmount: group.contribution_amount,
          interestRate: group.interest_rate,
        },
        savings: {
          totalSavings,
          totalDue,
          totalPaid,
          complianceRate: Math.round(complianceRate),
          contributionSummary,
        },
        loans: {
          totalIssued: totalLoansIssued,
          totalRepaid: totalLoansRepaid,
          totalOutstanding: totalOutstandingLoan,
          byStatus: loansByStatus,
          defaultRate: Math.round(defaultRatePercentage),
        },
        trends: {
          savingsTrend: calculateSavingsTrend(contributions),
          loanTrend: calculateLoanTrend(loans),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch analytics',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
});

function calculateSavingsTrend(contributions: any[]): { date: string; amount: number }[] {
  const trend: { [key: string]: number } = {};

  contributions.forEach((c) => {
    const dateStr = new Date(c.due_date).toISOString().split('T')[0];
    if (c.status === 'PAID') {
      trend[dateStr] = (trend[dateStr] || 0) + c.amount;
    }
  });

  return Object.entries(trend)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function calculateLoanTrend(loans: any[]): { date: string; issued: number; repaid: number }[] {
  const trend: { [key: string]: { issued: number; repaid: number } } = {};

  loans.forEach((loan) => {
    const dateStr = new Date(loan.issue_date).toISOString().split('T')[0];
    if (!trend[dateStr]) trend[dateStr] = { issued: 0, repaid: 0 };
    trend[dateStr].issued += loan.principal;

    if (loan.status === 'REPAID') {
      trend[dateStr].repaid += loan.principal;
    }
  });

  return Object.entries(trend)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
