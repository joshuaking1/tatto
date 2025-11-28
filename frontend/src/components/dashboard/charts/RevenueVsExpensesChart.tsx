import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts"
import { formatCurrency } from "@/lib/exportUtils"

interface RevenueVsExpensesChartProps {
  data: {
    totalRevenue: number
    totalExpenses: number
    totalPayroll: number
  }
}

export function RevenueVsExpensesChart({ data }: RevenueVsExpensesChartProps) {
  const chartData = [
    { name: 'Revenue', amount: data.totalRevenue },
    { name: 'Expenses', amount: data.totalExpenses },
    { name: 'Payroll', amount: data.totalPayroll },
  ]

  const netProfit = data.totalRevenue - data.totalExpenses - data.totalPayroll

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p style={{ color: payload[0].color }}>
            Amount: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Expenses</CardTitle>
        <CardDescription>
          Comparison of total revenue, expenses, and payroll costs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `₵${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={customTooltip} />
            <Bar
              dataKey="amount"
              fill="#8884d8"
              radius={[4, 4, 0, 0]}
            />
            <ReferenceLine
              y={data.totalRevenue}
              stroke="#10b981"
              strokeDasharray="5 5"
              label={{
                value: "Revenue",
                position: "right",
                style: { fontSize: 10, fill: "#10b981" }
              }}
            />
            {netProfit < 0 && (
              <ReferenceLine
                y={0}
                stroke="#dc2626"
                strokeDasharray="3 3"
                label={{
                  value: "Break-even",
                  position: "centerTop",
                  style: { fontSize: 10, fill: "#dc2626" }
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Net Profit: <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(netProfit)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
