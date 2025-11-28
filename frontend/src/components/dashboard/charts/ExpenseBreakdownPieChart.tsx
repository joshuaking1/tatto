import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"
import { formatCurrency } from "@/lib/exportUtils"

interface ExpenseBreakdownPieChartProps {
  data: Array<{
    categoryId: string
    categoryName: string
    amount: number
  }>
}

const COLORS = [
  '#2563eb',
  '#dc2626',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null // Don't show label for slices less than 5%

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ExpenseBreakdownPieChart({ data }: ExpenseBreakdownPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>
            Expenses by category for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No expense data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalExpenses = data.reduce((sum, item) => sum + item.amount, 0)

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.amount / totalExpenses) * 100).toFixed(1)
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg">
          <p className="font-semibold">{data.categoryName}</p>
          <p style={{ color: payload[0].color }}>
            Amount: {formatCurrency(data.amount)}
          </p>
          <p className="text-sm text-muted-foreground">
            {percentage}% of total
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = (props: any) => {
    const { payload } = props
    return (
      <ul className="flex flex-wrap justify-center gap-2 mt-2">
        {payload.map((item: any, index: number) => (
          <li
            key={`item-${index}`}
            className="flex items-center gap-1 text-xs"
            style={{ color: item.color }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.value}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>
          Expenses by category for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="amount"
              nameKey="categoryName"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Total Expenses: <span className="font-semibold text-foreground">
              {formatCurrency(totalExpenses)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
