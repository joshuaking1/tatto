import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    createInventoryItem,
    getAllInventoryCategories,
    getAllSuppliers,
    type CreateInventoryItemDto
} from '@/services/inventoryService';
import { getErrorMessage } from '@/lib/utils';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    sku: z.string().optional(),
    quantity: z.coerce.number().min(0, 'Quantity must be at least 0'),
    reorderLevel: z.preprocess(
        (val) => (val === '' || val === null ? undefined : val),
        z.coerce.number().min(0, 'Reorder level must be at least 0').optional()
    ),
    unitPrice: z.preprocess(
        (val) => (val === '' || val === null ? undefined : val),
        z.coerce.number().min(0, 'Unit price must be at least 0').optional()
    ),
    categoryId: z.string().min(1, 'Category is required'),
    supplierId: z.string().optional(),
});

interface AddInventoryItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddInventoryItemDialog({ open, onOpenChange, onSuccess }: AddInventoryItemDialogProps) {
    const queryClient = useQueryClient();

    type FormValues = z.output<typeof formSchema>;
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            sku: '',
            quantity: 0,
            reorderLevel: undefined,
            unitPrice: undefined,
            categoryId: '',
            supplierId: 'none',
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['inventoryCategories'],
        queryFn: getAllInventoryCategories,
        enabled: open,
    });

    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: getAllSuppliers,
        enabled: open,
    });

    const mutation = useMutation({
        mutationFn: createInventoryItem,
        onSuccess: () => {
            toast.success('Inventory item created successfully');
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            queryClient.invalidateQueries({ queryKey: ['inventoryCategories'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            form.reset();
            onSuccess();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const onSubmit = (values: FormValues) => {
        const payload: CreateInventoryItemDto = {
            ...values,
            reorderLevel: values.reorderLevel,
            unitPrice: values.unitPrice,
            supplierId: values.supplierId === 'none' || !values.supplierId ? undefined : values.supplierId,
        };
        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Item name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU</FormLabel>
                                        <FormControl>
                                            <Input placeholder="SKU (optional)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reorderLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reorder Level</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unitPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories?.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
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
                                name="supplierId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select supplier" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {suppliers?.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                {mutation.isPending ? 'Creating...' : 'Create Item'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
