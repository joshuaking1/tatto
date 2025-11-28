import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getInventoryReport } from '@/services/reportsService';
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
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Tag,
} from 'lucide-react';

interface InventoryReportTabProps {
  dateRange: DateRange;
  branchId?: string;
  shouldFetch: boolean;
}

export const InventoryReportTab: React.FC<InventoryReportTabProps> = ({
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
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: ['inventoryReport', queryParams],
    queryFn: () => getInventoryReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  if (inventoryError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Error loading inventory report data
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
            Select date range and click "Generate Report" to view inventory analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  if (inventoryLoading || !inventoryData) {
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
  const categoryData = inventoryData.itemsByCategory.map(item => ({
    name: item.categoryName,
    value: item.totalValue,
    count: item.itemCount,
  }));

  const supplierData = inventoryData.itemsBySupplier.map(item => ({
    name: item.supplierName,
    value: item.totalValue,
    count: item.itemCount,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Items"
          value={inventoryData.totalItems.toLocaleString()}
          icon={Package}
          description="Unique inventory items"
        />
        <KpiCard
          title="Total Value"
          value={`$${inventoryData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Current stock value"
        />
        <KpiCard
          title="Low Stock"
          value={inventoryData.lowStockCount.toLocaleString()}
          icon={AlertTriangle}
          description="Items below reorder level"
        />
        <KpiCard
          title="Turnover Rate"
          value={`${inventoryData.turnoverRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="Inventory movement rate"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Value by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Value by Category</CardTitle>
            <CardDescription>Total inventory value per category</CardDescription>
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
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
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

        {/* Items by Supplier */}
        <Card>
          <CardHeader>
            <CardTitle>Items by Supplier</CardTitle>
            <CardDescription>Inventory value by supplier</CardDescription>
          </CardHeader>
          <CardContent>
            {supplierData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={supplierData}>
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
                  <Bar dataKey="value" fill="#8884d8" name="Total Value" />
                  <Bar dataKey="count" fill="#82ca9d" name="Item Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No supplier data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryData.lowStockItems.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {inventoryData.lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Current: {item.currentStock} | Reorder at: {item.reorderLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.unitPrice.toFixed(2)}</p>
                      <p className="text-sm text-orange-500">Low Stock</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>All items are adequately stocked</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Category Summary
            </CardTitle>
            <CardDescription>Inventory breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-gray-500">{category.count} items</p>
                      </div>
                    </div>
                    <p className="font-medium">
                      ${category.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
