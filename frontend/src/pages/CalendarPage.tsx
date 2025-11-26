// src/pages/CalendarPage.tsx
import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { getAppointments } from '@/services/appointmentsService';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { CreateAppointmentDialog } from '@/components/appointments/CreateAppointmentDialog';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import type { EventClickArg, DatesSetArg, DateSelectArg } from '@fullcalendar/core';

const CalendarPage = () => {
    const queryClient = useQueryClient();
    const { accessToken } = useAuthStore();
    const { canAccessResource } = usePermissions();
    const [viewInfo, setViewInfo] = useState({
        start: new Date(),
        end: new Date(),
    });
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const canCreate = canAccessResource('appointment:create');

    // Query to fetch appointment data based on the current calendar view
    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', viewInfo.start.toISOString(), viewInfo.end.toISOString()],
        queryFn: () => getAppointments(accessToken!, viewInfo.start, viewInfo.end),
        enabled: !!accessToken,
    });

    // Transform our appointment data into the format FullCalendar expects
    const events = appointments?.map(appt => ({
        id: appt.id,
        title: `${appt.customer?.firstName || 'Unknown'} ${appt.customer?.lastName || 'Customer'} - ${appt.service?.name || 'Service'}`,
        start: appt.startTime,
        end: appt.endTime,
        extendedProps: {
            artist: `${appt.artist?.firstName || 'Unknown'} ${appt.artist?.lastName || 'Artist'}`,
            status: appt.status,
        },
        // Style events based on status
        backgroundColor: appt.status === 'CONFIRMED' ? '#2563eb' : appt.status === 'PENDING' ? '#f59e0b' : '#64748b',
        borderColor: appt.status === 'CONFIRMED' ? '#2563eb' : appt.status === 'PENDING' ? '#f59e0b' : '#64748b',
    }));

    const handleEventClick = (clickInfo: EventClickArg) => {
        setSelectedAppointmentId(clickInfo.event.id);
        setDetailsDialogOpen(true);
    };

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect(); // clear date selection

        setSelectedDate(selectInfo.start);
        setCreateDialogOpen(true);
    };

    const handleDatesSet = (dateInfo: DatesSetArg) => {
        setViewInfo({
            start: dateInfo.start,
            end: dateInfo.end,
        });
    };

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Calendar</h1>
                {canCreate && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Appointment
                    </Button>
                )}
            </div>
            <div className="flex-1 bg-card text-card-foreground shadow rounded-lg p-6">
                {isLoading && <div className="mb-4 text-sm text-muted-foreground">Loading appointments...</div>}
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    height="100%"
                    selectable={true}
                    editable={true}
                    events={events}
                    eventClick={handleEventClick}
                    select={handleDateSelect}
                    datesSet={handleDatesSet}
                    nowIndicator={true}
                    allDaySlot={false}
                />
            </div>

            <CreateAppointmentDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleSuccess}
                initialDate={selectedDate || undefined}
            />

            <AppointmentDetailsDialog
                appointmentId={selectedAppointmentId}
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default CalendarPage;
