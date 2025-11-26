import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Control, UseFormWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

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
import { TimePicker } from '@/components/ui/time-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    getArtistSchedule,
    setArtistSchedule,
    type SetScheduleDto,
} from '@/services/appointmentsService';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/utils';
import { UserRole } from '@/types';

const scheduleSchema = z.object({
    schedule: z.array(
        z.object({
            dayOfWeek: z.number().min(1).max(7),
            enabled: z.boolean(),
            slots: z.array(
                z.object({
                    startTime: z.string(),
                    endTime: z.string(),
                })
            ),
        })
    ),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface SetScheduleDialogProps {
    artistId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const DAYS = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 7 },
];

// Convert minutes from midnight to HH:mm format
const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Convert HH:mm format to minutes from midnight
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

interface DayScheduleRowProps {
    dayIndex: number;
    dayLabel: string;
    control: Control<ScheduleFormValues>;
    watch: UseFormWatch<ScheduleFormValues>;
}

function DayScheduleRow({ dayIndex, dayLabel, control, watch }: DayScheduleRowProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `schedule.${dayIndex}.slots`,
    });

    const enabled = watch(`schedule.${dayIndex}.enabled`);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                    <FormField
                        control={control}
                        name={`schedule.${dayIndex}.enabled`}
                        render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="!mt-0 font-medium">
                                    {dayLabel}
                                </FormLabel>
                            </FormItem>
                        )}
                    />
                    {enabled && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => append({ startTime: '09:00', endTime: '17:00' })}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Slot
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            {enabled && (
                <CardContent className="space-y-4">
                    {fields.map((field, slotIndex) => (
                        <div key={field.id} className="flex items-end gap-4">
                            <FormField
                                control={control}
                                name={`schedule.${dayIndex}.slots.${slotIndex}.startTime`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className={slotIndex > 0 ? "sr-only" : ""}>Start Time</FormLabel>
                                        <FormControl>
                                            <TimePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <span className={`text-muted-foreground pb-2`}>to</span>
                            <FormField
                                control={control}
                                name={`schedule.${dayIndex}.slots.${slotIndex}.endTime`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className={slotIndex > 0 ? "sr-only" : ""}>End Time</FormLabel>
                                        <FormControl>
                                            <TimePicker
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mb-0.5"
                                onClick={() => remove(slotIndex)}
                                disabled={fields.length === 1} // Prevent removing the last slot if we want at least one
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            )}
        </Card>
    );
}

export function SetScheduleDialog({
    artistId,
    open,
    onOpenChange,
    onSuccess,
}: SetScheduleDialogProps) {
    const { hasAnyRole } = usePermissions();
    const canEdit = hasAnyRole([UserRole.ADMIN, UserRole.MANAGER]);

    const { data: existingSchedule, isLoading } = useQuery({
        queryKey: ['artistSchedule', artistId],
        queryFn: () => getArtistSchedule(artistId),
        enabled: open && !!artistId,
    });

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            schedule: DAYS.map((day) => ({
                dayOfWeek: day.value,
                enabled: false,
                slots: [{ startTime: '09:00', endTime: '17:00' }],
            })),
        },
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: 'schedule',
    });

    React.useEffect(() => {
        if (existingSchedule && existingSchedule.length > 0) {
            const scheduleByDay = existingSchedule.reduce((acc, slot) => {
                if (!acc[slot.dayOfWeek]) {
                    acc[slot.dayOfWeek] = [];
                }
                acc[slot.dayOfWeek].push(slot);
                return acc;
            }, {} as Record<number, typeof existingSchedule>);

            const formSchedule = DAYS.map((day) => {
                const daySlots = scheduleByDay[day.value];
                if (daySlots && daySlots.length > 0) {
                    return {
                        dayOfWeek: day.value,
                        enabled: true,
                        slots: daySlots.map(slot => ({
                            startTime: minutesToTime(slot.startTime),
                            endTime: minutesToTime(slot.endTime),
                        }))
                    };
                }
                return {
                    dayOfWeek: day.value,
                    enabled: false,
                    slots: [{ startTime: '09:00', endTime: '17:00' }],
                };
            });

            form.reset({ schedule: formSchedule });
        }
    }, [existingSchedule, form]);

    const mutation = useMutation({
        mutationFn: setArtistSchedule,
        onSuccess: () => {
            toast.success('Schedule updated successfully.');
            onSuccess();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const onSubmit = (data: ScheduleFormValues) => {
        const scheduleData: SetScheduleDto = {
            artistId,
            schedule: data.schedule
                .filter((day) => day.enabled)
                .flatMap((day) => day.slots.map(slot => ({
                    dayOfWeek: day.dayOfWeek,
                    startTime: timeToMinutes(slot.startTime),
                    endTime: timeToMinutes(slot.endTime),
                }))),
        };

        mutation.mutate(scheduleData);
    };

    if (!canEdit) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Set Weekly Schedule</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <p>Loading schedule...</p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <DayScheduleRow
                                        key={field.id}
                                        dayIndex={index}
                                        dayLabel={DAYS[index].label}
                                        control={form.control}
                                        watch={form.watch}
                                    />
                                ))}
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Saving...' : 'Save Schedule'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
