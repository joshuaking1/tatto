import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Folder
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    getAllInventoryCategories,
    deleteInventoryCategory
} from '@/services/inventoryService';
import { AddInventoryCategoryDialog } from '@/components/inventory/AddInventoryCategoryDialog';
import { EditInventoryCategoryDialog } from '@/components/inventory/EditInventoryCategoryDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/utils';
import type { InventoryCategory } from '@/types';

export default function InventoryCategoriesPage() {
    const queryClient = useQueryClient();
    const { canAccessResource } = usePermissions();

    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | null>(null);

    const canCreate = canAccessResource('inventory:create');
    const canEdit = canAccessResource('inventory:edit');
    const canDelete = canAccessResource('inventory:delete');

    // Queries
    const { data: categories, isLoading } = useQuery({
        queryKey: ['inventoryCategories'],
        queryFn: getAllInventoryCategories,
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: deleteInventoryCategory,
        onSuccess: () => {
            toast.success('Category deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['inventoryCategories'] });
            setDeleteDialogOpen(false);
            setSelectedCategory(null);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    // Filtering
    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        return categories.filter((cat) =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    // Handlers
    const handleEdit = (category: InventoryCategory) => {
        setSelectedCategory(category);
        setEditDialogOpen(true);
    };

    const handleDelete = (category: InventoryCategory) => {
        setSelectedCategory(category);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedCategory) {
            deleteMutation.mutate(selectedCategory.id);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Categories</h1>
                    <p className="text-muted-foreground">
                        Organize your inventory items into categories.
                    </p>
                </div>
                {canCreate && (
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No categories found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category) => (
                        <Card key={category.id} className="hover:bg-accent/5 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center">
                                    <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                                    {category.name}
                                </CardTitle>
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
                                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Category
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        {canDelete && (
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(category)}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Category
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">
                                    {/* Placeholder for item count if available in future DTO */}
                                    Manages inventory organization
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <AddInventoryCategoryDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={() => { }}
            />

            <EditInventoryCategoryDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                categoryId={selectedCategory?.id || null}
                categoryName={selectedCategory?.name || null}
                onSuccess={() => setSelectedCategory(null)}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedCategory?.name}"?
                            Items in this category will need to be reassigned.
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
