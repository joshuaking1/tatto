// src/components/layout/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { Calendar, Home, Users, UserCircle, Scissors, CalendarClock, Package, ShoppingCart, Receipt, Building2, Wallet, TrendingUp, CreditCard, FileBarChart, ChevronDown, Tags, Clock, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types";
import { useState } from "react";

export function Sidebar() {
  const location = useLocation();
  const { hasAnyRole, canAccessResource } = usePermissions();
  const [expensesExpanded, setExpensesExpanded] = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [attendanceExpanded, setAttendanceExpanded] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const canViewStaff = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canViewCustomers = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST]);
  const canViewServices = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.ARTIST, UserRole.RECEPTIONIST]);
  const canViewAvailability = hasAnyRole([UserRole.ADMIN, UserRole.MANAGER]);
  const canViewInventory = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canViewPOS = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.RECEPTIONIST]);
  const canViewSales = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canViewBranches = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canViewPayroll = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canViewCommissionRules = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  const canViewExpenses = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canViewFinancialReports = canAccessResource('reports:view');
  const canViewAttendance = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.ARTIST, UserRole.RECEPTIONIST]);
  const canViewLeaveRequests = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.ARTIST, UserRole.RECEPTIONIST]);
  const canViewAttendanceReports = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);
  const canManageAttendanceSettings = hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]);

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* ... Logo ... */}
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive('/') && location.pathname === '/' && "bg-muted text-primary"
              )}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/calendar"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive('/calendar') && "bg-muted text-primary"
              )}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Link>
            {canViewAvailability && (
              <Link
                to="/availability"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/availability') && "bg-muted text-primary"
                )}
              >
                <CalendarClock className="h-4 w-4" />
                Availability
              </Link>
            )}
            {canViewStaff && (
              <Link
                to="/staff"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/staff') && "bg-muted text-primary"
                )}
              >
                <Users className="h-4 w-4" />
                Staff
              </Link>
            )}
            {canViewBranches && (
              <Link
                to="/branches"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/branches') && "bg-muted text-primary"
                )}
              >
                <Building2 className="h-4 w-4" />
                Branches
              </Link>
            )}
            {canViewCustomers && (
              <Link
                to="/customers"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/customers') && "bg-muted text-primary"
                )}
              >
                <UserCircle className="h-4 w-4" />
                Customers
              </Link>
            )}
            {canViewServices && (
              <Link
                to="/services"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/services') && "bg-muted text-primary"
                )}
              >
                <Scissors className="h-4 w-4" />
                Services
              </Link>
            )}
            {canViewInventory && (
              <div>
                <button
                  onClick={() => setInventoryExpanded(!inventoryExpanded)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full",
                    (isActive('/inventory') || isActive('/inventory/categories') || isActive('/inventory/suppliers')) && "bg-muted text-primary"
                  )}
                >
                  <Package className="h-4 w-4" />
                  Inventory
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    inventoryExpanded && "rotate-180"
                  )} />
                </button>
                {inventoryExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    <Link
                      to="/inventory"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive('/inventory') && !isActive('/inventory/categories') && !isActive('/inventory/suppliers') && "bg-muted text-primary"
                      )}
                    >
                      <Package className="h-4 w-4" />
                      All Items
                    </Link>
                    <Link
                      to="/inventory/categories"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive('/inventory/categories') && "bg-muted text-primary"
                      )}
                    >
                      <Tags className="h-4 w-4" />
                      Categories
                    </Link>
                    <Link
                      to="/inventory/suppliers"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive('/inventory/suppliers') && "bg-muted text-primary"
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      Suppliers
                    </Link>
                  </div>
                )}
              </div>
            )}
            {canViewPOS && (
              <Link
                to="/pos"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/pos') && "bg-muted text-primary"
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                Point of Sale
              </Link>
            )}
            {canViewSales && (
              <Link
                to="/sales"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/sales') && "bg-muted text-primary"
                )}
              >
                <Receipt className="h-4 w-4" />
                Sales History
              </Link>
            )}
            {canViewPayroll && (
              <Link
                to="/payroll"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/payroll') && "bg-muted text-primary"
                )}
              >
                <Wallet className="h-4 w-4" />
                Payroll
              </Link>
            )}
            {canViewExpenses && (
              <div>
                <button
                  onClick={() => setExpensesExpanded(!expensesExpanded)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full",
                    (isActive('/expenses') || isActive('/expenses/categories')) && "bg-muted text-primary"
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  Expenses
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    expensesExpanded && "rotate-180"
                  )} />
                </button>
                {expensesExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    <Link
                      to="/expenses"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive('/expenses') && !isActive('/expenses/categories') && "bg-muted text-primary"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      All Expenses
                    </Link>
                    <Link
                      to="/expenses/categories"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive('/expenses/categories') && "bg-muted text-primary"
                      )}
                    >
                      <Tags className="h-4 w-4" />
                      Categories
                    </Link>
                  </div>
                )}
              </div>
            )}
            {(canViewFinancialReports || canViewAttendanceReports) && (
              <div>
                <button
                  onClick={() => setReportsExpanded(!reportsExpanded)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full",
                    (isActive('/reports') || isActive('/reports/financial') || isActive('/attendance/reports')) && "bg-muted text-primary"
                  )}
                >
                  <FileBarChart className="h-4 w-4" />
                  Reports
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    reportsExpanded && "rotate-180"
                  )} />
                </button>
                {reportsExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    <Link
                      to="/reports"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive('/reports') && !isActive('/reports/financial') && !isActive('/attendance/reports') && "bg-muted text-primary"
                      )}
                    >
                      <FileBarChart className="h-4 w-4" />
                      All Reports
                    </Link>
                    {canViewFinancialReports && (
                      <Link
                        to="/reports/financial"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          isActive('/reports/financial') && "bg-muted text-primary"
                        )}
                      >
                        <FileBarChart className="h-4 w-4" />
                        Financial
                      </Link>
                    )}
                    {canViewAttendanceReports && (
                      <Link
                        to="/attendance/reports"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          isActive('/attendance/reports') && "bg-muted text-primary"
                        )}
                      >
                        <FileBarChart className="h-4 w-4" />
                        Attendance
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
            {canViewCommissionRules && (
              <Link
                to="/commission-rules"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/commission-rules') && "bg-muted text-primary"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                Commission Rules
              </Link>
            )}
            {canViewAttendance && (
              <div>
                <button
                  onClick={() => setAttendanceExpanded(!attendanceExpanded)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full",
                    (isActive('/attendance') || isActive('/leave-requests') || isActive('/attendance/settings') || isActive('/attendance/reports')) && "bg-muted text-primary"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  Attendance
                  <ChevronDown className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    attendanceExpanded && "rotate-180"
                  )} />
                </button>
                {attendanceExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    <Link
                      to="/attendance"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive('/attendance') && !isActive('/attendance/settings') && !isActive('/attendance/reports') && "bg-muted text-primary"
                      )}
                    >
                      <Clock className="h-4 w-4" />
                      Clock In/Out
                    </Link>
                    {canViewLeaveRequests && (
                      <Link
                        to="/leave-requests"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          isActive('/leave-requests') && "bg-muted text-primary"
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        Leave Requests
                      </Link>
                    )}
                    {canViewAttendanceReports && (
                      <Link
                        to="/attendance/reports"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          isActive('/attendance/reports') && "bg-muted text-primary"
                        )}
                      >
                        <FileBarChart className="h-4 w-4" />
                        Attendance Reports
                      </Link>
                    )}
                    {canManageAttendanceSettings && (
                      <Link
                        to="/attendance/settings"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          isActive('/attendance/settings') && "bg-muted text-primary"
                        )}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}