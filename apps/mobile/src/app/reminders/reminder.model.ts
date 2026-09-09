export type ReminderSource = 'Quotation' | 'Invoice';
export type ReminderStatus = 'Upcoming' | 'Overdue' | 'Completed';

export interface FollowUpReminder {
  id: string;
  sourceType: ReminderSource;
  sourceId: string;
  documentNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  message: string;
  scheduledAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}
