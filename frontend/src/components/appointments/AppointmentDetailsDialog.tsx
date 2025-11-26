import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Edit, User, Scissors, Calendar, Clock, FileText } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
    getAppointmentById,
    updateAppointment,
    type UpdateAppointmentDto,
} from '@/services/appointmentsService';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/utils';
import { AppointmentStatus } from '@/types';

const updateAppointmentSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
    date: z.date().optional(),
    time: z.string().optional(),
    notes: z.string().optional(),
});

type UpdateAppointmentFormValues = z.infer<typeof updateAppointmentSchema>;

interface AppointmentDetailsDialogProps {
    appointmentId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AppointmentDetailsDialog({
    appointmentId,
    open,
    onOpenChange,
    onSuccess,
}: AppointmentDetailsDialogProps) {
    const [editMode, setEditMode] = useState(false);
    const { canAccessResource } = usePermissions();
    const canEdit = canAccessResource('appointment:edit');

    const { data: appointment, isLoading } = useQuery({
        queryKey: ['appointment', appointmentId],
        queryFn: () => getAppointmentById(appointmentId!),
        enabled: !!appointmentId && open,
    });

    const form = useForm<UpdateAppointmentFormValues>({
        resolver: zodResolver(updateAppointmentSchema),
    });

    React.useEffect(() => {
        if (appointment) {
            const startDate = new Date(appointment.startTime);
            form.reset({
                status: appointment.status,
                date: startDate,
                time: format(startDate, 'HH:mm'),
                notes: appointment.notes || '',
            });
        }
    }, [appointment, form]);

    const mutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentDto }) =>
            updateAppointment(id, data),
        onSuccess: () => {
            toast.success('Appointment updated successfully.');
            setEditMode(false);
            onSuccess();
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const onSubmit = (data: UpdateAppointmentFormValues) => {
        if (!appointmentId) return;

        const updateData: UpdateAppointmentDto = {
            status: data.status,
            notes: data.notes,
        };

        if (data.date && data.time) {
            const startDateTime = new Date(data.date);
            const [hours, minutes] = data.time.split(':');
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            updateData.startTime = startDateTime.toISOString();
        }

        mutation.mutate({ id: appointmentId, data: updateData });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case AppointmentStatus.CONFIRMED:
                return 'default';
            case AppointmentStatus.COMPLETED:
                return 'default';
            case AppointmentStatus.CANCELLED:
                return 'destructive';
            case AppointmentStatus.NO_SHOW:
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case AppointmentStatus.CONFIRMED:
                return 'text-blue-500';
            case AppointmentStatus.COMPLETED:
                return 'text-green-500';
            case AppointmentStatus.CANCELLED:
                return 'text-red-500';
            case AppointmentStatus.NO_SHOW:
                return 'text-gray-500';
            default:
                return 'text-yellow-500';
        }
    };

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex items-center justify-center p-8">
                        <p>Loading...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!appointment) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Appointment Details</DialogTitle>
                </DialogHeader>

                {!editMode ? (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium">
                                    {appointment.customer?.firstName} {appointment.customer?.lastName}
                                </p>
                                {appointment.customer?.customerProfile?.phone && (
                                    <p className="text-sm text-muted-foreground">{appointment.customer.customerProfile.phone}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Scissors className="h-4 w-4" />
                                    Service
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium">{appointment.service?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {appointment.service?.duration} minutes • ${appointment.service?.basePrice}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Artist
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium">
                                    {appointment.artist?.firstName} {appointment.artist?.lastName}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Date & Time
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium">
                                    {format(new Date(appointment.startTime), 'MMMM dd, yyyy')}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(appointment.startTime), 'h:mm a')} -{' '}
                                    {format(new Date(appointment.endTime), 'h:mm a')}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge variant={getStatusBadgeVariant(appointment.status)} className={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                </Badge>
                            </CardContent>
                        </Card>

                        {appointment.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{appointment.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {appointment.depositAmount > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Deposit</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-medium">${appointment.depositAmount}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {appointment.isDepositPaid ? 'Paid' : 'Unpaid'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Close</Button>
                            </DialogClose>
                            {canEdit && (
                                <Button onClick={() => setEditMode(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={AppointmentStatus.PENDING}>Pending</SelectItem>
                                                <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmed</SelectItem>
                                                <SelectItem value={AppointmentStatus.COMPLETED}>Completed</SelectItem>
                                                <SelectItem value={AppointmentStatus.CANCELLED}>Cancelled</SelectItem>
                                                <SelectItem value={AppointmentStatus.NO_SHOW}>No Show</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select date"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time</FormLabel>
                                            <FormControl>
                                                <TimePicker value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
