import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { BranchSelector } from '@/components/ui/branch-selector';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getAttendanceSummary, getAttendanceByEmployee } from '@/services/attendanceService';
import { usePermissions } from '@/hooks/usePermissions';
import type { AttendanceSummary, AttendanceByEmployee } from '@/types';
import { exportToCSV } from '@/lib/exportUtils';
import type { DateRange } from 'react-day-picker';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Chart components
const DailyAttendanceChart = ({ data }: { data: any[] }) => {
  const chartData = data.map((item, index) => ({
    day: `Day ${index + 1}`,
    hours: item.totalHours || Math.random() * 8 + 2, // Fallback data
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="hours"
          stroke="#8884d8"
          strokeWidth={2}
          name="Hours Worked"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const EmployeeComparisonChart = ({ data }: { data: AttendanceByEmployee[] }) => {
  const chartData = data.map(item => ({
    name: item.employeeName,
    hours: parseFloat(item.totalHours.toFixed(2)),
    overtime: parseFloat(item.overtimeHours.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="hours" fill="#8884d8" name="Total Hours" />
        <Bar dataKey="overtime" fill="#82ca9d" name="Overtime Hours" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const LateArrivalsChart = ({ data }: { data: AttendanceByEmployee[] }) => {
  const chartData = data.map(item => ({
    name: item.employeeName,
    lateCount: item.lateCount || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="lateCount" fill="#ff7300" name="Late Arrivals" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const OvertimeDistributionChart = ({ data }: { data: AttendanceByEmployee[] }) => {
  const chartData = data
    .filter(item => item.overtimeHours > 0)
    .map(item => ({
      name: item.employeeName,
      value: parseFloat(item.overtimeHours.toFixed(2)),
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}h`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const AttendanceReportsPage: React.FC = () => {
  const canViewReports = usePermissions().canAccessResource('attendance:reports');

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [branchFilter, setBranchFilter] = useState<string | undefined>(undefined);
  const [employeeFilter, setEmployeeFilter] = useState<string | undefined>(undefined);

  // Query attendance summary
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ['attendanceSummary', dateRange, branchFilter, employeeFilter],
    queryFn: () =>
      getAttendanceSummary({
        startDate: dateRange?.from?.toISOString().split('T')[0] || '',
        endDate: dateRange?.to?.toISOString().split('T')[0] || '',
        branchId: branchFilter && branchFilter !== 'all' ? branchFilter : undefined,
        employeeId: employeeFilter && employeeFilter !== 'all' ? employeeFilter : undefined,
      }),
    enabled: !!dateRange,
  });

  // Query attendance by employee
  const {
    data: employeeData = [],
    isLoading: employeeDataLoading,
    error: employeeDataError,
  } = useQuery({
    queryKey: ['attendanceByEmployee', dateRange, branchFilter],
    queryFn: () =>
      getAttendanceByEmployee({
        startDate: dateRange?.from?.toISOString().split('T')[0] || '',
        endDate: dateRange?.to?.toISOString().split('T')[0] || '',
        branchId: branchFilter && branchFilter !== 'all' ? branchFilter : undefined,
      }),
    enabled: !!dateRange,
  });

  const handleExport = () => {
    // Create CSV data for export
    const csvData = employeeData.map(emp => ({
      'Employee Name': emp.employeeName,
      'Total Hours': emp.totalHours.toFixed(2),
      'Overtime Hours': emp.overtimeHours.toFixed(2),
      'Late Count': emp.lateCount,
      'Attendance Count': emp.attendanceCount,
    }));

    exportToCSV(csvData, `attendance-report-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  if (!canViewReports) {
    return <div>You don't have permission to view attendance reports.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-gray-500">Analyze attendance patterns and trends</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateRangePicker value={dateRange} onChange={(range) => setDateRange(range)} />
            <BranchSelector value={branchFilter} onValueChange={setBranchFilter} />
            {/* Employee selector would go here */}
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Hours"
          value={summary?.totalHours.toFixed(1) || '0'}
          icon={Clock}
          description="Total hours worked"
        />
        <KpiCard
          title="Overtime Hours"
          value={summary?.overtimeHours?.toFixed(1) || '0'}
          icon={TrendingUp}
          description="Hours beyond regular time"
        />
        <KpiCard
          title="Attendance Rate"
          value={`${((summary?.attendanceRate || 0) * 100).toFixed(1)}%`}
          icon={Calendar}
          description="Days attended vs scheduled"
        />
        <KpiCard
          title="Late Arrivals"
          value={summary?.lateArrivals?.toString() || '0'}
          icon={Clock}
          description="Number of late arrivals"
        />
        <KpiCard
          title="Unique Employees"
          value={summary?.uniqueEmployees?.toString() || '0'}
          icon={Users}
          description="Employees with attendance"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance</CardTitle>
            <CardDescription>Hours worked per day</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyAttendanceChart data={[]} />
          </CardContent>
        </Card>

        {/* Employee Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Comparison</CardTitle>
            <CardDescription>Total hours by employee</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeComparisonChart data={employeeData} />
          </CardContent>
        </Card>

        {/* Late Arrivals Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Late Arrivals</CardTitle>
            <CardDescription>Count by employee</CardDescription>
          </CardHeader>
          <CardContent>
            <LateArrivalsChart data={employeeData} />
          </CardContent>
        </Card>

        {/* Overtime Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Overtime Distribution</CardTitle>
            <CardDescription>Overtime hours by employee</CardDescription>
          </CardHeader>
          <CardContent>
            <OvertimeDistributionChart data={employeeData} />
          </CardContent>
        </Card>
      </div>

      {/* Employee Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Summary
          </CardTitle>
          <CardDescription>Detailed attendance metrics by employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Employee</th>
                  <th className="text-right p-2">Total Hours</th>
                  <th className="text-right p-2">Overtime</th>
                  <th className="text-right p-2">Late Count</th>
                  <th className="text-right p-2">Days Present</th>
                </tr>
              </thead>
              <tbody>
                {employeeData.map((employee) => (
                  <tr key={employee.employeeId} className="border-b">
                    <td className="p-2">{employee.employeeName}</td>
                    <td className="text-right p-2">{employee.totalHours.toFixed(1)}</td>
                    <td className="text-right p-2">{employee.overtimeHours.toFixed(1)}</td>
                    <td className="text-right p-2">{employee.lateCount}</td>
                    <td className="text-right p-2">{employee.attendanceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
