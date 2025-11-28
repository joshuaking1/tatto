export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    CASHIER = 'CASHIER',
    ARTIST = 'ARTIST',
    RECEPTIONIST = 'RECEPTIONIST',
    CUSTOMER = 'CUSTOMER',
}

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    NO_SHOW = 'NO_SHOW',
}

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    MOBILE_MONEY = 'MOBILE_MONEY',
    BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PurchaseOrderStatus {
    PENDING = 'PENDING',
    ORDERED = 'ORDERED',
    SHIPPED = 'SHIPPED',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED',
}

export enum SalaryType {
    MONTHLY = 'MONTHLY',
    HOURLY = 'HOURLY',
}

export enum PayrollStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export interface Organization {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface Branch {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
}

export interface InventoryCategory {
    id: string;
    name: string;
    organizationId: string;
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    organizationId: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    sku?: string;
    quantity: number;
    reorderLevel: number;
    unitPrice: number;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    categoryId: string;
    supplierId?: string;
    branchId?: string;
    category?: InventoryCategory;
    supplier?: Supplier;
    branch?: Branch;
}

export interface PurchaseOrder {
    id: string;
    status: PurchaseOrderStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    supplierId: string;
    supplier?: Supplier;
    items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
    id: string;
    quantity: number;
    unitPrice: number;
    purchaseOrderId: string;
    itemId: string;
    item?: InventoryItem;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    branchId?: string;
    branch?: Branch;
    staffProfile?: StaffProfile;
    customerProfile?: CustomerProfile;
}

export interface ServiceCategory {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
}

export interface Service {
    id: string;
    name: string;
    description?: string;
    duration: number;
    basePrice: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    categoryId: string;
    category?: ServiceCategory;
    artists: Array<{ userId: string; user: User }>;
}

export interface StaffProfile {
    id: string;
    bio?: string;
    phone?: string;
    instagramHandle?: string;
    commissionRate: number;
    isClockedIn: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
    baseSalary?: number;
    salaryType: SalaryType;
    commissionRuleId?: string;
    commissionRule?: CommissionRule;
}

export interface CustomerProfile {
    id: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    allergies?: string;
    notes?: string;
    isSubscribed: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

export interface ArtistAvailability {
    id: string;
    dayOfWeek: number;
    startTime: number;
    endTime: number;
    artistId: string;
    organizationId: string;
    branchId?: string;
}

export interface AvailableSlot {
    startTime: string;
    endTime: string;
    artistId: string;
    artistName: string;
}

export interface TimeSlot {
    dayOfWeek: number;
    startTime: number;
    endTime: number;
}


export interface Blockout {
    id: string;
    startTime: string;
    endTime: string;
    reason?: string;
    artistId: string;
    organizationId: string;
    branchId?: string;
}

export interface Sale {
    id: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    notes?: string;
    createdAt: string;
    organizationId: string;
    customerUserId: string;
    processedByStaffId: string;
    appointmentId?: string;
    branchId?: string;
    customer?: User;
    processedBy?: User;
    items?: SaleItem[];
    payments?: Payment[];
}

export interface SaleItem {
    id: string;
    quantity: number;
    priceAtTimeOfSale: number;
    saleId: string;
    serviceId?: string;
    inventoryItemId?: string;
    artistId?: string;
    service?: Service;
    inventoryItem?: InventoryItem;
    artist?: User;
}

export interface Payment {
    id: string;
    amount: number;
    method: PaymentMethod;
    transactionId?: string;
    createdAt: string;
    saleId: string;
}

export interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    notes?: string;
    price: number;
    depositAmount: number;
    isDepositPaid: boolean;
    createdAt: string;
    updatedAt: string;
    artistId: string;
    customerUserId: string;
    serviceId: string;
    organizationId: string;
    branchId?: string;
    artist?: User;
    customer?: User;
    service?: Service;
    branch?: Branch;
    sale?: Sale;
}


export interface CommissionRule {
    id: string;
    name: string;
    tiers: any; // Json type
    organizationId: string;
}

export interface Payroll {
    id: string;
    startDate: string;
    endDate: string;
    status: PayrollStatus;
    notes?: string;
    createdAt: string;
    branchId: string;
    organizationId: string;
    payslips?: Payslip[];
    branch?: Branch;
}

export interface Payslip {
    id: string;
    baseSalary: number;
    totalCommission: number;
    bonuses: number;
    deductions: number;
    netPay: number;
    currency: string;
    notes?: string;
    createdAt: string;
    payrollId: string;
    employeeId: string;
    employee?: User;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Staff-specific types for detailed staff view
export interface StaffServiceAssignment {
    userId: string;
    serviceId: string;
    assignedAt: string;
    service: Service;
}

export interface StaffDetail extends User {
    services?: StaffServiceAssignment[];
    artistAvailabilities?: ArtistAvailability[];
    upcomingAppointments?: Appointment[];
}


export interface CustomerDetail extends User {
    customerAppointments?: Appointment[];
    customerSales?: Sale[];
}

// Expense Management Types
export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  description: string;
  vendor: string | null;
  receiptUrl: string | null;
  paymentMethod: PaymentMethod;
  notes: string | null;
  organizationId: string;
  branchId: string | null;
  categoryId: string;
  recordedById: string;
  createdAt: string;
  updatedAt: string;
  // Optional relations
  category?: ExpenseCategory;
  branch?: Branch;
  recordedBy?: User;
}

// Attendance Management Types
export enum AttendanceStatus {
  CLOCKED_IN = 'CLOCKED_IN',
  CLOCKED_OUT = 'CLOCKED_OUT',
  INCOMPLETE = 'INCOMPLETE',
}

export enum BreakType {
  LUNCH = 'LUNCH',
  SHORT = 'SHORT',
  PERSONAL = 'PERSONAL',
}

export enum LeaveType {
  VACATION = 'VACATION',
  SICK = 'SICK',
  PERSONAL = 'PERSONAL',
  UNPAID = 'UNPAID',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Break {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  type: BreakType;
  createdAt: string;
  attendanceId: string;
}

export interface Attendance {
  id: string;
  clockInTime: string;
  clockOutTime: string | null;
  totalHours: number | null;
  status: AttendanceStatus;
  location: string | null;
  notes: string | null;
  isLate: boolean;
  lateMinutes: number;
  overtimeHours: number;
  createdAt: string;
  updatedAt: string;
  employeeId: string;
  branchId: string | null;
  organizationId: string;
  employee?: User;
  branch?: Branch;
  breaks?: Break[];
}

export interface AttendanceSettings {
  id: string;
  workStartTime: number; // minutes from midnight
  workEndTime: number;
  gracePeriodMinutes: number;
  overtimeThreshold: number;
  requireLocation: boolean;
  autoClockOutHours: number;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  type: LeaveType;
  status: LeaveStatus;
  reason: string;
  notes: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employeeId: string;
  organizationId: string;
  employee?: User;
  approver?: User;
}

export interface AttendanceSummary {
  totalHours: number;
  averageHoursPerDay: number;
  totalLateArrivals: number;
  lateArrivals: number; // Added for consistency
  totalOvertimeHours: number;
  overtimeHours: number; // Added for consistency
  attendanceRate: number;
  totalDays: number;
  uniqueEmployees: number; // Added for employee count
}

export interface AttendanceByEmployee {
  employeeId: string;
  employeeName: string;
  totalHours: number;
  overtimeHours: number;
  lateCount: number;
  attendanceCount: number;
}

// Report-related interfaces
export interface SalesReportData {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalTax: number;
  totalDiscount: number;
  salesByPaymentMethod: Array<{
    paymentMethod: string;
    totalAmount: number;
    count: number;
  }>;
  salesByService: Array<{
    serviceId: string;
    serviceName: string;
    totalQuantity: number;
    totalRevenue: number;
    count: number;
  }>;
  salesByStaff: Array<{
    staffId: string;
    staffName: string;
    totalRevenue: number;
    count: number;
  }>;
}

export interface InventoryReportData {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  turnoverRate: number;
  itemsByCategory: Array<{
    categoryName: string;
    itemCount: number;
    totalValue: number;
  }>;
  itemsBySupplier: Array<{
    supplierName: string;
    itemCount: number;
    totalValue: number;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    currentStock: number;
    reorderLevel: number;
    unitPrice: number;
  }>;
}

export interface CustomerReportData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageCustomerValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpend: number;
    totalVisits: number;
    lastVisit: string | null;
  }>;
}

