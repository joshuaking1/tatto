import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getStaffPerformanceReport } from '@/services/reportsService';
import { useAuthStore } from '@/store/authStore';
import type { DateRange } from 'react-day-picker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  TrendingUp,
  DollarSign,
  Award,
  Calendar,
  Clock,
  Target,
} from 'lucide-react';

interface StaffPerformanceReportTabProps {
  dateRange: DateRange;
  branchId?: string;
  shouldFetch: boolean;
}

export const StaffPerformanceReportTab: React.FC<StaffPerformanceReportTabProps> = ({
  dateRange,
  branchId,
  shouldFetch,
}) => {
  const { accessToken } = useAuthStore();

  const queryParams = {
    startDate: dateRange?.from?.toISOString().split('T')[0] || '',
    endDate: dateRange?.to?.toISOString().split('T')[0] || '',
    branchId: branchId && branchId !== 'all' ? branchId : undefined,
  };

  const {
    data: staffData,
    isLoading: staffLoading,
    error: staffError,
  } = useQuery({
    queryKey: ['staffPerformanceReport', queryParams],
    queryFn: () => getStaffPerformanceReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  if (staffError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Error loading staff performance report data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shouldFetch) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            Select date range and click "Generate Report" to view staff performance analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (staffLoading || !staffData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const salesPerformanceData = staffData.staffPerformance
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10)
    .map(staff => ({
      name: staff.staffName,
      sales: staff.totalSales,
      commissions: staff.totalCommissions,
    }));

  const appointmentsData = staffData.staffPerformance
    .sort((a, b) => b.appointmentsCompleted - a.appointmentsCompleted)
    .slice(0, 10)
    .map(staff => ({
      name: staff.staffName,
      completed: staff.appointmentsCompleted,
      total: staff.totalAppointments,
    }));

  const attendanceData = staffData.staffPerformance
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 10)
    .map(staff => ({
      name: staff.staffName,
      hours: staff.totalHours,
      days: staff.attendanceDays,
    }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Staff"
          value={staffData.totalStaff.toLocaleString()}
          icon={Users}
          description="Active staff members"
        />
        <KpiCard
          title="Top Performer"
          value={staffData.topPerformer}
          icon={Award}
          description="Highest sales performer"
        />
        <KpiCard
          title="Total Commissions"
          value={`$${staffData.totalCommissions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Total commissions paid"
        />
        <KpiCard
          title="Avg Productivity"
          value={staffData.averageProductivity.toFixed(1)}
          icon={Target}
          description="Average appointments completed"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Sales Performance
            </CardTitle>
            <CardDescription>Revenue and commissions by staff</CardDescription>
          </CardHeader>
          <CardContent>
            {salesPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                  <Bar dataKey="commissions" fill="#82ca9d" name="Commissions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No sales performance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointments Performance
            </CardTitle>
            <CardDescription>Completed vs total appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={appointmentsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#00C49F" name="Completed" />
                  <Bar dataKey="total" fill="#8884d8" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No appointment performance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance Performance
            </CardTitle>
            <CardDescription>Hours worked and attendance days</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" fill="#FFBB28" name="Hours Worked" />
                  <Bar dataKey="days" fill="#8884d8" name="Days Attended" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Summary
            </CardTitle>
            <CardDescription>Detailed staff performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {staffData.staffPerformance
                .sort((a, b) => b.totalSales - a.totalSales)
                .slice(0, 10)
                .map((staff, index) => (
                  <div key={staff.staffId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{staff.staffName}</p>
                        <p className="text-sm text-gray-500">{staff.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${staff.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {staff.appointmentsCompleted} appointments
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
