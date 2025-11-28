import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"
import { formatCurrency } from "@/lib/exportUtils"

interface ProfitLossTrendChartProps {
  data: Array<{
    date: string
    revenue: number
    expenses: number
    profit: number
  }>
}

export function ProfitLossTrendChart({ data }: ProfitLossTrendChartProps) {
  const formatXAxisTick = (tickItem: string) => {
    const date = new Date(tickItem)
    return date.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-semibold">{formatXAxisTick(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Profit & Loss Trend</CardTitle>
        <CardDescription>
          Daily revenue, expenses, and profit over the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisTick}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `₵${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Net Profit"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
