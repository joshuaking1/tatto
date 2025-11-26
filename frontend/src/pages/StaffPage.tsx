import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, UserPlus, Edit, Trash2 } from 'lucide-react';
import { getAllStaff, deleteStaff } from '@/services/staffService';
import { getAllBranches } from '@/services/branchesService';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InviteStaffDialog } from '@/components/staff/InviteStaffDialog';
import { EditStaffDialog } from '@/components/staff/EditStaffDialog';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function StaffPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [branchFilter, setBranchFilter] = useState<string>('all');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

    // Fetch staff list
    const { data: staffList = [], isLoading, isError } = useQuery({
        queryKey: ['staff'],
        queryFn: getAllStaff,
    });

    // Fetch branches
    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: getAllBranches,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteStaff,
        onSuccess: () => {
            toast.success('Staff member deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setDeleteDialogOpen(false);
            setSelectedStaffId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete staff member');
        },
    });

    // Filter staff based on search, role, and branch
    const filteredStaff = staffList.filter((staff) => {
        const matchesSearch =
            staff.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
        const matchesBranch = branchFilter === 'all' || staff.branchId === branchFilter;

        return matchesSearch && matchesRole && matchesBranch;
    });

    const handleDeleteClick = (staffId: string) => {
        setSelectedStaffId(staffId);
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (staffId: string) => {
        setSelectedStaffId(staffId);
        setEditDialogOpen(true);
    };

    const handleRowClick = (staffId: string) => {
        navigate(`/staff/${staffId}`);
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case UserRole.SUPER_ADMIN:
            case UserRole.ADMIN:
                return 'destructive';
            case UserRole.MANAGER:
                return 'default';
            case UserRole.ARTIST:
                return 'secondary';
            default:
                return 'outline';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading staff...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-destructive">Failed to load staff members</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Staff Management</h1>
                    <p className="text-muted-foreground">Manage your team members and their roles</p>
                </div>
                <PermissionGuard permission="staff:create">
                    <Button onClick={() => setInviteDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Staff
                    </Button>
                </PermissionGuard>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                        <SelectItem value={UserRole.ARTIST}>Artist</SelectItem>
                        <SelectItem value={UserRole.RECEPTIONIST}>Receptionist</SelectItem>
                        <SelectItem value={UserRole.CASHIER}>Cashier</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by branch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Staff Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStaff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                    No staff members found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStaff.map((staff) => (
                                <TableRow
                                    key={staff.id}
                                    className="cursor-pointer"
                                    onClick={() => handleRowClick(staff.id)}
                                >
                                    <TableCell className="font-medium">
                                        {staff.firstName} {staff.lastName}
                                    </TableCell>
                                    <TableCell>{staff.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(staff.role)}>
                                            {staff.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{staff.branch?.name || 'N/A'}</TableCell>
                                    <TableCell>{staff.staffProfile?.phone || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={staff.staffProfile?.isClockedIn ? 'success' : 'outline'}>
                                            {staff.staffProfile?.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <PermissionGuard permission="staff:edit">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditClick(staff.id)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="staff:delete">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(staff.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialogs */}
            <InviteStaffDialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['staff'] });
                }}
            />

            {selectedStaffId && (
                <EditStaffDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    staffId={selectedStaffId}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['staff'] });
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Staff Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this staff member? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedStaffId && deleteMutation.mutate(selectedStaffId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* TODO: Upcoming appointments feature deferred - will be implemented when appointment detail endpoints are enhanced to include staff-specific appointment lists */}
        </div>
    );
}
