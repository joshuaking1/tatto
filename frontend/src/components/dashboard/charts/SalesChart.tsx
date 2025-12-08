// src/components/dashboard/charts/SalesChart.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSalesOverTime } from "@/services/dashboardService";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export function SalesChart() {
    const { accessToken } = useAuthStore();
    const { data, isLoading } = useQuery({
        queryKey: ['salesOverTime'],
        queryFn: () => getSalesOverTime(accessToken!),
        enabled: !!accessToken,
    });

    if (isLoading) return <div>Loading chart...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales - Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300} className="h-[250px] sm:h-[300px] lg:h-[350px]">
                    <BarChart data={data}>
                        <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₵${value}`} />
                        <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}