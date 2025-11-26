import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import { addMinutes, format } from 'date-fns';

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
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Card, CardContent } from '@/components/ui/card';
import { getAllCustomers } from '@/services/customersService';
import { getAllServices } from '@/services/servicesService';
import { getAllStaff } from '@/services/staffService';
import {
    createAppointment,
    findAvailableSlots,
    type CreateAppointmentDto,
    type FindSlotsDto,
} from '@/services/appointmentsService';
import { getErrorMessage } from '@/lib/utils';
import { UserRole, type AvailableSlot } from '@/types';

const createAppointmentSchema = z.object({
    customerUserId: z.string().min(1, 'Customer is required'),
    serviceId: z.string().min(1, 'Service is required'),
    artistId: z.string().optional(),
    date: z.date({ required_error: 'Date is required' }),
    time: z.string().min(1, 'Time is required'),
    notes: z.string().optional(),
});

type CreateAppointmentFormValues = z.infer<typeof createAppointmentSchema>;

interface CreateAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialDate?: Date;
}

export function CreateAppointmentDialog({
    open,
    onOpenChange,
    onSuccess,
    initialDate,
}: CreateAppointmentDialogProps) {
    const [showSlotFinder, setShowSlotFinder] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [findingSlotsLoading, setFindingSlotsLoading] = useState(false);

    const form = useForm<CreateAppointmentFormValues>({
        resolver: zodResolver(createAppointmentSchema),
        defaultValues: {
            date: initialDate || new Date(),
            time: '09:00',
        },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({
                date: initialDate || new Date(),
                time: '09:00',
                customerUserId: '',
                serviceId: '',
                artistId: '',
                notes: '',
            });
            setShowSlotFinder(false);
            setAvailableSlots([]);
        }
    }, [open, initialDate, form]);

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: getAllCustomers,
        enabled: open,
    });

    const { data: services } = useQuery({
        queryKey: ['services'],
        queryFn: getAllServices,
        enabled: open,
    });

    const { data: staff } = useQuery({
        queryKey: ['staff'],
        queryFn: getAllStaff,
        enabled: open,
    });

    const artists = React.useMemo(
        () => staff?.filter((s) => s.role === UserRole.ARTIST) || [],
        [staff],
    );

    const selectedService = services?.find(
        (s) => s.id === form.watch('serviceId')
    );

    const mutation = useMutation({
        mutationFn: createAppointment,
        onSuccess: () => {
            toast.success('Appointment created successfully.');
            onSuccess();
            onOpenChange(false);
            form.reset();
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const handleFindSlots = async () => {
        const serviceId = form.getValues('serviceId');
        const date = form.getValues('date');
        const artistId = form.getValues('artistId');

        if (!serviceId || !date) {
            toast.error('Please select a service and date first');
            return;
        }

        setFindingSlotsLoading(true);
        try {
            const slotsData: FindSlotsDto = {
                startDate: date.toISOString(),
                endDate: addMinutes(date, 1440).toISOString(), // Next 24 hours
                serviceId,
                artistId: artistId || undefined,
            };

            const slots = await findAvailableSlots(slotsData);
            setAvailableSlots(slots);
            setShowSlotFinder(true);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setFindingSlotsLoading(false);
        }
    };

    const handleSelectSlot = (slot: AvailableSlot) => {
        const slotDate = new Date(slot.startTime);
        const timeString = format(slotDate, 'HH:mm');

        form.setValue('artistId', slot.artistId);
        form.setValue('time', timeString);
        setShowSlotFinder(false);
        toast.success(`Selected slot with ${slot.artistName}`);
    };

    const onSubmit = (data: CreateAppointmentFormValues) => {
        if (!selectedService) return;

        const startDateTime = new Date(data.date);
        const [hours, minutes] = data.time.split(':');
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Backend calculates endTime based on service duration
        // We confirmed CreateAppointmentDto does not have endTime

        const appointmentData: CreateAppointmentDto = {
            customerUserId: data.customerUserId,
            serviceId: data.serviceId,
            artistId: data.artistId || artists[0]?.id || '',
            startTime: startDateTime.toISOString(),
            notes: data.notes,
        };

        mutation.mutate(appointmentData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Appointment</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="customerUserId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a customer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {customers?.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.firstName} {customer.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="serviceId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a service" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {services?.map((service) => (
                                                <SelectItem key={service.id} value={service.id}>
                                                    {service.name} ({service.duration} mins)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="artistId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Artist (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an artist" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {artists.map((artist) => (
                                                <SelectItem key={artist.id} value={artist.id}>
                                                    {artist.firstName} {artist.lastName}
                                                </SelectItem>
                                            ))}
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

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleFindSlots}
                            disabled={findingSlotsLoading}
                            className="w-full"
                        >
                            {findingSlotsLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Finding Slots...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Find Available Slots
                                </>
                            )}
                        </Button>

                        {showSlotFinder && availableSlots.length > 0 && (
                            <Card>
                                <CardContent className="pt-4 max-h-[200px] overflow-y-auto">
                                    <div className="space-y-2">
                                        {availableSlots.map((slot, index) => (
                                            <Button
                                                key={index}
                                                type="button"
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={() => handleSelectSlot(slot)}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium">
                                                        {format(new Date(slot.startTime), 'h:mm a')} -{' '}
                                                        {format(new Date(slot.endTime), 'h:mm a')}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        with {slot.artistName}
                                                    </span>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {showSlotFinder && availableSlots.length === 0 && !findingSlotsLoading && (
                            <Card>
                                <CardContent className="pt-4">
                                    <p className="text-sm text-muted-foreground text-center">
                                        No available slots found. Please select a different date or time manually.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Add any special notes..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Creating...' : 'Create Appointment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
