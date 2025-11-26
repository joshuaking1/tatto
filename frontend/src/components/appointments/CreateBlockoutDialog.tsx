import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
    createBlockout,
    getAppointments,
    type CreateBlockoutDto,
} from '@/services/appointmentsService';
import { getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const createBlockoutSchema = z.object({
    startDate: z.date(),
    startTime: z.string().min(1, 'Start time is required'),
    endDate: z.date(),
    endTime: z.string().min(1, 'End time is required'),
    reason: z.string().optional(),
}).refine((data) => {
    const start = new Date(data.startDate);
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    start.setHours(startHours, startMinutes, 0, 0);

    const end = new Date(data.endDate);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    end.setHours(endHours, endMinutes, 0, 0);

    return end > start;
}, {
    message: 'End date/time must be after start date/time',
    path: ['endDate'],
});

type CreateBlockoutFormValues = z.infer<typeof createBlockoutSchema>;

interface CreateBlockoutDialogProps {
    artistId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateBlockoutDialog({
    artistId,
    open,
    onOpenChange,
    onSuccess,
}: CreateBlockoutDialogProps) {
    const { accessToken } = useAuthStore();
    const form = useForm<CreateBlockoutFormValues>({
        resolver: zodResolver(createBlockoutSchema),
        defaultValues: {
            startDate: new Date(),
            startTime: '09:00',
            endDate: new Date(),
            endTime: '17:00',
        },
    });

    const mutation = useMutation({
        mutationFn: createBlockout,
        onSuccess: () => {
            toast.success('Blockout created successfully.');
            onSuccess();
            onOpenChange(false);
            form.reset();
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const onSubmit = async (data: CreateBlockoutFormValues) => {
        const startDateTime = new Date(data.startDate);
        const [startHours, startMinutes] = data.startTime.split(':').map(Number);
        startDateTime.setHours(startHours, startMinutes, 0, 0);

        const endDateTime = new Date(data.endDate);
        const [endHours, endMinutes] = data.endTime.split(':').map(Number);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        // Check for overlaps
        try {
            if (accessToken) {
                const appointments = await getAppointments(accessToken, startDateTime, endDateTime);
                const overlapping = appointments.filter(appt => {
                    if (appt.artistId !== artistId) return false;
                    const apptStart = new Date(appt.startTime);
                    const apptEnd = new Date(appt.endTime);
                    return (startDateTime < apptEnd && endDateTime > apptStart);
                });

                if (overlapping.length > 0) {
                    toast.error(`This blockout overlaps with an existing appointment at ${new Date(overlapping[0].startTime).toLocaleTimeString()}`);
                    return;
                }
            }
        } catch (error) {
            console.error("Failed to check for overlaps", error);
            // Proceed with caution or return? 
            // Comment said "Only call createBlockout when no overlaps are found". 
            // If check fails, maybe warn user or block? I'll block to be safe or just show error toast.
            toast.error("Failed to verify availability. Please try again.");
            return;
        }

        const blockoutData: CreateBlockoutDto = {
            artistId,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            reason: data.reason,
        };

        mutation.mutate(blockoutData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Blockout</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select start date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Time</FormLabel>
                                        <FormControl>
                                            <TimePicker value={field.value} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select end date"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Time</FormLabel>
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
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="e.g., Vacation, Sick leave, Personal"
                                        />
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
                                {mutation.isPending ? 'Creating...' : 'Create Blockout'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
