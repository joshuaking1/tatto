import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getPayrollReport } from '@/services/reportsService';
import { useAuthStore } from '@/store/authStore';
import type { DateRange } from 'react-day-picker';
import {
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
  TrendingDown,
  Wallet,
  Users,
  Calendar,
  FileText,
} from 'lucide-react';

interface PayrollReportTabProps {
  dateRange: DateRange;
  branchId?: string;
  shouldFetch: boolean;
}

export const PayrollReportTab: React.FC<PayrollReportTabProps> = ({
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
    data: payrollData,
    isLoading: payrollLoading,
    error: payrollError,
  } = useQuery({
    queryKey: ['payrollReport', queryParams],
    queryFn: () => getPayrollReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  if (payrollError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Error loading payroll report data
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
            Select date range and click "Generate Report" to view payroll analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payrollLoading || !payrollData) {
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
  const payrollByStaffData = payrollData.payrollByStaff
    .sort((a, b) => b.grossPay - a.grossPay)
    .slice(0, 10)
    .map(payroll => ({
      name: payroll.staffName,
      gross: payroll.grossPay,
      net: payroll.netPay,
      deductions: payroll.totalDeductions,
    }));

  const payrollComparisonData = [
    { name: 'Gross Pay', value: payrollData.totalGrossPay, color: '#0088FE' },
    { name: 'Deductions', value: payrollData.totalDeductions, color: '#FF8042' },
    { name: 'Net Pay', value: payrollData.totalNetPay, color: '#00C49F' },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Gross Pay"
          value={`$${payrollData.totalGrossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Before deductions"
        />
        <KpiCard
          title="Total Deductions"
          value={`$${payrollData.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingDown}
          description="Total deductions"
        />
        <KpiCard
          title="Total Net Pay"
          value={`$${payrollData.totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Wallet}
          description="After deductions"
        />
        <KpiCard
          title="Average Salary"
          value={`$${payrollData.averageSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Users}
          description="Per staff member"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Breakdown</CardTitle>
            <CardDescription>Gross vs Net Pay comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={payrollComparisonData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {payrollComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payroll by Staff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payroll by Staff
            </CardTitle>
            <CardDescription>Individual payroll breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {payrollByStaffData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={payrollByStaffData}>
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
                  <Bar dataKey="gross" fill="#8884d8" name="Gross Pay" />
                  <Bar dataKey="net" fill="#00C49F" name="Net Pay" />
                  <Bar dataKey="deductions" fill="#FF8042" name="Deductions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No payroll data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payroll Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll Metrics
            </CardTitle>
            <CardDescription>Key payroll statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Total Gross Pay</p>
                    <p className="text-sm text-gray-500">Before deductions</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ${payrollData.totalGrossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="font-medium">Total Deductions</p>
                    <p className="text-sm text-gray-500">All deductions combined</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ${payrollData.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-red-500">
                    {payrollData.totalGrossPay > 0 
                      ? `${((payrollData.totalDeductions / payrollData.totalGrossPay) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">Total Net Pay</p>
                    <p className="text-sm text-gray-500">After deductions</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ${payrollData.totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payroll Details
            </CardTitle>
            <CardDescription>Individual payroll records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {payrollData.payrollByStaff
                .sort((a, b) => b.grossPay - a.grossPay)
                .slice(0, 10)
                .map((payroll, index) => (
                  <div key={payroll.staffId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{payroll.staffName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(payroll.payPeriodStart).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${payroll.netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500">
                        Gross: ${payroll.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
