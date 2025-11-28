import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getAppointmentReport } from '@/services/reportsService';
import { useAuthStore } from '@/store/authStore';
import type { DateRange } from 'react-day-picker';
import {
  PieChart,
  Pie,
  Cell,
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
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
} from 'lucide-react';

interface AppointmentReportTabProps {
  dateRange: DateRange;
  branchId?: string;
  shouldFetch: boolean;
}

export const AppointmentReportTab: React.FC<AppointmentReportTabProps> = ({
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
    data: appointmentData,
    isLoading: appointmentLoading,
    error: appointmentError,
  } = useQuery({
    queryKey: ['appointmentReport', queryParams],
    queryFn: () => getAppointmentReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  if (appointmentError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Error loading appointment report data
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
            Select date range and click "Generate Report" to view appointment analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointmentLoading || !appointmentData) {
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
  const statusData = appointmentData.statusBreakdown.map(item => ({
    name: item.status,
    value: item.count,
  }));

  const artistData = appointmentData.artistUtilization
    .sort((a, b) => b.totalAppointments - a.totalAppointments)
    .slice(0, 10)
    .map(item => ({
      name: item.artistName,
      appointments: item.totalAppointments,
    }));

  const COLORS = {
    CONFIRMED: '#0088FE',
    CANCELLED: '#FF8042',
    COMPLETED: '#00C49F',
    NO_SHOW: '#FFBB28',
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Appointments"
          value={appointmentData.totalAppointments.toLocaleString()}
          icon={Calendar}
          description="All scheduled appointments"
        />
        <KpiCard
          title="Confirmed"
          value={appointmentData.confirmedCount.toLocaleString()}
          icon={CheckCircle}
          description="Confirmed bookings"
        />
        <KpiCard
          title="Cancellation Rate"
          value={`${appointmentData.cancellationRate.toFixed(1)}%`}
          icon={XCircle}
          description="Cancelled appointments"
        />
        <KpiCard
          title="Completed"
          value={appointmentData.completedCount.toLocaleString()}
          icon={Clock}
          description="Successfully completed"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
            <CardDescription>Distribution of appointment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Artist Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Artist Utilization
            </CardTitle>
            <CardDescription>Appointments by artist</CardDescription>
          </CardHeader>
          <CardContent>
            {artistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={artistData}>
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
                  <Bar dataKey="appointments" fill="#8884d8" name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No artist utilization data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Appointment Metrics
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Total Appointments</p>
                    <p className="text-sm text-gray-500">All scheduled bookings</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{appointmentData.totalAppointments}</p>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">Completion Rate</p>
                    <p className="text-sm text-gray-500">Successfully completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{appointmentData.completedCount}</p>
                  <p className="text-sm text-green-500">
                    {appointmentData.totalAppointments > 0 
                      ? `${((appointmentData.completedCount / appointmentData.totalAppointments) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-medium">Cancellation Rate</p>
                    <p className="text-sm text-gray-500">Cancelled appointments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{appointmentData.cancellationRate.toFixed(1)}%</p>
                  <p className="text-sm text-orange-500">{appointmentData.cancelledCount} cancelled</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status Breakdown
            </CardTitle>
            <CardDescription>Detailed appointment status information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appointmentData.statusBreakdown.map(status => (
                <div key={status.status} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[status.status as keyof typeof COLORS] || '#8884d8' }}
                    ></div>
                    <div>
                      <p className="font-medium capitalize">{status.status.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        {appointmentData.totalAppointments > 0 
                          ? `${((status.count / appointmentData.totalAppointments) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">{status.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
