import { toast } from 'sonner';
import { type Sale, type Payslip, type User, type Payroll, type Branch } from '@/types';
import { getSaleById } from '@/services/salesService';
import { getPayslipById } from '@/services/payrollService';
import { businessInfo } from '@/config/businessInfo';

/**
 * Print a receipt for the given sale
 * @param sale - The sale data to print
 */
export const printReceipt = (sale: Sale): void => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    // Format currency
    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    // Create the receipt HTML as plain string
    const saleDate = new Date(sale.createdAt);
    const receiptNumber = `R-${sale.id.slice(-8).toUpperCase()}`;

    // Write the HTML to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              color: black;
              background: white;
              margin: 20px;
            }
            .print-content {
              max-width: 800px;
              margin: 0 auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .border-b {
              border-bottom: 1px solid black;
            }
            .border-t {
              border-top: 1px solid black;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-bold {
              font-weight: bold;
            }
            .mb-2 {
              margin-bottom: 8px;
            }
            .mb-4 {
              margin-bottom: 16px;
            }
            .mb-6 {
              margin-bottom: 24px;
            }
            .mt-4 {
              margin-top: 16px;
            }
            .mt-8 {
              margin-top: 32px;
            }
            .py-1 {
              padding-top: 4px;
              padding-bottom: 4px;
            }
            .py-2 {
              padding-top: 8px;
              padding-bottom: 8px;
            }
            @media print {
              body { margin: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            <!-- Header Section -->
            <div class="text-center mb-6">
              <h1 class="font-bold mb-2" style="font-size: 24px;">${businessInfo.name}</h1>
              <p class="text-sm">${businessInfo.address}</p>
              <p class="text-sm">${businessInfo.city}</p>
              <p class="text-sm">${businessInfo.phone}</p>
              <div class="border-t border-b py-2 mt-4">
                <p class="text-xs">Receipt #${receiptNumber}</p>
                <p class="text-xs">${saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <!-- Customer Information -->
            ${sale.customer ? `
            <div class="mb-4">
              <h3 class="font-semibold mb-1">Customer:</h3>
              <p class="text-sm">
                ${sale.customer.firstName} ${sale.customer.lastName}
              </p>
              <p class="text-sm">${sale.customer.email}</p>
            </div>
            ` : ''}

            <!-- Items Table -->
            <div class="mb-4">
              <h3 class="font-semibold mb-2">Items:</h3>
              <table>
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-1">Item Name</th>
                    <th class="text-left py-1">Type</th>
                    <th class="text-right py-1">Qty</th>
                    <th class="text-right py-1">Price</th>
                    <th class="text-right py-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${sale.items && sale.items.length > 0 ? sale.items.map((item) => `
                    <tr class="border-b">
                      <td class="py-1">
                        ${item.service?.name || item.inventoryItem?.name || 'Unknown Item'}
                      </td>
                      <td class="py-1">
                        ${item.service ? 'Service' : item.inventoryItem ? 'Inventory' : 'Unknown'}
                      </td>
                      <td class="text-right py-1">${item.quantity}</td>
                      <td class="text-right py-1">
                        ${currencyFormatter.format(item.priceAtTimeOfSale)}
                      </td>
                      <td class="text-right py-1">
                        ${currencyFormatter.format(item.priceAtTimeOfSale * item.quantity)}
                      </td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="5" class="text-center py-2" style="color: #666;">
                        No items
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>

            <!-- Calculations Section -->
            <div class="mb-4">
              <div style="font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Subtotal:</span>
                  <span>${currencyFormatter.format(sale.subtotal)}</span>
                </div>
                ${sale.discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Discount:</span>
                  <span>-${currencyFormatter.format(sale.discountAmount)}</span>
                </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span>Tax:</span>
                  <span>${currencyFormatter.format(sale.taxAmount)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 1px solid black; padding-top: 4px;">
                  <span>Total:</span>
                  <span>${currencyFormatter.format(sale.total)}</span>
                </div>
              </div>
            </div>

            <!-- Payments Section -->
            <div class="mb-4">
              <h3 class="font-semibold mb-2">Payments:</h3>
              <div style="font-size: 12px;">
                ${sale.payments && sale.payments.length > 0 ? sale.payments.map((payment) => `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>
                      ${payment.method}
                      ${payment.transactionId ? ` (${payment.transactionId})` : ''}
                    </span>
                    <span>${currencyFormatter.format(payment.amount)}</span>
                  </div>
                `).join('') : `
                  <div style="color: #666; font-size: 12px;">
                    No payments recorded
                  </div>
                `}
                <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid black; padding-top: 4px;">
                  <span>Total Paid:</span>
                  <span>
                    ${currencyFormatter.format(
                      sale.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="mt-8 text-center">
              <p class="font-semibold mb-2">Thank you for your business!</p>
              ${sale.processedBy ? `
              <p class="text-xs">
                Processed by: ${sale.processedBy.firstName} ${sale.processedBy.lastName}
              </p>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for the content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

  } catch (error) {
    console.error('Error printing receipt:', error);
    toast.error('Failed to print receipt');
  }
};

/**
 * Print a receipt by fetching sale data by ID
 * @param saleId - The ID of the sale to print
 */
export const printReceiptById = async (saleId: string): Promise<void> => {
  // Show loading toast
  const loadingToast = toast.loading('Loading sale data...');

  try {
    // Fetch sale data
    const sale = await getSaleById(saleId);

    // Print the receipt
    printReceipt(sale);

    // Show success toast
    toast.success('Receipt ready for printing');

  } catch (error) {
    console.error('Error printing receipt by ID:', error);
    toast.error('Failed to load sale data for printing');
  } finally {
    // Always dismiss loading toast
    toast.dismiss(loadingToast);
  }
};

/**
 * Print a payslip for the given payslip data
 * @param payslip - The payslip data to print
 */
export const printPayslip = (payslip: Payslip & { 
  employee: User; 
  payroll: Payroll & { branch: Branch } 
}): void => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    // Format currency
    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: payslip.currency,
    });

    // Create the payslip HTML as plain string
    const payslipNumber = `PS-${payslip.id.slice(-8).toUpperCase()}`;
    const payPeriodStart = new Date(payslip.payroll.startDate);
    const payPeriodEnd = new Date(payslip.payroll.endDate);
    const generationDate = new Date(payslip.createdAt);

    // Write the HTML to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${payslip.employee.firstName} ${payslip.employee.lastName}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              color: black;
              background: white;
              margin: 20px;
            }
            .print-content {
              max-width: 800px;
              margin: 0 auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .border-b {
              border-bottom: 1px solid black;
            }
            .border-t {
              border-top: 1px solid black;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-bold {
              font-weight: bold;
            }
            .mb-2 {
              margin-bottom: 8px;
            }
            .mb-4 {
              margin-bottom: 16px;
            }
            .mb-6 {
              margin-bottom: 24px;
            }
            .mt-4 {
              margin-top: 16px;
            }
            .py-2 {
              padding-top: 8px;
              padding-bottom: 8px;
            }
            .py-3 {
              padding-top: 12px;
              padding-bottom: 12px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .bg-gray-100 {
              background-color: #f3f4f6;
            }
            .p-4 {
              padding: 16px;
            }
            .rounded {
              border-radius: 4px;
            }
            @media print {
              body { margin: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            <!-- Header Section -->
            <div class="text-center mb-6">
              <h1 class="font-bold mb-2" style="font-size: 24px;">${businessInfo.name}</h1>
              <p class="text-sm">${businessInfo.address}</p>
              <p class="text-sm">${businessInfo.city}</p>
              <p class="text-sm">${businessInfo.phone}</p>
              <div class="border-t border-b py-2 mt-4">
                <p class="font-bold text-xs">PAYSLIP</p>
                <p class="text-xs">Payslip #${payslipNumber}</p>
                <p class="text-xs">
                  Pay Period: ${payPeriodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${payPeriodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p class="text-xs">Generated: ${generationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <!-- Employee Information -->
            <div class="mb-6">
              <h3 class="font-semibold mb-2 border-b pb-1">Employee Information:</h3>
              <div class="grid">
                <div>
                  <p><span class="font-medium">Name:</span> ${payslip.employee.firstName} ${payslip.employee.lastName}</p>
                  <p><span class="font-medium">Email:</span> ${payslip.employee.email}</p>
                </div>
                <div>
                  <p><span class="font-medium">Branch:</span> ${payslip.payroll.branch.name}</p>
                  <p><span class="font-medium">Branch Address:</span> ${payslip.payroll.branch.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <!-- Pay Breakdown Table -->
            <div class="mb-6">
              <h3 class="font-semibold mb-2 border-b pb-1">Pay Breakdown:</h3>
              <table>
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2">Description</th>
                    <th class="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b">
                    <td class="py-2">Base Salary</td>
                    <td class="text-right py-2">${currencyFormatter.format(payslip.baseSalary)}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2">Commission</td>
                    <td class="text-right py-2">${currencyFormatter.format(payslip.totalCommission)}</td>
                  </tr>
                  ${payslip.bonuses > 0 ? `
                  <tr class="border-b">
                    <td class="py-2">Bonuses</td>
                    <td class="text-right py-2">${currencyFormatter.format(payslip.bonuses)}</td>
                  </tr>
                  ` : ''}
                  ${payslip.deductions > 0 ? `
                  <tr class="border-b">
                    <td class="py-2">Deductions</td>
                    <td class="text-right py-2" style="color: red;">-${currencyFormatter.format(payslip.deductions)}</td>
                  </tr>
                  ` : ''}
                  <tr class="border-t">
                    <td class="py-3 font-bold" style="font-size: 18px;">Net Pay</td>
                    <td class="text-right py-3 font-bold" style="font-size: 18px;">${currencyFormatter.format(payslip.netPay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Summary Section -->
            <div class="mb-6">
              <div class="bg-gray-100 p-4 rounded">
                <h3 class="font-semibold mb-2">Summary:</h3>
                <div class="grid">
                  <div>
                    <p><span class="font-medium">Gross Earnings:</span> ${currencyFormatter.format(payslip.baseSalary + payslip.totalCommission + payslip.bonuses)}</p>
                    <p><span class="font-medium">Total Deductions:</span> ${currencyFormatter.format(payslip.deductions)}</p>
                  </div>
                  <div>
                    <p><span class="font-medium">Net Pay:</span> ${currencyFormatter.format(payslip.netPay)}</p>
                    <p><span class="font-medium">Currency:</span> ${payslip.currency}</p>
                  </div>
                </div>
              </div>
            </div>

            ${payslip.notes ? `
            <!-- Notes Section -->
            <div class="mb-6">
              <h3 class="font-semibold mb-2 border-b pb-1">Notes:</h3>
              <p class="text-sm">${payslip.notes}</p>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="mt-8 text-center">
              <p class="font-semibold mb-2">This is a system-generated payslip</p>
              <p class="text-xs">For any questions regarding this payslip, please contact the payroll department</p>
              <div class="mt-4 border-t pt-2">
                <p class="text-xs" style="color: #666;">
                  Generated on ${generationDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for the content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

  } catch (error) {
    console.error('Error printing payslip:', error);
    toast.error('Failed to print payslip');
  }
};

/**
 * Print a payslip by fetching payslip data by ID
 * @param payslipId - The ID of the payslip to print
 */
export const printPayslipById = async (payslipId: string): Promise<void> => {
  // Show loading toast
  const loadingToast = toast.loading('Loading payslip data...');

  try {
    // Fetch payslip data
    const payslip = await getPayslipById(payslipId);

    // Print the payslip
    printPayslip(payslip);

    // Show success toast
    toast.success('Payslip ready for printing');

  } catch (error) {
    console.error('Error printing payslip by ID:', error);
    toast.error('Failed to load payslip data for printing');
  } finally {
    // Always dismiss loading toast
    toast.dismiss(loadingToast);
  }
};
