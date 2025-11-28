import apiClient from './apiClient';
import { z } from 'zod';

// Base report query schema
const ReportDateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  branchId: z.string().optional(),
});

// Sales report schemas
const SalesReportQuerySchema = ReportDateRangeSchema.extend({
  staffId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER']).optional(),
  serviceId: z.string().optional(),
});

const SalesTimeSeriesQuerySchema = SalesReportQuerySchema.extend({
  groupBy: z.enum(['day', 'week', 'month']),
});

// Inventory report schemas
const InventoryReportQuerySchema = ReportDateRangeSchema.extend({
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
});

// Customer report schemas
const CustomerReportQuerySchema = ReportDateRangeSchema.extend({
  serviceId: z.string().optional(),
});

// Appointment report schemas
const AppointmentReportQuerySchema = ReportDateRangeSchema.extend({
  artistId: z.string().optional(),
  status: z.string().optional(),
});

// Staff report schemas
const StaffReportQuerySchema = ReportDateRangeSchema.extend({
  staffId: z.string().optional(),
});

// Payroll report schemas
const PayrollReportQuerySchema = ReportDateRangeSchema.extend({
  staffId: z.string().optional(),
});

// Expense report schemas
const ExpenseReportQuerySchema = ReportDateRangeSchema.extend({
  categoryId: z.string().optional(),
  vendor: z.string().optional(),
});

// Response schemas
const SalesReportDataSchema = z.object({
  totalSales: z.number(),
  totalRevenue: z.number(),
  averageOrderValue: z.number(),
  totalTax: z.number(),
  totalDiscount: z.number(),
  salesByPaymentMethod: z.array(z.object({
    paymentMethod: z.string(),
    totalAmount: z.number(),
    count: z.number(),
  })),
  salesByService: z.array(z.object({
    serviceId: z.string(),
    serviceName: z.string(),
    totalQuantity: z.number(),
    totalRevenue: z.number(),
    count: z.number(),
  })),
  salesByStaff: z.array(z.object({
    staffId: z.string(),
    staffName: z.string(),
    totalRevenue: z.number(),
    count: z.number(),
  })),
});

const InventoryReportDataSchema = z.object({
  totalItems: z.number(),
  totalValue: z.number(),
  lowStockCount: z.number(),
  turnoverRate: z.number(),
  itemsByCategory: z.array(z.object({
    categoryName: z.string(),
    itemCount: z.number(),
    totalValue: z.number(),
  })),
  itemsBySupplier: z.array(z.object({
    supplierName: z.string(),
    itemCount: z.number(),
    totalValue: z.number(),
  })),
  lowStockItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    currentStock: z.number(),
    reorderLevel: z.number(),
    unitPrice: z.number(),
  })),
});

const CustomerReportDataSchema = z.object({
  totalCustomers: z.number(),
  newCustomers: z.number(),
  returningCustomers: z.number(),
  averageCustomerValue: z.number(),
  topCustomers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    totalSpend: z.number(),
    totalVisits: z.number(),
    lastVisit: z.string().nullable(),
  })),
});

const AppointmentReportDataSchema = z.object({
  totalAppointments: z.number(),
  confirmedCount: z.number(),
  cancelledCount: z.number(),
  completedCount: z.number(),
  noShowCount: z.number(),
  cancellationRate: z.number(),
  statusBreakdown: z.array(z.object({
    status: z.string(),
    count: z.number(),
  })),
  artistUtilization: z.array(z.object({
    artistId: z.string(),
    artistName: z.string(),
    totalAppointments: z.number(),
  })),
});

const StaffPerformanceDataSchema = z.object({
  totalStaff: z.number(),
  topPerformer: z.string(),
  totalCommissions: z.number(),
  averageProductivity: z.number(),
  staffPerformance: z.array(z.object({
    staffId: z.string(),
    staffName: z.string(),
    role: z.string(),
    totalSales: z.number(),
    totalCommissions: z.number(),
    appointmentsCompleted: z.number(),
    totalAppointments: z.number(),
    attendanceDays: z.number(),
    totalHours: z.number(),
  })),
});

const PayrollReportDataSchema = z.object({
  totalGrossPay: z.number(),
  totalDeductions: z.number(),
  totalNetPay: z.number(),
  averageSalary: z.number(),
  payrollCount: z.number(),
  payrollByStaff: z.array(z.object({
    staffId: z.string(),
    staffName: z.string(),
    payPeriodStart: z.string(),
    grossPay: z.number(),
    totalDeductions: z.number(),
    netPay: z.number(),
  })),
});

