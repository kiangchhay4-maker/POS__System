import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Clock,
  DollarSign,
  CheckCircle,
  LogOut,
  User,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { shiftApi } from '../api/shift.api';
import { useShiftStore } from '../stores/shift.store';
import { useAuthStore } from '../stores/auth.store';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function ShiftPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentShift, clearShift } = useShiftStore();

  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closedSummary, setClosedSummary] = useState<any | null>(null);

  // Fetch current shift from backend or fallback to store
  const { data: shiftData } = useQuery({
    queryKey: ['current-shift'],
    queryFn: async () => {
      const live = await shiftApi.getCurrentShift();
      return live || currentShift;
    },
    initialData: currentShift,
    refetchInterval: 3000,
  });

  const activeShift = shiftData || currentShift;

  // Calculate local orders stats for the shift
  const localOrdersRaw = localStorage.getItem('coffee_pos_orders') || '[]';
  const localOrders = JSON.parse(localOrdersRaw);
  const totalShiftSales = localOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0);
  const cashSales = localOrders
    .filter((o: any) => o.paymentMethod === 'CASH')
    .reduce((acc: number, o: any) => acc + (o.total || 0), 0);
  const digitalSales = totalShiftSales - cashSales;

  const openingCash = activeShift?.openingCash ?? 0.0;
  const expectedCashInDrawer = openingCash + cashSales;
  const closingCashNum = parseFloat(closingCash) || 0;
  const discrepancy = closingCashNum - expectedCashInDrawer;

  const closeShiftMutation = useMutation({
    mutationFn: async () => {
      if (activeShift?.id) {
        try {
          return await shiftApi.closeShift(activeShift.id, {
            closingCash: closingCashNum,
            notes,
          });
        } catch {
          // Local fallback
        }
      }
      return {
        ...activeShift,
        closingCash: closingCashNum,
        expectedCash: expectedCashInDrawer,
        difference: discrepancy,
        status: 'CLOSED',
        closedAt: new Date().toISOString(),
      };
    },
    onSuccess: (result) => {
      setClosedSummary(result);
      clearShift();
      setIsClosingModalOpen(false);
    },
  });

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Shift
              </span>
              <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Monitor drawer balance, sales volume, and reconcile cash at the end of the shift.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (confirm('Reset Shift & Drawer Data to $0? This will start drawer balance fresh at $0.00.')) {
                  localStorage.removeItem('coffee_pos_orders');
                  shiftApi.resetShiftData();
                  clearShift();
                  navigate('/open-shift');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all active:scale-[0.99]"
              title="Reset shift and drawer to $0.00"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to $0
            </button>

            <button
              onClick={() => {
                setClosingCash(expectedCashInDrawer.toFixed(2));
                setIsClosingModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4" />
              Reconcile & Close Shift
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Cashier & Timing Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase">Cashier On Duty</div>
              <div className="text-base font-bold text-gray-900">{user?.name || 'Cashier'}</div>
              <div className="text-xs text-gray-500">{user?.phone || 'ID: 010203'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase">Shift Opened At</div>
              <div className="text-sm font-bold text-gray-900">
                {activeShift?.openedAt ? formatDateTime(activeShift.openedAt) : 'Today, 08:00 AM'}
              </div>
              <div className="text-xs text-emerald-600 font-semibold">Shift in progress</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase">Drawer Balance</div>
              <div className="text-xl font-black text-emerald-700">
                {formatCurrency(expectedCashInDrawer)}
              </div>
              <div className="text-xs text-gray-500">Includes opening float</div>
            </div>
          </div>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase">Starting Float</span>
            <div className="text-2xl font-bold text-gray-800 mt-1">
              {formatCurrency(openingCash)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Counted at shift start</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase">Cash Sales</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {formatCurrency(cashSales)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Physical cash payments</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase">Digital / Card / QR</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {formatCurrency(digitalSales)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">KHQR & Card transactions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase">Total Shift Sales</span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {formatCurrency(totalShiftSales)}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {localOrders.length} completed orders
            </p>
          </div>
        </div>

        {/* Shift Cash Reconciliation Explanation */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="p-3 bg-amber-600 text-white rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">End-of-Shift Reconciliation</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              When ending your shift, physically count the bills and coins in your cash drawer.
              Enter the exact amount counted into the closing modal. The POS will calculate any cash
              surplus or shortage against registered transactions and generate your final shift report.
            </p>
          </div>
        </div>
      </div>

      {/* CLOSE SHIFT MODAL */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 bg-rose-600 text-white">
              <h3 className="text-xl font-black">Close Register & End Shift</h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Count all cash in drawer and enter final closing amount.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Starting Cash:</span>
                  <span className="font-bold text-gray-800">{formatCurrency(openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">+ Cash Sales:</span>
                  <span className="font-bold text-amber-700">{formatCurrency(cashSales)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200 font-bold text-sm">
                  <span>Expected in Drawer:</span>
                  <span className="text-emerald-700">{formatCurrency(expectedCashInDrawer)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Actual Counted Cash ($) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-lg font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Variance indicator */}
              <div
                className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold border ${
                  Math.abs(discrepancy) < 0.01
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : discrepancy > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <span>Discrepancy (Variance):</span>
                <span>
                  {discrepancy > 0 ? `+${formatCurrency(discrepancy)} (Over)` : discrepancy < 0 ? `-${formatCurrency(Math.abs(discrepancy))} (Short)` : 'Balanced ($0.00)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Closing Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain any variance or drawer handoff notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={closeShiftMutation.isPending}
                  onClick={() => closeShiftMutation.mutate()}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition-colors disabled:opacity-50"
                >
                  {closeShiftMutation.isPending ? 'Closing...' : 'Confirm & Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT SUMMARY REPORT MODAL */}
      {closedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 p-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Shift Closed Successfully</h3>
            <p className="text-xs text-gray-500 mt-1">
              Your drawer report has been finalized.
            </p>

            <div className="my-5 p-4 bg-gray-50 rounded-2xl text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Expected:</span>
                <span className="font-semibold">{formatCurrency(expectedCashInDrawer)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actual Counted:</span>
                <span className="font-semibold">{formatCurrency(closingCashNum)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
                <span>Variance:</span>
                <span
                  className={
                    discrepancy < 0
                      ? 'text-rose-600'
                      : discrepancy > 0
                      ? 'text-blue-600'
                      : 'text-emerald-600'
                  }
                >
                  {formatCurrency(discrepancy)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setClosedSummary(null);
                navigate('/open-shift');
              }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              Open New Shift
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
