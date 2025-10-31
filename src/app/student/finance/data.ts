
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

const MOCK_STUDENT_ID = "studentAlexDemo"; // Matches student dashboard mock

export const mockInvoicesData: Invoice[] = [
  {
    id: "inv001",
    invoiceNumber: "INV-2024-001",
    studentId: MOCK_STUDENT_ID,
    dateIssued: new Date("2024-07-15").toISOString(),
    dueDate: new Date("2024-08-15").toISOString(),
    lineItems: [
      { id: "li01", description: "Term 1 Tuition Fees - Automotive Engineering Year 2", quantity: 1, unitPrice: 50000, total: 50000 },
      { id: "li02", description: "Library Fee", quantity: 1, unitPrice: 1000, total: 1000 },
      { id: "li03", description: "Student Activity Fee", quantity: 1, unitPrice: 500, total: 500 },
    ],
    subTotal: 51500,
    taxAmount: 0,
    totalAmount: 51500,
    amountPaid: 25000,
    status: "Partial",
  },
  {
    id: "inv002",
    invoiceNumber: "INV-2024-002",
    studentId: MOCK_STUDENT_ID,
    dateIssued: new Date("2024-03-10").toISOString(),
    dueDate: new Date("2024-04-10").toISOString(),
    lineItems: [
      { id: "li04", description: "Workshop Materials Fee", quantity: 1, unitPrice: 3000, total: 3000 },
      { id: "li05", description: "Safety Gear Rental", quantity: 1, unitPrice: 500, total: 500 },
    ],
    subTotal: 3500,
    taxAmount: 0,
    totalAmount: 3500,
    amountPaid: 3500,
    status: "Paid",
  },
];

export const mockPaymentsData: PaymentRecord[] = [
  {
    id: "pay001",
    studentId: MOCK_STUDENT_ID,
    invoiceId: "inv001",
    datePaid: new Date("2024-07-20").toISOString(),
    amount: 25000,
    paymentMethod: "Bank Transfer",
    reference: "BTREF789012",
    description: "Part payment for Term 1 Fees",
  },
  {
    id: "pay002",
    studentId: MOCK_STUDENT_ID,
    invoiceId: "inv002",
    datePaid: new Date("2024-03-15").toISOString(),
    amount: 3500,
    paymentMethod: "Mobile Money",
    reference: "MPESAXYZ123",
    description: "Payment for Workshop Materials & Safety Gear",
  },
  {
    id: "pay003",
    studentId: "otherStudent", // Example for another student
    datePaid: new Date("2024-07-25").toISOString(),
    amount: 10000,
    paymentMethod: "Card",
    description: "Miscellaneous Fee Payment",
  },
];

// Helper to get data for the current mock student
export const getStudentFinancials = (studentId: string = MOCK_STUDENT_ID) => {
  const invoices = mockInvoicesData.filter(inv => inv.studentId === studentId);
  const payments = mockPaymentsData.filter(pay => pay.studentId === studentId);
  
  const totalDue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
  // This is a simplified balance. A real system would consider which invoices are paid by which payments.
  const outstandingBalance = totalDue - totalPaid;

  return {
    invoices,
    payments,
    totalDue,
    totalPaid,
    outstandingBalance
  };
};
