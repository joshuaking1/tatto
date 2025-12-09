import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Clock,
  Coffee,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getAttendanceById } from '@/services/attendanceService';
import { 
  AttendanceStatus, 
  BreakType 
} from '@/types';

interface AttendanceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string;
}

export function AttendanceDetailsDialog({ open, onOpenChange, attendanceId }: AttendanceDetailsDialogProps) {
  const { data: attendance, isLoading, error } = useQuery({
    queryKey: ['attendance', attendanceId],
    queryFn: () => getAttendanceById(attendanceId),
    enabled: open && !!attendanceId,
  });

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.CLOCKED_IN:
        return <Badge className="bg-green-500">Clocked In</Badge>;
      case AttendanceStatus.CLOCKED_OUT:
        return <Badge className="bg-gray-500">Clocked Out</Badge>;
      case AttendanceStatus.INCOMPLETE:
        return <Badge className="bg-yellow-500">Incomplete</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBreakTypeBadge = (type: BreakType) => {
    switch (type) {
      case BreakType.LUNCH:
        return <Badge className="bg-blue-500">Lunch</Badge>;
      case BreakType.SHORT:
        return <Badge className="bg-green-500">Short</Badge>;
      case BreakType.PERSONAL:
        return <Badge className="bg-purple-500">Personal</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Attendance Details</span>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading attendance details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load attendance details</p>
          </div>
        ) : attendance ? (
          <div className="space-y-6">
            {/* Attendance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Attendance Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee</label>
                    <p className="font-medium">
                      {attendance.employee
                        ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
                        : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p>{format(new Date(attendance.clockInTime), 'PPP')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Clock In</label>
                    <p>{format(new Date(attendance.clockInTime), 'h:mm a')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Clock Out</label>
                    <p>
                      {attendance.clockOutTime
                        ? format(new Date(attendance.clockOutTime), 'h:mm a')
                        : 'Not clocked out'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(attendance.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Branch</label>
                    <p>{attendance.branch?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p>{attendance.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Hours</label>
                    <p>{attendance.totalHours ? `${attendance.totalHours.toFixed(2)} hours` : 'Not calculated'}</p>
                  </div>
                </div>

                {attendance.notes && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-sm">{attendance.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Time Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {attendance.totalHours ? `${attendance.totalHours.toFixed(1)}h` : '0h'}
                    </div>
                    <div className="text-sm text-gray-500">Total Hours</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {attendance.isLate ? `${attendance.lateMinutes}m` : '0m'}
                    </div>
                    <div className="text-sm text-gray-500">Late Arrival</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {attendance.overtimeHours.toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-500">Overtime</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Breaks Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Breaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.breaks && attendance.breaks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.breaks.map((breakItem) => (
                        <TableRow key={breakItem.id}>
                          <TableCell>{getBreakTypeBadge(breakItem.type)}</TableCell>
                          <TableCell>{format(new Date(breakItem.startTime), 'h:mm a')}</TableCell>
                          <TableCell>
                            {breakItem.endTime
                              ? format(new Date(breakItem.endTime), 'h:mm a')
                              : 'Active'}
                          </TableCell>
                          <TableCell>
                            {breakItem.duration
                              ? formatDuration(breakItem.duration)
                              : 'In progress'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No breaks recorded
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
