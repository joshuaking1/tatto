// React import not required with modern JSX transform
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  Plus,
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
import { createLeaveRequest } from '@/services/leaveRequestsService';
import { LeaveType } from '@/types';
import { toast } from 'sonner';

// Form validation schema
const createLeaveRequestSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.nativeEnum(LeaveType),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type CreateLeaveRequestFormValues = z.infer<typeof createLeaveRequestSchema>;

interface CreateLeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateLeaveRequestDialog({ open, onOpenChange, onSuccess }: CreateLeaveRequestDialogProps) {
  // Form setup
  const form = useForm<CreateLeaveRequestFormValues>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      type: LeaveType.VACATION,
      reason: '',
      notes: '',
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      toast.success('Leave request created successfully');
      onSuccess();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Failed to create leave request');
    },
  });

  const onSubmit = (data: CreateLeaveRequestFormValues) => {
    createMutation.mutate(data);
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
            <Plus className="h-5 w-5" />
            Request Leave
          </DialogTitle>
          <DialogDescription>
            Submit a new leave request for approval
          </DialogDescription>
        </DialogHeader>

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
                disabled={createMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