export interface AppointmentReportData {
  totalAppointments: number;
  confirmedCount: number;
  cancelledCount: number;
  completedCount: number;
  noShowCount: number;
  cancellationRate: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  artistUtilization: Array<{
    artistId: string;
    artistName: string;
    totalAppointments: number;
  }>;
}

export interface StaffPerformanceData {
  totalStaff: number;
  topPerformer: string;
  totalCommissions: number;
  averageProductivity: number;
  staffPerformance: Array<{
    staffId: string;
    staffName: string;
    role: string;
    totalSales: number;
    totalCommissions: number;
    appointmentsCompleted: number;
    totalAppointments: number;
    attendanceDays: number;
    totalHours: number;
  }>;
}

export interface PayrollReportData {
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  averageSalary: number;
  payrollCount: number;
  payrollByStaff: Array<{
    staffId: string;
    staffName: string;
    payPeriodStart: string;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
  }>;
}

export interface ExpenseReportData {
  totalExpenses: number;
  averageExpense: number;
  expenseCount: number;
  topExpenseCategory: string;
  expensesByCategory: Array<{
    categoryName: string;
    count: number;
    totalAmount: number;
  }>;
  expensesByVendor: Array<{
    vendorName: string;
    count: number;
    totalAmount: number;
  }>;
}

export interface TimeSeriesData {
  date: string;
  totalSales: number;
  totalRevenue: number;
}
