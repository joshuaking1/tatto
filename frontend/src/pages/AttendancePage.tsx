import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, differenceInMinutes, addMinutes } from 'date-fns';
import {
  Clock,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Coffee,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { BranchSelector } from '@/components/ui/branch-selector';
import { AttendanceDetailsDialog } from '@/components/attendance/AttendanceDetailsDialog';
import { EditAttendanceDialog } from '@/components/attendance/EditAttendanceDialog';
import {
  getCurrentAttendance,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAllAttendance,
  deleteAttendance,
} from '@/services/attendanceService';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  AttendanceStatus, 
  BreakType 
} from '@/types';
import type { 
  Attendance, 
  User 
} from '@/types';
import type { DateRange } from 'react-day-picker';

export const AttendancePage: React.FC = () => {
  const canViewAttendance = usePermissions().canAccessResource('attendance:view');
  const canCreateAttendance = usePermissions().canAccessResource('attendance:create');
  const canEditAttendance = usePermissions().canAccessResource('attendance:edit');
  const canDeleteAttendance = usePermissions().canAccessResource('attendance:delete');

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  // Clock state
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');

  // Query current attendance
  const {
    data: currentAttendance,
    refetch: refetchCurrentAttendance,
  } = useQuery({
    queryKey: ['currentAttendance'],
    queryFn: getCurrentAttendance,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query attendance records
  const {
    data: attendances = [],
    isLoading,
    error,
    refetch: refetchAttendances,
  } = useQuery({
    queryKey: ['attendances', dateRange, employeeFilter, branchFilter, statusFilter],
    queryFn: () =>
      getAllAttendance({
        startDate: dateRange?.from?.toISOString().split('T')[0],
        endDate: dateRange?.to?.toISOString().split('T')[0],
        employeeId: employeeFilter && employeeFilter !== 'all' ? employeeFilter : undefined,
        branchId: branchFilter && branchFilter !== 'all' ? branchFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
  });

  // Client-side search filtering
  const filteredAttendances = attendances.filter(attendance => {
    if (!searchQuery) return true;
    
    const employeeName = `${attendance.employee?.firstName || ''} ${attendance.employee?.lastName || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return employeeName.includes(query);
  });

  // Update elapsed time
  useEffect(() => {
    if (currentAttendance && currentAttendance.status === AttendanceStatus.CLOCKED_IN) {
      const interval = setInterval(() => {
        const now = new Date();
        const clockIn = new Date(currentAttendance.clockInTime);
        const elapsed = differenceInMinutes(now, clockIn);
        
        const hours = Math.floor(elapsed / 60);
        const minutes = elapsed % 60;
        const seconds = now.getSeconds();
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedTime('00:00:00');
    }
  }, [currentAttendance]);

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: clockIn,
    onSuccess: () => {
      toast.success('Clocked in successfully');
      refetchCurrentAttendance();
      refetchAttendances();
    },
    onError: (error) => {
      toast.error('Failed to clock in');
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: clockOut,
    onSuccess: () => {
      toast.success('Clocked out successfully');
      refetchCurrentAttendance();
      refetchAttendances();
    },
    onError: (error) => {
      toast.error('Failed to clock out');
    },
  });

  // Start break mutation
  const startBreakMutation = useMutation({
    mutationFn: ({ attendanceId, type }: { attendanceId: string; type: BreakType }) =>
      startBreak(attendanceId, type),
    onSuccess: () => {
      toast.success('Break started');
      refetchCurrentAttendance();
    },
    onError: (error) => {
      toast.error('Failed to start break');
    },
  });

  // End break mutation
  const endBreakMutation = useMutation({
    mutationFn: endBreak,
    onSuccess: () => {
      toast.success('Break ended');
      refetchCurrentAttendance();
    },
    onError: (error) => {
      toast.error('Failed to end break');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      toast.success('Attendance deleted');
      refetchAttendances();
    },
    onError: (error) => {
      toast.error('Failed to delete attendance');
    },
  });

  const handleClockIn = () => {
    clockInMutation.mutate({});
  };

  const handleClockOut = () => {
    clockOutMutation.mutate();
  };

  const handleStartBreak = (type: BreakType) => {
    if (currentAttendance) {
      startBreakMutation.mutate({ attendanceId: currentAttendance.id, type });
    }
  };

  const handleEndBreak = () => {
    if (currentAttendance) {
      endBreakMutation.mutate(currentAttendance.id);
    }
  };

  const handleDelete = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    deleteMutation.mutate(attendance.id);
  };

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

  const hasActiveBreak = currentAttendance?.breaks?.some(b => !b.endTime);

  if (!canViewAttendance) {
    return <div>You don't have permission to view attendance.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Clock Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Clock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentAttendance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Clocked in at</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(currentAttendance.clockInTime), 'h:mm a')}
                  </p>
                  {currentAttendance.isLate && (
                    <Badge className="bg-yellow-500 mt-1">
                      Late by {currentAttendance.lateMinutes} min
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Elapsed time</p>
                  <p className="text-2xl font-mono font-bold">{elapsedTime}</p>
                </div>
              </div>
              
              {hasActiveBreak && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">On Break</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleClockOut}
                  disabled={clockOutMutation.isPending}
                  className="flex-1"
                >
                  Clock Out
                </Button>
                {!hasActiveBreak ? (
                  <Button
                    onClick={() => handleStartBreak(BreakType.SHORT)}
                    disabled={startBreakMutation.isPending}
                    variant="outline"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Start Break
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndBreak}
                    disabled={endBreakMutation.isPending}
                    variant="outline"
                  >
                    End Break
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Clock className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-semibold">Not Clocked In</p>
                <p className="text-sm text-gray-500">Clock in to start tracking your time</p>
              </div>
              <Button
                onClick={handleClockIn}
                disabled={clockInMutation.isPending}
                size="lg"
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                Clock In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <DateRangePicker value={dateRange} onChange={(range) => setDateRange(range)} />
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {/* Add employee options here */}
              </SelectContent>
            </Select>
            <BranchSelector value={branchFilter} onValueChange={setBranchFilter} />
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={AttendanceStatus.CLOCKED_IN}>Clocked In</SelectItem>
                <SelectItem value={AttendanceStatus.CLOCKED_OUT}>Clocked Out</SelectItem>
                <SelectItem value={AttendanceStatus.INCOMPLETE}>Incomplete</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance History
            </span>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Breaks</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendances.map((attendance) => (
                <TableRow key={attendance.id}>
                  <TableCell>
                    {attendance.employee
                      ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
                      : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(attendance.clockInTime), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(attendance.clockInTime), 'h:mm a')}
                  </TableCell>
                  <TableCell>
                    {attendance.clockOutTime
                      ? format(new Date(attendance.clockOutTime), 'h:mm a')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {attendance.totalHours ? `${attendance.totalHours.toFixed(1)}h` : '-'}
                  </TableCell>
                  <TableCell>
                    {attendance.breaks?.length || 0}
                  </TableCell>
                  <TableCell>
                    {attendance.isLate && (
                      <Badge className="bg-yellow-500">
                        {attendance.lateMinutes}m
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {attendance.overtimeHours > 0 && (
                      <Badge className="bg-blue-500">
                        {attendance.overtimeHours.toFixed(1)}h
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedAttendance(attendance);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        {canEditAttendance && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAttendance(attendance);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canDeleteAttendance && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(attendance)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedAttendance && (
        <>
          <AttendanceDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            attendanceId={selectedAttendance.id}
          />
          <EditAttendanceDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            attendanceId={selectedAttendance.id}
            onSuccess={() => refetchAttendances()}
          />
        </>
      )}
    </div>
  );
};
