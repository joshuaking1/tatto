import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
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
import { Button } from '@/components/ui/button';
import { getLeaveRequestById } from '@/services/leaveRequestsService';
import { LeaveType, LeaveStatus } from '@/types';
import type { LeaveRequest } from '@/types';

interface LeaveRequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequestId: string;
}

export function LeaveRequestDetailsDialog({ open, onOpenChange, leaveRequestId }: LeaveRequestDetailsDialogProps) {
  const { data: leaveRequest, isLoading, error } = useQuery({
    queryKey: ['leaveRequest', leaveRequestId],
    queryFn: () => getLeaveRequestById(leaveRequestId),
    enabled: open && !!leaveRequestId,
  });

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

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.PENDING:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case LeaveStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case LeaveStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getLeaveTypeIcon = (type: LeaveType) => {
    switch (type) {
      case LeaveType.VACATION:
        return <Calendar className="h-4 w-4" />;
      case LeaveType.SICK:
        return <AlertCircle className="h-4 w-4" />;
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

  const getLeaveTypeDescription = (type: LeaveType) => {
    switch (type) {
      case LeaveType.VACATION:
        return 'Vacation';
      case LeaveType.SICK:
        return 'Sick Leave';
      case LeaveType.PERSONAL:
        return 'Personal Leave';
      case LeaveType.UNPAID:
        return 'Unpaid Leave';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Request Details
            </span>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading leave request details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load leave request details</p>
          </div>
        ) : leaveRequest ? (
          <div className="space-y-6">
            {/* Status Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(leaveRequest.status)}
                    <div>
                      <h3 className="font-semibold">Request Status</h3>
                      <p className="text-sm text-gray-500">
                        {leaveRequest.status === LeaveStatus.PENDING && 'Waiting for approval'}
                        {leaveRequest.status === LeaveStatus.APPROVED && 'Leave has been approved'}
                        {leaveRequest.status === LeaveStatus.REJECTED && 'Leave has been rejected'}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(leaveRequest.status)}
                </div>
              </CardContent>
            </Card>

            {/* Leave Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Leave Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee</label>
                    <p className="font-medium">
                      {leaveRequest.employee
                        ? `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`
                        : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Leave Type</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getLeaveTypeIcon(leaveRequest.type)}
                      <span>{getLeaveTypeDescription(leaveRequest.type)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p>{format(new Date(leaveRequest.startDate), 'PPP')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p>{format(new Date(leaveRequest.endDate), 'PPP')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p>{calculateDuration(leaveRequest.startDate, leaveRequest.endDate)} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Requested On</label>
                    <p>{format(new Date(leaveRequest.createdAt), 'PPP')}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="mt-1 text-sm">{leaveRequest.reason}</p>
                </div>

                {leaveRequest.notes && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Additional Notes</label>
                    <p className="mt-1 text-sm">{leaveRequest.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approval Information */}
            {(leaveRequest.approvedById && leaveRequest.approvedAt) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Approval Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Approved By</label>
                      <p className="font-medium">
                        {leaveRequest.approver
                          ? `${leaveRequest.approver.firstName} ${leaveRequest.approver.lastName}`
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Approved On</label>
                      <p>{format(new Date(leaveRequest.approvedAt), 'PPP p')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
