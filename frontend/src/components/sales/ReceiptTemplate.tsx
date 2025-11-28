import React from 'react';
import { type Sale } from '@/types';
import { format } from 'date-fns';
import { businessInfo } from '@/config/businessInfo';

interface ReceiptTemplateProps {
  sale: Sale;
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ sale }) => {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const saleDate = new Date(sale.createdAt);
  const receiptNumber = `R-${sale.id.slice(-8).toUpperCase()}`;

  return (
    <div className="hidden print:block print-content p-6 bg-white text-black font-mono text-sm">
      {/* Header Section */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">{businessInfo.name}</h1>
        <p className="text-sm">{businessInfo.address}</p>
        <p className="text-sm">{businessInfo.city}</p>
        <p className="text-sm">{businessInfo.phone}</p>
        <div className="border-t border-b border-black py-2 mt-4">
          <p className="text-xs">Receipt #{receiptNumber}</p>
          <p className="text-xs">{format(saleDate, 'MMM dd, yyyy HH:mm')}</p>
        </div>
      </div>

      {/* Customer Information */}
      {sale.customer && (
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Customer:</h3>
          <p className="text-sm">
            {sale.customer.firstName} {sale.customer.lastName}
          </p>
          <p className="text-sm">{sale.customer.email}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Items:</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">Item Name</th>
              <th className="text-left py-1">Type</th>
              <th className="text-right py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items && sale.items.length > 0 ? (
              sale.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-1">
                    {item.service?.name || item.inventoryItem?.name || 'Unknown Item'}
                  </td>
                  <td className="py-1">
                    {item.service ? 'Service' : item.inventoryItem ? 'Inventory' : 'Unknown'}
                  </td>
                  <td className="text-right py-1">{item.quantity}</td>
                  <td className="text-right py-1">
                    {currencyFormatter.format(item.priceAtTimeOfSale)}
                  </td>
                  <td className="text-right py-1">
                    {currencyFormatter.format(item.priceAtTimeOfSale * item.quantity)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-2 text-gray-500">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Calculations Section */}
      <div className="mb-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{currencyFormatter.format(sale.subtotal)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{currencyFormatter.format(sale.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{currencyFormatter.format(sale.taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-black pt-1">
            <span>Total:</span>
            <span>{currencyFormatter.format(sale.total)}</span>
          </div>
        </div>
      </div>

      {/* Payments Section */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Payments:</h3>
        <div className="space-y-1 text-sm">
          {sale.payments && sale.payments.length > 0 ? (
            sale.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between">
                <span>
                  {payment.method}
                  {payment.transactionId && ` (${payment.transactionId})`}
                </span>
                <span>{currencyFormatter.format(payment.amount)}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm">
              No payments recorded
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-black pt-1">
            <span>Total Paid:</span>
            <span>
              {currencyFormatter.format(
                sale.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="font-semibold mb-2">Thank you for your business!</p>
        {sale.processedBy && (
          <p className="text-xs">
            Processed by: {sale.processedBy.firstName} {sale.processedBy.lastName}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReceiptTemplate;
