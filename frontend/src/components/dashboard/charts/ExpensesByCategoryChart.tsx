// src/components/dashboard/charts/ExpensesByCategoryChart.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpensesByCategory } from "@/services/dashboardService";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export function ExpensesByCategoryChart() {
    const { accessToken } = useAuthStore();
    const { data, isLoading } = useQuery({
        queryKey: ['expensesByCategory'],
        queryFn: () => getExpensesByCategory(accessToken!),
        enabled: !!accessToken,
    });

    if (isLoading) return <div>Loading chart...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart layout="vertical" data={data || []}>
                        <XAxis type="number" hide />
                        <YAxis type="category" width={150} dataKey="categoryName" stroke="#888888" fontSize={12} />
                        <Tooltip cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="total" name="Total Amount" fill="#dc2626" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
