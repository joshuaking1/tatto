import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getSalesReport, getSalesTimeSeries } from '@/services/reportsService';
import { useAuthStore } from '@/store/authStore';
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
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Users,
  Package,
} from 'lucide-react';

interface SalesReportTabProps {
  dateRange: DateRange;
  branchId?: string;
  shouldFetch: boolean;
}

export const SalesReportTab: React.FC<SalesReportTabProps> = ({
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

  // Fetch sales report data
  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useQuery({
    queryKey: ['salesReport', queryParams],
    queryFn: () => getSalesReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  // Fetch time series data
  const {
    data: timeSeriesData,
    isLoading: timeSeriesLoading,
  } = useQuery({
    queryKey: ['salesTimeSeries', { ...queryParams, groupBy: 'day' }],
    queryFn: () => getSalesTimeSeries(accessToken || '', { ...queryParams, groupBy: 'day' }),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  if (salesError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Error loading sales report data
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
            Select date range and click "Generate Report" to view sales analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (salesLoading || !salesData) {
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
          {[...Array(4)].map((_, i) => (
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
  const paymentMethodData = salesData.salesByPaymentMethod.map(item => ({
    name: item.paymentMethod,
    value: item.totalAmount,
    count: item.count,
  }));

  const serviceData = salesData.salesByService
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
    .map(item => ({
      name: item.serviceName,
      revenue: item.totalRevenue,
      quantity: item.totalQuantity,
    }));

  const staffData = salesData.salesByStaff
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
    .map(item => ({
      name: item.staffName,
      revenue: item.totalRevenue,
      count: item.count,
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sales"
          value={salesData.totalSales.toLocaleString()}
          icon={ShoppingCart}
          description="Number of transactions"
        />
        <KpiCard
          title="Total Revenue"
          value={`$${salesData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Gross revenue generated"
        />
        <KpiCard
          title="Average Order"
          value={`$${salesData.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Average transaction value"
        />
        <KpiCard
          title="Top Payment"
          value={paymentMethodData[0]?.name || 'N/A'}
          icon={CreditCard}
          description="Most used payment method"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily sales performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData && timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalSales"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Sales Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No payment method data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Top Services</CardTitle>
            <CardDescription>Highest revenue generating services</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={serviceData}>
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
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar dataKey="quantity" fill="#82ca9d" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No service data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>Sales performance by staff members</CardDescription>
          </CardHeader>
          <CardContent>
            {staffData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={staffData}>
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
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar dataKey="count" fill="#82ca9d" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No staff performance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
