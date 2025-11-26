import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getStaffById, updateStaff } from '@/services/staffService';
import type { UpdateStaffDto } from '@/services/staffService';
import { getAllBranches } from '@/services/branchesService';
import { getAllCommissionRules } from '@/services/commissionRulesService';
import { UserRole, SalaryType } from '@/types';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EditStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staffId: string;
    onSuccess: () => void;
}

export function EditStaffDialog({ open, onOpenChange, staffId, onSuccess }: EditStaffDialogProps) {
    const form = useForm<UpdateStaffDto>();
    const initialValuesRef = useRef<UpdateStaffDto | null>(null);

    // Fetch staff details
    const { data: staff, isLoading: isLoadingStaff } = useQuery({
        queryKey: ['staff', staffId],
        queryFn: () => getStaffById(staffId),
        enabled: open && !!staffId,
    });

    // Fetch branches
    const { data: branches = [] } = useQuery({
        queryKey: ['branches'],
        queryFn: getAllBranches,
    });

    // Fetch commission rules
    const { data: commissionRules = [] } = useQuery({
        queryKey: ['commissionRules'],
        queryFn: getAllCommissionRules,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: UpdateStaffDto) => updateStaff(staffId, data),
        onSuccess: () => {
            toast.success('Staff member updated successfully');
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update staff member');
        },
    });

    // Populate form with staff data and store initial values
    useEffect(() => {
        if (staff) {
            const initialValues: UpdateStaffDto = {
                firstName: staff.firstName,
                lastName: staff.lastName,
                role: staff.role,
                phone: staff.staffProfile?.phone || '',
                branchId: staff.branchId || '',
                bio: staff.staffProfile?.bio || '',
                instagramHandle: staff.staffProfile?.instagramHandle || '',
                commissionRate: staff.staffProfile?.commissionRate,
                baseSalary: staff.staffProfile?.baseSalary,
                salaryType: staff.staffProfile?.salaryType || SalaryType.MONTHLY,
                commissionRuleId: staff.staffProfile?.commissionRuleId || '',
            };

            initialValuesRef.current = initialValues;
            form.reset(initialValues);
        }
    }, [staff, form]);

    const onSubmit = (data: UpdateStaffDto) => {
        if (!initialValuesRef.current) {
            updateMutation.mutate(data);
            return;
        }

        // Build minimal payload with only changed fields
        const changedFields: Partial<UpdateStaffDto> = {};
        const initial = initialValuesRef.current;

        if (data.firstName !== initial.firstName) changedFields.firstName = data.firstName;
        if (data.lastName !== initial.lastName) changedFields.lastName = data.lastName;
        if (data.role !== initial.role) changedFields.role = data.role;
        if (data.phone !== initial.phone) changedFields.phone = data.phone;
        if (data.branchId !== initial.branchId) changedFields.branchId = data.branchId;
        if (data.bio !== initial.bio) changedFields.bio = data.bio;
        if (data.instagramHandle !== initial.instagramHandle) changedFields.instagramHandle = data.instagramHandle;
        if (data.commissionRate !== initial.commissionRate && data.commissionRate !== undefined) {
            changedFields.commissionRate = data.commissionRate;
        }
        if (data.baseSalary !== initial.baseSalary && data.baseSalary !== undefined) {
            changedFields.baseSalary = data.baseSalary;
        }
        if (data.salaryType !== initial.salaryType) changedFields.salaryType = data.salaryType;
        if (data.commissionRuleId !== initial.commissionRuleId) changedFields.commissionRuleId = data.commissionRuleId;

        // Only send if there are changes
        if (Object.keys(changedFields).length > 0) {
            updateMutation.mutate(changedFields as UpdateStaffDto);
        } else {
            toast.info('No changes detected');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Staff Member</DialogTitle>
                </DialogHeader>

                {isLoadingStaff ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">Loading staff details...</p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                    <TabsTrigger value="profile">Staff Profile</TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="firstName"
                                            rules={{ required: 'First name is required' }}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>First Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
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
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input value={staff?.email} disabled />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="role"
                                        rules={{ required: 'Role is required' }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                                                        <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                                                        <SelectItem value={UserRole.ARTIST}>Artist</SelectItem>
                                                        <SelectItem value={UserRole.RECEPTIONIST}>Receptionist</SelectItem>
                                                        <SelectItem value={UserRole.CASHIER}>Cashier</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                                                    <Input type="tel" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="branchId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Branch</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
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
                                </TabsContent>

                                <TabsContent value="profile" className="space-y-4 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="bio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bio</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Tell us about this staff member..."
                                                        className="resize-none"
                                                        rows={4}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="instagramHandle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Instagram Handle</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="@username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="commissionRate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Commission Rate</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="1"
                                                        placeholder="0.50"
                                                        value={field.value ?? ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            field.onChange(value === '' ? undefined : parseFloat(value));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="baseSalary"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Base Salary</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="0.00"
                                                            value={field.value ?? ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                field.onChange(value === '' ? undefined : parseFloat(value));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="salaryType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Salary Type</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value={SalaryType.MONTHLY}>Monthly</SelectItem>
                                                            <SelectItem value={SalaryType.HOURLY}>Hourly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="commissionRuleId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Commission Rule</FormLabel>
                                                <Select
                                                    onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                                                    value={field.value || 'none'}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a commission rule" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {commissionRules.map((rule) => (
                                                            <SelectItem key={rule.id} value={rule.id}>
                                                                {rule.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TabsContent>
                            </Tabs>

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
                                    {updateMutation.isPending ? 'Updating...' : 'Update Staff'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
