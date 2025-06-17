
'use server';

import { 
    mockStudentsData, 
    mockInvoicesData, 
    mockPaymentsData, 
    calculateStudentFinancials,
    type Student,
    type Invoice,
    type InvoiceLineItem,
    type PaymentRecord,
    type StudentFinancialSummary
} from './data';
import { format } from 'date-fns';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getStudentsFinancialSummaries(): Promise<StudentFinancialSummary[]> {
  await delay(500);
  return mockStudentsData.map(student => {
    const financials = calculateStudentFinancials(student.id);
    return {
      ...student,
      ...financials,
    };
  });
}

export async function getStudentFinancialDetails(studentId: string): Promise<StudentFinancialSummary | null> {
    await delay(300);
    const student = mockStudentsData.find(s => s.id === studentId);
    if (!student) return null;

    const financials = calculateStudentFinancials(studentId);
    return {
        ...student,
        ...financials,
    };
}

interface RecordPaymentInput {
  studentId: string;
  amount: number;
  paymentDate: string; // ISO string
  paymentMethod: "Bank Transfer" | "Card" | "Cash" | "Mobile Money";
  description?: string;
  reference?: string;
  applyToInvoiceId?: string; // Optional: if payment is for a specific invoice
}

export async function recordPayment(input: RecordPaymentInput): Promise<{ success: boolean; message: string }> {
  await delay(700);
  
  const studentExists = mockStudentsData.some(s => s.id === input.studentId);
  if (!studentExists) {
    return { success: false, message: "Student not found." };
  }
  if (input.amount <= 0) {
    return { success: false, message: "Payment amount must be positive." };
  }

  const newPayment: PaymentRecord = {
    id: `pay${Date.now()}`,
    studentId: input.studentId,
    invoiceId: input.applyToInvoiceId,
    datePaid: input.paymentDate,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    reference: input.reference,
    description: input.description || `Payment received on ${format(new Date(input.paymentDate), "PPP")}`,
  };
  mockPaymentsData.push(newPayment);

  // If applied to a specific invoice, update that invoice's amountPaid and status
  if (input.applyToInvoiceId) {
    const invoiceIndex = mockInvoicesData.findIndex(inv => inv.id === input.applyToInvoiceId && inv.studentId === input.studentId);
    if (invoiceIndex > -1) {
      mockInvoicesData[invoiceIndex].amountPaid += input.amount;
      if (mockInvoicesData[invoiceIndex].amountPaid >= mockInvoicesData[invoiceIndex].totalAmount) {
        mockInvoicesData[invoiceIndex].status = "Paid";
      } else if (mockInvoicesData[invoiceIndex].amountPaid > 0) {
        mockInvoicesData[invoiceIndex].status = "Partial";
      }
      // Potentially check for overpayment, though not handled in this mock
    }
  }
  
  return { success: true, message: `Payment of KES ${input.amount} recorded for student ID ${input.studentId}.` };
}

interface GenerateInvoiceInputItem {
    description: string;
    quantity: number;
    unitPrice: number;
}
interface GenerateInvoiceInput {
    studentId: string;
    items: GenerateInvoiceInputItem[];
    dueDate: string; // ISO String
    dateIssued?: string; // ISO String, defaults to now
}

export async function generateInvoice(input: GenerateInvoiceInput): Promise<{ success: boolean; message: string, invoiceId?: string }> {
    await delay(700);
    const studentExists = mockStudentsData.some(s => s.id === input.studentId);
    if (!studentExists) {
        return { success: false, message: "Student not found." };
    }
    if (input.items.length === 0) {
        return { success: false, message: "Invoice must have at least one line item."};
    }

    let subTotal = 0;
    const lineItems: InvoiceLineItem[] = input.items.map((item, index) => {
        const total = item.quantity * item.unitPrice;
        subTotal += total;
        return {
            id: `li${Date.now()}${index}`,
            ...item,
            total,
        };
    });
    
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${String(mockInvoicesData.length + 1).padStart(3, '0')}`;
    const newInvoice: Invoice = {
        id: `inv${Date.now()}`,
        invoiceNumber: newInvoiceNumber,
        studentId: input.studentId,
        dateIssued: input.dateIssued || new Date().toISOString(),
        dueDate: input.dueDate,
        lineItems,
        subTotal,
        taxAmount: 0, // Assuming no tax for mock
        totalAmount: subTotal,
        amountPaid: 0,
        status: "Unpaid",
    };

    mockInvoicesData.push(newInvoice);
    return { success: true, message: `Invoice ${newInvoiceNumber} generated for student ID ${input.studentId}.`, invoiceId: newInvoice.id };
}
