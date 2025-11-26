import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Edit, Trash2, TrendingUp } from 'lucide-react';
import { getAllCommissionRules, deleteCommissionRule } from '@/services/commissionRulesService';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddCommissionRuleDialog } from '@/components/commission-rules/AddCommissionRuleDialog';
import { EditCommissionRuleDialog } from '@/components/commission-rules/EditCommissionRuleDialog';

export function CommissionRulesPage() {
    const queryClient = useQueryClient();
    const { hasRole } = usePermissions();

    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

    // Fetch commission rules list
    const { data: rulesList = [], isLoading, isError } = useQuery({
        queryKey: ['commission-rules'],
        queryFn: getAllCommissionRules,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteCommissionRule,
        onSuccess: () => {
            toast.success('Commission rule deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
            setDeleteDialogOpen(false);
            setSelectedRuleId(null);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to delete commission rule';
            toast.error(message);
        },
    });

    // Filter rules based on search query
    const filteredRules = useMemo(() => {
        if (!searchQuery) return rulesList;
        return rulesList.filter((rule) =>
            rule.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [rulesList, searchQuery]);

    // Format tiers for display
    const formatTiers = (tiers: any[]) => {
        if (!tiers || tiers.length === 0) return 'No tiers';
        
        // Validate and filter out malformed tier data
        const validTiers = tiers.filter(tier => 
            tier && 
            typeof tier.threshold === 'number' && 
            typeof tier.rate === 'number' &&
            !isNaN(tier.threshold) && 
            !isNaN(tier.rate)
        );
        
        if (validTiers.length === 0) return 'No valid tiers';
        
        const sortedTiers = [...validTiers].sort((a, b) => a.threshold - b.threshold);
        
        if (sortedTiers.length === 1) {
            const tier = sortedTiers[0];
            return `1 tier: ${tier.threshold === 0 ? 'All sales' : `$${tier.threshold}+`} (${(tier.rate * 100).toFixed(1)}%)`;
        }
        
        let formatted = `${sortedTiers.length} tiers: `;
        const tierDescriptions = sortedTiers.map((tier, index) => {
            if (index === 0) {
                const nextThreshold = sortedTiers[index + 1]?.threshold;
                return `$0-${nextThreshold ? `$${nextThreshold}` : '∞'} (${(tier.rate * 100).toFixed(1)}%)`;
            } else if (index === sortedTiers.length - 1) {
                return `$${tier.threshold}+ (${(tier.rate * 100).toFixed(1)}%)`;
            } else {
                const nextThreshold = sortedTiers[index + 1]?.threshold;
                return `$${tier.threshold}-${nextThreshold ? `$${nextThreshold}` : '∞'} (${(tier.rate * 100).toFixed(1)}%)`;
            }
        });
        
        return formatted + tierDescriptions.join(', ');
    };

    const handleDeleteRule = () => {
        if (selectedRuleId) {
            deleteMutation.mutate(selectedRuleId);
        }
    };

    const openEditDialog = (ruleId: string) => {
        setSelectedRuleId(ruleId);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (ruleId: string) => {
        setSelectedRuleId(ruleId);
        setDeleteDialogOpen(true);
    };

    return (
        <PermissionGuard 
            roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}
            fallback={
                <div className="container mx-auto py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                        <p className="text-gray-600 mt-2">You don't have permission to manage commission rules.</p>
                    </div>
                </div>
            }
        >
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Commission Rules</h1>
                    <p className="text-gray-600">Manage commission structures and tier rates</p>
                </div>
                <PermissionGuard roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Add Commission Rule
                    </Button>
                </PermissionGuard>
            </div>

            {/* Search and Filters */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search commission rules by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Commission Rules Table */}
            <div className="bg-white rounded-lg shadow">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Loading commission rules...</p>
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center">
                        <p className="text-red-500">Error loading commission rules</p>
                    </div>
                ) : filteredRules.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">
                            {searchQuery ? 'No commission rules found matching your search.' : 'No commission rules found.'}
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Tiers</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell>
                                        <div className="max-w-md">
                                            <p className="text-sm text-gray-600">{formatTiers(rule.tiers)}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <PermissionGuard roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditDialog(rule.id)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(rule.id)}
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

            {/* Add Commission Rule Dialog */}
            <AddCommissionRuleDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
                }}
            />

            {/* Edit Commission Rule Dialog */}
            {selectedRuleId && (
                <EditCommissionRuleDialog
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (!open) setSelectedRuleId(null);
                    }}
                    ruleId={selectedRuleId}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
                        setEditDialogOpen(false);
                        setSelectedRuleId(null);
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) setSelectedRuleId(null);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Commission Rule</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this commission rule? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setDeleteDialogOpen(false);
                            setSelectedRuleId(null);
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteRule}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Rule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </PermissionGuard>
    );
}
