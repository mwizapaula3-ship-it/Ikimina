/**
 * Prisma seed script - creates demo data for testing
 * Run with: npx prisma db seed
 */

import { PrismaClient, Role } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { hashPassword } from '../src/lib/auth';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Delete existing data
  await prisma.reminder.deleteMany();
  await prisma.loanRepayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.meetingAttendance.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();

  // Create a demo group
  const group = await prisma.group.create({
    data: {
      name: 'Ubwiyunge wa Kigali',
      description: 'Demo VSLA group in Kigali, Rwanda',
      contribution_amount: 10000, // 10,000 RWF
      contribution_frequency: 'monthly',
      interest_rate: 15, // 15% interest on loans
      // Cycle starts 6 months ago so it lines up with the contribution history
      // seeded below, and stays open-ended (no end date) like a real ongoing group.
      cycle_start_date: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
      cycle_end_date: null,
    },
  });

  console.log(`✅ Created group: ${group.name}`);

  // Create super admin
  const adminPassword = await hashPassword('Admin@2024');
  const superAdmin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@ikimina.local',
      password_hash: adminPassword,
      role: 'SUPER_ADMIN',
      group_id: group.id,
    },
  });

  // Create group admin
  const groupAdminPassword = await hashPassword('President@2024');
  const groupAdmin = await prisma.user.create({
    data: {
      name: 'Jean Nkunde',
      email: 'president@group.local',
      phone: '+250788123456',
      password_hash: groupAdminPassword,
      role: 'GROUP_ADMIN',
      group_id: group.id,
    },
  });

  // Create treasurer
  const treasurerPassword = await hashPassword('Treasurer@2024');
  const treasurer = await prisma.user.create({
    data: {
      name: 'Marie Kamanzi',
      phone: '+250788234567',
      password_hash: treasurerPassword,
      role: 'TREASURER',
      group_id: group.id,
    },
  });

  // Create secretary
  const secretaryPassword = await hashPassword('Secretary@2024');
  const secretary = await prisma.user.create({
    data: {
      name: 'Therese Uwimana',
      phone: '+250788345678',
      password_hash: secretaryPassword,
      role: 'SECRETARY',
      group_id: group.id,
    },
  });

  // Create demo members
  const members = [];
  const memberNames = [
    { name: 'Joseph Kabaghe', phone: '+250789001111' },
    { name: 'Claudette Habimana', phone: '+250789002222' },
    { name: 'David Twahirwa', phone: '+250789003333' },
    { name: 'Emmanuel Rutayisire', phone: '+250789004444' },
    { name: 'Grace Uwineza', phone: '+250789005555' },
    { name: 'John Habimana', phone: '+250789006666' },
    { name: 'Rose Mukamakuba', phone: '+250789007777' },
    { name: 'Patrick Makuza', phone: '+250789008888' },
    { name: 'Sylvie Nsanzubikina', phone: '+250789009999' },
    { name: 'Bernard Umuhire', phone: '+250789010101' },
    { name: 'Francoise Nyirandekwe', phone: '+250789011111' },
    { name: 'Vincent Ntaguhimana', phone: '+250789012121' },
    { name: 'Josephine Mukakabanda', phone: '+250789013131' },
    { name: 'Samuel Nsabimana', phone: '+250789014141' },
    { name: 'Caroline Mukeshimana', phone: '+250789015151' },
  ];

  for (const { name, phone } of memberNames) {
    const memberPassword = await hashPassword('Member@2024');
    const member = await prisma.user.create({
      data: {
        name,
        phone,
        password_hash: memberPassword,
        role: 'MEMBER',
        group_id: group.id,
      },
    });
    members.push(member);
  }

  console.log(`✅ Created ${members.length} members`);

  // Create sample contributions for the last 6 months
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);

    for (const member of members) {
      // Randomize: 80% paid on time, 10% late, 10% missed
      const rand = Math.random();
      let status = 'PAID';
      let paidDate: Date | null = null;

      if (rand < 0.8) {
        status = 'PAID';
        paidDate = new Date(monthDate);
        paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 5));
      } else if (rand < 0.9) {
        status = 'LATE';
        paidDate = new Date(monthDate);
        paidDate.setDate(paidDate.getDate() + 10 + Math.floor(Math.random() * 10));
      } else {
        status = 'MISSED';
        paidDate = null;
      }

      await prisma.contribution.create({
        data: {
          member_id: member.id,
          group_id: group.id,
          amount: group.contribution_amount,
          due_date: monthDate,
          paid_date: paidDate,
          status: status as any,
          payment_method: ['cash', 'mobile_money'][Math.floor(Math.random() * 2)],
          recorded_by: treasurer.id,
        },
      });
    }
  }

  console.log('✅ Created 90 contributions (6 months x 15 members)');

  // Create some sample loans
  for (let i = 0; i < 5; i++) {
    const borrower = members[i];

    // Get member's savings
    const contributions = await prisma.contribution.findMany({
      where: {
        member_id: borrower.id,
        group_id: group.id,
        status: 'PAID',
      },
    });

    const totalSavings = contributions.reduce((sum, c) => sum + c.amount, 0);
    const loanAmount = Math.floor(totalSavings * 1.5); // 1.5x savings

    const loan = await prisma.loan.create({
      data: {
        member_id: borrower.id,
        group_id: group.id,
        principal: loanAmount,
        interest_rate: group.interest_rate,
        total_interest: Math.floor((loanAmount * group.interest_rate) / 100),
        issue_date: new Date(new Date().setMonth(new Date().getMonth() - 2)),
        due_date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        status: 'ACTIVE',
      },
    });

    // Create sample repayments (partial)
    if (i % 2 === 0) {
      const repaymentAmount = Math.floor(loanAmount * 0.3);
      await prisma.loanRepayment.create({
        data: {
          loan_id: loan.id,
          amount: repaymentAmount,
          paid_date: new Date(new Date().setDate(new Date().getDate() - 20)),
          recorded_by: treasurer.id,
        },
      });
    }
  }

  console.log('✅ Created 5 loans with partial repayments');

  // Create demo meeting
  const meeting = await prisma.meeting.create({
    data: {
      group_id: group.id,
      date: new Date(),
      notes: 'Monthly meeting - discussed Q4 savings plan',
    },
  });

  // Add attendance
  for (const member of members.slice(0, 12)) {
    await prisma.meetingAttendance.create({
      data: {
        meeting_id: meeting.id,
        member_id: member.id,
        present: Math.random() > 0.2,
      },
    });
  }

  console.log('✅ Created demo meeting with attendance records');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📝 Demo credentials:');
  console.log('  Super Admin: admin@ikimina.local / Admin@2024');
  console.log('  Group Admin: president@group.local / President@2024');
  console.log('  Treasurer: +250788234567 / Treasurer@2024');
  console.log('  Secretary: +250788345678 / Secretary@2024');
  console.log('  Members: any member phone / Member@2024');
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
