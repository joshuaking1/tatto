import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarClock, Plus, Trash2, Edit } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getAllStaff } from '@/services/staffService';
import {
    getArtistSchedule,
    getArtistBlockouts,
    deleteBlockout,
} from '@/services/appointmentsService';
import { SetScheduleDialog } from '@/components/appointments/SetScheduleDialog';
import { CreateBlockoutDialog } from '@/components/appointments/CreateBlockoutDialog';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/lib/utils';
import { UserRole } from '@/types';

// Updated to start with Monday to match backend dayOfWeek (1=Monday, 7=Sunday)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Convert minutes from midnight to HH:mm format
const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
};

export default function ArtistAvailabilityPage() {
    const queryClient = useQueryClient();
    const { hasAnyRole } = usePermissions();
    const [selectedArtistId, setSelectedArtistId] = useState<string>('');
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [blockoutDialogOpen, setBlockoutDialogOpen] = useState(false);

    const canManage = hasAnyRole([UserRole.ADMIN, UserRole.MANAGER]);

    const { data: staff } = useQuery({
        queryKey: ['staff'],
        queryFn: getAllStaff,
    });

    const artists = React.useMemo(
        () => staff?.filter((s) => s.role === UserRole.ARTIST) || [],
        [staff],
    );

    const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
        queryKey: ['artistSchedule', selectedArtistId],
        queryFn: () => getArtistSchedule(selectedArtistId),
        enabled: !!selectedArtistId,
    });

    const { data: blockouts, isLoading: isLoadingBlockouts } = useQuery({
        queryKey: ['artistBlockouts', selectedArtistId],
        queryFn: () => getArtistBlockouts(selectedArtistId),
        enabled: !!selectedArtistId,
    });

    const deleteBlockoutMutation = useMutation({
        mutationFn: deleteBlockout,
        onSuccess: () => {
            toast.success('Blockout deleted successfully.');
            queryClient.invalidateQueries({ queryKey: ['artistBlockouts', selectedArtistId] });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const handleDeleteBlockout = (blockoutId: string) => {
        if (confirm('Are you sure you want to delete this blockout?')) {
            deleteBlockoutMutation.mutate(blockoutId);
        }
    };

    const scheduleByDay = React.useMemo(() => {
        if (!schedule) return {};
        return schedule.reduce((acc, slot) => {
            if (!acc[slot.dayOfWeek]) {
                acc[slot.dayOfWeek] = [];
            }
            acc[slot.dayOfWeek].push(slot);
            return acc;
        }, {} as Record<number, typeof schedule>);
    }, [schedule]);

    if (!canManage) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <CalendarClock className="h-8 w-8" />
                    Artist Availability
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage artist schedules and time off
                </p>
            </header>

            <div className="mb-6">
                <Select value={selectedArtistId} onValueChange={setSelectedArtistId}>
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select an artist" />
                    </SelectTrigger>
                    <SelectContent>
                        {artists.map((artist) => (
                            <SelectItem key={artist.id} value={artist.id}>
                                {artist.firstName} {artist.lastName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedArtistId && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Weekly Schedule Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Schedule</CardTitle>
                            <CardDescription>Regular working hours for this artist</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSchedule ? (
                                <p className="text-sm text-muted-foreground">Loading schedule...</p>
                            ) : schedule && schedule.length > 0 ? (
                                <div className="space-y-2">
                                    {DAYS.map((day, index) => {
                                        const dayKey = index + 1; // 1=Monday, 7=Sunday
                                        const daySlots = scheduleByDay[dayKey];

                                        if (!daySlots || daySlots.length === 0) {
                                            return (
                                                <div key={day} className="flex justify-between py-2 border-b">
                                                    <span className="font-medium">{day}</span>
                                                    <span className="text-muted-foreground">Unavailable</span>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={day} className="flex justify-between py-2 border-b">
                                                <span className="font-medium">{day}</span>
                                                <span className="text-right">
                                                    {daySlots.map((slot, i) => (
                                                        <div key={i}>
                                                            {minutesToTime(slot.startTime)} - {minutesToTime(slot.endTime)}
                                                        </div>
                                                    ))}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No schedule set for this artist
                                </p>
                            )}
                            <Button
                                className="w-full mt-4"
                                onClick={() => setScheduleDialogOpen(true)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Schedule
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Blockouts Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Blockouts</CardTitle>
                            <CardDescription>Time off and unavailable periods</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingBlockouts ? (
                                <p className="text-sm text-muted-foreground">Loading blockouts...</p>
                            ) : blockouts && blockouts.length > 0 ? (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Period</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {blockouts
                                                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                                                .map((blockout) => (
                                                    <TableRow key={blockout.id}>
                                                        <TableCell className="text-sm">
                                                            <div>
                                                                {format(new Date(blockout.startTime), 'MMM dd, yyyy h:mm a')}
                                                            </div>
                                                            <div className="text-muted-foreground">
                                                                to {format(new Date(blockout.endTime), 'MMM dd, yyyy h:mm a')}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {blockout.reason || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteBlockout(blockout.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No blockouts for this artist
                                </p>
                            )}
                            <Button
                                className="w-full mt-4"
                                onClick={() => setBlockoutDialogOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Blockout
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {!selectedArtistId && (
                <Card>
                    <CardContent className="flex items-center justify-center min-h-[300px]">
                        <p className="text-muted-foreground">Select an artist to manage their availability</p>
                    </CardContent>
                </Card>
            )}

            <SetScheduleDialog
                artistId={selectedArtistId}
                open={scheduleDialogOpen}
                onOpenChange={setScheduleDialogOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['artistSchedule', selectedArtistId] });
                }}
            />

            <CreateBlockoutDialog
                artistId={selectedArtistId}
                open={blockoutDialogOpen}
                onOpenChange={setBlockoutDialogOpen}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['artistBlockouts', selectedArtistId] });
                }}
            />
        </div>
    );
}
