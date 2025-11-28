import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign } from 'lucide-react';
import { updateExpense, getExpenseById, getAllExpenseCategories, type UpdateExpenseDto } from '@/services/expensesService';
import { BranchSelector } from '@/components/ui/branch-selector';
import { DatePicker } from '@/components/ui/date-picker';
import { PaymentMethod } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

const formSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be at least 0.01'),
  date: z.date().refine((date) => date !== null, {
    message: 'Date is required',
  }),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().min(1, 'Category is required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'] as const),
  branchId: z.string().optional(),
  vendor: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string | null;
  onSuccess: () => void;
}

export const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
  open,
  onOpenChange,
  expenseId,
  onSuccess,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      date: new Date(),
      description: '',
      categoryId: '',
      paymentMethod: 'CASH' as PaymentMethod,
      branchId: '',
      vendor: '',
      receiptUrl: '',
      notes: '',
    },
  });

  const queryClient = useQueryClient();

  // Query expense details
  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => expenseId ? getExpenseById(expenseId) : Promise.reject('No expense ID'),
    enabled: open && !!expenseId,
  });

  // Query expense categories
  const { data: categories = [] } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: getAllExpenseCategories,
    enabled: open,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseDto }) => 
      updateExpense(id, data),
    onSuccess: () => {
      toast.success('Expense updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if (expenseId) {
        queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      }
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Populate form when expense data loads
  useEffect(() => {
    if (expense) {
      form.reset({
        amount: expense.amount,
        date: new Date(expense.date),
        description: expense.description,
        categoryId: expense.categoryId,
        paymentMethod: expense.paymentMethod,
        branchId: expense.branchId || '',
        vendor: expense.vendor || '',
        receiptUrl: expense.receiptUrl || '',
        notes: expense.notes || '',
      });
    }
  }, [expense, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!expenseId) return;

    const payload: UpdateExpenseDto = {
      ...values,
      date: values.date.toISOString(),
      branchId: values.branchId === 'none' ? undefined : values.branchId,
      receiptUrl: values.receiptUrl || undefined,
      paymentMethod: values.paymentMethod as PaymentMethod,
    };
    updateMutation.mutate({ id: expenseId, data: payload });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the expense record details.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter expense description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CARD">Card</SelectItem>
                          <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch (Optional)</FormLabel>
                      <FormControl>
                        <BranchSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          includeAllOption={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter vendor name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiptUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt URL (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/receipt" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any additional notes..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || isLoading}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
