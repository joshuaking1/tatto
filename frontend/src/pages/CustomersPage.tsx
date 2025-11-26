import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Input } from '@/components/ui/input';
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
import { AddCustomerDialog } from '@/components/customers/AddCustomerDialog';
import { EditCustomerDialog } from '@/components/customers/EditCustomerDialog';
import { getAllCustomers, deleteCustomer } from '@/services/customersService';
import { usePermissions } from '@/hooks/usePermissions';

export function CustomersPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const { data: customers = [], isLoading, isError } = useQuery({
        queryKey: ['customers'],
        queryFn: getAllCustomers,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCustomer,
        onSuccess: () => {
            toast.success('Customer deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setDeleteDialogOpen(false);
            setSelectedCustomerId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete customer');
        },
    });

    const filteredCustomers = customers.filter((customer) => {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        const email = customer.email.toLowerCase();
        const phone = customer.customerProfile?.phone?.toLowerCase() || '';

        return (
            fullName.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchLower)
        );
    });

    const handleEdit = (id: string) => {
        setSelectedCustomerId(id);
        setEditDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setSelectedCustomerId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedCustomerId) {
            deleteMutation.mutate(selectedCustomerId);
        }
    };

    if (isError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-destructive">Error loading customers</h2>
                    <p className="text-muted-foreground">Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">
                        Manage your customer base and view their history.
                    </p>
                </div>
                <PermissionGuard permission="customer:create">
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                </PermissionGuard>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Joined Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Loading customers...
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow
                                    key={customer.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <UserCircle className="h-5 w-5" />
                                            </div>
                                            {customer.firstName} {customer.lastName}
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell>{customer.customerProfile?.phone || '-'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {customer.customerProfile?.address || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <PermissionGuard permission="customer:edit">
                                                    <DropdownMenuItem onClick={() => handleEdit(customer.id)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                </PermissionGuard>
                                                <PermissionGuard permission="customer:delete">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(customer.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </PermissionGuard>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddCustomerDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
            />

            {selectedCustomerId && (
                <EditCustomerDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    customerId={selectedCustomerId}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
                />
            )}

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Customer</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this customer? This action cannot be undone.
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
        </div>
    );
}
