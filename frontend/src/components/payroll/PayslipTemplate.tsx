import React from 'react';
import { type Payslip, type User, type Payroll, type Branch } from '@/types';
import { format } from 'date-fns';
import { businessInfo } from '@/config/businessInfo';

interface PayslipTemplateProps {
  payslip: Payslip & { 
    employee: User; 
    payroll: Payroll & { branch: Branch } 
  };
}

const PayslipTemplate: React.FC<PayslipTemplateProps> = ({ payslip }) => {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: payslip.currency,
  });

  const payslipNumber = `PS-${payslip.id.slice(-8).toUpperCase()}`;
  const payPeriodStart = new Date(payslip.payroll.startDate);
  const payPeriodEnd = new Date(payslip.payroll.endDate);
  const generationDate = new Date(payslip.createdAt);

  return (
    <div className="print-content p-6 bg-white text-black font-mono text-sm max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{businessInfo.name}</h1>
        <p className="text-sm">{businessInfo.address}</p>
        <p className="text-sm">{businessInfo.city}</p>
        <p className="text-sm">{businessInfo.phone}</p>
        <div className="border-t border-b border-black py-2 mt-4">
          <p className="text-xs font-bold">PAYSLIP</p>
          <p className="text-xs">Payslip #{payslipNumber}</p>
          <p className="text-xs">
            Pay Period: {format(payPeriodStart, 'MMM dd, yyyy')} - {format(payPeriodEnd, 'MMM dd, yyyy')}
          </p>
          <p className="text-xs">Generated: {format(generationDate, 'MMM dd, yyyy HH:mm')}</p>
        </div>
      </div>

      {/* Employee Information */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2 border-b border-black pb-1">Employee Information:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">Name:</span> {payslip.employee.firstName} {payslip.employee.lastName}</p>
            <p><span className="font-medium">Email:</span> {payslip.employee.email}</p>
          </div>
          <div>
            <p><span className="font-medium">Branch:</span> {payslip.payroll.branch.name}</p>
            <p><span className="font-medium">Branch Address:</span> {payslip.payroll.branch.address || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Pay Breakdown Table */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2 border-b border-black pb-1">Pay Breakdown:</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="py-2">Base Salary</td>
              <td className="text-right py-2">{currencyFormatter.format(payslip.baseSalary)}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="py-2">Commission</td>
              <td className="text-right py-2">{currencyFormatter.format(payslip.totalCommission)}</td>
            </tr>
            {payslip.bonuses > 0 && (
              <tr className="border-b border-gray-300">
                <td className="py-2">Bonuses</td>
                <td className="text-right py-2">{currencyFormatter.format(payslip.bonuses)}</td>
              </tr>
            )}
            {payslip.deductions > 0 && (
              <tr className="border-b border-gray-300">
                <td className="py-2">Deductions</td>
                <td className="text-right py-2 text-red-600">-{currencyFormatter.format(payslip.deductions)}</td>
              </tr>
            )}
            <tr className="border-t-2 border-black">
              <td className="py-3 font-bold text-lg">Net Pay</td>
              <td className="text-right py-3 font-bold text-lg">{currencyFormatter.format(payslip.netPay)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="mb-6">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Summary:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Gross Earnings:</span> {currencyFormatter.format(payslip.baseSalary + payslip.totalCommission + payslip.bonuses)}</p>
              <p><span className="font-medium">Total Deductions:</span> {currencyFormatter.format(payslip.deductions)}</p>
            </div>
            <div>
              <p><span className="font-medium">Net Pay:</span> {currencyFormatter.format(payslip.netPay)}</p>
              <p><span className="font-medium">Currency:</span> {payslip.currency}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {payslip.notes && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 border-b border-black pb-1">Notes:</h3>
          <p className="text-sm">{payslip.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="font-semibold mb-2">This is a system-generated payslip</p>
        <p className="text-xs">For any questions regarding this payslip, please contact the payroll department</p>
        <div className="mt-4 border-t border-black pt-2">
          <p className="text-xs text-gray-600">
            Generated on {format(generationDate, 'MMMM dd, yyyy at HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayslipTemplate;
