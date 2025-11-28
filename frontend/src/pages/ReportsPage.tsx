import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { BranchSelector } from '@/components/ui/branch-selector';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { 
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getAppointmentReport,
  getStaffPerformanceReport,
  getPayrollReport,
  getExpenseReport,
} from '@/services/reportsService';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import {
  FileBarChart,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Package,
  Clock,
  Download,
} from 'lucide-react';
import { 
  exportToCSVEnhanced, 
  exportToExcel, 
  exportReportToPDF 
} from '@/lib/exportUtils';

// Import tab components
import { SalesReportTab } from '@/components/reports/SalesReportTab';
import { InventoryReportTab } from '@/components/reports/InventoryReportTab';
import { CustomerReportTab } from '@/components/reports/CustomerReportTab';
import { AppointmentReportTab } from '@/components/reports/AppointmentReportTab';
import { StaffPerformanceReportTab } from '@/components/reports/StaffPerformanceReportTab';
import { PayrollReportTab } from '@/components/reports/PayrollReportTab';
import { ExpenseReportTab } from '@/components/reports/ExpenseReportTab';

export const ReportsPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const { hasAnyRole } = usePermissions();
  
  // Check permissions
  const canViewReports = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canViewFinancialReports = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canViewAttendanceReports = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.ARTIST, UserRole.RECEPTIONIST]);
  
  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You don't have permission to view reports.</p>
      </div>
    );
  }

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [branchFilter, setBranchFilter] = useState<string | undefined>(undefined);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');

  // Common query parameters
  const queryParams = {
    startDate: dateRange?.from?.toISOString().split('T')[0] || '',
    endDate: dateRange?.to?.toISOString().split('T')[0] || '',
    branchId: branchFilter && branchFilter !== 'all' ? branchFilter : undefined,
  };

  // Fetch data for all reports
  const { data: salesData } = useQuery({
    queryKey: ['salesReport', queryParams],
    queryFn: () => getSalesReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['inventoryReport', queryParams],
    queryFn: () => getInventoryReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  const { data: customerData } = useQuery({
    queryKey: ['customerReport', queryParams],
    queryFn: () => getCustomerReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  const { data: appointmentData } = useQuery({
    queryKey: ['appointmentReport', queryParams],
    queryFn: () => getAppointmentReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staffPerformanceReport', queryParams],
    queryFn: () => getStaffPerformanceReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  const { data: payrollData } = useQuery({
    queryKey: ['payrollReport', queryParams],
    queryFn: () => getPayrollReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  const { data: expenseData } = useQuery({
    queryKey: ['expenseReport', queryParams],
    queryFn: () => getExpenseReport(accessToken || '', queryParams),
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to,
  });

  const handleGenerateReport = () => {
    setShouldFetch(true);
    toast.success('Report generation started');
  };

  const handleExportCSV = () => {
    const reportData = getReportDataForActiveTab();
    if (!reportData || reportData.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const filename = `${activeTab}-report-${format(new Date(), 'yyyy-MM-dd')}`;
    exportToCSVEnhanced(reportData, filename);
    toast.success('CSV exported successfully');
  };

  const handleExportPDF = () => {
    const reportData = getReportDataForActiveTab();
    if (!reportData || reportData.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const filename = `${activeTab}-report-${format(new Date(), 'yyyy-MM-dd')}`;
    const pdfData = {
      title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`,
      dateRange: `${format(dateRange?.from || new Date(), 'MMM dd, yyyy')} - ${format(dateRange?.to || new Date(), 'MMM dd, yyyy')}`,
      sections: [{
        title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data`,
        data: reportData,
        headers: Object.keys(reportData[0] || {}),
      }],
    };
    exportReportToPDF(pdfData, filename);
    toast.success('PDF exported successfully');
  };

  const handleExportExcel = () => {
    const reportData = getReportDataForActiveTab();
    if (!reportData || reportData.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const filename = `${activeTab}-report-${format(new Date(), 'yyyy-MM-dd')}`;
    exportToExcel(reportData, filename);
    toast.success('Excel exported successfully');
  };

  const getReportDataForActiveTab = () => {
    switch (activeTab) {
      case 'sales':
        return salesData ? [
          { metric: 'Total Sales', value: salesData.totalSales },
          { metric: 'Total Revenue', value: salesData.totalRevenue },
          { metric: 'Average Order Value', value: salesData.averageOrderValue },
          { metric: 'Total Tax', value: salesData.totalTax },
          { metric: 'Total Discount', value: salesData.totalDiscount },
          ...(salesData.salesByService || []),
          ...(salesData.salesByStaff || []),
        ] : [];
      case 'inventory':
        return inventoryData ? [
          { metric: 'Total Items', value: inventoryData.totalItems },
          { metric: 'Total Value', value: inventoryData.totalValue },
          { metric: 'Low Stock Count', value: inventoryData.lowStockCount },
          { metric: 'Turnover Rate', value: inventoryData.turnoverRate },
          ...(inventoryData.itemsByCategory || []),
          ...(inventoryData.itemsBySupplier || []),
          ...(inventoryData.lowStockItems || []),
        ] : [];
      case 'customers':
        return customerData ? [
          { metric: 'Total Customers', value: customerData.totalCustomers },
          { metric: 'New Customers', value: customerData.newCustomers },
          { metric: 'Returning Customers', value: customerData.returningCustomers },
          { metric: 'Average Customer Value', value: customerData.averageCustomerValue },
          ...(customerData.topCustomers || []),
        ] : [];
      case 'appointments':
        return appointmentData ? [
          { metric: 'Total Appointments', value: appointmentData.totalAppointments },
          { metric: 'Confirmed', value: appointmentData.confirmedCount },
          { metric: 'Cancelled', value: appointmentData.cancelledCount },
          { metric: 'Completed', value: appointmentData.completedCount },
          { metric: 'No Shows', value: appointmentData.noShowCount },
          { metric: 'Cancellation Rate', value: appointmentData.cancellationRate },
          ...(appointmentData.statusBreakdown || []),
          ...(appointmentData.artistUtilization || []),
        ] : [];
      case 'staff':
        return staffData ? [
          { metric: 'Total Staff', value: staffData.totalStaff },
          { metric: 'Top Performer', value: staffData.topPerformer },
          { metric: 'Total Commissions', value: staffData.totalCommissions },
          { metric: 'Average Productivity', value: staffData.averageProductivity },
          ...(staffData.staffPerformance || []),
        ] : [];
      case 'payroll':
        return payrollData ? [
          { metric: 'Total Gross Pay', value: payrollData.totalGrossPay },
          { metric: 'Total Deductions', value: payrollData.totalDeductions },
          { metric: 'Total Net Pay', value: payrollData.totalNetPay },
          { metric: 'Average Salary', value: payrollData.averageSalary },
          { metric: 'Payroll Count', value: payrollData.payrollCount },
          ...(payrollData.payrollByStaff || []),
        ] : [];
      case 'expenses':
        return expenseData ? [
          { metric: 'Total Expenses', value: expenseData.totalExpenses },
          { metric: 'Average Expense', value: expenseData.averageExpense },
          ...(expenseData.expensesByCategory || []),
          ...(expenseData.expensesByVendor || []),
        ] : [];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Advanced Reports</h1>
          <p className="text-gray-500">Comprehensive analytics and insights for your tattoo shop</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Select date range and filters to generate comprehensive reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateRangePicker 
              value={dateRange} 
              onChange={(range) => setDateRange(range)} 
            />
            <BranchSelector 
              value={branchFilter} 
              onValueChange={setBranchFilter} 
            />
            <Button 
              onClick={handleGenerateReport}
              className="w-full"
              disabled={!dateRange?.from || !dateRange?.to}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-8">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <SalesReportTab 
            dateRange={dateRange}
            branchId={branchFilter}
            shouldFetch={shouldFetch}
          />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <InventoryReportTab 
            dateRange={dateRange}
            branchId={branchFilter}
            shouldFetch={shouldFetch}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomerReportTab 
            dateRange={dateRange}
            branchId={branchFilter}
            shouldFetch={shouldFetch}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <AppointmentReportTab 
            dateRange={dateRange}
            branchId={branchFilter}
            shouldFetch={shouldFetch}
          />
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <StaffPerformanceReportTab 
            dateRange={dateRange}
            branchId={branchFilter}
            shouldFetch={shouldFetch}
          />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <PayrollReportTab 
            dateRange={dateRange}
            branchId={branchFilter}
            shouldFetch={shouldFetch}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseReportTab 
            dateRange={dateRange}
            branchId={branchFilter}
            shouldFetch={shouldFetch}
          />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance Reports
              </CardTitle>
              <CardDescription>
                Staff attendance, punctuality, and work hours analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Attendance reports are available in the dedicated Attendance section</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = '/attendance/reports'}
                >
                  Go to Attendance Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
