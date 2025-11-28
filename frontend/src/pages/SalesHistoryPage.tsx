import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  MoreHorizontal,
  Eye,
  Printer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DatePicker } from '@/components/ui/date-picker';
import { getAllSales } from '@/services/salesService';
import { usePermissions } from '@/hooks/usePermissions';
import { type Sale, PaymentMethod } from '@/types';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { printReceipt } from '@/lib/printUtils';

export function SalesHistoryPage() {
  const { canAccessResource } = usePermissions();

  if (!canAccessResource('sale:view')) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to view sales history.</p>
        </div>
      </div>
    );
  }

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['sales', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: () => getAllSales(
      startDate?.toISOString(),
      endDate?.toISOString()
    ),
  });

  const filteredSales = useMemo(() => {
    if (!searchQuery) return sales;
    
    return sales.filter((sale) =>
      sale.customer?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sales, searchQuery]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchQuery('');
  };

  const handleViewDetails = (saleId: string) => {
    setSelectedSaleId(saleId);
    setDetailsDialogOpen(true);
  };

  const handlePrintReceipt = (sale: Sale) => {
    printReceipt(sale);
  };

  const getPaymentBadges = (payments: any[]) => {
    if (!payments || payments.length === 0) return <Badge variant="secondary">No payments</Badge>;
    
    return (
      <div className="flex gap-1 flex-wrap">
        {payments.map((payment, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {payment.method}
          </Badge>
        ))}
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mt-2">Failed to load sales data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sales History</h1>
        <p className="text-gray-600">View and manage all sales transactions</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                placeholderText="Select start date"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                placeholderText="Select end date"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Search Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sales ({filteredSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading sales...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500">No sales found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchQuery || startDate || endDate
                  ? 'Try adjusting your filters'
                  : 'No sales have been recorded yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Processed By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDetails(sale.id)}
                  >
                    <TableCell>
                      <div>
                        <div>{format(new Date(sale.createdAt), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(sale.createdAt), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sale.customer ? (
                        <div>
                          <div className="font-medium">
                            {sale.customer.firstName} {sale.customer.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{sale.customer.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No customer</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {sale.items?.length || 0} items
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(sale.subtotal)}</TableCell>
                    <TableCell className="text-red-600">
                      {sale.discountAmount > 0 ? `-${formatCurrency(sale.discountAmount)}` : '-'}
                    </TableCell>
                    <TableCell>{formatCurrency(sale.taxAmount)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>
                      {getPaymentBadges(sale.payments || [])}
                    </TableCell>
                    <TableCell>
                      {sale.processedBy ? (
                        <div className="text-sm">
                          {sale.processedBy.firstName} {sale.processedBy.lastName}
                        </div>
                      ) : (
                        <span className="text-gray-500">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(sale.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintReceipt(sale)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print Receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        saleId={selectedSaleId}
      />
    </div>
  );
}
