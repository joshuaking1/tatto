import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { subDays } from 'date-fns'
import { Download, FileText, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Skeleton } from '@/components/ui'
import { DateRangePicker } from '@/components/ui'
import { BranchSelector } from '@/components/ui'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { ProfitLossTrendChart } from '@/components/dashboard/charts/ProfitLossTrendChart'
import { RevenueVsExpensesChart } from '@/components/dashboard/charts/RevenueVsExpensesChart'
import { ExpenseBreakdownPieChart } from '@/components/dashboard/charts/ExpenseBreakdownPieChart'
import { getFinancialReport } from '@/services/dashboardService'
import { exportFinancialReportToCSV, exportToPDF, formatCurrency, formatPercentage } from '@/lib/exportUtils'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'

export function FinancialReportsPage() {
  const { canAccessResource } = usePermissions()
  const { accessToken } = useAuthStore()
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>()
  const [shouldFetch, setShouldFetch] = useState(false)

  const {
    data: reportData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['financial-report', dateRange, selectedBranchId],
    queryFn: () => {
      if (!dateRange?.from || !dateRange?.to || !accessToken) {
        throw new Error('Missing required data')
      }
      return getFinancialReport(
        accessToken,
        dateRange.from.toISOString(),
        dateRange.to.toISOString(),
        selectedBranchId
      )
    },
    enabled: shouldFetch && !!dateRange?.from && !!dateRange?.to && !!accessToken,
  })

  const handleGenerateReport = () => {
    if (dateRange?.from && dateRange?.to) {
      setShouldFetch(true)
      refetch()
    }
  }

  const handleExportCSV = () => {
    if (reportData) {
      const filename = `financial-report-${format(new Date(), 'yyyy-MM-dd')}`
      exportFinancialReportToCSV(reportData, filename)
    }
  }

  const handleExportPDF = () => {
    if (reportData) {
      const filename = `financial-report-${format(new Date(), 'yyyy-MM-dd')}`
      exportToPDF(reportData, filename)
    }
  }

  // Prepare data for trend chart
  const trendData = React.useMemo(() => {
    if (!reportData) return []
    
    const revenueMap = new Map(reportData.revenueOverTime.map(r => [r.date, r.amount]))
    const expensesMap = new Map(reportData.expensesOverTime.map(e => [e.date, e.amount]))
    
    const allDates = new Set([
      ...reportData.revenueOverTime.map(r => r.date),
      ...reportData.expensesOverTime.map(e => e.date)
    ])
    
    return Array.from(allDates).sort().map(date => ({
      date,
      revenue: revenueMap.get(date) || 0,
      expenses: expensesMap.get(date) || 0,
      profit: (revenueMap.get(date) || 0) - (expensesMap.get(date) || 0),
    }))
  }, [reportData])

  if (!canAccessResource('reports:view')) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access financial reports.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive financial analysis and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!reportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={!reportData}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select date range and branch to generate report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select date range"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Branch</label>
              <BranchSelector
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
                placeholder="All Branches"
                includeAllOption={true}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerateReport}
                disabled={!dateRange?.from || !dateRange?.to}
                className="w-full"
              >
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <p>Error loading financial report</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(error as Error).message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {reportData && !isLoading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Revenue"
              value={formatCurrency(reportData.summary.totalRevenue)}
              icon={TrendingUp}
              trend={reportData.comparisons.monthOverMonth.revenue}
              trendLabel="vs last month"
            />
            <KpiCard
              title="Total Expenses"
              value={formatCurrency(reportData.summary.totalExpenses)}
              icon={TrendingDown}
              trend={reportData.comparisons.monthOverMonth.expenses}
              trendLabel="vs last month"
            />
            <KpiCard
              title="Total Payroll"
              value={formatCurrency(reportData.summary.totalPayroll)}
              icon={Wallet}
              trend={reportData.comparisons.monthOverMonth.payroll}
              trendLabel="vs last month"
            />
            <KpiCard
              title="Net Profit"
              value={formatCurrency(reportData.summary.netProfit)}
              icon={DollarSign}
              trend={reportData.comparisons.monthOverMonth.profit}
              trendLabel="vs last month"
              trendType={reportData.summary.netProfit >= 0 ? 'positive' : 'negative'}
            />
          </div>

          {/* Period Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Month over Month</CardTitle>
                <CardDescription>
                  Comparison with previous period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Revenue</span>
                  <Badge variant={reportData.comparisons.monthOverMonth.revenue >= 0 ? 'default' : 'destructive'}>
                    {formatPercentage(reportData.comparisons.monthOverMonth.revenue)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expenses</span>
                  <Badge variant={reportData.comparisons.monthOverMonth.expenses <= 0 ? 'default' : 'destructive'}>
                    {formatPercentage(reportData.comparisons.monthOverMonth.expenses)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Payroll</span>
                  <Badge variant={reportData.comparisons.monthOverMonth.payroll <= 0 ? 'default' : 'destructive'}>
                    {formatPercentage(reportData.comparisons.monthOverMonth.payroll)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Profit</span>
                  <Badge variant={reportData.comparisons.monthOverMonth.profit >= 0 ? 'default' : 'destructive'}>
                    {formatPercentage(reportData.comparisons.monthOverMonth.profit)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Year over Year</CardTitle>
                <CardDescription>
                  Comparison with same period last year
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Revenue</span>
                  <Badge variant={reportData.comparisons.yearOverYear.revenue >= 0 ? 'default' : 'destructive'}>
                    {formatPercentage(reportData.comparisons.yearOverYear.revenue)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expenses</span>
                  <Badge variant={reportData.comparisons.yearOverYear.expenses <= 0 ? 'default' : 'destructive'}>
                    {formatPercentage(reportData.comparisons.yearOverYear.expenses)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Payroll</span>
                  <Badge variant={reportData.comparisons.yearOverYear.payroll <= 0 ? 'default' : 'destructive'}>
                    {formatPercentage(reportData.comparisons.yearOverYear.payroll)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Profit</span>
                  <Badge variant={reportData.comparisons.yearOverYear.profit >= 0 ? 'default' : 'destructive'}>
                    {formatPercentage(reportData.comparisons.yearOverYear.profit)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitLossTrendChart data={trendData} />
            <div className="space-y-6">
              <RevenueVsExpensesChart
                data={{
                  totalRevenue: reportData.summary.totalRevenue,
                  totalExpenses: reportData.summary.totalExpenses,
                  totalPayroll: reportData.summary.totalPayroll,
                }}
              />
              <ExpenseBreakdownPieChart data={reportData.expensesByCategory} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
