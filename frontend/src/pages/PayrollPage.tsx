import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Eye, Wallet } from 'lucide-react';
import { getAllPayrolls } from '@/services/payrollService';
import { usePermissions } from '@/hooks/usePermissions';
import { type Payroll, PayrollStatus } from '@/types';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GeneratePayrollDialog } from '@/components/payroll/GeneratePayrollDialog';
import { format } from 'date-fns';

export function PayrollPage() {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

    // Fetch payroll list
    const { data: payrollList = [], isLoading, isError } = useQuery({
        queryKey: ['payrolls'],
        queryFn: getAllPayrolls,
    });

    // Filter payroll based on search query
    const filteredPayroll = useMemo(() => {
        if (!searchQuery) return payrollList;

        const query = searchQuery.toLowerCase();
        return payrollList.filter((payroll) => {
            // Search by branch name
            if (payroll.branch?.name.toLowerCase().includes(query)) return true;
            // Search by notes
            if (payroll.notes && payroll.notes.toLowerCase().includes(query)) return true;
            // Search by date range
            const periodText = `${format(new Date(payroll.startDate), 'MMM dd, yyyy')} - ${format(new Date(payroll.endDate), 'MMM dd, yyyy')}`;
            if (periodText.toLowerCase().includes(query)) return true;
            return false;
        });
    }, [payrollList, searchQuery]);

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

    const viewPayrollDetails = (payrollId: string) => {
        navigate(`/payroll/${payrollId}`);
    };

    return (
        <PermissionGuard 
            permission="payroll:view"
            fallback={
                <div className="container mx-auto py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                        <p className="text-gray-600 mt-2">You don't have permission to view payroll.</p>
                    </div>
                </div>
            }
        >
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Payroll</h1>
                    <p className="text-gray-600">Manage payroll periods and employee payments</p>
                </div>
                <PermissionGuard permission="payroll:create">
                    <Button onClick={() => setGenerateDialogOpen(true)}>
                        <Wallet className="h-4 w-4 mr-2" />
                        Generate Payroll
                    </Button>
                </PermissionGuard>
            </div>

            {/* Search and Filters */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search payroll by branch, notes, or dates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Payroll Table */}
            <div className="bg-white rounded-lg shadow">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Loading payroll...</p>
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center">
                        <p className="text-red-500">Error loading payroll</p>
                    </div>
                ) : filteredPayroll.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">
                            {searchQuery ? 'No payroll found matching your search.' : 'No payroll periods found.'}
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayroll.map((payroll) => (
                                <TableRow 
                                    key={payroll.id} 
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => viewPayrollDetails(payroll.id)}
                                >
                                    <TableCell className="font-medium">
                                        {format(new Date(payroll.startDate), 'MMM dd, yyyy')} - {format(new Date(payroll.endDate), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell>{payroll.branch?.name || 'Unknown'}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(payroll.status)}>
                                            {payroll.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(payroll.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => viewPayrollDetails(payroll.id)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Generate Payroll Dialog */}
            <GeneratePayrollDialog
                open={generateDialogOpen}
                onOpenChange={setGenerateDialogOpen}
                onSuccess={() => {
                    // Refresh will be handled by query invalidation in the dialog
                }}
            />
        </div>
        </PermissionGuard>
    );
}
