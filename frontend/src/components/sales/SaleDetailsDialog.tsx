import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  User,
  Calendar,
  FileText,
  X,
  Printer,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getSaleById } from '@/services/salesService';
import { PaymentMethod, type Sale } from '@/types';
import { printReceipt } from '@/lib/printUtils';

interface SaleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
}

export function SaleDetailsDialog({ open, onOpenChange, saleId }: SaleDetailsDialogProps) {
  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => getSaleById(saleId),
    enabled: open && !!saleId,
  });

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CARD:
        return <CreditCard className="h-4 w-4" />;
      case PaymentMethod.CASH:
        return <Banknote className="h-4 w-4" />;
      case PaymentMethod.MOBILE_MONEY:
        return <Smartphone className="h-4 w-4" />;
      case PaymentMethod.BANK_TRANSFER:
        return <Building className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePrintReceipt = () => {
    if (sale) {
      printReceipt(sale);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Sale Details</span>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading sale details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load sale details</p>
          </div>
        ) : sale ? (
          <div className="space-y-6">
            {/* Sale Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sale Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sale ID</label>
                    <p className="font-mono text-sm">{sale.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date/Time</label>
                    <p>{format(new Date(sale.createdAt), 'PPP p')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p>
                      {sale.customer ? (
                        <Link to={`/customers/${sale.customer.id}`} className="text-blue-600 hover:underline">
                          {sale.customer.firstName} {sale.customer.lastName}
                        </Link>
                      ) : (
                        'No customer'
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Processed By</label>
                    <p>
                      {sale.processedBy
                        ? `${sale.processedBy.firstName} ${sale.processedBy.lastName}`
                        : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Appointment</label>
                    <p>
                      {sale.appointmentId ? (
                        <Link to={`/calendar`} className="text-blue-600 hover:underline">
                          <Badge variant="outline" className="cursor-pointer">
                            Linked to Appointment
                          </Badge>
                        </Link>
                      ) : (
                        'No appointment'
                      )}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm">{sale.notes || 'No notes'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Artist</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.service?.name || item.inventoryItem?.name || 'Unknown Item'}
                            </div>
                            {item.inventoryItem?.sku && (
                              <div className="text-sm text-gray-500">SKU: {item.inventoryItem.sku}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.service ? 'default' : 'secondary'}>
                            {item.service ? 'Service' : 'Inventory'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.priceAtTimeOfSale)}</TableCell>
                        <TableCell>
                          {formatCurrency(item.priceAtTimeOfSale * item.quantity)}
                        </TableCell>
                        <TableCell>
                          {item.artist ? (
                            <div className="text-sm">
                              {item.artist.firstName} {item.artist.lastName}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!sale.items || sale.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          No items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  {(sale.items && sale.items.length > 0) && (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} className="font-medium">
                          Subtotal
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(
                            sale.items.reduce(
                              (sum, item) => sum + item.priceAtTimeOfSale * item.quantity,
                              0
                            )
                          )}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  )}
                </Table>
              </CardContent>
            </Card>

            {/* Calculations */}
            <Card>
              <CardHeader>
                <CardTitle>Calculations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(sale.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>
                      {formatCurrency(sale.taxAmount)}
                      {sale.subtotal > 0 && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({((sale.taxAmount / (sale.subtotal - sale.discountAmount)) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(sale.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sale.payments?.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getPaymentIcon(payment.method)}
                        <div>
                          <div className="font-medium">{payment.method}</div>
                          {payment.transactionId && (
                            <div className="text-sm text-gray-500">
                              Transaction ID: {payment.transactionId}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!sale.payments || sale.payments.length === 0) && (
                    <div className="text-center text-gray-500 py-4">
                      No payments recorded
                    </div>
                  )}
                  {(sale.payments && sale.payments.length > 0) && (
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-medium">
                        <span>Total Paid:</span>
                        <span>
                          {formatCurrency(
                            sale.payments.reduce((sum, payment) => sum + payment.amount, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handlePrintReceipt}>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
