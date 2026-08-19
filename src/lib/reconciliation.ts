import prisma from '@/lib/prisma';

const LATE_GRACE_PERIOD_DAYS = 7;
const MAX_CYCLES_TO_BACKFILL = 500;

function addCycle(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export interface ReconciliationResult {
  contributionsCreated: number;
  contributionsMarkedMissed: number;
  loansDefaulted: number;
}

/**
 * Catches up a group's data with the passage of time:
 * - Backfills a MISSED contribution row for every due cycle a member has no record for
 * - Flips LATE contributions to MISSED once they're past the grace period unpaid
 * - Flips overdue ACTIVE loans to DEFAULTED
 *
 * `actorUserId` is recorded as the author of any backfilled contribution rows.
 */
export async function reconcileGroup(
  groupId: string,
  actorUserId: string
): Promise<ReconciliationResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return { contributionsCreated: 0, contributionsMarkedMissed: 0, loansDefaulted: 0 };
  }

  const members = await prisma.user.findMany({
    where: { group_id: groupId, role: 'MEMBER', is_active: true },
  });

  // Every due date from the cycle start up to today, capped as a safety backstop
  const dueDates: Date[] = [];
  let cursor = new Date(group.cycle_start_date);
  cursor.setHours(0, 0, 0, 0);
  const cycleEnd = group.cycle_end_date ? new Date(group.cycle_end_date) : null;

  while (cursor <= today && dueDates.length < MAX_CYCLES_TO_BACKFILL) {
    if (!cycleEnd || cursor <= cycleEnd) {
      dueDates.push(new Date(cursor));
    }
    cursor = addCycle(cursor, group.contribution_frequency);
  }

  let contributionsCreated = 0;

  for (const member of members) {
    const existing = await prisma.contribution.findMany({
      where: { member_id: member.id, group_id: groupId },
      select: { due_date: true },
    });
    const existingDueDates = new Set(existing.map((c) => c.due_date.toISOString().slice(0, 10)));

    for (const dueDate of dueDates) {
      const key = dueDate.toISOString().slice(0, 10);
      if (existingDueDates.has(key)) continue;

      await prisma.contribution.create({
        data: {
          member_id: member.id,
          group_id: groupId,
          amount: group.contribution_amount,
          due_date: dueDate,
          status: 'MISSED',
          recorded_by: actorUserId,
        },
      });
      contributionsCreated += 1;
    }
  }

  // LATE contributions past the grace period with no payment become MISSED
  const graceThreshold = new Date(today);
  graceThreshold.setDate(graceThreshold.getDate() - LATE_GRACE_PERIOD_DAYS);

  const { count: contributionsMarkedMissed } = await prisma.contribution.updateMany({
    where: {
      group_id: groupId,
      status: 'LATE',
      paid_date: null,
      due_date: { lt: graceThreshold },
    },
    data: { status: 'MISSED' },
  });

  // Overdue active loans with an outstanding balance become DEFAULTED
  const overdueLoans = await prisma.loan.findMany({
    where: { group_id: groupId, status: 'ACTIVE', due_date: { lt: today } },
    include: { repayments: true },
  });

  let loansDefaulted = 0;
  for (const loan of overdueLoans) {
    const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    const totalOwed = loan.principal + (loan.total_interest || 0);
    if (totalRepaid < totalOwed) {
      await prisma.loan.update({ where: { id: loan.id }, data: { status: 'DEFAULTED' } });
      loansDefaulted += 1;
    }
  }

  return { contributionsCreated, contributionsMarkedMissed, loansDefaulted };
}
