import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getAllBranches } from '@/services/branchesService';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface BranchSelectorProps {
    /** The currently selected value: branch id, 'all' for all branches, or undefined for no selection */
    value: string | undefined;
    onValueChange: (value: string | undefined) => void;
    placeholder?: string;
    includeAllOption?: boolean;
    className?: string;
}

export function BranchSelector({
    value,
    onValueChange,
    placeholder = 'Select branch',
    includeAllOption = true,
    className,
}: BranchSelectorProps) {
    const { data: branches = [], isLoading, error } = useQuery({
        queryKey: ['branches'],
        queryFn: getAllBranches,
    });

    const getDisplayText = () => {
        if (isLoading) return 'Loading branches...';
        if (error) return 'Error loading branches';
        
        // Explicitly check for 'all' value first
        if (includeAllOption && value === 'all') {
            return 'All Branches';
        }
        
        // Check for no selection state
        if (!value) {
            return placeholder;
        }
        
        // Look up branch by ID
        const selectedBranch = branches.find(branch => branch.id === value);
        return selectedBranch?.name || placeholder;
    };

    return (
        <Select
            value={value ?? ''}
            onValueChange={(newValue) => {
                // Pass 'all' through unchanged when it's a legitimate option
                if (includeAllOption && newValue === 'all') {
                    onValueChange('all');
                } else if (newValue === '') {
                    // Convert empty string back to undefined for no selection
                    onValueChange(undefined);
                } else {
                    onValueChange(newValue);
                }
            }}
        >
            <SelectTrigger className={cn(className)}>
                <SelectValue placeholder={placeholder}>
                    {getDisplayText()}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {includeAllOption && (
                    <SelectItem value="all">
                        All Branches
                    </SelectItem>
                )}
                {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
