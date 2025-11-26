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
import { createInventoryCategory, type CreateInventoryCategoryDto } from '@/services/inventoryService';
import { getErrorMessage } from '@/lib/utils';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

interface AddInventoryCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AddInventoryCategoryDialog({ open, onOpenChange, onSuccess }: AddInventoryCategoryDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
        },
    });

    const mutation = useMutation({
        mutationFn: createInventoryCategory,
        onSuccess: () => {
            toast.success('Category created successfully');
            queryClient.invalidateQueries({ queryKey: ['inventoryCategories'] });
            form.reset();
            onSuccess();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const payload: CreateInventoryCategoryDto = { name: values.name };
        mutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Category</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Category name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Creating...' : 'Create Category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
