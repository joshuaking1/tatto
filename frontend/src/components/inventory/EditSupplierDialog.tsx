import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import isEqual from 'lodash/isEqual';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { getSupplierById, updateSupplier, type UpdateSupplierDto } from '@/services/inventoryService';
import { getErrorMessage } from '@/lib/utils';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    contactPerson: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
});

interface EditSupplierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplierId: string | null;
    onSuccess: () => void;
}

export function EditSupplierDialog({ open, onOpenChange, supplierId, onSuccess }: EditSupplierDialogProps) {
    const queryClient = useQueryClient();
    const initialValuesRef = useRef<z.infer<typeof formSchema> | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
        },
    });

    const { data: supplier, isLoading } = useQuery({
        queryKey: ['supplier', supplierId],
        queryFn: () => getSupplierById(supplierId!),
        enabled: open && !!supplierId,
    });

    useEffect(() => {
        if (supplier) {
            const formValues = {
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
            };
            form.reset(formValues);
            initialValuesRef.current = formValues;
        }
    }, [supplier, form]);

    const mutation = useMutation({
        mutationFn: (data: UpdateSupplierDto) => updateSupplier(supplierId!, data),
        onSuccess: () => {
            toast.success('Supplier updated successfully');
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
            onSuccess();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (!initialValuesRef.current) return;

        const changedFields: UpdateSupplierDto = {};
        const hasChanged = (key: keyof typeof values) => !isEqual(values[key], initialValuesRef.current![key]);

        if (hasChanged('name')) changedFields.name = values.name;
        if (hasChanged('contactPerson')) changedFields.contactPerson = values.contactPerson;
        if (hasChanged('email')) changedFields.email = values.email === '' ? undefined : values.email;
        if (hasChanged('phone')) changedFields.phone = values.phone;
        if (hasChanged('address')) changedFields.address = values.address;

        if (Object.keys(changedFields).length === 0) {
            onOpenChange(false);
            return;
        }

        mutation.mutate(changedFields);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Supplier</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="py-4 text-center">Loading supplier details...</div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Supplier name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contactPerson"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Person</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contact person" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="Email address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Phone number" {...field} />
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
                                                <Input placeholder="Address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
