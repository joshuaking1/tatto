import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Edit,
  Save,
  X,
  Calendar,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getLeaveRequestById, updateLeaveRequest } from '@/services/leaveRequestsService';
import { LeaveType } from '@/types';
import type { LeaveRequest } from '@/types';
import { toast } from 'sonner';

// Form validation schema
const editLeaveRequestSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.nativeEnum(LeaveType),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type EditLeaveRequestFormValues = z.infer<typeof editLeaveRequestSchema>;

interface EditLeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequestId: string;
  onSuccess: () => void;
}

export function EditLeaveRequestDialog({ open, onOpenChange, leaveRequestId, onSuccess }: EditLeaveRequestDialogProps) {
  // Query leave request details
  const { data: leaveRequest, isLoading } = useQuery({
    queryKey: ['leaveRequest', leaveRequestId],
    queryFn: () => getLeaveRequestById(leaveRequestId),
    enabled: open && !!leaveRequestId,
  });

  // Form setup
  const form = useForm<EditLeaveRequestFormValues>({
    resolver: zodResolver(editLeaveRequestSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      type: LeaveType.VACATION,
      reason: '',
      notes: '',
    },
  });

  // Update form values when leave request is loaded
  React.useEffect(() => {
    if (leaveRequest) {
      form.reset({
        startDate: format(new Date(leaveRequest.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(leaveRequest.endDate), 'yyyy-MM-dd'),
        type: leaveRequest.type,
        reason: leaveRequest.reason,
        notes: leaveRequest.notes || '',
      });
    }
  }, [leaveRequest, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeaveRequest> }) =>
      updateLeaveRequest(id, data),
    onSuccess: () => {
      toast.success('Leave request updated successfully');
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update leave request');
    },
  });

  const onSubmit = (data: EditLeaveRequestFormValues) => {
    if (!leaveRequest) return;

    const updateData: Partial<LeaveRequest> = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };

    updateMutation.mutate({ id: leaveRequestId, data: updateData });
  };

  const calculateDuration = () => {
    const startDate = form.getValues('startDate');
    const endDate = form.getValues('endDate');
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const getLeaveTypeDescription = (type: LeaveType) => {
    switch (type) {
      case LeaveType.VACATION:
        return 'Paid vacation time';
      case LeaveType.SICK:
        return 'Medical leave for illness';
      case LeaveType.PERSONAL:
        return 'Personal time off';
      case LeaveType.UNPAID:
        return 'Leave without pay';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Leave Request
          </DialogTitle>
          <DialogDescription>
            Update leave request details for{' '}
            {leaveRequest?.employee 
              ? `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`
              : 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading leave request details...</p>
          </div>
        ) : leaveRequest ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Leave Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LeaveType.VACATION}>
                          <div>
                            <div className="font-medium">Vacation</div>
                            <div className="text-sm text-gray-500">{getLeaveTypeDescription(LeaveType.VACATION)}</div>
                          </div>
                        </SelectItem>
                        <SelectItem value={LeaveType.SICK}>
                          <div>
                            <div className="font-medium">Sick Leave</div>
                            <div className="text-sm text-gray-500">{getLeaveTypeDescription(LeaveType.SICK)}</div>
                          </div>
                        </SelectItem>
                        <SelectItem value={LeaveType.PERSONAL}>
                          <div>
                            <div className="font-medium">Personal Leave</div>
                            <div className="text-sm text-gray-500">{getLeaveTypeDescription(LeaveType.PERSONAL)}</div>
                          </div>
                        </SelectItem>
                        <SelectItem value={LeaveType.UNPAID}>
                          <div>
                            <div className="font-medium">Unpaid Leave</div>
                            <div className="text-sm text-gray-500">{getLeaveTypeDescription(LeaveType.UNPAID)}</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration Display */}
              {calculateDuration() > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Duration: {calculateDuration()} day{calculateDuration() !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a reason for your leave request..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Original Information */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Original Information</h4>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-gray-500">Original Dates:</span>{' '}
                    {format(new Date(leaveRequest.startDate), 'MMM dd, yyyy')} - {format(new Date(leaveRequest.endDate), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="text-gray-500">Original Type:</span>{' '}
                    {leaveRequest.type}
                  </div>
                  <div>
                    <span className="text-gray-500">Requested On:</span>{' '}
                    {format(new Date(leaveRequest.createdAt), 'PPP')}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
