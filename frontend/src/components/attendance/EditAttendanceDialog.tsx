import * as React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Edit,
  Save,
  X,
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
import { getAttendanceById, updateAttendance } from '@/services/attendanceService';
import { AttendanceStatus } from '@/types';
import type { Attendance } from '@/types';
import { toast } from 'sonner';

// Form validation schema
const editAttendanceSchema = z.object({
  clockOutTime: z.string().optional(),
  totalHours: z.number().positive().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
});

type EditAttendanceFormValues = z.infer<typeof editAttendanceSchema>;

interface EditAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string;
  onSuccess: () => void;
}

export function EditAttendanceDialog({ open, onOpenChange, attendanceId, onSuccess }: EditAttendanceDialogProps) {
  // Query attendance details
  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', attendanceId],
    queryFn: () => getAttendanceById(attendanceId),
    enabled: open && !!attendanceId,
  });

  // Form setup
  const form = useForm<EditAttendanceFormValues>({
    resolver: zodResolver(editAttendanceSchema),
    defaultValues: {
      clockOutTime: '',
      notes: '',
      status: AttendanceStatus.CLOCKED_OUT,
    },
  });

  // Update form values when attendance is loaded
  React.useEffect(() => {
    if (attendance) {
      form.reset({
        clockOutTime: attendance.clockOutTime 
          ? format(new Date(attendance.clockOutTime), "yyyy-MM-dd'T'HH:mm")
          : '',
        totalHours: attendance.totalHours || 0,
        notes: attendance.notes || '',
        status: attendance.status,
      });
    }
  }, [attendance, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Attendance> }) =>
      updateAttendance(id, data),
    onSuccess: () => {
      toast.success('Attendance updated successfully');
      onSuccess();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update attendance');
    },
  });

  const onSubmit = (data: EditAttendanceFormValues) => {
    if (!attendance) return;

    const updateData: Partial<Attendance> = {
      ...data,
      clockOutTime: data.clockOutTime ? new Date(data.clockOutTime).toISOString() : null,
    };

    updateMutation.mutate({ id: attendanceId, data: updateData });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Attendance
          </DialogTitle>
          <DialogDescription>
            Update attendance details for{' '}
            {attendance?.employee 
              ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
              : 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading attendance details...</p>
          </div>
        ) : attendance ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Clock Out Time */}
              <FormField
                control={form.control}
                name="clockOutTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock Out Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Hours */}
              <FormField
                control={form.control}
                name="totalHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AttendanceStatus.CLOCKED_IN}>Clocked In</SelectItem>
                        <SelectItem value={AttendanceStatus.CLOCKED_OUT}>Clocked Out</SelectItem>
                        <SelectItem value={AttendanceStatus.INCOMPLETE}>Incomplete</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this attendance record..."
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
                    <span className="text-gray-500">Clock In:</span>{' '}
                    {format(new Date(attendance.clockInTime), 'PPp')}
                  </div>
                  {attendance.clockOutTime && (
                    <div>
                      <span className="text-gray-500">Clock Out:</span>{' '}
                      {format(new Date(attendance.clockOutTime), 'PPp')}
                    </div>
                  )}
                  {attendance.totalHours && (
                    <div>
                      <span className="text-gray-500">Original Hours:</span>{' '}
                      {attendance.totalHours.toFixed(2)}h
                    </div>
                  )}
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
