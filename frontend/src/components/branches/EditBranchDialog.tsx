import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getBranchById, updateBranch, type UpdateBranchDto } from '@/services/branchesService';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface EditBranchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId: string;
    onSuccess: () => void;
}

export function EditBranchDialog({ open, onOpenChange, branchId, onSuccess }: EditBranchDialogProps) {
    // Early return if no valid branchId
    if (!branchId) {
        return null;
    }

    const form = useForm<UpdateBranchDto>();
    const initialValuesRef = useRef<UpdateBranchDto | null>(null);

    // Fetch branch details
    const { data: branch, isLoading: isLoadingBranch } = useQuery({
        queryKey: ['branch', branchId],
        queryFn: () => getBranchById(branchId),
        enabled: open && !!branchId,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: UpdateBranchDto) => updateBranch(branchId, data),
        onSuccess: () => {
            toast.success('Branch updated successfully');
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: any) => {
            // Derive user-friendly message from error or use generic fallback
            const message = error?.response?.data?.message || 'Failed to update branch';
            toast.error(message);
        },
    });

    // Populate form with fetched data
    useEffect(() => {
        if (branch) {
            const formData: UpdateBranchDto = {
                name: branch.name,
                address: branch.address || '',
                phone: branch.phone || '',
                isDefault: branch.isDefault || false,
            };
            form.reset(formData);
            initialValuesRef.current = formData;
        }
    }, [branch, form]);

    const onSubmit = (data: UpdateBranchDto) => {
        // Compare current values with initial values to detect changes
        const initialValues = initialValuesRef.current;
        if (!initialValues) return;

        const changedFields: UpdateBranchDto = {};

        // Check each field for changes
        if (data.name !== initialValues.name) {
            changedFields.name = data.name;
        }
        if (data.address !== initialValues.address) {
            changedFields.address = data.address;
        }
        if (data.phone !== initialValues.phone) {
            changedFields.phone = data.phone;
        }
        if (data.isDefault !== initialValues.isDefault) {
            changedFields.isDefault = data.isDefault;
        }

        // Check if any fields changed
        const hasChanges = Object.keys(changedFields).length > 0;

        if (!hasChanges) {
            toast.info('No changes detected');
            return;
        }

        updateMutation.mutate(changedFields);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Branch</DialogTitle>
                    <DialogDescription>
                        Update the branch information. Only changed fields will be saved.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingBranch ? (
                    <div className="p-4 text-center">
                        <p className="text-gray-500">Loading branch details...</p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                rules={{ required: 'Branch name is required' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter branch name" {...field} />
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
                                            <Input placeholder="Enter branch address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="Enter branch phone" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isDefault"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Default Branch</FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                Set this as the default branch for the organization
                                            </p>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={updateMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? 'Updating...' : 'Update Branch'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
