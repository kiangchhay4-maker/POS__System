import { apiClient } from './client';
import type { Shift, OpenShiftRequest, CloseShiftRequest } from '../types';

const SHIFT_STORAGE_KEY = 'coffee_pos_current_shift';

export const shiftApi = {
  async openShift(request: OpenShiftRequest): Promise<Shift> {
    const localShift: Shift = {
      id: 'shift-' + Date.now(),
      cashierId: 'current-user',
      cashierName: 'Visal',
      openingCash: request.openingCash ?? 0,
      expectedCash: request.openingCash ?? 0,
      cashSales: 0,
      cashRefunds: 0,
      cashIn: 0,
      cashOut: 0,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
    };

    try {
      const res: any = await apiClient.post<Shift>('/api/v1/shifts/open', request);
      const shift = res?.data ?? res;
      localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shift));
      return shift;
    } catch {
      localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(localShift));
      return localShift;
    }
  },

  async closeShift(shiftId: string, request: CloseShiftRequest): Promise<Shift> {
    localStorage.removeItem(SHIFT_STORAGE_KEY);
    try {
      const res: any = await apiClient.post<Shift>(`/api/v1/shifts/${shiftId}/close`, request);
      return res?.data ?? res;
    } catch {
      return {
        id: shiftId,
        cashierId: 'current-user',
        cashierName: 'Visal',
        openingCash: 0,
        closingCash: request.closingCash,
        expectedCash: 0,
        cashSales: 0,
        cashRefunds: 0,
        cashIn: 0,
        cashOut: 0,
        difference: 0,
        status: 'CLOSED',
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
      };
    }
  },

  async getCurrentShift(): Promise<Shift | null> {
    try {
      const res: any = await apiClient.get<Shift>('/api/v1/shifts/current');
      const shift = res?.data ?? res;
      if (shift && shift.id) {
        localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shift));
        return shift;
      }
    } catch {
      // Offline / fallback
    }

    try {
      const raw = localStorage.getItem(SHIFT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  resetShiftData(): void {
    localStorage.removeItem(SHIFT_STORAGE_KEY);
  },

  async getShift(id: string): Promise<Shift> {
    return apiClient.get<Shift>(`/api/v1/shifts/${id}`);
  },

  async cashIn(shiftId: string, amount: number, reason: string): Promise<Shift> {
    return apiClient.post<Shift>(`/api/v1/shifts/${shiftId}/cash-in`, {
      amount,
      reason,
    });
  },

  async cashOut(shiftId: string, amount: number, reason: string): Promise<Shift> {
    return apiClient.post<Shift>(`/api/v1/shifts/${shiftId}/cash-out`, {
      amount,
      reason,
    });
  },
};
