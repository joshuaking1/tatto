import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getCustomerReport } from '@/services/reportsService';
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
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Star,
  Calendar,
} from 'lucide-react';

interface CustomerReportTabProps {
  dateRange: DateRange;
  branchId?: string;
  shouldFetch: boolean;
}

export const CustomerReportTab: React.FC<CustomerReportTabProps> = ({
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
    data: customerData,
    isLoading: customerLoading,
    error: customerError,
  } = useQuery({
    queryKey: ['customerReport', queryParams],
    queryFn: () => getCustomerReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  if (customerError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Error loading customer report data
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
            Select date range and click "Generate Report" to view customer analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (customerLoading || !customerData) {
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
  const topCustomersData = customerData.topCustomers.slice(0, 10).map(customer => ({
    name: customer.name,
    spend: customer.totalSpend,
    visits: customer.totalVisits,
  }));

  const customerSegmentData = [
    { name: 'New Customers', value: customerData.newCustomers, color: '#0088FE' },
    { name: 'Returning Customers', value: customerData.returningCustomers, color: '#00C49F' },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Customers"
          value={customerData.totalCustomers.toLocaleString()}
          icon={Users}
          description="Active customer base"
        />
        <KpiCard
          title="New Customers"
          value={customerData.newCustomers.toLocaleString()}
          icon={UserPlus}
          description="Customers acquired in period"
        />
        <KpiCard
          title="Returning Customers"
          value={customerData.returningCustomers.toLocaleString()}
          icon={TrendingUp}
          description="Existing customers"
        />
        <KpiCard
          title="Avg Customer Value"
          value={`$${customerData.averageCustomerValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Average lifetime value"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
            <CardDescription>New vs returning customer distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={customerSegmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerSegmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Customers
            </CardTitle>
            <CardDescription>Highest spending customers</CardDescription>
          </CardHeader>
          <CardContent>
            {topCustomersData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topCustomersData}>
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
                  <Bar dataKey="spend" fill="#8884d8" name="Total Spend" />
                  <Bar dataKey="visits" fill="#82ca9d" name="Visits" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Customer Metrics
            </CardTitle>
            <CardDescription>Key customer performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Total Customers</p>
                    <p className="text-sm text-gray-500">Active customer base</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{customerData.totalCustomers.toLocaleString()}</p>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">Customer Growth</p>
                    <p className="text-sm text-gray-500">New customers in period</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{customerData.newCustomers}</p>
                  <p className="text-sm text-green-500">
                    {customerData.totalCustomers > 0 
                      ? `${((customerData.newCustomers / customerData.totalCustomers) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="font-medium">Average Customer Value</p>
                    <p className="text-sm text-gray-500">Lifetime average spend</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ${customerData.averageCustomerValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Customer Leaderboard
            </CardTitle>
            <CardDescription>Detailed top customers information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customerData.topCustomers.slice(0, 10).map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${customer.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-500">{customer.totalVisits} visits</p>
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
