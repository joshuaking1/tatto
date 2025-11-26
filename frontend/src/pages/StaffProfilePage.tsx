import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, Instagram, DollarSign, Calendar, Clock } from 'lucide-react';
import { getStaffById, deleteStaff } from '@/services/staffService';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditStaffDialog } from '@/components/staff/EditStaffDialog';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StaffProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { canAccessResource } = usePermissions();

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Fetch staff details
    const { data: staff, isLoading, isError } = useQuery({
        queryKey: ['staff', id],
        queryFn: () => getStaffById(id!),
        enabled: !!id,
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteStaff,
        onSuccess: () => {
            toast.success('Staff member deleted successfully');
            navigate('/staff');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete staff member');
        },
    });

    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
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
                <p className="text-muted-foreground">Loading staff profile...</p>
            </div>
        );
    }

    if (isError || !staff) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center space-y-4">
                    <p className="text-destructive">Failed to load staff profile</p>
                    <Button onClick={() => navigate('/staff')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Staff List
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => navigate('/staff')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {staff.firstName} {staff.lastName}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getRoleBadgeVariant(staff.role)}>{staff.role}</Badge>
                            {staff.staffProfile?.isClockedIn && (
                                <Badge variant="success">Clocked In</Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {canAccessResource('staff:edit') && (
                        <Button onClick={() => setEditDialogOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                    {canAccessResource('staff:delete') && (
                        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{staff.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{staff.staffProfile?.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Branch</p>
                            <p className="font-medium">{staff.branch?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={staff.staffProfile?.isClockedIn ? 'success' : 'outline'}>
                                {staff.staffProfile?.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Staff Profile */}
                <Card>
                    <CardHeader>
                        <CardTitle>Staff Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {staff.staffProfile?.bio && (
                            <div>
                                <p className="text-sm text-muted-foreground">Bio</p>
                                <p className="font-medium">{staff.staffProfile.bio}</p>
                            </div>
                        )}
                        {staff.staffProfile?.instagramHandle && (
                            <div>
                                <p className="text-sm text-muted-foreground">Instagram</p>
                                <a
                                    href={`https://instagram.com/${staff.staffProfile.instagramHandle.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    <Instagram className="h-4 w-4" />
                                    {staff.staffProfile.instagramHandle}
                                </a>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-muted-foreground">Commission Rate</p>
                            <p className="font-medium flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {((staff.staffProfile?.commissionRate || 0) * 100).toFixed(0)}%
                            </p>
                        </div>
                        {staff.staffProfile?.baseSalary && (
                            <div>
                                <p className="text-sm text-muted-foreground">Base Salary</p>
                                <p className="font-medium">
                                    ${staff.staffProfile.baseSalary.toFixed(2)} / {staff.staffProfile.salaryType}
                                </p>
                            </div>
                        )}
                        {staff.staffProfile?.commissionRule && (
                            <div>
                                <p className="text-sm text-muted-foreground">Commission Rule</p>
                                <p className="font-medium">{staff.staffProfile.commissionRule.name}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Services */}
            <Card>
                <CardHeader>
                    <CardTitle>Services</CardTitle>
                    <CardDescription>Services this staff member can perform</CardDescription>
                </CardHeader>
                <CardContent>
                    {staff.services && staff.services.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staff.services.map((artistService) => (
                                    <TableRow key={artistService.serviceId}>
                                        <TableCell className="font-medium">{artistService.service.name}</TableCell>
                                        <TableCell>{artistService.service.category?.name || 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {artistService.service.duration} min
                                            </div>
                                        </TableCell>
                                        <TableCell>${(artistService.service.basePrice / 100).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No services assigned</p>
                    )}
                </CardContent>
            </Card>

            {/* Availability */}
            <Card>
                <CardHeader>
                    <CardTitle>Availability</CardTitle>
                    <CardDescription>Weekly schedule</CardDescription>
                </CardHeader>
                <CardContent>
                    {staff.artistAvailabilities && staff.artistAvailabilities.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {staff.artistAvailabilities.map((availability) => (
                                    <TableRow key={availability.id}>
                                        <TableCell className="font-medium flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {DAYS_OF_WEEK[availability.dayOfWeek - 1]}
                                        </TableCell>
                                        <TableCell>{formatTime(availability.startTime)}</TableCell>
                                        <TableCell>{formatTime(availability.endTime)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No availability set</p>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            {id && (
                <EditStaffDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    staffId={id}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['staff', id] });
                    }}
                />
            )}

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Staff Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {staff.firstName} {staff.lastName}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => id && deleteMutation.mutate(id)}
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
