
import { getStudentFinancials, mockPaymentsData, PaymentRecord } from './data';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('getStudentFinancials', () => {
  it('should correctly calculate the outstanding balance', () => {
    const studentId = 'studentAlexDemo';
    const initialFinancials = getStudentFinancials(studentId);
    const initialBalance = initialFinancials.outstandingBalance;

    const newPayment: PaymentRecord = {
      id: 'pay004',
      studentId: studentId,
      datePaid: new Date().toISOString(),
      amount: 5000,
      paymentMethod: 'Mobile Money',
      description: 'Additional fee payment',
    };
    mockPaymentsData.push(newPayment);

    const updatedFinancials = getStudentFinancials(studentId);
    const expectedBalance = initialBalance - newPayment.amount;

    expect(updatedFinancials.outstandingBalance).toBe(expectedBalance);

    // Clean up the mock data
    mockPaymentsData.pop();
  });
});
