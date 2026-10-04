export interface BillMetadata {
  type: 'EMPLOYEE_BILL';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  vendor: string;
  invoiceNumber?: string;
  dueDate?: string;
  notes?: string;
  creatorRole?: string;
  paidAt?: string;
  paidBy?: string;
  paymentMethod?: string;
  paymentVoucherUrl?: string;
}

export interface UnifiedBillItem {
  id: string;
  source: 'EMPLOYEE_BILL' | 'PURCHASE_ORDER';
  title: string;
  vendor: string;
  invoiceNumber: string;
  amountMAD: number;
  category: string;
  dueDate: string | null;
  invoiceDate: string | null;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  isOverdue: boolean;
  daysRemaining: number | null;
  invoiceUrl: string | null;
  receiptUrl: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdById: string | null;
  creatorName: string;
  creatorRole: string;
  createdAt: string;
  notes: string | null;
  rawExpense?: any;
  rawPurchaseOrder?: any;
}

const META_PREFIX = '[BILL_META:';
const META_SUFFIX = ']';

/**
 * Parses bill metadata stored in AdminExpense.description
 */
export function parseBillMetadata(description?: string | null): BillMetadata | null {
  if (!description) return null;
  const startIdx = description.indexOf(META_PREFIX);
  if (startIdx === -1) return null;

  const contentStart = startIdx + META_PREFIX.length;
  const endIdx = description.indexOf(META_SUFFIX, contentStart);
  if (endIdx === -1) return null;

  try {
    const rawJson = description.substring(contentStart, endIdx);
    const parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === 'object') {
      return parsed as BillMetadata;
    }
  } catch (err) {
    // Return null if malformed
  }

  return null;
}

/**
 * Builds the AdminExpense.description with structured metadata
 */
export function encodeBillDescription(metadata: BillMetadata, userNotes?: string | null): string {
  const json = JSON.stringify(metadata);
  const cleanNotes = (userNotes || '').trim();
  return `${META_PREFIX}${json}${META_SUFFIX}${cleanNotes ? ` ${cleanNotes}` : ''}`;
}

/**
 * Checks if a date string/Date is overdue compared to now (ignoring time)
 */
export function checkIsOverdue(dueDateStr?: string | Date | null, status?: string): boolean {
  if (!dueDateStr || status === 'PAID' || status === 'CANCELLED') return false;
  try {
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return false;
    const now = new Date();
    // Compare dates at start of day
    const dueTime = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return dueTime < nowTime;
  } catch {
    return false;
  }
}

/**
 * Calculate days remaining until due date (negative if overdue)
 */
export function getDaysRemaining(dueDateStr?: string | Date | null): number | null {
  if (!dueDateStr) return null;
  try {
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return null;
    const now = new Date();
    const dueTime = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffMs = dueTime - nowTime;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}
