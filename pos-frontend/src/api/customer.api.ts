import { apiClient } from './client';
import type { Customer, PageResponse, PageRequest } from '../types';

export const customerApi = {
  async getCustomers(params?: {
    search?: string;
  } & PageRequest): Promise<PageResponse<Customer>> {
    return apiClient.get<PageResponse<Customer>>('/api/v1/customers', {
      params,
    });
  },

  async getCustomer(id: string): Promise<Customer> {
    return apiClient.get<Customer>(`/api/v1/customers/${id}`);
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const response = await apiClient.get<PageResponse<Customer>>('/api/v1/customers', {
      params: { search: query, size: 10 },
    });
    return response.content;
  },
};
