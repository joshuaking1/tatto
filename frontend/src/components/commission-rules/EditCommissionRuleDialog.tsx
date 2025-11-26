import { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { getCommissionRuleById, updateCommissionRule, type UpdateCommissionRuleDto } from '@/services/commissionRulesService';
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

interface EditCommissionRuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ruleId: string;
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

export function EditCommissionRuleDialog({ open, onOpenChange, ruleId, onSuccess }: EditCommissionRuleDialogProps) {
    const form = useForm<CommissionRuleForm>();
    const initialValuesRef = useRef<CommissionRuleForm | null>(null);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'tiers',
    });

    // Fetch rule details
    const { data: rule, isLoading: isLoadingRule } = useQuery({
        queryKey: ['commission-rule', ruleId],
        queryFn: () => getCommissionRuleById(ruleId),
        enabled: open && !!ruleId,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: UpdateCommissionRuleDto) => updateCommissionRule(ruleId, data),
        onSuccess: () => {
            toast.success('Commission rule updated successfully');
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to update commission rule';
            toast.error(message);
        },
    });

    // Populate form with fetched data
    useEffect(() => {
        if (rule) {
            const formData: CommissionRuleForm = {
                name: rule.name,
                tiers: rule.tiers || [],
            };
            form.reset(formData);
            initialValuesRef.current = formData;
        }
    }, [rule, form]);

    const onSubmit = (data: CommissionRuleForm) => {
        // Compare current values with initial values to detect changes
        const initialValues = initialValuesRef.current;
        if (!initialValues) return;

        const changedFields: UpdateCommissionRuleDto = {};

        // Check each field for changes
        if (data.name !== initialValues.name) {
            changedFields.name = data.name;
        }

        // Compare tiers arrays
        const currentTiers = data.tiers;
        const initialTiers = initialValues.tiers;
        
        if (JSON.stringify(currentTiers) !== JSON.stringify(initialTiers)) {
            changedFields.tiers = currentTiers.map(tier => ({
                threshold: tier.threshold,
                rate: tier.rate,
            }));
        }

        // Check if any fields changed
        const hasChanges = Object.keys(changedFields).length > 0;

        if (!hasChanges) {
            toast.info('No changes detected');
            return;
        }

        updateMutation.mutate(changedFields);
    };

    const addTier = () => {
        append({ threshold: 0, rate: 0 });
    };

    const removeTier = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Commission Rule</DialogTitle>
                    <DialogDescription>
                        Update the commission rule. Only changed fields will be saved.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingRule ? (
                    <div className="p-4 text-center">
                        <p className="text-gray-500">Loading rule details...</p>
                    </div>
                ) : (
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
                                    disabled={updateMutation.isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending ? 'Updating...' : 'Update Rule'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
