import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { createService, getAllServiceCategories } from '@/services/servicesService';
import { getAllStaff } from '@/services/staffService';
import { getErrorMessage } from '@/lib/utils';
import { UserRole } from '@/types';
import { Switch } from '@/components/ui/switch';

const addServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
  basePrice: z.coerce.number().min(0, 'Price must be a positive number'),
  isActive: z.boolean().default(true),
  categoryId: z.string().min(1, 'Category is required'),
  artistIds: z.array(z.string()).optional(),
});

type AddServiceFormValues = z.infer<typeof addServiceSchema>;

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddServiceDialog({ open, onOpenChange, onSuccess }: AddServiceDialogProps) {
  const form = useForm<AddServiceFormValues>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      name: '',
      description: '',
      duration: 30,
      basePrice: 50,
      isActive: true,
      categoryId: '',
      artistIds: [],
    },
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: getAllServiceCategories,
    enabled: open,
  });

  const { data: staff, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: getAllStaff,
    enabled: open,
  });

  const artists = React.useMemo(
    () => staff?.filter((s) => s.role === UserRole.ARTIST) || [],
    [staff],
  );

  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      toast.success('Service created successfully.');
      form.reset();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = (data: AddServiceFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Small Tribal Tattoo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the service..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artistIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Artists</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={
                        artists.map((artist) => ({
                          value: artist.id,
                          label: `${artist.firstName} ${artist.lastName}`,
                        })) || []
                      }
                      onValueChange={field.onChange}
                      defaultValue={field.value || []}
                      placeholder="Select artists..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Adding...' : 'Add Service'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
