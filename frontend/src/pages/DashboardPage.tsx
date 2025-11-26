// src/pages/DashboardPage.tsx
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesChart } from "@/components/dashboard/charts/SalesChart";
import { TopServicesChart } from "@/components/dashboard/charts/TopServicesChart";
import { getKpis } from "@/services/dashboardService";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";

const DashboardPage = () => {
  const { accessToken } = useAuthStore();

  const { data: kpiData, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardKpis'],
    queryFn: () => getKpis(accessToken!),
    enabled: !!accessToken,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GHS' }).format(amount);
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {isLoading ? (
        <div>Loading dashboard...</div>
      ) : isError ? (
        <div>Error fetching data: {error.message}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <KpiCard title="Total Revenue" value={formatCurrency(kpiData?.totalRevenue || 0)} description={kpiData?.period} icon={DollarSign} />
            <KpiCard title="Sales" value={`+${kpiData?.totalSales || 0}`} description={kpiData?.period} icon={CreditCard} />
            <KpiCard title="New Customers" value={`+${kpiData?.newCustomers || 0}`} description={kpiData?.period} icon={Users} />
            <KpiCard title="Upcoming Appointments" value={kpiData?.upcomingAppointments || 0} description="Confirmed bookings" icon={Activity} />
          </div>

          {/* --- ADD THE CHART GRID SECTION --- */}
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-8">
            <div className="xl:col-span-2">
                <SalesChart />
            </div>
            <div>
                <TopServicesChart />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;