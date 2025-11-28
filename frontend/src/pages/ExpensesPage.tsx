import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Receipt,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { BranchSelector } from '@/components/ui/branch-selector';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { EditExpenseDialog } from '@/components/expenses/EditExpenseDialog';
import { getAllExpenses, deleteExpense, getAllExpenseCategories } from '@/services/expensesService';
import { usePermissions } from '@/hooks/usePermissions';
import type { Expense } from '@/types';
import { PaymentMethod } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

export const ExpensesPage: React.FC = () => {
  const canViewExpenses = usePermissions().canAccessResource('expense:view');
  const canCreateExpense = usePermissions().canAccessResource('expense:create');
  const canEditExpense = usePermissions().canAccessResource('expense:edit');
  const canDeleteExpense = usePermissions().canAccessResource('expense:delete');

  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string | undefined>(undefined);
  const [vendorSearch, setVendorSearch] = useState<string>('');
  
  // Pagination states
  const [page, setPage] = useState(1);
  const pageSize = 20; // Fixed page size

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

// Query expenses
  const {
    data: expensesData = { data: [], total: 0, page: 1, limit: 20 },
    isLoading,
    error,
  } = useQuery({
    queryKey: ['expenses', startDate, endDate, categoryFilter, branchFilter, vendorSearch, page, pageSize],
    queryFn: () =>
      getAllExpenses({
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0],
        categoryId: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
        branchId: branchFilter && branchFilter !== 'all' ? branchFilter : undefined,
        vendor: vendorSearch || undefined,
        page,
        limit: pageSize,
      }),
  });

  // Query expense categories for filter dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: getAllExpenseCategories,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success('Expense deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Remove client-side vendor filtering - handled server-side
  const expenses = expensesData.data;

  const handleBranchFilterChange = (value: string | undefined) => {
    setBranchFilter(value);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCategoryFilter('');
    setBranchFilter(undefined);
    setVendorSearch('');
    setPage(1);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditDialogOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedExpense) {
      deleteMutation.mutate(selectedExpense.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    const variants: Record<PaymentMethod, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      CASH: 'default',
      CARD: 'secondary',
      MOBILE_MONEY: 'outline',
      BANK_TRANSFER: 'destructive',
    };
    return <Badge variant={variants[method]}>{method.replace('_', ' ')}</Badge>;
  };

  if (!canViewExpenses) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have permission to view expenses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">
            Track and manage your business expenses
          </p>
        </div>
        {canCreateExpense && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter expenses by date, category, branch, and vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <DatePicker
              placeholder="Start Date"
              value={startDate}
              onChange={setStartDate}
            />
            <DatePicker
              placeholder="End Date"
              value={endDate}
              onChange={setEndDate}
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <BranchSelector
              value={branchFilter}
              onValueChange={handleBranchFilterChange}
              includeAllOption={true}
            />
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendor..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Error loading expenses: {getErrorMessage(error)}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No expenses</h3>
              <p className="mt-1 text-sm text-gray-500">
                {vendorSearch || categoryFilter || branchFilter || startDate || endDate
                  ? 'No expenses match your current filters.'
                  : 'Get started by adding your first expense.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category?.name || '-'}</TableCell>
                    <TableCell>{expense.vendor || '-'}</TableCell>
                    <TableCell>{expense.branch?.name || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>{getPaymentMethodBadge(expense.paymentMethod)}</TableCell>
                    <TableCell>
                      {expense.recordedBy
                        ? `${expense.recordedBy.firstName} ${expense.recordedBy.lastName}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditExpense && (
                            <DropdownMenuItem onClick={() => handleEdit(expense)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteExpense && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(expense)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
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

      {/* Pagination Controls */}
      {expensesData.total > pageSize && (
        <div className="flex items-center justify-between px-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(expensesData.total / pageSize)} ({expensesData.total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(expensesData.total / pageSize)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialogs */}
      <AddExpenseDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => setPage(1)} // Reset to first page when adding
      />
      <EditExpenseDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedExpense(null);
        }}
        expenseId={selectedExpense?.id || null}
        onSuccess={() => {}} // No-op since dialog handles invalidation
      />
    </div>
  );
};
