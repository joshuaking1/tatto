import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AddExpenseCategoryDialog } from '@/components/expenses/AddExpenseCategoryDialog';
import {
  getAllExpenseCategories,
  deleteExpenseCategory,
  updateExpenseCategory,
} from '@/services/expensesService';
import { usePermissions } from '@/hooks/usePermissions';
import type { ExpenseCategory } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { toast } from 'sonner';

const editFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export const ExpenseCategoriesPage: React.FC = () => {
  const canViewCategories = usePermissions().canAccessResource('expense:view');
  const canCreateCategory = usePermissions().canAccessResource('expense:create');
  const canEditCategory = usePermissions().canAccessResource('expense:edit');
  const canDeleteCategory = usePermissions().canAccessResource('expense:delete');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  const queryClient = useQueryClient();

  // Edit form
  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Query categories
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: getAllExpenseCategories,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteExpenseCategory,
    onSuccess: () => {
      toast.success('Expense category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      updateExpenseCategory(id, data),
    onSuccess: () => {
      toast.success('Expense category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      setEditDialogOpen(false);
      setSelectedCategory(null);
      editForm.reset();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleEdit = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    editForm.reset({
      name: category.name,
      description: category.description || '',
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  const handleEditSubmit = (values: z.infer<typeof editFormSchema>) => {
    if (selectedCategory) {
      updateMutation.mutate({
        id: selectedCategory.id,
        data: {
          name: values.name,
          description: values.description || undefined,
        },
      });
    }
  };

  if (!canViewCategories) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have permission to view expense categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Categories</h1>
          <p className="text-muted-foreground">
            Manage expense categories for organizing your business expenses
          </p>
        </div>
        {canCreateCategory && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Error loading categories: {getErrorMessage(error)}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No categories</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first expense category.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditCategory && (
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteCategory && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(category)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense category? This action cannot be undone.
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense Category</DialogTitle>
            <DialogDescription>
              Update the expense category details.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter category name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Optional description"
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
                  onClick={() => setEditDialogOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <AddExpenseCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['expenseCategories'] })}
      />
    </div>
  );
};
