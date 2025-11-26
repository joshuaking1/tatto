// src/components/layout/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { Calendar, Home, Users, UserCircle, Scissors, CalendarClock, Package, ShoppingCart, Receipt, Building2, Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types";

export function Sidebar() {
  const location = useLocation();
  const { hasAnyRole } = usePermissions();

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
              <Link
                to="/inventory"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive('/inventory') && "bg-muted text-primary"
                )}
              >
                <Package className="h-4 w-4" />
                Inventory
              </Link>
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
          </nav>
        </div>
      </div>
    </div>
  );
}