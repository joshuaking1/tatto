import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCustomerById, updateCustomer } from '@/services/customersService';
import type { UpdateCustomerDto } from '@/services/customersService';
import {
    Dialog,
    DialogContent,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EditCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerId: string;
    onSuccess: () => void;
}

export function EditCustomerDialog({ open, onOpenChange, customerId, onSuccess }: EditCustomerDialogProps) {
    const form = useForm<UpdateCustomerDto>();
    const initialValuesRef = useRef<UpdateCustomerDto | null>(null);

    const { data: customer, isLoading: isLoadingCustomer } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: () => getCustomerById(customerId),
        enabled: open && !!customerId,
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateCustomerDto) => updateCustomer(customerId, data),
        onSuccess: () => {
            toast.success('Customer updated successfully');
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update customer');
        },
    });

    useEffect(() => {
        if (customer) {
            const initialValues: UpdateCustomerDto = {
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.customerProfile?.phone || '',
                address: customer.customerProfile?.address || '',
                allergies: customer.customerProfile?.allergies || '',
                notes: customer.customerProfile?.notes || '',
            };

            initialValuesRef.current = initialValues;
            form.reset(initialValues);
        }
    }, [customer, form]);

    const onSubmit = (data: UpdateCustomerDto) => {
        if (!initialValuesRef.current) {
            updateMutation.mutate(data);
            return;
        }

        const changedFields: Partial<UpdateCustomerDto> = {};
        const initial = initialValuesRef.current;

        if (data.firstName !== initial.firstName) changedFields.firstName = data.firstName;
        if (data.lastName !== initial.lastName) changedFields.lastName = data.lastName;
        if (data.phone !== initial.phone) changedFields.phone = data.phone;
        if (data.address !== initial.address) changedFields.address = data.address;
        if (data.allergies !== initial.allergies) changedFields.allergies = data.allergies;
        if (data.notes !== initial.notes) changedFields.notes = data.notes;

        if (Object.keys(changedFields).length > 0) {
            updateMutation.mutate(changedFields as UpdateCustomerDto);
        } else {
            toast.info('No changes detected');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Customer</DialogTitle>
                </DialogHeader>

                {isLoadingCustomer ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">Loading customer details...</p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={customer?.email} disabled />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    rules={{ required: 'First name is required' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={updateMutation.isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    rules={{ required: 'Last name is required' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={updateMutation.isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input type="tel" {...field} disabled={updateMutation.isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} disabled={updateMutation.isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="allergies"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Allergies</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} disabled={updateMutation.isPending} />
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
                                            <Textarea {...field} disabled={updateMutation.isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={updateMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? 'Updating...' : 'Update Customer'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
