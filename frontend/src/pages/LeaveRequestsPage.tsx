import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Download,
  Clock,
  X,
} from 'lucide-react';
import {
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
} from '@/services/leaveRequestsService';
import { LeaveStatus, LeaveType } from '@/types';
import { CreateLeaveRequestDialog } from '@/components/attendance/CreateLeaveRequestDialog';
import { LeaveRequestDetailsDialog } from '@/components/attendance/LeaveRequestDetailsDialog';
import { EditLeaveRequestDialog } from '@/components/attendance/EditLeaveRequestDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { usePermissions } from '@/hooks/usePermissions';
import type { LeaveRequest } from '@/types';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';

export const LeaveRequestsPage: React.FC = () => {
  const canViewLeave = usePermissions().canAccessResource('leave:view');
  const canCreateLeave = usePermissions().canAccessResource('leave:create');
  const canApproveLeave = usePermissions().canAccessResource('leave:approve');
  const canEditLeave = usePermissions().canAccessResource('leave:edit');
  const canDeleteLeave = usePermissions().canAccessResource('leave:delete');

  // Filter states
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequest | null>(null);

  // Query leave requests
  const {
    data: leaveRequests = [],
    isLoading,
    refetch: refetchLeaveRequests,
  } = useQuery({
    queryKey: ['leaveRequests', statusFilter, employeeFilter, dateRange, searchQuery],
    queryFn: () =>
      getAllLeaveRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        employeeId: employeeFilter && employeeFilter !== 'all' ? employeeFilter : undefined,
        startDate: dateRange?.from?.toISOString().split('T')[0],
        endDate: dateRange?.to?.toISOString().split('T')[0],
      }),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: approveLeaveRequest,
    onSuccess: () => {
      toast.success('Leave request approved');
      refetchLeaveRequests();
    },
    onError: () => {
      toast.error('Failed to approve leave request');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: rejectLeaveRequest,
    onSuccess: () => {
      toast.success('Leave request rejected');
      refetchLeaveRequests();
    },
    onError: () => {
      toast.error('Failed to reject leave request');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLeaveRequest,
    onSuccess: () => {
      toast.success('Leave request deleted');
      refetchLeaveRequests();
    },
    onError: () => {
      toast.error('Failed to delete leave request');
    },
  });

  const handleApprove = (leaveRequest: LeaveRequest) => {
    approveMutation.mutate(leaveRequest.id);
  };

  const handleReject = (leaveRequest: LeaveRequest) => {
    rejectMutation.mutate(leaveRequest.id);
  };

  const handleDelete = (leaveRequest: LeaveRequest) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      deleteMutation.mutate(leaveRequest.id);
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.PENDING:
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case LeaveStatus.APPROVED:
        return <Badge className="bg-green-500">Approved</Badge>;
      case LeaveStatus.REJECTED:
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLeaveTypeIcon = (type: LeaveType) => {
    switch (type) {
      case LeaveType.VACATION:
        return <Calendar className="h-4 w-4" />;
      case LeaveType.SICK:
        return <AlertTriangle className="h-4 w-4" />;
      case LeaveType.PERSONAL:
        return <Clock className="h-4 w-4" />;
      case LeaveType.UNPAID:
        return <X className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (!canViewLeave) {
    return <div>You don't have permission to view leave requests.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-gray-500">Manage employee leave requests and approvals</p>
        </div>
        {canCreateLeave && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={LeaveStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={LeaveStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={LeaveStatus.REJECTED}>Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {/* Add employee options here */}
              </SelectContent>
            </Select>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            {leaveRequests.length} request{leaveRequests.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading leave requests...</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No leave requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((leaveRequest) => (
                  <TableRow key={leaveRequest.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {leaveRequest.employee
                            ? `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`
                            : 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getLeaveTypeIcon(leaveRequest.type)}
                        <span>{leaveRequest.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {calculateDuration(leaveRequest.startDate, leaveRequest.endDate)} days
                    </TableCell>
                    <TableCell>{getStatusBadge(leaveRequest.status)}</TableCell>
                    <TableCell>
                      {format(new Date(leaveRequest.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLeaveRequest(leaveRequest);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEditLeave && leaveRequest.status === LeaveStatus.PENDING && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLeaveRequest(leaveRequest);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canApproveLeave && leaveRequest.status === LeaveStatus.PENDING && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(leaveRequest)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(leaveRequest)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {canDeleteLeave && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(leaveRequest)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateLeaveRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => refetchLeaveRequests()}
      />
      
      {selectedLeaveRequest && (
        <>
          <LeaveRequestDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            leaveRequestId={selectedLeaveRequest.id}
          />
          <EditLeaveRequestDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            leaveRequestId={selectedLeaveRequest.id}
            onSuccess={() => refetchLeaveRequests()}
          />
        </>
      )}
    </div>
  );
};
