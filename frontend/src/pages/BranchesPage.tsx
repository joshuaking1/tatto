import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Building2, Edit, Trash2 } from 'lucide-react';
import { getAllBranches, deleteBranch } from '@/services/branchesService';
import { type Branch } from '@/types';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddBranchDialog } from '@/components/branches/AddBranchDialog';
import { EditBranchDialog } from '@/components/branches/EditBranchDialog';

export function BranchesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

    // Fetch branches list
    const { data: branchesList = [], isLoading, isError } = useQuery({
        queryKey: ['branches'],
        queryFn: getAllBranches,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteBranch,
        onSuccess: () => {
            toast.success('Branch deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            setDeleteDialogOpen(false);
            setSelectedBranchId(null);
        },
        onError: (error: any) => {
            // Derive user-friendly message from error or use generic fallback
            const message = error?.response?.data?.message || 'Failed to delete branch';
            toast.error(message);
        },
    });

    // Filter branches based on search query
    const filteredBranches = branchesList.filter((branch) =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (branch.address && branch.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (branch.phone && branch.phone.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDeleteBranch = () => {
        if (selectedBranchId) {
            deleteMutation.mutate(selectedBranchId);
        }
    };

    const openEditDialog = (branchId: string) => {
        setSelectedBranchId(branchId);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (branchId: string) => {
        setSelectedBranchId(branchId);
        setDeleteDialogOpen(true);
    };

    if (isError) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Error</h1>
                    <p className="text-gray-600 mt-2">Failed to load branches.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Branches</h1>
                    <p className="text-gray-600">Manage your organization's branches</p>
                </div>
                <PermissionGuard permission="branch:create">
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <Building2 className="h-4 w-4 mr-2" />
                        Create Branch
                    </Button>
                </PermissionGuard>
            </div>

            {/* Search and Filters */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search branches by name, address, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Branches Table */}
            <div className="bg-white rounded-lg shadow">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Loading branches...</p>
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center">
                        <p className="text-red-500">Error loading branches</p>
                    </div>
                ) : filteredBranches.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">
                            {searchQuery ? 'No branches found matching your search.' : 'No branches found.'}
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBranches.map((branch) => (
                                <TableRow key={branch.id}>
                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                    <TableCell>{branch.address || '-'}</TableCell>
                                    <TableCell>{branch.phone || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={branch.isDefault ? 'default' : 'outline'}>
                                            {branch.isDefault ? 'Default' : 'Regular'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <PermissionGuard permission="branch:edit">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditDialog(branch.id)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="branch:delete">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(branch.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Add Branch Dialog */}
            <AddBranchDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['branches'] });
                }}
            />

            {/* Edit Branch Dialog */}
            {selectedBranchId && (
                <EditBranchDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    branchId={selectedBranchId}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['branches'] });
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Branch</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this branch? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteBranch}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Branch'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
