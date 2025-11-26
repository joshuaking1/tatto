import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlusCircle, Search, Scissors, Trash2, Edit, MoreVertical } from 'lucide-react';

import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  getAllServices,
  getAllServiceCategories,
  deleteService,
  deleteServiceCategory,
} from '@/services/servicesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { AddServiceDialog } from '@/components/services/AddServiceDialog';
import { EditServiceDialog } from '@/components/services/EditServiceDialog';
import { AddCategoryDialog } from '@/components/services/AddCategoryDialog';
import { getErrorMessage } from '@/lib/utils';
import type { Service, ServiceCategory } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ServicesPage() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [editServiceOpen, setEditServiceOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [deleteServiceOpen, setDeleteServiceOpen] = useState(false);
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { canAccessResource } = usePermissions();

  const canCreate = canAccessResource('service:create');
  const canEdit = canAccessResource('service:edit');
  const canDelete = canAccessResource('service:delete');
  const canManageCategories = canCreate;

  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError,
  } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: getAllServices,
  });

  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery<ServiceCategory[]>({
    queryKey: ['serviceCategories'],
    queryFn: getAllServiceCategories,
    enabled: canManageCategories,
  });

  const deleteServiceMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success('Service deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDeleteServiceOpen(false);
      setSelectedServiceId(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteServiceCategory,
    onSuccess: () => {
      toast.success('Category deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['serviceCategories', 'services'] });
      setDeleteCategoryOpen(false);
      setSelectedCategoryId(null);
      setCategoryFilter('all');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter((service) => {
      const searchMatch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = categoryFilter === 'all' || service.categoryId === categoryFilter;
      return searchMatch && categoryMatch;
    });
  }, [services, searchQuery, categoryFilter]);

  const groupedServices = useMemo(() => {
    if (!canManageCategories || !filteredServices || !categories) return {};
    return filteredServices.reduce((acc, service) => {
      const category = categories.find((c) => c.id === service.categoryId);
      const categoryName = category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [canManageCategories, filteredServices, categories]);

  const handleEditClick = (id: string) => {
    setSelectedServiceId(id);
    setEditServiceOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedServiceId(id);
    setDeleteServiceOpen(true);
  };

  const handleDeleteCategoryClick = (id: string) => {
    setSelectedCategoryId(id);
    setDeleteCategoryOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (isLoadingServices || isLoadingCategories) {
    return <div>Loading...</div>;
  }

  if (servicesError || categoriesError) {
    return <div>Error loading data.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Services Management</h1>
        {canCreate && (
          <div className="flex items-center gap-2">
            <PermissionGuard permission="service:create">
              <Button onClick={() => setAddCategoryOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </PermissionGuard>
            {canCreate && (
              <PermissionGuard permission="service:create">
                <Button onClick={() => setAddServiceOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </PermissionGuard>
            )}
          </div>
        )}
      </header>

      {canManageCategories && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage your service categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {categories?.map((category) => (
              <Badge key={category.id} variant="secondary" className="p-2">
                {category.name}
                <PermissionGuard permission="service:delete">
                  <Trash2
                    className="ml-2 h-3 w-3 cursor-pointer text-red-500"
                    onClick={() => handleDeleteCategoryClick(category.id)}
                  />
                </PermissionGuard>
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
          <CardDescription>Browse and manage all available services.</CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {canManageCategories && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {canManageCategories && Object.keys(groupedServices).length > 0 ? (
            Object.entries(groupedServices).map(([categoryName, servicesInCategory]) => (
              <div key={categoryName} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">{categoryName}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {servicesInCategory.map((service) => (
                    <Card key={service.id}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          {service.name}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <PermissionGuard permission="service:edit">
                                <DropdownMenuItem onClick={() => handleEditClick(service.id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </PermissionGuard>
                              <PermissionGuard permission="service:delete">
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(service.id)}
                                  className="text-red-500"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </PermissionGuard>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Price:</span>
                          <span>{formatCurrency(service.basePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Duration:</span>
                          <span>{service.duration} mins</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Status:</span>
                          <Badge variant={service.isActive ? 'default' : 'outline'}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Artists:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {service.artists.length > 0 ? (
                              service.artists.map((artist) => (
                                <Badge key={artist.userId} variant="secondary">
                                  {artist.user.firstName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No assigned artists
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          ) : !canManageCategories && filteredServices && filteredServices.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      {service.name}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGuard permission="service:edit">
                            <DropdownMenuItem onClick={() => handleEditClick(service.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </PermissionGuard>
                          <PermissionGuard permission="service:delete">
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(service.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </PermissionGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Price:</span>
                      <span>{formatCurrency(service.basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Duration:</span>
                      <span>{service.duration} mins</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={service.isActive ? 'default' : 'outline'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Artists:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {service.artists.length > 0 ? (
                          service.artists.map((artist) => (
                            <Badge key={artist.userId} variant="secondary">
                              {artist.user.firstName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No assigned artists
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Scissors className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">No services found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PermissionGuard permission="service:create">
        <AddServiceDialog
          open={addServiceOpen}
          onOpenChange={setAddServiceOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
        />
      </PermissionGuard>
      <PermissionGuard permission="service:edit">
        <EditServiceDialog
          open={editServiceOpen}
          onOpenChange={setEditServiceOpen}
          serviceId={selectedServiceId}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
        />
      </PermissionGuard>
      <PermissionGuard permission="service:create">
        <AddCategoryDialog
          open={addCategoryOpen}
          onOpenChange={setAddCategoryOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['serviceCategories'] })}
        />
      </PermissionGuard>

      {/* Delete Confirmation Dialogs */}
      <Dialog open={deleteServiceOpen} onOpenChange={setDeleteServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the service.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => selectedServiceId && deleteServiceMutation.mutate(selectedServiceId)}
              disabled={deleteServiceMutation.isPending}
            >
              {deleteServiceMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteCategoryOpen} onOpenChange={setDeleteCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the service category.
              Services in this category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() =>
                selectedCategoryId && deleteCategoryMutation.mutate(selectedCategoryId)
              }
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}