import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings,
  Clock,
  MapPin,
  AlertCircle,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getAttendanceSettings, updateAttendanceSettings } from '@/services/attendanceSettingsService';
import { usePermissions } from '@/hooks/usePermissions';
import type { AttendanceSettings } from '@/types';
import { toast } from 'sonner';

// Form validation schema
const settingsSchema = z.object({
  workStartTime: z.number().min(0).max(1439),
  workEndTime: z.number().min(0).max(1439),
  gracePeriodMinutes: z.number().min(0).max(60),
  overtimeThreshold: z.number().min(0).max(24),
  requireLocation: z.boolean(),
  autoClockOutHours: z.number().min(1).max(24),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const AttendanceSettingsPage: React.FC = () => {
  const canManageSettings = usePermissions().canAccessResource('attendance:settings');

  // Query settings
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['attendanceSettings'],
    queryFn: getAttendanceSettings,
  });

  // Form setup
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      workStartTime: 540, // 9:00 AM
      workEndTime: 1020, // 5:00 PM
      gracePeriodMinutes: 15,
      overtimeThreshold: 8.0,
      requireLocation: false,
      autoClockOutHours: 12,
    },
  });

  // Update form values when settings are loaded
  React.useEffect(() => {
    if (settings) {
      form.reset({
        workStartTime: settings.workStartTime,
        workEndTime: settings.workEndTime,
        gracePeriodMinutes: settings.gracePeriodMinutes,
        overtimeThreshold: settings.overtimeThreshold,
        requireLocation: settings.requireLocation,
        autoClockOutHours: settings.autoClockOutHours,
      });
    }
  }, [settings, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateAttendanceSettings,
    onSuccess: () => {
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings');
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    updateMutation.mutate(data);
  };

  if (!canManageSettings) {
    return <div>You don't have permission to manage attendance settings.</div>;
  }

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  if (error) {
    return <div>Error loading settings.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Attendance Settings
        </h1>
        <p className="text-gray-500">Configure attendance policies and work hours</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Work Hours Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Work Hours
              </CardTitle>
              <CardDescription>
                Set standard work hours and grace periods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          value={minutesToTime(field.value)}
                          onChange={(e) => field.onChange(timeToMinutes(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Standard work day start time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          value={minutesToTime(field.value)}
                          onChange={(e) => field.onChange(timeToMinutes(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Standard work day end time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gracePeriodMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace Period (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Minutes allowed after start time before marking as late
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Overtime Section */}
          <Card>
            <CardHeader>
              <CardTitle>Overtime Settings</CardTitle>
              <CardDescription>
                Configure overtime calculation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="overtimeThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime Threshold (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Hours worked per day before overtime is calculated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Policies Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Policies
              </CardTitle>
              <CardDescription>
                Additional attendance policies and requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="requireLocation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Require Location</FormLabel>
                      <FormDescription className="text-sm">
                        Require location check-in when clocking in
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoClockOutHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto Clock-Out (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Automatically clock out employees after this many hours
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
