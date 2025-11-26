import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Truck
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
    getAllSuppliers,
    deleteSupplier
} from '@/services/inventoryService';
import { AddSupplierDialog } from '@/components/inventory/AddSupplierDialog';
import { EditSupplierDialog } from '@/components/inventory/EditSupplierDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/utils';
import type { Supplier } from '@/types';

export default function SuppliersPage() {
    const queryClient = useQueryClient();
    const { canAccessResource } = usePermissions();

    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const canCreate = canAccessResource('inventory:create');
    const canEdit = canAccessResource('inventory:edit');
    const canDelete = canAccessResource('inventory:delete');

    // Queries
    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: getAllSuppliers,
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: deleteSupplier,
        onSuccess: () => {
            toast.success('Supplier deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setDeleteDialogOpen(false);
            setSelectedSupplier(null);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    // Filtering
    const filteredSuppliers = useMemo(() => {
        if (!suppliers) return [];
        const lowerQuery = searchQuery.toLowerCase();
        return suppliers.filter((sup) =>
            sup.name.toLowerCase().includes(lowerQuery) ||
            (sup.contactPerson && sup.contactPerson.toLowerCase().includes(lowerQuery)) ||
            (sup.email && sup.email.toLowerCase().includes(lowerQuery))
        );
    }, [suppliers, searchQuery]);

    // Handlers
    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setEditDialogOpen(true);
    };

    const handleDelete = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedSupplier) {
            deleteMutation.mutate(selectedSupplier.id);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground">
                        Manage your product suppliers and contact information.
                    </p>
                </div>
                {canCreate && (
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Supplier
                    </Button>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search suppliers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Loading suppliers...
                                </TableCell>
                            </TableRow>
                        ) : filteredSuppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No suppliers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSuppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium flex items-center">
                                        <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {supplier.name}
                                    </TableCell>
                                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                                    <TableCell>{supplier.email || '-'}</TableCell>
                                    <TableCell>{supplier.phone || '-'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={supplier.address || ''}>
                                        {supplier.address || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                {canEdit && (
                                                    <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Supplier
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {canDelete && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(supplier)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Supplier
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddSupplierDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={() => { }}
            />

            <EditSupplierDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                supplierId={selectedSupplier?.id || null}
                onSuccess={() => setSelectedSupplier(null)}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Supplier</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedSupplier?.name}"?
                            Inventory items linked to this supplier will need to be updated.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
