import { apiClient } from './client';
import type { Order, CreateOrderRequest, PageResponse, PageRequest } from '../types';

export const orderApi = {
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/api/v1/orders', request);
  },

  async getOrders(params?: {
    status?: string;
    orderType?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  } & PageRequest): Promise<PageResponse<Order>> {
    return apiClient.get<PageResponse<Order>>('/api/v1/orders', {
      params,
    });
  },

  async getOrder(id: string): Promise<Order> {
    return apiClient.get<Order>(`/api/v1/orders/${id}`);
  },

  async cancelOrder(id: string, reason: string): Promise<Order> {
    return apiClient.post<Order>(`/api/v1/orders/${id}/cancel`, {
      reason,
    });
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return apiClient.patch<Order>(`/api/v1/orders/${id}/status`, {
      status,
    });
  },
};
