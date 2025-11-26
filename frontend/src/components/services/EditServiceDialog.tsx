import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isEqual } from 'lodash';

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
import {
  updateService,
  getServiceById,
  getAllServiceCategories,
} from '@/services/servicesService';
import type { UpdateServiceDto } from '@/services/servicesService';
import { getAllStaff } from '@/services/staffService';
import { getErrorMessage } from '@/lib/utils';
import { UserRole } from '@/types';
import { Switch } from '@/components/ui/switch';

const editServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
  basePrice: z.coerce.number().min(0, 'Price must be a positive number'),
  isActive: z.boolean(),
  categoryId: z.string().min(1, 'Category is required'),
  artistIds: z.array(z.string()).optional(),
});

type EditServiceFormValues = z.infer<typeof editServiceSchema>;

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string | null;
  onSuccess: () => void;
}

export function EditServiceDialog({
  open,
  onOpenChange,
  serviceId,
  onSuccess,
}: EditServiceDialogProps) {
  const form = useForm<EditServiceFormValues>({
    resolver: zodResolver(editServiceSchema),
  });
  const initialFormState = useRef<EditServiceFormValues | null>(null);

  const { data: service, isLoading: isLoadingService } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => getServiceById(serviceId!),
    enabled: !!serviceId && open,
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

  useEffect(() => {
    if (service) {
      const initialData = {
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        basePrice: service.basePrice,
        isActive: service.isActive,
        categoryId: service.categoryId,
        artistIds: service.artists.map((a) => a.userId),
      };
      form.reset(initialData);
      initialFormState.current = initialData;
    }
  }, [service, form]);

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceDto }) =>
      updateService(id, data),
    onSuccess: () => {
      toast.success('Service updated successfully.');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = (data: EditServiceFormValues) => {
    if (!serviceId || !initialFormState.current) return;

    const changedFields: UpdateServiceDto = {};

    for (const key in data) {
      const formKey = key as keyof EditServiceFormValues;
      if (!isEqual(data[formKey], initialFormState.current[formKey])) {
        (changedFields as any)[formKey] = data[formKey];
      }
    }

    if (Object.keys(changedFields).length === 0) {
      toast.info('No changes detected.');
      return;
    }

    mutation.mutate({ id: serviceId, data: changedFields });
  };

  const isLoading = isLoadingService || isLoadingCategories || isLoadingStaff;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
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
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}