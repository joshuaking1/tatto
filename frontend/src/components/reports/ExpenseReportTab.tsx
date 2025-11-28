import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getExpenseReport } from '@/services/reportsService';
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
  DollarSign,
  TrendingUp,
  Receipt,
  Building,
  AlertTriangle,
  Tag,
} from 'lucide-react';

interface ExpenseReportTabProps {
  dateRange: DateRange;
  branchId?: string;
  shouldFetch: boolean;
}

export const ExpenseReportTab: React.FC<ExpenseReportTabProps> = ({
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
    data: expenseData,
    isLoading: expenseLoading,
    error: expenseError,
  } = useQuery({
    queryKey: ['expenseReport', queryParams],
    queryFn: () => getExpenseReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  if (expenseError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Error loading expense report data
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
            Select date range and click "Generate Report" to view expense analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expenseLoading || !expenseData) {
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
  const categoryData = expenseData.expensesByCategory
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
    .map(category => ({
      name: category.categoryName,
      amount: category.totalAmount,
      count: category.count,
    }));

  const vendorData = expenseData.expensesByVendor
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
    .map(vendor => ({
      name: vendor.vendorName,
      amount: vendor.totalAmount,
      count: vendor.count,
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Expenses"
          value={`$${expenseData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Total spending"
        />
        <KpiCard
          title="Top Category"
          value={expenseData.topExpenseCategory}
          icon={Tag}
          description="Highest expense category"
        />
        <KpiCard
          title="Average Expense"
          value={`$${expenseData.averageExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Average transaction amount"
        />
        <KpiCard
          title="Expense Count"
          value={expenseData.expenseCount.toLocaleString()}
          icon={Receipt}
          description="Number of expenses"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Spending distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Vendor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Expenses by Vendor
            </CardTitle>
            <CardDescription>Top vendors by spending</CardDescription>
          </CardHeader>
          <CardContent>
            {vendorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={vendorData}>
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
                  <Bar dataKey="amount" fill="#8884d8" name="Total Amount" />
                  <Bar dataKey="count" fill="#82ca9d" name="Transaction Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No vendor data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Expense Metrics
            </CardTitle>
            <CardDescription>Key expense statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Total Expenses</p>
                    <p className="text-sm text-gray-500">All expenses in period</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ${expenseData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">Average Expense</p>
                    <p className="text-sm text-gray-500">Per transaction</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ${expenseData.averageExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Receipt className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="font-medium">Transaction Count</p>
                    <p className="text-sm text-gray-500">Number of expenses</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{expenseData.expenseCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Category Breakdown
            </CardTitle>
            <CardDescription>Detailed expense categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expenseData.expensesByCategory
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 10)
                .map((category, index) => (
                  <div key={category.categoryName} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <div>
                        <p className="font-medium">{category.categoryName}</p>
                        <p className="text-sm text-gray-500">{category.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${category.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {expenseData.totalExpenses > 0 
                          ? `${((category.totalAmount / expenseData.totalExpenses) * 100).toFixed(1)}%`
                          : '0%'
                        }
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
