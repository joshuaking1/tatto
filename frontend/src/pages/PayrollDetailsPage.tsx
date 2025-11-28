import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Printer } from 'lucide-react';
import { getPayrollById } from '@/services/payrollService';
import { usePermissions } from '@/hooks/usePermissions';
import { PayrollStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { printPayslipById } from '@/lib/printUtils';

export function PayrollDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { canAccessResource } = usePermissions();

    // Fetch payroll details with payslips
    const { data: payroll, isLoading, isError } = useQuery({
        queryKey: ['payroll', id],
        queryFn: () => getPayrollById(id!),
        enabled: !!id,
    });

    const getStatusColor = (status: PayrollStatus) => {
        switch (status) {
            case PayrollStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800';
            case PayrollStatus.PROCESSING:
                return 'bg-blue-100 text-blue-800';
            case PayrollStatus.COMPLETED:
                return 'bg-green-100 text-green-800';
            case PayrollStatus.FAILED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const calculateTotalNetPay = () => {
        if (!payroll?.payslips) return { amount: 0, currency: 'USD' };
        const total = payroll.payslips.reduce((total, payslip) => total + (payslip.netPay || 0), 0);
        const currency = payroll.payslips[0]?.currency || 'USD';
        return { amount: total, currency };
    };

    const totalNetPay = calculateTotalNetPay();

    if (!canAccessResource('payroll:view')) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                    <p className="text-gray-600 mt-2">You don't have permission to view payroll details.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <p className="text-gray-500">Loading payroll details...</p>
                </div>
            </div>
        );
    }

    if (isError || !payroll) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <p className="text-red-500">Error loading payroll details</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Button
                    variant="outline"
                    onClick={() => navigate('/payroll')}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Payroll
                </Button>
            </div>

            {/* Payroll Information Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Payroll Period
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Period</label>
                            <p className="font-medium">
                                {format(new Date(payroll.startDate), 'MMM dd, yyyy')} - {format(new Date(payroll.endDate), 'MMM dd, yyyy')}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Branch</label>
                            <p className="font-medium">{payroll.branch?.name || 'Unknown'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <div className="mt-1">
                                <Badge className={getStatusColor(payroll.status)}>
                                    {payroll.status}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Created</label>
                            <p className="font-medium">{format(new Date(payroll.createdAt), 'MMM dd, yyyy')}</p>
                        </div>
                    </div>
                    {payroll.notes && (
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-500">Notes</label>
                            <p className="text-sm mt-1">{payroll.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Employee Payslips Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Employee Payslips</CardTitle>
                </CardHeader>
                <CardContent>
                    {!payroll.payslips || payroll.payslips.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No payslips found for this payroll period.</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee Name</TableHead>
                                        <TableHead className="text-right">Base Salary</TableHead>
                                        <TableHead className="text-right">Commission</TableHead>
                                        <TableHead className="text-right">Bonuses</TableHead>
                                        <TableHead className="text-right">Deductions</TableHead>
                                        <TableHead className="text-right">Net Pay</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payroll.payslips.map((payslip) => (
                                        <TableRow key={payslip.id}>
                                            <TableCell className="font-medium">
                                                {payslip.employee 
                                                    ? `${payslip.employee.firstName} ${payslip.employee.lastName}`
                                                    : 'Unknown Employee'
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(payslip.baseSalary || 0, payslip.currency || 'USD')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(payslip.totalCommission || 0, payslip.currency || 'USD')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(payslip.bonuses || 0, payslip.currency || 'USD')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(payslip.deductions || 0, payslip.currency || 'USD')}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(payslip.netPay || 0, payslip.currency || 'USD')}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => printPayslipById(payslip.id)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                    Print Payslip
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold bg-gray-50">
                                        <TableCell colSpan={6} className="text-right">
                                            Total Net Pay:
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(totalNetPay.amount, totalNetPay.currency)}
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
