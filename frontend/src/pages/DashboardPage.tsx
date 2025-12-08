// src/pages/DashboardPage.tsx
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesChart } from "@/components/dashboard/charts/SalesChart";
import { TopServicesChart } from "@/components/dashboard/charts/TopServicesChart";
import { ExpensesByCategoryChart } from "@/components/dashboard/charts/ExpensesByCategoryChart";
import { getKpis, getTotalExpenses, getProfitLoss } from "@/services/dashboardService";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Activity, CreditCard, DollarSign, Users, TrendingDown, TrendingUp } from "lucide-react";

const DashboardPage = () => {
  const { accessToken } = useAuthStore();

  const { data: kpiData, isLoading: kpiLoading, isError: kpiError, error: kpiErrorMessage } = useQuery({
    queryKey: ['dashboardKpis'],
    queryFn: () => getKpis(accessToken!),
    enabled: !!accessToken,
  });

  const { data: totalExpensesData, isError: expensesError, error: expensesErrorMessage } = useQuery({
    queryKey: ['totalExpenses'],
    queryFn: () => getTotalExpenses(accessToken!),
    enabled: !!accessToken,
  });

  const { data: profitLossData, isError: profitLossError, error: profitLossErrorMessage } = useQuery({
    queryKey: ['profitLoss'],
    queryFn: () => getProfitLoss(accessToken!),
    enabled: !!accessToken,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(amount);
  };
  
  // Primary loading state depends on critical KPI data
  const isLoading = kpiLoading;
  const isError = kpiError;
  const error = kpiErrorMessage;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>
      
      {isLoading ? (
        <div>Loading dashboard...</div>
      ) : isError ? (
        <div>Error fetching data: {error?.message || 'Unknown error'}</div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard title="Total Revenue" value={formatCurrency(kpiData?.totalRevenue || 0)} description={kpiData?.period} icon={DollarSign} />
            <KpiCard title="Sales" value={`+${kpiData?.totalSales || 0}`} description={kpiData?.period} icon={CreditCard} />
            <KpiCard title="New Customers" value={`+${kpiData?.newCustomers || 0}`} description={kpiData?.period} icon={Users} />
            <KpiCard title="Upcoming Appointments" value={kpiData?.upcomingAppointments || 0} description="Confirmed bookings" icon={Activity} />
            <div className="relative">
              <KpiCard title="Total Expenses" value={formatCurrency(totalExpensesData?.total || 0)} description="Last 30 Days" icon={TrendingDown} />
              {expensesError && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" title={expensesErrorMessage?.message}>
                  !
                </div>
              )}
            </div>
            <div className="relative">
              <KpiCard title="Net Profit/Loss" value={formatCurrency(profitLossData?.netProfit || 0)} description={profitLossData?.period} icon={(profitLossData?.netProfit || 0) >= 0 ? TrendingUp : TrendingDown} />
              {profitLossError && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" title={profitLossErrorMessage?.message}>
                  !
                </div>
              )}
            </div>
          </div>

          {/* --- ADD THE CHART GRID SECTION --- */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mt-8">
            <div>
                <SalesChart />
            </div>
            <div>
                <TopServicesChart />
            </div>
            <div>
                <ExpensesByCategoryChart />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;