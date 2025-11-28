import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { FinancialReportData } from '../services/dashboardService'

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format a percentage change with + or - sign
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

/**
 * Format an ISO date string to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Get headers from object keys
  const headers = Object.keys(data[0])
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up
  URL.revokeObjectURL(url)
}

/**
 * Export financial report to PDF
 */
export function exportToPDF(reportData: FinancialReportData, filename: string): void {
  const doc = new jsPDF()
  
  // Set font
  doc.setFont('helvetica')
  
  // Title
  doc.setFontSize(20)
  doc.text('Financial Report', 14, 20)
  
  // Date range and branch info
  doc.setFontSize(12)
  doc.text(
    `Period: ${formatDate(reportData.summary.period.start)} - ${formatDate(reportData.summary.period.end)}`,
    14,
    30
  )
  
  let yPosition = 45
  
  // Summary Section
  doc.setFontSize(14)
  doc.text('Summary', 14, yPosition)
  yPosition += 10
  
  // Summary table
  autoTable(doc, {
    head: [['Metric', 'Amount']],
    body: [
      ['Total Revenue', formatCurrency(reportData.summary.totalRevenue)],
      ['Total Expenses', formatCurrency(reportData.summary.totalExpenses)],
      ['Total Payroll', formatCurrency(reportData.summary.totalPayroll)],
      ['Net Profit', formatCurrency(reportData.summary.netProfit)],
    ],
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 15
  
  // Expenses by Category Section
  if (reportData.expensesByCategory.length > 0) {
    doc.setFontSize(14)
    doc.text('Expenses by Category', 14, yPosition)
    yPosition += 10
    
    autoTable(doc, {
      head: [['Category', 'Amount']],
      body: reportData.expensesByCategory.map(cat => [
        cat.categoryName,
        formatCurrency(cat.total),
      ]),
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [239, 68, 68] },
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 15
  }
  
  // Period Comparisons Section
  doc.setFontSize(14)
  doc.text('Period Comparisons', 14, yPosition)
  yPosition += 10
  
  // Month over Month
  doc.setFontSize(12)
  doc.text('Month over Month', 14, yPosition)
  yPosition += 7
  
  autoTable(doc, {
    head: [['Metric', 'Change']],
    body: [
      ['Revenue', formatPercentage(reportData.comparisons.monthOverMonth.revenue)],
      ['Expenses', formatPercentage(reportData.comparisons.monthOverMonth.expenses)],
      ['Payroll', formatPercentage(reportData.comparisons.monthOverMonth.payroll)],
      ['Profit', formatPercentage(reportData.comparisons.monthOverMonth.profit)],
    ],
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [34, 197, 94] },
  })
  
  yPosition = (doc as any).lastAutoTable.finalY + 15
  
  // Year over Year
  doc.setFontSize(12)
  doc.text('Year over Year', 14, yPosition)
  yPosition += 7
  
  autoTable(doc, {
    head: [['Metric', 'Change']],
    body: [
      ['Revenue', formatPercentage(reportData.comparisons.yearOverYear.revenue)],
      ['Expenses', formatPercentage(reportData.comparisons.yearOverYear.expenses)],
      ['Payroll', formatPercentage(reportData.comparisons.yearOverYear.payroll)],
      ['Profit', formatPercentage(reportData.comparisons.yearOverYear.profit)],
    ],
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [168, 85, 247] },
  })
  
  // Add footer with timestamp
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Generated on ${new Date().toLocaleString('en-GH')}`,
      14,
      doc.internal.pageSize.height - 10
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    )
  }
  
  // Save the PDF
  doc.save(`${filename}.pdf`)
}

/**
 * Export financial report data to CSV (flattened format)
 */
export function exportFinancialReportToCSV(reportData: FinancialReportData, filename: string): void {
  const csvData = [
    {
      Category: 'Summary',
      Metric: 'Total Revenue',
      Amount: reportData.summary.totalRevenue,
      Period: `${formatDate(reportData.summary.period.start)} - ${formatDate(reportData.summary.period.end)}`,
    },
    {
      Category: 'Summary',
      Metric: 'Total Expenses',
      Amount: reportData.summary.totalExpenses,
      Period: `${formatDate(reportData.summary.period.start)} - ${formatDate(reportData.summary.period.end)}`,
    },
    {
      Category: 'Summary',
      Metric: 'Total Payroll',
      Amount: reportData.summary.totalPayroll,
      Period: `${formatDate(reportData.summary.period.start)} - ${formatDate(reportData.summary.period.end)}`,
    },
    {
      Category: 'Summary',
      Metric: 'Net Profit',
      Amount: reportData.summary.netProfit,
      Period: `${formatDate(reportData.summary.period.start)} - ${formatDate(reportData.summary.period.end)}`,
    },
    ...reportData.expensesByCategory.map(cat => ({
      Category: 'Expenses by Category',
      Metric: cat.categoryName,
      Amount: cat.total,
      Period: `${formatDate(reportData.summary.period.start)} - ${formatDate(reportData.summary.period.end)}`,
    })),
    {
      Category: 'Comparisons',
      Metric: 'MoM Revenue Change',
      Amount: reportData.comparisons.monthOverMonth.revenue,
      Period: 'Percentage',
    },
    {
      Category: 'Comparisons',
      Metric: 'MoM Expenses Change',
      Amount: reportData.comparisons.monthOverMonth.expenses,
      Period: 'Percentage',
    },
    {
      Category: 'Comparisons',
      Metric: 'MoM Payroll Change',
      Amount: reportData.comparisons.monthOverMonth.payroll,
      Period: 'Percentage',
    },
    {
      Category: 'Comparisons',
      Metric: 'MoM Profit Change',
      Amount: reportData.comparisons.monthOverMonth.profit,
      Period: 'Percentage',
    },
    {
      Category: 'Comparisons',
      Metric: 'YoY Revenue Change',
      Amount: reportData.comparisons.yearOverYear.revenue,
      Period: 'Percentage',
    },
    {
      Category: 'Comparisons',
      Metric: 'YoY Expenses Change',
      Amount: reportData.comparisons.yearOverYear.expenses,
      Period: 'Percentage',
    },
    {
      Category: 'Comparisons',
      Metric: 'YoY Payroll Change',
      Amount: reportData.comparisons.yearOverYear.payroll,
      Period: 'Percentage',
    },
    {
      Category: 'Comparisons',
      Metric: 'YoY Profit Change',
      Amount: reportData.comparisons.yearOverYear.profit,
      Period: 'Percentage',
    },
  ]
  
  exportToCSV(csvData, filename)
}

/**
 * Export data to Excel format (.xlsx)
 */
export function exportToExcel(data: any[], filename: string, sheetName = 'Sheet1') {
  // Create a new workbook
  const wb = XLSX.utils.book_new()
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data)
  
  // Apply basic styling to headers
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'FFE6B6' } }
      }
    }
  }
  
  // Auto-size columns
  const colWidths = []
  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxLength = 0
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      const cell = ws[cellAddress]
      if (cell && cell.v) {
        const cellValue = String(cell.v)
        maxLength = Math.max(maxLength, cellValue.length)
      }
    }
    colWidths.push({ wch: Math.min(maxLength + 2, 50) }) // Max width 50
  }
  ws['!cols'] = colWidths
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  
  // Generate and download the file
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Enhanced CSV export that handles nested objects and arrays
 */
export function exportToCSVEnhanced(data: any[], filename: string) {
  // Flatten nested objects
  const flattenedData = data.map(item => {
    const flattened: any = {}
    
    const flatten = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key]
          const newKey = prefix ? `${prefix}.${key}` : key
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            flatten(value, newKey)
          } else if (Array.isArray(value)) {
            flattened[newKey] = value.join(', ')
          } else {
            flattened[newKey] = value
          }
        }
      }
    }
    
    flatten(item)
    return flattened
  })
  
  exportToCSV(flattenedData, filename)
}

/**
 * Export multi-section report to PDF
 */
export function exportReportToPDF(reportData: {
  title: string
  dateRange: string
  sections: Array<{
    title: string
    data: any[]
    headers: string[]
  }>
}, filename: string) {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(20)
  doc.text(reportData.title, 20, 20)
  
  // Add date range
  doc.setFontSize(12)
  doc.text(`Period: ${reportData.dateRange}`, 20, 30)
  
  let yPosition = 50
  
  reportData.sections.forEach((section, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    // Add section title
    doc.setFontSize(16)
    doc.text(section.title, 20, yPosition)
    yPosition += 15
    
    // Add table
    if (section.data.length > 0) {
      autoTable(doc, {
        head: [section.headers],
        body: section.data.map(row => 
          section.headers.map(header => 
            String(row[header] || '')
          )
        ),
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
      })
      
      yPosition = (doc as any).lastAutoTable.finalY + 20
    } else {
      doc.setFontSize(10)
      doc.text('No data available', 20, yPosition)
      yPosition += 20
    }
    
    yPosition += 10
  })
  
  // Save the PDF
  doc.save(`${filename}.pdf`)
}
