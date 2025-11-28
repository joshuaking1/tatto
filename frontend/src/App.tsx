// src/App.tsx
import { Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import StaffPage from './pages/StaffPage';
import StaffProfilePage from './pages/StaffProfilePage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import ServicesPage from './pages/ServicesPage';
import InventoryPage from './pages/InventoryPage';
import InventoryCategoriesPage from './pages/InventoryCategoriesPage';
import SuppliersPage from './pages/SuppliersPage';
import ArtistAvailabilityPage from './pages/ArtistAvailabilityPage';
import { BranchesPage } from './pages/BranchesPage';
import { POSPage } from './pages/POSPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { PayrollPage } from './pages/PayrollPage';
import { PayrollDetailsPage } from './pages/PayrollDetailsPage';
import { CommissionRulesPage } from './pages/CommissionRulesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ExpenseCategoriesPage } from './pages/ExpenseCategoriesPage';
import { FinancialReportsPage } from './pages/FinancialReportsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AttendancePage } from './pages/AttendancePage';
import { AttendanceReportsPage } from './pages/AttendanceReportsPage';
import { LeaveRequestsPage } from './pages/LeaveRequestsPage';
import { AttendanceSettingsPage } from './pages/AttendanceSettingsPage';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { UserRole } from '@/types';
import { Toaster } from '@/components/ui/sonner'; // Import the Toaster
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/availability" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <ArtistAvailabilityPage />
            </RoleGuard>
          } />
          <Route path="/staff" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <StaffPage />
            </RoleGuard>
          } />
          <Route path="/staff/:id" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <StaffProfilePage />
            </RoleGuard>
          } />
          <Route path="/branches" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <BranchesPage />
            </RoleGuard>
          } />
          <Route path="/customers/:id" element={<CustomerProfilePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/inventory" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <InventoryPage />
            </RoleGuard>
          } />
          <Route path="/inventory/categories" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <InventoryCategoriesPage />
            </RoleGuard>
          } />
          <Route path="/inventory/suppliers" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <SuppliersPage />
            </RoleGuard>
          } />
          <Route path="/pos" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.RECEPTIONIST]}>
              <POSPage />
            </RoleGuard>
          } />
          <Route path="/sales" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <SalesHistoryPage />
            </RoleGuard>
          } />
          <Route path="/payroll" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <PayrollPage />
            </RoleGuard>
          } />
          <Route path="/payroll/:id" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <PayrollDetailsPage />
            </RoleGuard>
          } />
          <Route path="/commission-rules" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
              <CommissionRulesPage />
            </RoleGuard>
          } />
          <Route path="/expenses" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <ExpensesPage />
            </RoleGuard>
          } />
          <Route path="/expenses/categories" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <ExpenseCategoriesPage />
            </RoleGuard>
          } />
          <Route path="/reports/financial" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <FinancialReportsPage />
            </RoleGuard>
          } />
          <Route path="/reports" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <ReportsPage />
            </RoleGuard>
          } />
          <Route path="/attendance" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.ARTIST, UserRole.RECEPTIONIST]}>
              <AttendancePage />
            </RoleGuard>
          } />
          <Route path="/attendance/reports" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <AttendanceReportsPage />
            </RoleGuard>
          } />
          <Route path="/leave-requests" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.ARTIST, UserRole.RECEPTIONIST]}>
              <LeaveRequestsPage />
            </RoleGuard>
          } />
          <Route path="/attendance/settings" element={
            <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
              <AttendanceSettingsPage />
            </RoleGuard>
          } />
        </Route>
      </Routes>
      <Toaster /> {/* Add the Toaster component here */}
    </>
  );
}

export default App;