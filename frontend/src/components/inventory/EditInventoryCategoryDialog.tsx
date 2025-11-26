import { useEffect } from 'react';
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
import { updateInventoryCategory, type UpdateInventoryCategoryDto } from '@/services/inventoryService';
import { getErrorMessage } from '@/lib/utils';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

interface EditInventoryCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoryId: string | null;
    categoryName: string | null;
    onSuccess: () => void;
}

export function EditInventoryCategoryDialog({
    open,
    onOpenChange,
    categoryId,
    categoryName,
    onSuccess
}: EditInventoryCategoryDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (open && categoryName) {
            form.reset({ name: categoryName });
        }
    }, [open, categoryName, form]);

    const mutation = useMutation({
        mutationFn: (data: UpdateInventoryCategoryDto) => updateInventoryCategory(categoryId!, data),
        onSuccess: () => {
            toast.success('Category updated successfully');
            queryClient.invalidateQueries({ queryKey: ['inventoryCategories'] });
            onSuccess();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (values.name === categoryName) {
            onOpenChange(false);
            return;
        }
        mutation.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
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
                                {mutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
