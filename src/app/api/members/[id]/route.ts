import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/prisma';

/**
 * GET /api/members/[id] - Get a specific member's details with their statistics
 */
export const GET = withAuth(
  async (
    req: NextRequest & { user?: any },
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const user = (req as any).user;
      const { id: memberId } = await params;

      // For MEMBER role, can only view own details
      if (user.role === 'MEMBER' && user.userId !== memberId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot view other members details',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      const member = await prisma.user.findUnique({
        where: { id: memberId },
      });

      if (!member || member.group_id !== user.groupId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Member not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Get member's contributions
      const contributions = await prisma.contribution.findMany({
        where: {
          member_id: memberId,
          group_id: user.groupId,
        },
      });

      // Get member's loans
      const loans = await prisma.loan.findMany({
        where: {
          member_id: memberId,
          group_id: user.groupId,
        },
        include: {
          repayments: true,
        },
      });

      // Calculate statistics
      const totalSavings = contributions
        .filter((c) => c.status === 'PAID')
        .reduce((sum, c) => sum + c.amount, 0);

      const totalContributions = contributions.length;
      const paidContributions = contributions.filter((c) => c.status === 'PAID').length;
      const complianceRate =
        totalContributions > 0 ? (paidContributions / totalContributions) * 100 : 0;

      let totalLoansIssued = 0;
      let totalLoansRepaid = 0;
      let totalOutstandingLoan = 0;

      loans.forEach((loan) => {
        totalLoansIssued += loan.principal;
        const totalOwed = loan.principal + (loan.total_interest || 0);
        const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);

        if (loan.status === 'REPAID') {
          totalLoansRepaid += loan.principal;
        } else if (loan.status === 'ACTIVE') {
          totalOutstandingLoan += Math.max(0, totalOwed - totalRepaid);
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          member: {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            role: member.role,
          },
          statistics: {
            totalSavings,
            totalContributions,
            paidContributions,
            complianceRate: Math.round(complianceRate),
            totalLoansIssued,
            totalLoansRepaid,
            totalOutstandingLoan,
          },
          recentContributions: contributions.slice(-5).reverse(),
          loans,
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch member details',
          code: 'FETCH_ERROR',
        },
        { status: 500 }
      );
    }
  }
);

/**
 * PUT /api/members/[id] - Update member details (GROUP_ADMIN only)
 */
export const PUT = withAuth(
  async (
    req: NextRequest & { user?: any },
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const user = (req as any).user;

      // Check permission
      if (user.role !== 'GROUP_ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Only group admins can update members',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      const { id: memberId } = await params;
      const { name, phone, email, role, isActive } = await req.json();

      // Verify member exists in group
      const member = await prisma.user.findUnique({
        where: { id: memberId },
      });

      if (!member || member.group_id !== user.groupId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Member not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Check for email/phone conflicts
      if (email && email !== member.email) {
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

      if (phone && phone !== member.phone) {
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

      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(email && { email }),
          ...(role && { role }),
          ...(isActive !== undefined && { is_active: isActive }),
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

      return NextResponse.json({
        success: true,
        data: updatedMember,
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to update member',
          code: 'UPDATE_ERROR',
        },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/members/[id] - Delete a member (GROUP_ADMIN only)
 */
export const DELETE = withAuth(
  async (
    req: NextRequest & { user?: any },
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const user = (req as any).user;

      // Check permission
      if (user.role !== 'GROUP_ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Only group admins can delete members',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      const { id: memberId } = await params;

      // Verify member exists in group
      const member = await prisma.user.findUnique({
        where: { id: memberId },
      });

      if (!member || member.group_id !== user.groupId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Member not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Deactivate instead of delete (soft delete)
      const deletedMember = await prisma.user.update({
        where: { id: memberId },
        data: {
          is_active: false,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: deletedMember.id,
          message: 'Member deactivated successfully',
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to delete member',
          code: 'DELETE_ERROR',
        },
        { status: 500 }
      );
    }
  }
);
