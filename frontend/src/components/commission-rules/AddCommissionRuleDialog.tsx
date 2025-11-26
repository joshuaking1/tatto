import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { createCommissionRule, type CreateCommissionRuleDto } from '@/services/commissionRulesService';
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

interface AddCommissionRuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface TierForm {
    threshold: number;
    rate: number;
}

interface CommissionRuleForm {
    name: string;
    tiers: TierForm[];
}

export function AddCommissionRuleDialog({ open, onOpenChange, onSuccess }: AddCommissionRuleDialogProps) {
    const form = useForm<CommissionRuleForm>({
        defaultValues: {
            name: '',
            tiers: [{ threshold: 0, rate: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'tiers',
    });

    const createMutation = useMutation({
        mutationFn: createCommissionRule,
        onSuccess: () => {
            toast.success('Commission rule created successfully');
            form.reset();
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to create commission rule';
            toast.error(message);
        },
    });

    const onSubmit = (data: CommissionRuleForm) => {
        // Convert form data to DTO format
        const createData: CreateCommissionRuleDto = {
            name: data.name,
            tiers: data.tiers.map(tier => ({
                threshold: tier.threshold,
                rate: tier.rate,
            })),
        };
        createMutation.mutate(createData);
    };

    const addTier = () => {
        append({ threshold: 0, rate: 0 });
    };

    const removeTier = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            form.reset({ name: '', tiers: [{ threshold: 0, rate: 0 }] });
        }
    }, [open, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create Commission Rule</DialogTitle>
                    <DialogDescription>
                        Add a new commission rule with tier-based rates.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            rules={{ required: 'Rule name is required' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rule Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter rule name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Commission Tiers</div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addTier}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Tier
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium mb-2">
                                            Tier {index + 1}
                                        </div>
                                        <div className="flex gap-4 mt-2">
                                            <FormField
                                                control={form.control}
                                                name={`tiers.${index}.threshold`}
                                                rules={{
                                                    required: 'Threshold is required',
                                                    min: { value: 0, message: 'Threshold must be at least 0' },
                                                }}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Threshold"
                                                                min="0"
                                                                step="0.01"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`tiers.${index}.rate`}
                                                rules={{
                                                    required: 'Rate is required',
                                                    min: { value: 0, message: 'Rate must be at least 0' },
                                                    max: { value: 1, message: 'Rate cannot exceed 100%' },
                                                }}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Rate (0.15 = 15%)"
                                                                min="0"
                                                                max="1"
                                                                step="0.01"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeTier(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={createMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Rule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
