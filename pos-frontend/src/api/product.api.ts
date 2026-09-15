import { apiClient } from './client';
import type {
  Product,
  Category,
  PageResponse,
  PageRequest,
  CreateProductInput,
  UpdateProductInput,
} from '../types';
import {
  getStoredImages,
  saveProductImage,
  removeProductImage,
  getLocalCustomProducts,
  saveLocalCustomProduct,
  deleteLocalCustomProduct,
  SEED_PRODUCTS,
  CATEGORY_FALLBACK_IMAGES,
} from '../utils/productImages';

export const productApi = {
  async getProducts(
    params?: {
      category?: string;
      categoryId?: string;
      search?: string;
      barcode?: string;
      available?: boolean;
    } & PageRequest
  ): Promise<PageResponse<Product>> {
    let backendProducts: Product[] = [];
    let totalElements = 0;

    try {
      const response: any = await apiClient.get('/api/v1/products', {
        params: {
          category: params?.category,
          available: params?.available,
          page: params?.page ?? 0,
          size: params?.size ?? 50,
        },
      });

      // Handle ApiResponse envelope { success: true, data: [...], meta: {...} } or direct array
      const rawData = response?.data !== undefined ? response.data : response;
      if (Array.isArray(rawData)) {
        backendProducts = rawData;
        totalElements = response?.meta?.totalElements ?? rawData.length;
      } else if (rawData?.content && Array.isArray(rawData.content)) {
        backendProducts = rawData.content;
        totalElements = rawData.totalElements ?? backendProducts.length;
      }
    } catch {
      // Backend not running or offline, proceed with local fallback
      backendProducts = [];
      totalElements = 0;
    }

    // Combine with locally created products & fallback seed items if backend is empty
    const localCustom = getLocalCustomProducts();
    const storedImages = getStoredImages();

    let combined: Product[] = [];
    if (backendProducts.length === 0 && localCustom.length === 0) {
      combined = [...SEED_PRODUCTS];
    } else {
      // De-duplicate by ID (local custom products take precedence)
      const map = new Map<string, Product>();
      backendProducts.forEach((p) => map.set(p.id, p));
      localCustom.forEach((p) => map.set(p.id, p));
      combined = Array.from(map.values());
    }

    // Enrich with stored images or category fallback images
    combined = combined.map((p) => {
      const categoryKey = (p.category || 'COFFEE').toString().toUpperCase();
      const userImage = storedImages[p.id];
      const fallbackImage = CATEGORY_FALLBACK_IMAGES[categoryKey] || CATEGORY_FALLBACK_IMAGES.COFFEE;
      return {
        ...p,
        category: p.category || 'COFFEE',
        imageUrl: userImage || p.imageUrl || fallbackImage,
      };
    });

    // Client-side filtering if search or category is specified
    if (params?.category && params.category !== 'ALL') {
      combined = combined.filter(
        (p) =>
          p.category?.toString().toUpperCase() === params.category?.toUpperCase()
      );
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      combined = combined.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (params?.available !== undefined) {
      combined = combined.filter((p) => p.available === params.available);
    }

    return {
      content: combined,
      totalElements: totalElements > 0 ? totalElements : combined.length,
      totalPages: 1,
      size: combined.length,
      number: 0,
      first: true,
      last: true,
    };
  },

  async getProduct(id: string): Promise<Product> {
    const storedImages = getStoredImages();
    try {
      const res: any = await apiClient.get(`/api/v1/products/${id}`);
      const p = res?.data ?? res;
      return {
        ...p,
        imageUrl: storedImages[id] || p.imageUrl || CATEGORY_FALLBACK_IMAGES[p.category] || CATEGORY_FALLBACK_IMAGES.COFFEE,
      };
    } catch {
      // Look in local custom products or seed
      const all = [...getLocalCustomProducts(), ...SEED_PRODUCTS];
      const found = all.find((p) => p.id === id);
      if (found) {
        return {
          ...found,
          imageUrl: storedImages[id] || found.imageUrl,
        };
      }
      throw new Error('Product not found');
    }
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    const tempId = 'prod-' + Date.now();
    let createdProduct: Product;

    try {
      const res: any = await apiClient.post('/api/v1/admin/products', {
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        currency: input.currency || 'USD',
        available: input.available ?? true,
        initialStock: input.initialStock ?? 20,
      });
      createdProduct = res?.data ?? res;
    } catch {
      // If backend call fails, create locally
      createdProduct = {
        id: tempId,
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        currency: input.currency || 'USD',
        available: input.available ?? true,
        stockQuantity: input.initialStock ?? 20,
      };
    }

    // If an image was uploaded or provided, persist it
    if (input.imageUrl) {
      saveProductImage(createdProduct.id, input.imageUrl);
      createdProduct.imageUrl = input.imageUrl;
    }
    saveLocalCustomProduct(createdProduct);

    return createdProduct;
  },

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    let updatedProduct: Product;
    try {
      const res: any = await apiClient.patch(`/api/v1/admin/products/${id}`, {
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        available: input.available,
      });
      updatedProduct = res?.data ?? res;
    } catch {
      // Fallback update locally
      const existing = await productApi.getProduct(id);
      updatedProduct = {
        ...existing,
        ...input,
      };
    }

    if (input.imageUrl !== undefined) {
      if (input.imageUrl) {
        saveProductImage(id, input.imageUrl);
        updatedProduct.imageUrl = input.imageUrl;
      } else {
        removeProductImage(id);
      }
    }
    saveLocalCustomProduct(updatedProduct);

    return updatedProduct;
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/products/${id}`);
    } catch {
      // Delete locally if backend fails
    }
    deleteLocalCustomProduct(id);
    removeProductImage(id);
  },

  async getCategories(): Promise<Category[]> {
    return [
      { id: 'ALL', name: 'All Menu' },
      { id: 'COFFEE', name: 'Coffee' },
      { id: 'ESPRESSO', name: 'Espresso' },
      { id: 'COLD_BREW', name: 'Cold Brew' },
      { id: 'TEA', name: 'Tea & Matcha' },
      { id: 'PASTRY', name: 'Pastries' },
      { id: 'SNACK', name: 'Snacks' },
      { id: 'COFFEE_BEANS', name: 'Coffee Beans' },
      { id: 'MERCHANDISE', name: 'Merchandise' },
    ];
  },
};
