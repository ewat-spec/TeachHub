
'use server';

import {
    mockInvoicesData,
    mockPaymentsData,
    getStudentFinancials,
    type PaymentRecord
} from './data';
import { revalidatePath } from 'next/cache';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface RecordStudentPaymentInput {
  studentId: string;
  amount: number;
  paymentMethod: "Bank Transfer" | "Card" | "Cash" | "Mobile Money" | "Cardano (ADA)";
  description: string;
  reference?: string;
}

export async function getStudentFinancialsAction(studentId: string = "studentAlexDemo") {
  await delay(500);
  return getStudentFinancials(studentId);
}

export async function recordStudentPayment(input: RecordStudentPaymentInput): Promise<{ success: boolean; message: string }> {
  await delay(1000);

  if (input.amount <= 0) {
    return { success: false, message: "Payment amount must be positive." };
  }

  const newPayment: PaymentRecord = {
    id: `pay-stu-${Date.now()}`,
    studentId: input.studentId,
    datePaid: new Date().toISOString(),
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    reference: input.reference,
    description: input.description,
  };

  mockPaymentsData.push(newPayment);

  // In a real mock, we would also update the invoices' amountPaid
  // but for simplicity in this student portal mock, we'll just add the payment record.
  // The getStudentFinancials helper will pick it up if it's for the same studentId.

  revalidatePath('/student/finance');

  return {
    success: true,
    message: `Payment of KES ${input.amount.toLocaleString()} via ${input.paymentMethod} recorded successfully.`
  };
}
