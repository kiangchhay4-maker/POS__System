import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle,
  X,
  Trash2,
  Lock,
  Phone,
  Store,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { staffApi } from '../api/staff.api';
import { broadcastSync } from '../utils/syncChannel';

export default function AdminStaffPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('StaffPassword123!');
  const [station, setStation] = useState('Cashier 1 - Main Register');
  const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF');

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ['admin-staff-list'],
    queryFn: () => staffApi.getStaffList(),
  });

  const createStaffMutation = useMutation({
    mutationFn: () =>
      staffApi.createStaff({
        name,
        phone,
        password,
        station,
        role,
      }),
    onSuccess: (newStaff) => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-list'] });
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setPassword('StaffPassword123!');
      setStation('Cashier 1 - Main Register');
      setRole('STAFF');
      broadcastSync('STAFF_UPDATED');
      setFeedback({
        type: 'success',
        message: `${newStaff.role === 'ADMIN' ? 'Super Admin' : 'Staff'} account "${newStaff.name}" registered successfully!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: () => {
      setFeedback({
        type: 'error',
        message: 'Failed to create staff account. Phone number may already be in use.',
      });
      setTimeout(() => setFeedback(null), 4000);
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: ({ id, phone }: { id: string; phone?: string }) =>
      staffApi.deleteStaff(id, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-list'] });
      broadcastSync('STAFF_UPDATED');
      setFeedback({ type: 'success', message: 'Staff account removed permanently.' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Failed to remove staff account.' });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      (s.station && s.station.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !password.trim()) {
      alert('Please fill all required fields.');
      return;
    }
    createStaffMutation.mutate();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                Admin Center
              </span>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-600" />
                Staff & Cashier Management
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Register cashier accounts. Each staff member will have their name printed on orders,
              receipts, and drawer shift reports.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow transition-all active:scale-[0.99]"
          >
            <UserPlus className="w-4 h-4" />
            Register New Staff
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`mx-8 mt-4 p-4 rounded-xl flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            {feedback.message}
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Staff Content */}
      <div className="p-8 max-w-6xl mx-auto w-full flex-1">
        {/* Search */}
        <div className="mb-6 max-w-md relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, phone, or cashier station..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white shadow-xs"
          />
        </div>

        {/* Staff Table */}
        {isLoading ? (
          <div className="py-20 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading staff accounts...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-md mx-auto">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 text-base">No staff found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Click &quot;Register New Staff&quot; above to create your first cashier account.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Staff Member</th>
                  <th className="px-6 py-4 text-left">Phone / Login ID</th>
                  <th className="px-6 py-4 text-left">Assigned Station</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl font-extrabold flex items-center justify-center text-sm shadow-xs ${
                          staff.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                            {staff.name}
                            {staff.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-purple-100 text-purple-700 rounded-md">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {staff.role === 'ADMIN' ? 'Super Administrator' : 'Cashier POS Operator'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {staff.phone}
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-gray-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800">
                        {staff.role === 'ADMIN' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        ) : (
                          <Store className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        {staff.station || (staff.role === 'ADMIN' ? 'Admin Portal' : 'Main Register')}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        staff.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {staff.role === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                        {staff.role === 'ADMIN' ? 'SUPER ADMIN' : 'STAFF'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Active
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap text-xs font-medium">
                      {staff.phone === '0789789789' ? (
                        <span className="inline-flex items-center px-2 py-1 text-[11px] font-bold text-gray-400 bg-gray-100 rounded-lg">
                          Primary Admin
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete account "${staff.name}" (${staff.phone})?`)) {
                              deleteStaffMutation.mutate({ id: staff.id, phone: staff.phone });
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-transparent rounded-lg transition-colors text-xs font-semibold"
                          title="Delete staff account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTER STAFF MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Admin Registration
                </span>
                <h3 className="text-xl font-black mt-0.5">Register Staff Cashier</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Account Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('STAFF');
                      if (station === 'Headquarters / Super Admin' || station === 'Admin Portal') {
                        setStation('Cashier 1 - Main Register');
                      }
                    }}
                    className={`p-3 text-left rounded-xl border-2 transition-all flex flex-col gap-0.5 ${
                      role === 'STAFF'
                        ? 'bg-amber-50/80 border-amber-600 text-amber-950 shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      Staff Cashier
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">POS, Sell & Shifts only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('ADMIN');
                      setStation('Headquarters / Super Admin');
                    }}
                    className={`p-3 text-left rounded-xl border-2 transition-all flex flex-col gap-0.5 ${
                      role === 'ADMIN'
                        ? 'bg-purple-50/80 border-purple-600 text-purple-950 shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xs font-black flex items-center gap-1.5 text-purple-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      Super Admin
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">Full access & admin controls</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {role === 'ADMIN' ? 'Admin Full Name *' : 'Cashier Name (Printed on Receipts) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff A (Cashier)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                  autoFocus
                />
              </div>

              {/* Station */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Cashier Station / Counter
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cashier 1 - Counter A"
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Phone Number (Login ID) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 088123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="StaffPassword123!"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Default password preset: StaffPassword123!
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStaffMutation.isPending}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {createStaffMutation.isPending ? 'Registering...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
