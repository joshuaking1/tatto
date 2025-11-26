import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Pencil,
    Trash2,
    UserCircle,
    AlertCircle,
    DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EditCustomerDialog } from '@/components/customers/EditCustomerDialog';
import { getCustomerById, deleteCustomer } from '@/services/customersService';
import { usePermissions } from '@/hooks/usePermissions';
import { AppointmentStatus, PaymentMethod } from '@/types';

export function CustomerProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { canAccessResource } = usePermissions();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { data: customer, isLoading, isError } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => getCustomerById(id!),
        enabled: !!id,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCustomer,
        onSuccess: () => {
            toast.success('Customer deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            navigate('/customers');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete customer');
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading customer details...</p>
            </div>
        );
    }

    if (isError || !customer) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-lg font-semibold text-destructive">Customer not found</h2>
                <Button variant="outline" onClick={() => navigate('/customers')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Customers
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {customer.firstName} {customer.lastName}
                        </h1>
                        <Badge>Customer</Badge>
                    </div>
                    <p className="text-muted-foreground">
                        Member since {format(new Date(customer.createdAt), 'MMMM d, yyyy')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {canAccessResource('customer:edit') && (
                        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                    )}
                    {canAccessResource('customer:delete') && (
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.customerProfile?.phone || 'No phone number'}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <span>{customer.customerProfile?.address || 'No address provided'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Customer Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="font-medium block mb-1">Date of Birth</span>
                            <span className="text-muted-foreground">
                                {customer.customerProfile?.dateOfBirth
                                    ? format(new Date(customer.customerProfile.dateOfBirth), 'MMMM d, yyyy')
                                    : 'Not provided'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium block mb-1">Allergies</span>
                            <span className="text-muted-foreground">
                                {customer.customerProfile?.allergies || 'None listed'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium block mb-1">Notes</span>
                            <span className="text-muted-foreground">
                                {customer.customerProfile?.notes || 'No notes'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium block mb-1">Status</span>
                            <Badge variant={customer.customerProfile?.isSubscribed ? 'success' : 'secondary'}>
                                {customer.customerProfile?.isSubscribed ? 'Subscribed' : 'Not Subscribed'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Appointment History
                        </CardTitle>
                    </CardHeader>
                    {/* TODO: Appointment history will be wired once backend endpoints are enhanced to include relations */}
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Artist</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customer.customerAppointments && customer.customerAppointments.length > 0 ? (
                                    customer.customerAppointments
                                        .slice(0, 10)
                                        .map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell>
                                                    {format(new Date(appointment.startTime), 'MMM d, yyyy h:mm a')}
                                                </TableCell>
                                                <TableCell>{appointment.service?.name || 'Unknown Service'}</TableCell>
                                                <TableCell>
                                                    {appointment.artist
                                                        ? `${appointment.artist.firstName} ${appointment.artist.lastName}`
                                                        : 'Unknown Artist'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            appointment.status === AppointmentStatus.COMPLETED
                                                                ? 'success'
                                                                : appointment.status === AppointmentStatus.CANCELLED
                                                                    ? 'destructive'
                                                                    : 'default'
                                                        }
                                                    >
                                                        {appointment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ${appointment.price.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No appointments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Purchase History
                        </CardTitle>
                    </CardHeader>
                    {/* TODO: Purchase history will be wired once backend endpoints are enhanced to include relations */}
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customer.customerSales && customer.customerSales.length > 0 ? (
                                    customer.customerSales
                                        .slice(0, 10)
                                        .map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell>
                                                    {format(new Date(sale.createdAt), 'MMM d, yyyy h:mm a')}
                                                </TableCell>
                                                <TableCell>{sale.items?.length || 0} items</TableCell>
                                                <TableCell>
                                                    {sale.payments?.[0]?.method || 'Unknown'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ${sale.total.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No purchases found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {id && (
                <EditCustomerDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    customerId={id}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customer', id] })}
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
                            onClick={() => deleteMutation.mutate(id!)}
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
