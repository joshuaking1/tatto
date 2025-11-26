import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    AlertTriangle,
    PackagePlus,
    Filter
} from 'lucide-react';
import { toast } from 'sonner';

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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import {
    getAllInventoryItems,
    getAllInventoryCategories,
    getAllSuppliers,
    deleteInventoryItem,
    getLowStockItems
} from '@/services/inventoryService';
import { AddInventoryItemDialog } from '@/components/inventory/AddInventoryItemDialog';
import { EditInventoryItemDialog } from '@/components/inventory/EditInventoryItemDialog';
import { AdjustStockDialog } from '@/components/inventory/AdjustStockDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/utils';
import type { InventoryItem } from '@/types';

export default function InventoryPage() {
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [supplierFilter, setSupplierFilter] = useState<string>('all');
    const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Queries
    const { data: items, isLoading: isLoadingItems } = useQuery({
        queryKey: ['inventoryItems'],
        queryFn: getAllInventoryItems,
    });

    const { data: lowStockItems } = useQuery({
        queryKey: ['lowStockItems'],
        queryFn: getLowStockItems,
    });

    const { data: categories } = useQuery({
        queryKey: ['inventoryCategories'],
        queryFn: getAllInventoryCategories,
    });

    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: getAllSuppliers,
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: deleteInventoryItem,
        onSuccess: () => {
            toast.success('Inventory item deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            setDeleteDialogOpen(false);
            setSelectedItem(null);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    // Filtering Logic
    const filteredItems = useMemo(() => {
        if (!items) return [];

        return items.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;

            const matchesSupplier = supplierFilter === 'all' ||
                (supplierFilter === 'none' ? !item.supplierId : item.supplierId === supplierFilter);

            const isLowStock = item.reorderLevel !== undefined && item.quantity <= item.reorderLevel;
            const matchesStockStatus = stockStatusFilter === 'all' ||
                (stockStatusFilter === 'low' && isLowStock) ||
                (stockStatusFilter === 'in_stock' && !isLowStock);

            return matchesSearch && matchesCategory && matchesSupplier && matchesStockStatus;
        });
    }, [items, searchQuery, categoryFilter, supplierFilter, stockStatusFilter]);

    // Handlers
    const handleEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        setEditDialogOpen(true);
    };

    const handleAdjustStock = (item: InventoryItem) => {
        setSelectedItem(item);
        setAdjustStockDialogOpen(true);
    };

    const handleDelete = (item: InventoryItem) => {
        setSelectedItem(item);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedItem) {
            deleteMutation.mutate(selectedItem.id);
        }
    };

    const formatCurrency = (amount?: number) => {
        if (amount === undefined) return '-';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
                    <p className="text-muted-foreground">
                        Manage your products, stock levels, and suppliers.
                    </p>
                </div>
                <PermissionGuard permission="inventory:create">
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </PermissionGuard>
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockItems && lowStockItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-center justify-between text-amber-800">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                        <span className="font-medium">
                            {lowStockItems.length} items are running low on stock.
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-800 hover:text-amber-900 hover:bg-amber-100"
                        onClick={() => setStockStatusFilter('low')}
                    >
                        View Low Stock Items
                    </Button>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Array.isArray(categories) && categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        <SelectItem value="none">No Supplier</SelectItem>
                        {suppliers?.map((sup) => (
                            <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Stock Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="low">Low Stock</SelectItem>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Items Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingItems ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Loading inventory...
                                </TableCell>
                            </TableRow>
                        ) : filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => {
                                const isLowStock = item.reorderLevel !== undefined && item.quantity <= item.reorderLevel;
                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                {isLowStock && (
                                                    <Badge variant="destructive" className="w-fit mt-1 text-[10px] px-1 py-0 h-4">
                                                        Low Stock
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.sku || '-'}</TableCell>
                                        <TableCell>
                                            {categories?.find(c => c.id === item.categoryId)?.name || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            {suppliers?.find(s => s.id === item.supplierId)?.name || '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            <span className={isLowStock ? "text-red-600" : ""}>
                                                {item.quantity}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(item.unitPrice)}
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
                                                    <PermissionGuard permission="inventory:edit">
                                                        <DropdownMenuItem onClick={() => handleAdjustStock(item)}>
                                                            <PackagePlus className="mr-2 h-4 w-4" />
                                                            Adjust Stock
                                                        </DropdownMenuItem>
                                                    </PermissionGuard>
                                                    <PermissionGuard permission="inventory:edit">
                                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Item
                                                        </DropdownMenuItem>
                                                    </PermissionGuard>
                                                    <DropdownMenuSeparator />
                                                    <PermissionGuard permission="inventory:delete">
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(item)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Item
                                                        </DropdownMenuItem>
                                                    </PermissionGuard>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialogs */}
            <AddInventoryItemDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={() => { }}
            />

            <EditInventoryItemDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                itemId={selectedItem?.id || null}
                onSuccess={() => setSelectedItem(null)}
            />

            <AdjustStockDialog
                open={adjustStockDialogOpen}
                onOpenChange={setAdjustStockDialogOpen}
                item={selectedItem}
                onSuccess={() => setSelectedItem(null)}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Inventory Item</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
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
