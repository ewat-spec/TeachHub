
// To allow direct mutation of mock data in server actions for demo
// Removed: 'use server'; 

// Re-defining interfaces here for clarity and potential admin-specific extensions.
// In a real app, these would likely come from a shared types directory.

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  dateIssued: string; // ISO Date string
  dueDate: string; // ISO Date string
  lineItems: InvoiceLineItem[];
  subTotal: number;
  taxAmount: number; // Assuming 0 for mock
  totalAmount: number;
  amountPaid: number;
  status: "Paid" | "Partial" | "Unpaid" | "Overdue";
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  invoiceId?: string; // Optional link to a specific invoice
  datePaid: string; // ISO Date string
  amount: number;
  paymentMethod: "Bank Transfer" | "Card" | "Cash" | "Mobile Money";
  reference?: string;
  description: string;
}

export interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  course?: string; // Added course for better identification
}

export interface StudentFinancialSummary extends Student {
  invoices: Invoice[];
  payments: PaymentRecord[];
  outstandingBalance: number;
  totalBilled: number;
  totalPaid: number;
}

// Mock data - can be shared or adapted from other data files for consistency in a prototype
export const mockStudentsData: Student[] = [
  { id: "studentAlexDemo", name: "Alex DemoStudent", admissionNumber: "SCT221-0077/2024", course: "Automotive Engineering" },
  { id: "stud001", name: "Alice Wonderland", admissionNumber: "SCT/001/24", course: "React Fundamentals" },
  { id: "stud002", name: "Bob The Builder", admissionNumber: "SCT/002/24", course: "Safety Procedures" },
  { id: "stud003", name: "Charlie Chaplin", admissionNumber: "SCT/003/24", course: "React Fundamentals" },
];

export let mockInvoicesData: Invoice[] = [
  {
    id: "inv001", invoiceNumber: "INV-2024-001", studentId: "studentAlexDemo",
    dateIssued: new Date("2024-07-15").toISOString(), dueDate: new Date("2024-08-15").toISOString(),
    lineItems: [
      { id: "li01", description: "Term 1 Tuition Fees - Automotive Engineering", quantity: 1, unitPrice: 50000, total: 50000 },
      { id: "li02", description: "Library Fee", quantity: 1, unitPrice: 1000, total: 1000 },
    ],
    subTotal: 51000, taxAmount: 0, totalAmount: 51000, amountPaid: 25000, status: "Partial",
  },
  {
    id: "inv002", invoiceNumber: "INV-2024-002", studentId: "studentAlexDemo",
    dateIssued: new Date("2024-03-10").toISOString(), dueDate: new Date("2024-04-10").toISOString(),
    lineItems: [{ id: "li04", description: "Workshop Materials", quantity: 1, unitPrice: 3500, total: 3500 }],
    subTotal: 3500, taxAmount: 0, totalAmount: 3500, amountPaid: 3500, status: "Paid",
  },
  {
    id: "inv003", invoiceNumber: "INV-2024-003", studentId: "stud001",
    dateIssued: new Date("2024-08-01").toISOString(), dueDate: new Date("2024-09-01").toISOString(),
    lineItems: [{ id: "li05", description: "Course Fees - React Fundamentals", quantity: 1, unitPrice: 20000, total: 20000 }],
    subTotal: 20000, taxAmount: 0, totalAmount: 20000, amountPaid: 0, status: "Unpaid",
  },
];

export let mockPaymentsData: PaymentRecord[] = [
  {
    id: "pay001", studentId: "studentAlexDemo", invoiceId: "inv001",
    datePaid: new Date("2024-07-20").toISOString(), amount: 25000,
    paymentMethod: "Bank Transfer", reference: "BTREF789012", description: "Part payment for Term 1 Fees",
  },
  {
    id: "pay002", studentId: "studentAlexDemo", invoiceId: "inv002",
    datePaid: new Date("2024-03-15").toISOString(), amount: 3500,
    paymentMethod: "Mobile Money", reference: "MPESAXYZ123", description: "Payment for Workshop Materials",
  },
];

// Helper to calculate financials for a student
export const calculateStudentFinancials = (studentId: string): { invoices: Invoice[], payments: PaymentRecord[], outstandingBalance: number, totalBilled: number, totalPaid: number } => {
  const studentInvoices = mockInvoicesData.filter(inv => inv.studentId === studentId);
  const studentPayments = mockPaymentsData.filter(pay => pay.studentId === studentId);
  
  const totalBilled = studentInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaidThisStudent = studentPayments.reduce((sum, pay) => sum + pay.amount, 0);
  
  // More accurate outstanding balance based on invoices for this student
  const outstandingBalance = studentInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.amountPaid), 0);

  return {
    invoices: studentInvoices,
    payments: studentPayments,
    outstandingBalance,
    totalBilled,
    totalPaid: totalPaidThisStudent,
  };
};
