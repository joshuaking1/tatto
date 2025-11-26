import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generatePayroll, type CreatePayrollDto } from '@/services/payrollService';
import { getAllBranches } from '@/services/branchesService';
import { isAfter, format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface GeneratePayrollDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function GeneratePayrollDialog({ open, onOpenChange, onSuccess }: GeneratePayrollDialogProps) {
    const queryClient = useQueryClient();
    const form = useForm<CreatePayrollDto>({
        defaultValues: {
            startDate: '',
            endDate: '',
            branchId: '',
            notes: '',
        },
    });

    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: getAllBranches,
        enabled: open,
    });

    const generateMutation = useMutation({
        mutationFn: generatePayroll,
        onSuccess: () => {
            toast.success('Payroll generated successfully');
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            form.reset();
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to generate payroll';
            toast.error(message);
        },
    });

    const onSubmit = (data: CreatePayrollDto) => {
        generateMutation.mutate(data);
    };

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Payroll</DialogTitle>
                    <DialogDescription>
                        Create a new payroll run for a specific period and branch.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="branchId"
                            rules={{ required: 'Branch is required' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branch</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select branch" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="startDate"
                            rules={{ required: 'Start date is required' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            value={field.value ? new Date(field.value) : undefined}
                                            onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endDate"
                            rules={{
                                required: 'End date is required',
                                validate: (value) => {
                                    const startDate = form.getValues('startDate');
                                    if (!startDate || !value) return true;
                                    return isAfter(new Date(value), new Date(startDate)) || 
                                           'End date must be after start date';
                                },
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                        <DatePicker
                                            value={field.value ? new Date(field.value) : undefined}
                                            onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Add any notes about this payroll run..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={generateMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={generateMutation.isPending}
                            >
                                {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
