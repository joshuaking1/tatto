import apiClient from "./apiClient";
import type { InventoryItem, InventoryCategory, Supplier } from "@/types";

// Inventory Item DTOs
export interface CreateInventoryItemDto {
    name: string;
    sku?: string;
    quantity: number;
    reorderLevel?: number;
    unitPrice?: number;
    categoryId: string;
    supplierId?: string;
}

export interface UpdateInventoryItemDto extends Partial<CreateInventoryItemDto> { }

export interface AdjustStockDto {
    adjustment: number;
    reason?: string;
}

// Inventory Category DTOs
export interface CreateInventoryCategoryDto {
    name: string;
}

export interface UpdateInventoryCategoryDto extends Partial<CreateInventoryCategoryDto> { }

// Supplier DTOs
export interface CreateSupplierDto {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> { }

// Inventory Item Functions
export const getAllInventoryItems = async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get('/inventory-items');
    return response.data;
};

export const getLowStockItems = async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get('/inventory-items/low-stock');
    return response.data;
};

export const getInventoryItemById = async (id: string): Promise<InventoryItem> => {
    const response = await apiClient.get(`/inventory-items/${id}`);
    return response.data;
};

export const createInventoryItem = async (data: CreateInventoryItemDto): Promise<InventoryItem> => {
    const response = await apiClient.post('/inventory-items', data);
    return response.data;
};

export const updateInventoryItem = async (id: string, data: UpdateInventoryItemDto): Promise<InventoryItem> => {
    const response = await apiClient.patch(`/inventory-items/${id}`, data);
    return response.data;
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory-items/${id}`);
};

// Inventory Category Functions
export const getAllInventoryCategories = async (): Promise<InventoryCategory[]> => {
    const response = await apiClient.get('/inventory-categories');
    return response.data;
};

export const createInventoryCategory = async (data: CreateInventoryCategoryDto): Promise<InventoryCategory> => {
    const response = await apiClient.post('/inventory-categories', data);
    return response.data;
};

export const updateInventoryCategory = async (id: string, data: UpdateInventoryCategoryDto): Promise<InventoryCategory> => {
    const response = await apiClient.patch(`/inventory-categories/${id}`, data);
    return response.data;
};

export const deleteInventoryCategory = async (id: string): Promise<void> => {
    await apiClient.delete(`/inventory-categories/${id}`);
};

// Supplier Functions
export const getAllSuppliers = async (): Promise<Supplier[]> => {
    const response = await apiClient.get('/suppliers');
    return response.data;
};

export const getSupplierById = async (id: string): Promise<Supplier> => {
    const response = await apiClient.get(`/suppliers/${id}`);
    return response.data;
};

export const createSupplier = async (data: CreateSupplierDto): Promise<Supplier> => {
    const response = await apiClient.post('/suppliers', data);
    return response.data;
};

export const updateSupplier = async (id: string, data: UpdateSupplierDto): Promise<Supplier> => {
    const response = await apiClient.patch(`/suppliers/${id}`, data);
    return response.data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
};
