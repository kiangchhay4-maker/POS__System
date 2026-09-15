import { apiClient } from './client';
import type { Payment, CreatePaymentRequest, RefundRequest } from '../types';

export const paymentApi = {
  async createPayment(request: CreatePaymentRequest): Promise<Payment> {
    return apiClient.post<Payment>('/api/v1/payments', request, {
      headers: {
        'Idempotency-Key': request.idempotencyKey,
      },
    });
  },

  async getPayment(id: string): Promise<Payment> {
    return apiClient.get<Payment>(`/api/v1/payments/${id}`);
  },

  async getPaymentByOrder(orderId: string): Promise<Payment> {
    return apiClient.get<Payment>(`/api/v1/payments/order/${orderId}`);
  },

  async checkPaymentStatus(id: string): Promise<Payment> {
    return apiClient.get<Payment>(`/api/v1/payments/${id}/status`);
  },

  async refundPayment(request: RefundRequest): Promise<Payment> {
    return apiClient.post<Payment>('/api/v1/payments/refund', request);
  },
};
