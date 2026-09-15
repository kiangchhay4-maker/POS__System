import type { Shift, OpenShiftRequest, CloseShiftRequest } from '../types';

const SHIFT_STORAGE_KEY = 'coffee_pos_current_shift';

export const shiftApi = {
  async openShift(request: OpenShiftRequest): Promise<Shift> {
    let userName = 'Visal';
    let userId = 'admin-visal';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.name) userName = u.name;
        if (u.id) userId = u.id;
      }
    } catch {
      // Ignore JSON parse error
    }

    const shift: Shift = {
      id: 'shift-' + Date.now(),
      cashierId: userId,
      cashierName: userName,
      openingCash: request.openingCash ?? 0,
      expectedCash: request.openingCash ?? 0,
      cashSales: 0,
      cashRefunds: 0,
      cashIn: 0,
      cashOut: 0,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
    };

    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shift));
    return shift;
  },

  async closeShift(shiftId: string, request: CloseShiftRequest): Promise<Shift> {
    let existing: Shift | null = null;
    try {
      const raw = localStorage.getItem(SHIFT_STORAGE_KEY);
      if (raw) existing = JSON.parse(raw);
    } catch {
      // Ignore
    }

    const closed: Shift = {
      id: shiftId,
      cashierId: existing?.cashierId || 'admin-visal',
      cashierName: existing?.cashierName || 'Visal',
      openingCash: existing?.openingCash ?? 0,
      closingCash: request.closingCash,
      expectedCash: existing?.expectedCash ?? 0,
      cashSales: existing?.cashSales ?? 0,
      cashRefunds: existing?.cashRefunds ?? 0,
      cashIn: existing?.cashIn ?? 0,
      cashOut: existing?.cashOut ?? 0,
      difference: (request.closingCash ?? 0) - (existing?.expectedCash ?? 0),
      status: 'CLOSED',
      openedAt: existing?.openedAt || new Date().toISOString(),
      closedAt: new Date().toISOString(),
    };

    localStorage.removeItem(SHIFT_STORAGE_KEY);
    return closed;
  },

  async getCurrentShift(): Promise<Shift | null> {
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
    const shift = await this.getCurrentShift();
    if (shift && shift.id === id) return shift;
    return {
      id,
      cashierId: 'admin-visal',
      cashierName: 'Visal',
      openingCash: 0,
      expectedCash: 0,
      cashSales: 0,
      cashRefunds: 0,
      cashIn: 0,
      cashOut: 0,
      status: 'CLOSED',
      openedAt: new Date().toISOString(),
    };
  },

  async cashIn(_shiftId: string, amount: number, _reason: string): Promise<Shift> {
    const shift = await this.getCurrentShift();
    if (!shift) throw new Error('No open shift');
    shift.cashIn = (shift.cashIn || 0) + amount;
    shift.expectedCash = (shift.expectedCash || 0) + amount;
    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shift));
    return shift;
  },

  async cashOut(_shiftId: string, amount: number, _reason: string): Promise<Shift> {
    const shift = await this.getCurrentShift();
    if (!shift) throw new Error('No open shift');
    shift.cashOut = (shift.cashOut || 0) + amount;
    shift.expectedCash = Math.max(0, (shift.expectedCash || 0) - amount);
    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shift));
    return shift;
  },
};
