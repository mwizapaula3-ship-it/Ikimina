import { Role } from '@prisma/client';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  groupId: string;
  preferredLanguage: string;
  isActive: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  contributionAmount: number;
  contributionFrequency: string;
  interestRate: number;
  cycleStartDate: Date;
  cycleEndDate?: Date;
}

export interface Contribution {
  id: string;
  memberId: string;
  groupId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'PAID' | 'LATE' | 'MISSED';
  paymentMethod?: string;
}

export interface Loan {
  id: string;
  memberId: string;
  groupId: string;
  principal: number;
  interestRate: number;
  issueDate: Date;
  dueDate: Date;
  status: 'ACTIVE' | 'REPAID' | 'DEFAULTED';
  totalInterest?: number;
}

export interface Reminder {
  id: string;
  memberId: string;
  groupId: string;
  channel: string;
  message: string;
  messageType?: string;
  sentAt: Date;
  status: string;
}

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
