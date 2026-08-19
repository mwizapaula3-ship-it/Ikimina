-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contribution_amount" INTEGER NOT NULL,
    "contribution_frequency" TEXT NOT NULL,
    "interest_rate" REAL NOT NULL,
    "cycle_start_date" DATETIME NOT NULL,
    "cycle_end_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "User_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "due_date" DATETIME NOT NULL,
    "paid_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'MISSED',
    "payment_method" TEXT,
    "notes" TEXT,
    "recorded_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Contribution_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contribution_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contribution_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "principal" INTEGER NOT NULL,
    "interest_rate" REAL NOT NULL,
    "issue_date" DATETIME NOT NULL,
    "due_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "total_interest" INTEGER,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Loan_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Loan_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loan_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "LoanRepayment_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "Loan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LoanRepayment_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'mock_sms',
    "message" TEXT NOT NULL,
    "message_type" TEXT,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "recorded_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Reminder_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Meeting_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeetingAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meeting_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "MeetingAttendance_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeetingAttendance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "performed_by" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Group_created_at_idx" ON "Group"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_group_id_idx" ON "User"("group_id");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Contribution_member_id_idx" ON "Contribution"("member_id");

-- CreateIndex
CREATE INDEX "Contribution_group_id_idx" ON "Contribution"("group_id");

-- CreateIndex
CREATE INDEX "Contribution_due_date_idx" ON "Contribution"("due_date");

-- CreateIndex
CREATE INDEX "Contribution_status_idx" ON "Contribution"("status");

-- CreateIndex
CREATE INDEX "Loan_member_id_idx" ON "Loan"("member_id");

-- CreateIndex
CREATE INDEX "Loan_group_id_idx" ON "Loan"("group_id");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_due_date_idx" ON "Loan"("due_date");

-- CreateIndex
CREATE INDEX "LoanRepayment_loan_id_idx" ON "LoanRepayment"("loan_id");

-- CreateIndex
CREATE INDEX "LoanRepayment_paid_date_idx" ON "LoanRepayment"("paid_date");

-- CreateIndex
CREATE INDEX "Reminder_member_id_idx" ON "Reminder"("member_id");

-- CreateIndex
CREATE INDEX "Reminder_group_id_idx" ON "Reminder"("group_id");

-- CreateIndex
CREATE INDEX "Reminder_sent_at_idx" ON "Reminder"("sent_at");

-- CreateIndex
CREATE INDEX "Reminder_status_idx" ON "Reminder"("status");

-- CreateIndex
CREATE INDEX "Meeting_group_id_idx" ON "Meeting"("group_id");

-- CreateIndex
CREATE INDEX "Meeting_date_idx" ON "Meeting"("date");

-- CreateIndex
CREATE INDEX "MeetingAttendance_meeting_id_idx" ON "MeetingAttendance"("meeting_id");

-- CreateIndex
CREATE INDEX "MeetingAttendance_member_id_idx" ON "MeetingAttendance"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendance_meeting_id_member_id_key" ON "MeetingAttendance"("meeting_id", "member_id");

-- CreateIndex
CREATE INDEX "AuditLog_entity_type_entity_id_idx" ON "AuditLog"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AuditLog_performed_by_idx" ON "AuditLog"("performed_by");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
