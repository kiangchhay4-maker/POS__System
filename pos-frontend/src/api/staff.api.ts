import { apiClient } from './client';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: 'STAFF' | 'ADMIN';
  station?: string;
  active: boolean;
  createdAt: string;
  password?: string;
}

const LOCAL_STAFF_KEY = 'coffee_pos_staff_accounts';
const DELETED_STAFF_KEY = 'coffee_pos_deleted_staff';

function getDeletedStaffSet(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_STAFF_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function addDeletedStaffRecord(id: string, phone?: string): void {
  try {
    const deleted = getDeletedStaffSet();
    if (id) deleted.add(id);
    if (phone) deleted.add(phone);
    localStorage.setItem(DELETED_STAFF_KEY, JSON.stringify(Array.from(deleted)));
  } catch (e) {
    console.error('Failed to update deleted staff blacklist', e);
  }
}

function removeDeletedStaffRecord(id: string, phone?: string): void {
  try {
    const deleted = getDeletedStaffSet();
    if (id) deleted.delete(id);
    if (phone) deleted.delete(phone);
    localStorage.setItem(DELETED_STAFF_KEY, JSON.stringify(Array.from(deleted)));
  } catch (e) {
    console.error('Failed to unblacklist staff account', e);
  }
}

// Default starter admin account (only one admin account)
export const DEFAULT_STAFF_ACCOUNTS: StaffMember[] = [
  {
    id: 'f56024a2-721d-4411-9ed4-6346e4a2382d',
    name: 'Visal',
    phone: '0789789789',
    role: 'ADMIN',
    station: 'Headquarters / Super Admin',
    active: true,
    createdAt: new Date().toISOString(),
    password: '789789789',
  },
];

export function getLocalStaff(): StaffMember[] {
  try {
    const deleted = getDeletedStaffSet();
    const raw = localStorage.getItem(LOCAL_STAFF_KEY);
    if (!raw) {
      const filtered = DEFAULT_STAFF_ACCOUNTS.filter(
        (s) => !deleted.has(s.id) && !deleted.has(s.phone)
      );
      localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(filtered));
      return filtered;
    }
    const parsed: StaffMember[] = JSON.parse(raw);
    return parsed.filter((s) => !deleted.has(s.id) && !deleted.has(s.phone));
  } catch {
    return DEFAULT_STAFF_ACCOUNTS;
  }
}

export function saveLocalStaff(staff: StaffMember): void {
  try {
    removeDeletedStaffRecord(staff.id, staff.phone);
    const current = getLocalStaff();
    const idx = current.findIndex((s) => s.id === staff.id || s.phone === staff.phone);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...staff };
    } else {
      current.unshift(staff);
    }
    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save staff account locally', e);
  }
}

export function deleteLocalStaff(id: string, phone?: string): void {
  try {
    addDeletedStaffRecord(id, phone);
    const current = getLocalStaff().filter((s) => s.id !== id && (!phone || s.phone !== phone));
    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to delete staff account locally', e);
  }
}

export const staffApi = {
  async getStaffList(): Promise<StaffMember[]> {
    let backendStaff: StaffMember[] = [];
    try {
      const res: any = await apiClient.get('/api/v1/admin/staff');
      const raw = res?.data ?? res;
      backendStaff = Array.isArray(raw) ? raw : [];
    } catch {
      backendStaff = [];
    }

    const deleted = getDeletedStaffSet();
    const localList = getLocalStaff().filter((s) => !deleted.has(s.id) && !deleted.has(s.phone));
    const map = new Map<string, StaffMember>();
    localList.forEach((s) => map.set(s.phone, s));
    backendStaff
      .filter((s) => !deleted.has(s.id) && !deleted.has(s.phone))
      .forEach((s) => {
        const existing = map.get(s.phone);
        map.set(s.phone, {
          ...s,
          station: existing?.station || (s.role === 'ADMIN' ? 'Headquarters' : 'Main Cashier Counter'),
          password: existing?.password,
        });
      });

    return Array.from(map.values());
  },

  async createStaff(data: {
    name: string;
    phone: string;
    password: string;
    role?: 'STAFF' | 'ADMIN';
    station?: string;
  }): Promise<StaffMember> {
    const newStaff: StaffMember = {
      id: (data.role === 'ADMIN' ? 'admin-' : 'staff-') + Date.now(),
      name: data.name,
      phone: data.phone,
      role: data.role || 'STAFF',
      station: data.station || (data.role === 'ADMIN' ? 'Admin Portal' : 'Main Cashier Station'),
      active: true,
      createdAt: new Date().toISOString(),
      password: data.password,
    };

    try {
      const res: any = await apiClient.post('/api/v1/admin/staff', {
        name: data.name,
        phone: data.phone,
        password: data.password,
        role: newStaff.role,
      });
      const backendCreated = res?.data ?? res;
      if (backendCreated?.id) {
        newStaff.id = backendCreated.id;
      }
    } catch {
      // Offline / local fallback
    }

    saveLocalStaff(newStaff);
    return newStaff;
  },

  async deleteStaff(id: string, phone?: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/admin/staff/${id}`);
    } catch (e) {
      console.warn('Backend DELETE staff failed or skipped:', e);
    }
    deleteLocalStaff(id, phone);
  },
};
