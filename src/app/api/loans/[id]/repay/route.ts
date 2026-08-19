import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * POST /api/loans/[id]/repay - Record a loan repayment
 */
export const POST = withAuth(
  async (
    req: NextRequest & { user?: any },
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const user = (req as any).user;

      // Check permission
      if (!['GROUP_ADMIN', 'TREASURER'].includes(user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Only admins and treasurers can record repayments',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      const { id: loanId } = await params;
      const { amount, paidDate, notes } = await req.json();

      if (!amount || amount <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Amount must be greater than 0',
            code: 'INVALID_AMOUNT',
          },
          { status: 400 }
        );
      }

      // Verify loan exists and belongs to user's group
      const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { repayments: true },
      });

      if (!loan || loan.group_id !== user.groupId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Loan not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Calculate total repaid and check if loan is fully repaid
      const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
      const totalOwed = loan.principal + (loan.total_interest || 0);
      const newTotal = totalRepaid + amount;

      // Create repayment record
      const repayment = await prisma.loanRepayment.create({
        data: {
          loan_id: loanId,
          amount,
          paid_date: paidDate ? new Date(paidDate) : new Date(),
          recorded_by: user.userId,
          notes,
        },
      });

      // Update loan status if fully repaid
      if (newTotal >= totalOwed && loan.status !== 'REPAID') {
        await prisma.loan.update({
          where: { id: loanId },
          data: { status: 'REPAID' },
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            repayment,
            remainingBalance: Math.max(0, totalOwed - newTotal),
            isFullyRepaid: newTotal >= totalOwed,
          },
        },
        { status: 201 }
      );
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to record repayment',
          code: 'CREATE_ERROR',
        },
        { status: 500 }
      );
    }
  }
);