const ExpenseReportDataSchema = z.object({
  totalExpenses: z.number(),
  averageExpense: z.number(),
  expenseCount: z.number(),
  topExpenseCategory: z.string(),
  expensesByCategory: z.array(z.object({
    categoryName: z.string(),
    count: z.number(),
    totalAmount: z.number(),
  })),
  expensesByVendor: z.array(z.object({
    vendorName: z.string(),
    count: z.number(),
    totalAmount: z.number(),
  })),
});

const TimeSeriesDataSchema = z.array(z.object({
  date: z.string(),
  totalSales: z.number(),
  totalRevenue: z.number(),
}));

// API functions
export const getSalesReport = async (token: string, params: z.infer<typeof SalesReportQuerySchema>) => {
  const validatedParams = SalesReportQuerySchema.parse(params);
  const response = await apiClient.get('/reports/sales', {
    params: validatedParams,
    headers: { Authorization: `Bearer ${token}` },
  });
  return SalesReportDataSchema.parse(response.data);
};

export const getSalesTimeSeries = async (token: string, params: z.infer<typeof SalesTimeSeriesQuerySchema>) => {
  const validatedParams = SalesTimeSeriesQuerySchema.parse(params);
  const response = await apiClient.get('/reports/sales/time-series', {
    params: validatedParams,
    headers: { Authorization: `Bearer ${token}` },
  });
  return TimeSeriesDataSchema.parse(response.data);
};

export const getInventoryReport = async (token: string, params: z.infer<typeof InventoryReportQuerySchema>) => {
  const validatedParams = InventoryReportQuerySchema.parse(params);
  const response = await apiClient.get('/reports/inventory', {
    params: validatedParams,
    headers: { Authorization: `Bearer ${token}` },
  });
  return InventoryReportDataSchema.parse(response.data);
};

export const getCustomerReport = async (token: string, params: z.infer<typeof CustomerReportQuerySchema>) => {
  const validatedParams = CustomerReportQuerySchema.parse(params);
  const response = await apiClient.get('/reports/customers', {
    params: validatedParams,
    headers: { Authorization: `Bearer ${token}` },
  });
  return CustomerReportDataSchema.parse(response.data);
};

export const getAppointmentReport = async (token: string, params: z.infer<typeof AppointmentReportQuerySchema>) => {
  const validatedParams = AppointmentReportQuerySchema.parse(params);
  const response = await apiClient.get('/reports/appointments', {
    params: validatedParams,
    headers: { Authorization: `Bearer ${token}` },
  });
  return AppointmentReportDataSchema.parse(response.data);
};

export const getStaffPerformanceReport = async (token: string, params: z.infer<typeof StaffReportQuerySchema>) => {
  const validatedParams = StaffReportQuerySchema.parse(params);
  const response = await apiClient.get('/reports/staff-performance', {
    params: validatedParams,
    headers: { Authorization: `Bearer ${token}` },
  });
  return StaffPerformanceDataSchema.parse(response.data);
};

export const getPayrollReport = async (token: string, params: z.infer<typeof PayrollReportQuerySchema>) => {
  const validatedParams = PayrollReportQuerySchema.parse(params);
  const response = await apiClient.get('/reports/payroll', {
    params: validatedParams,
    headers: { Authorization: `Bearer ${token}` },
  });
  return PayrollReportDataSchema.parse(response.data);
};

export const getExpenseReport = async (token: string, params: z.infer<typeof ExpenseReportQuerySchema>) => {
  const validatedParams = ExpenseReportQuerySchema.parse(params);
  const response = await apiClient.get('/reports/expenses', {
    params: validatedParams,
    headers: { Authorization: `Bearer ${token}` },
  });
  return ExpenseReportDataSchema.parse(response.data);
};

// Export types for use in components
export type SalesReportData = z.infer<typeof SalesReportDataSchema>;
export type InventoryReportData = z.infer<typeof InventoryReportDataSchema>;
export type CustomerReportData = z.infer<typeof CustomerReportDataSchema>;
export type AppointmentReportData = z.infer<typeof AppointmentReportDataSchema>;
export type StaffPerformanceData = z.infer<typeof StaffPerformanceDataSchema>;
export type PayrollReportData = z.infer<typeof PayrollReportDataSchema>;
export type ExpenseReportData = z.infer<typeof ExpenseReportDataSchema>;
export type TimeSeriesData = z.infer<typeof TimeSeriesDataSchema>;
