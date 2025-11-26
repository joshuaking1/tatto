import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateInventoryItem } from '@/services/inventoryService';
import { getErrorMessage } from '@/lib/utils';
import type { InventoryItem } from '@/types';

const formSchema = z.object({
    adjustmentType: z.enum(['add', 'subtract']),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    reason: z.string().optional(),
});

interface AdjustStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem | null;
    onSuccess: () => void;
}

interface StockAdjustmentVariables {
    from: number;
    to: number;
    itemId: string;
}

export function AdjustStockDialog({ open, onOpenChange, item, onSuccess }: AdjustStockDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            adjustmentType: 'add',
            quantity: 1,
            reason: '',
        },
    });

    const adjustmentType = form.watch('adjustmentType');
    const quantity = form.watch('quantity');

    const currentStock = item?.quantity || 0;
    const newStock = adjustmentType === 'add'
        ? currentStock + (quantity || 0)
        : currentStock - (quantity || 0);

    const mutation = useMutation({
        mutationFn: (vars: StockAdjustmentVariables) =>
            updateInventoryItem(vars.itemId, { quantity: vars.to }),
        onSuccess: (_data, variables) => {
            toast.success(`Stock adjusted: ${variables.from} → ${variables.to}`);
            queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
            queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
            form.reset();
            onSuccess();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (!item) return;

        if (values.adjustmentType === 'subtract' && values.quantity > currentStock) {
            form.setError('quantity', {
                type: 'manual',
                message: 'Cannot subtract more than current stock'
            });
            return;
        }

        const finalQuantity = values.adjustmentType === 'add'
            ? currentStock + values.quantity
            : currentStock - values.quantity;

        mutation.mutate({
            from: currentStock,
            to: finalQuantity,
            itemId: item.id,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Adjust Stock: {item?.name}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <div className="flex justify-between items-center bg-muted p-3 rounded-md mb-4">
                        <span className="text-sm font-medium">Current Stock:</span>
                        <span className="text-lg font-bold">{currentStock}</span>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="adjustmentType"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Action</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex space-x-4"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="add" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-green-600 font-medium">
                                                        Add Stock
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="subtract" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal text-red-600 font-medium">
                                                        Remove Stock
                                                    </FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-between items-center border-t pt-4 mt-2">
                                <span className="text-sm font-medium">New Stock Preview:</span>
                                <span className={`text-lg font-bold ${newStock < 0 ? 'text-red-600' : ''}`}>
                                    {newStock}
                                </span>
                            </div>

                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Why is stock being adjusted?"
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending || newStock < 0}>
                                    {mutation.isPending ? 'Updating...' : 'Update Stock'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
