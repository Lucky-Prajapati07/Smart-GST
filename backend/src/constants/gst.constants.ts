/**
 * GST Constants
 * GST filing types and periods
 */

export const GST_FILING_TYPES = {
  GSTR1: 'GSTR1',
  GSTR3B: 'GSTR3B',
  GSTR9: 'GSTR9',
} as const;

export const GST_FILING_PERIODS = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
} as const;

export const GST_RETURN_STATUSES = {
  DRAFT: 'Draft',
  FILED: 'Filed',
  ACKNOWLEDGED: 'Acknowledged',
  REJECTED: 'Rejected',
  PENDING: 'Pending',
} as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const QUARTERS = {
  Q1: 'Q1',
  Q2: 'Q2',
  Q3: 'Q3',
  Q4: 'Q4',
} as const;

export const GST_INVOICE_TYPES = {
  REGULAR: 'Regular',
  BILL_OF_SUPPLY: 'Bill of Supply',
  CREDIT_NOTE: 'Credit Note',
  DEBIT_NOTE: 'Debit Note',
} as const;
