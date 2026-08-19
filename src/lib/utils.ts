// Utility functions for common operations

/**
 * Format currency to RWF with thousands separator
 */
export function formatCurrency(amount: number | null | undefined, decimals = 0): string {
  if (amount === null || amount === undefined) return '0 RWF';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return formatter.format(amount);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: Date, gracePeriodDays = 0): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = daysBetween(today, due);
  return diffDays > gracePeriodDays;
}

/**
 * Format date to readable string (Kinyarwanda and English)
 */
export function formatDate(date: Date, language: 'en' | 'rw' = 'en'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  const locale = language === 'rw' ? 'rw-RW' : 'en-US';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Calculate loan total (principal + interest)
 */
export function calculateLoanTotal(
  principal: number,
  interestRate: number
): number {
  return principal + (principal * interestRate) / 100;
}

/**
 * Calculate remaining loan balance
 */
export function calculateRemainingBalance(
  principal: number,
  interestRate: number,
  paidAmount: number
): number {
  const total = calculateLoanTotal(principal, interestRate);
  return Math.max(0, total - paidAmount);
}

/**
 * Calculate contribution compliance rate for a group
 */
export function calculateComplianceRate(
  totalContributions: number,
  paidContributions: number
): number {
  if (totalContributions === 0) return 0;
  return (paidContributions / totalContributions) * 100;
}

/**
 * Generate a random alphanumeric string
 */
export function generateRandomString(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+\d{1,3})?[\d\s\-()]{8,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
