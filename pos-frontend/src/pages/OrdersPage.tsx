import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Coffee,
  CheckCircle,
  Clock,
  Printer,
  X,
  Eye,
  FileText,
  User,
  DollarSign,
  Banknote,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { orderApi } from '../api/order.api';
import { useLanguageStore } from '../stores/language.store';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function OrdersPage() {
  const { t } = useLanguageStore();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Load orders from backend and local cache
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-history'],
    queryFn: async () => {
      let backendOrders: any[] = [];
      try {
        const res: any = await orderApi.getOrders({ size: 50 });
        const raw = res?.data ?? res;
        backendOrders = Array.isArray(raw) ? raw : raw?.content || [];
      } catch {
        backendOrders = [];
      }

      // Merge with local orders
      const localRaw = localStorage.getItem('coffee_pos_orders') || '[]';
      const localOrders = JSON.parse(localRaw);

      const map = new Map<string, any>();
      backendOrders.forEach((o) => map.set(o.id || o.orderNumber, o));
      localOrders.forEach((o: any) => map.set(o.id || o.orderNumber, o));

      return Array.from(map.values()).sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    },
    refetchInterval: 3000,
  });

  // Unique staff cashier names
  const availableStaff = Array.from(
    new Set(orders.map((o: any) => o.cashierName || 'Staff'))
  ).filter(Boolean);

  const filteredOrders = orders.filter((o: any) => {
    const matchesStatus =
      statusFilter === 'ALL' || (o.status || 'COMPLETED').toUpperCase() === statusFilter;
    const matchesPayment =
      paymentFilter === 'ALL' || (o.paymentMethod || 'CASH').toUpperCase() === paymentFilter;
    const matchesStaff =
      staffFilter === 'ALL' || (o.cashierName || 'Staff') === staffFilter;
    const matchesSearch =
      searchTerm === '' ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.cashierName && o.cashierName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesPayment && matchesStaff && matchesSearch;
  });

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum: number, o: any) => sum + (o.total || o.subtotal || 0), 0);
  const cashOrders = filteredOrders.filter((o: any) => (o.paymentMethod || 'CASH').toUpperCase() === 'CASH');
  const totalCash = cashOrders.reduce((sum: number, o: any) => sum + (o.total || o.subtotal || 0), 0);
  const digitalOrders = filteredOrders.filter((o: any) => (o.paymentMethod || 'CASH').toUpperCase() !== 'CASH');
  const totalDigital = digitalOrders.reduce((sum: number, o: any) => sum + (o.total || o.subtotal || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" />
            {t('completed')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <X className="w-3.5 h-3.5" />
            {t('cancelled')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            {t('preparing')}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-600" />
              {t('ordersHistoryTitle')}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('ordersHistorySubtitle')}
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('Clear local order cache and reset orders to 0?')) {
                localStorage.removeItem('coffee_pos_orders');
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all active:scale-[0.99]"
            title="Reset orders to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            0 Orders
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
              <span>{t('totalOrders')}</span>
              <Coffee className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {filteredOrders.length}
            </div>
            <span className="text-[11px] text-gray-500">{t('itemsCount')}</span>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase">
              <span>{t('totalRevenue')}</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-800 mt-1">
              {formatCurrency(totalRevenue)}
            </div>
            <span className="text-[11px] text-amber-700 font-medium">{t('allPayments')}</span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-900 text-xs font-bold uppercase">
              <span>{t('cashSales')}</span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-1">
              {formatCurrency(totalCash)}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">{cashOrders.length} {t('cash')}</span>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between text-blue-900 text-xs font-bold uppercase">
              <span>{t('khqrSales')}</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-800 mt-1">
              {formatCurrency(totalDigital)}
            </div>
            <span className="text-[11px] text-blue-700 font-medium">{digitalOrders.length} {t('khqr')}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchOrders')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Staff Cashier Filter */}
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl px-2.5 py-1 text-xs">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{t('allStaff')}</option>
                {availableStaff.map((staffName: string) => (
                  <option key={staffName} value={staffName}>
                    {t('staffCol')}: {staffName}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl px-2.5 py-1 text-xs">
              <Banknote className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{t('allPayments')}</option>
                <option value="CASH">💵 {t('cash')}</option>
                <option value="KHQR">📱 {t('khqr')}</option>
                <option value="CARD">💳 {t('card')}</option>
              </select>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1">
              {[
                { id: 'ALL', label: t('allStatus') },
                { id: 'COMPLETED', label: t('completed') },
                { id: 'CANCELLED', label: t('cancelled') },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === st.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="p-8 flex-1">
        {isLoading ? (
          <div className="py-20 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">{t('signingIn')}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-lg mx-auto">
            <Coffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 text-base">{t('noOrdersFound')}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {t('availableItems')}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">{t('orderNumber')}</th>
                  <th className="px-6 py-3.5 text-left">{t('dateTime')}</th>
                  <th className="px-6 py-3.5 text-left">{t('staffCol')}</th>
                  <th className="px-6 py-3.5 text-left">{t('customerName')}</th>
                  <th className="px-6 py-3.5 text-left">{t('type')}</th>
                  <th className="px-6 py-3.5 text-left">{t('statusCol')}</th>
                  <th className="px-6 py-3.5 text-left">{t('paymentCol')}</th>
                  <th className="px-6 py-3.5 text-right">{t('totalCol')}</th>
                  <th className="px-6 py-3.5 text-right">{t('actionCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredOrders.map((order: any) => (
                  <tr key={order.orderNumber || order.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                      {order.orderNumber || order.id?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(order.createdAt || new Date().toISOString())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-black flex items-center justify-center text-xs">
                          {(order.cashierName || 'Staff').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-xs block">
                            {order.cashierName || 'Staff'}
                          </span>
                          <span className="text-[10px] text-gray-400">Cashier POS</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">
                      {order.customerName || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                      {order.orderType || 'TAKEAWAY'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status || 'COMPLETED')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        (order.paymentMethod || 'CASH').toUpperCase() === 'CASH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.paymentMethod === 'CASH' ? '💵 CASH' : order.paymentMethod || 'CASH'}
                      </span>
                      {order.paymentMethod === 'CASH' && (order.amountReceived > 0 || order.changeDue > 0) && (
                        <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                          Paid: <span className="font-bold text-gray-700">{formatCurrency(order.amountReceived || order.total)}</span>
                          {order.changeDue > 0 && (
                            <span className="text-emerald-600 font-bold ml-1">
                              (Change: {formatCurrency(order.changeDue)})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(order.total || order.subtotal || 0)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t('viewDetails')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-amber-600 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-200 uppercase">{t('orderDetails')}</span>
                <h3 className="text-lg font-black">
                  #{selectedOrder.orderNumber || selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[10px]">{t('dateTime')}</span>
                  <span className="font-semibold text-gray-800">
                    {formatDateTime(selectedOrder.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[10px]">{t('staffCol')}</span>
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {selectedOrder.cashierName || 'Staff Cashier'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[10px]">{t('customerName')}</span>
                  <span className="font-semibold text-gray-800">
                    {selectedOrder.customerName || t('walkInCustomer')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase text-[10px]">{t('type')}</span>
                  <span className="font-semibold text-gray-800">{selectedOrder.orderType}</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">{t('items')}</h4>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {(selectedOrder.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="p-3 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-gray-900">
                          {item.quantity}x {item.productName || item.name}
                        </span>
                        {item.notes && (
                          <span className="block text-[11px] text-amber-700 italic">
                            {item.notes}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-gray-800">
                        {formatCurrency(item.subtotal || item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>{t('subtotal')}</span>
                  <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.total)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>{t('discount')}</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between">
                    <span>{t('tax')}</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-1 border-t border-gray-200">
                  <span>{t('grandTotal')}</span>
                  <span className="text-amber-700">{formatCurrency(selectedOrder.total)}</span>
                </div>

                {/* Cash Payment Details Breakdown */}
                {selectedOrder.paymentMethod === 'CASH' && (
                  <div className="mt-2 p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-emerald-950">
                      <span>{t('paymentCol')}</span>
                      <span>💵 {t('cash')} ({selectedOrder.cashierName || 'Staff'})</span>
                    </div>
                    {selectedOrder.amountReceived > 0 && (
                      <div className="flex justify-between text-emerald-900">
                        <span>{t('tendered')}</span>
                        <span className="font-bold">{formatCurrency(selectedOrder.amountReceived)}</span>
                      </div>
                    )}
                    {selectedOrder.changeDue > 0 && (
                      <div className="flex justify-between text-emerald-800 font-bold">
                        <span>{t('change')}</span>
                        <span>{formatCurrency(selectedOrder.changeDue)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {t('printReceipt')}
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
