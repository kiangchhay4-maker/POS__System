import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  QrCode,
  CreditCard,
  Banknote,
  Printer,
  X,
  Coffee,
  User as UserIcon,
  Tag,
  Sparkles,
} from 'lucide-react';
import { productApi } from '../api/product.api';
import { orderApi } from '../api/order.api';
import { useCartStore } from '../stores/cart.store';
import { useAuthStore } from '../stores/auth.store';
import { formatCurrency, formatDateTime } from '../utils/format';
import type { Product, OrderType, PaymentMethod } from '../types';

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString().slice(-6)}`;
}

export default function PosPage() {
  const { user } = useAuthStore();
  const {
    items: cartItems,
    orderType,
    customerName,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    setOrderType,
    setCustomer,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [editingItemNotes, setEditingItemNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // Payment & Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Fetch products
  const { data: pageResponse, isLoading } = useQuery({
    queryKey: ['pos-products', selectedCategory, searchQuery],
    queryFn: () =>
      productApi.getProducts({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        available: true,
        size: 100,
      }),
  });

  const products: Product[] = pageResponse?.content || [];

  // Price calculations
  const subtotal = getSubtotal();
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = 0.1; // 10%
  const taxAmount = taxableAmount * taxRate;
  const grandTotal = taxableAmount + taxAmount;
  const khrRate = 4100;
  const grandTotalKHR = Math.round(grandTotal * khrRate);

  // Cash change calculation
  const cashNum = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, cashNum - grandTotal);
  const changeDueKHR = Math.round(changeDue * khrRate);

  const categories = [
    { id: 'ALL', label: 'All Menu' },
    { id: 'COFFEE', label: 'Coffee' },
    { id: 'ESPRESSO', label: 'Espresso' },
    { id: 'COLD_BREW', label: 'Cold Brew' },
    { id: 'TEA', label: 'Tea & Matcha' },
    { id: 'PASTRY', label: 'Pastries' },
    { id: 'SNACK', label: 'Snacks' },
    { id: 'COFFEE_BEANS', label: 'Beans' },
    { id: 'MERCHANDISE', label: 'Merchandise' },
  ];

  const handleAddToCart = (product: Product) => {
    if (!product.available) return;
    addItem({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.price,
    });
  };

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) return;
    setAmountReceived(grandTotal.toFixed(2));
    setIsCheckoutOpen(true);
  };

  const handleCompleteOrder = async () => {
    setIsProcessingPayment(true);
    const orderNumber = generateOrderNumber();

    const orderPayload = {
      orderNumber,
      orderType,
      customerName: customerName || 'Walk-in Customer',
      cashierName: user?.name || 'Cashier',
      items: cartItems.map((i) => ({
        productId: i.productId,
        productName: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
        notes: i.notes,
      })),
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      totalKHR: grandTotalKHR,
      paymentMethod,
      amountReceived: paymentMethod === 'CASH' ? cashNum : grandTotal,
      changeDue: paymentMethod === 'CASH' ? changeDue : 0,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    };

    try {
      // Try posting to backend
      await orderApi.createOrder({
        orderType,
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes,
        })),
        notes: `Order ${orderNumber}`,
      });
    } catch {
      // Offline/Local fallback
    }

    // Save order in local history
    try {
      const existingRaw = localStorage.getItem('coffee_pos_orders') || '[]';
      const orders = JSON.parse(existingRaw);
      orders.unshift(orderPayload);
      localStorage.setItem('coffee_pos_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to cache order locally', e);
    }

    setIsProcessingPayment(false);
    setIsCheckoutOpen(false);
    setCompletedOrder(orderPayload);
    clearCart();
    setDiscountPercent(0);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-gray-100">
      {/* LEFT / CENTER: Products Catalog */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-200 bg-white">
        {/* Top Header & Search */}
        <div className="p-5 border-b border-gray-200 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <Coffee className="w-6 h-6 text-amber-600" />
                POS Cashier Terminal
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Cashier on Duty: {user?.name || 'Staff A (Cashier)'}
                </span>
              </div>
            </div>

            {/* Live Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coffee, drinks, bakery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-5 overflow-y-auto bg-gray-50/50">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-semibold">Loading items...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No items available</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                No items match your selected category or search filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const countInCart =
                  cartItems.find((i) => i.productId === product.id)?.quantity || 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`relative bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden flex flex-col cursor-pointer select-none group active:scale-[0.98] ${
                      !product.available ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-32 w-full bg-gray-100 overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      {countInCart > 0 && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-600 text-white rounded-full text-xs font-extrabold flex items-center justify-center shadow-lg animate-scaleIn">
                          {countInCart}
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white">
                        {product.category || 'COFFEE'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-amber-700 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                          {product.description || 'Freshly brewed artisan quality'}
                        </p>
                      </div>

                      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-gray-100">
                        <div>
                          <span className="text-base font-extrabold text-amber-700">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-1">
                            ≈ {Math.round(product.price * khrRate).toLocaleString()}៛
                          </span>
                        </div>
                        <div className="w-7 h-7 bg-amber-50 group-hover:bg-amber-600 text-amber-700 group-hover:text-white rounded-lg flex items-center justify-center transition-colors shadow-xs">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Order Cart & Checkout Panel */}
      <div className="w-full md:w-96 lg:w-[420px] bg-white flex flex-col h-full border-t md:border-t-0 shadow-lg z-10">
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-gray-900 text-base">Current Order</h2>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                {getItemCount()} items
              </span>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Order Type Segmented Control */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`py-1.5 rounded-lg transition-all capitalize ${
                  orderType === type
                    ? 'bg-white text-gray-900 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {type.replace('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>

          {/* Customer walk-in */}
          <div className="mt-3 flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>{customerName}</span>
            </div>
            <button
              onClick={() => {
                const name = prompt('Enter customer name or table number:', customerName);
                if (name !== null) setCustomer(undefined, name.trim() || 'Walk-in Customer');
              }}
              className="text-amber-700 hover:underline font-semibold text-[11px]"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Select drinks and pastries from the left menu to start a sale.
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.productId}
                className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-gray-900 leading-snug">{item.name}</h5>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatCurrency(item.unitPrice)} each
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>

                {/* Notes if any */}
                {item.notes && (
                  <div className="text-[11px] bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200 flex items-center justify-between">
                    <span>Note: {item.notes}</span>
                    <button
                      onClick={() => updateNotes(item.productId, '')}
                      className="text-amber-900 hover:text-rose-600 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Quantity and Actions Bar */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      setEditingItemNotes(item.productId);
                      setTempNotes(item.notes || '');
                    }}
                    className="text-[11px] text-amber-700 hover:underline font-medium"
                  >
                    {item.notes ? 'Edit note' : '+ Add note'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 bg-white px-1.5 py-0.5 rounded-lg border border-gray-200 shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-amber-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-amber-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notes Dialog */}
        {editingItemNotes && (
          <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Less ice, oat milk, extra hot..."
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
              autoFocus
            />
            <button
              onClick={() => {
                updateNotes(editingItemNotes, tempNotes);
                setEditingItemNotes(null);
              }}
              className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg"
            >
              Save
            </button>
            <button
              onClick={() => setEditingItemNotes(null)}
              className="p-1.5 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bill Summary & Pay Action */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-3">
          {/* Quick Discount chips */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              Discount:
            </span>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountPercent(pct)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    discountPercent === pct
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {pct === 0 ? 'None' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5 text-xs text-gray-600 pt-1 border-t border-gray-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount ({discountPercent}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (10%)</span>
              <span className="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-gray-200 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Total Payable
              </span>
              <span className="text-xs font-semibold text-gray-400">
                {grandTotalKHR.toLocaleString()} ៛
              </span>
            </div>
            <div className="text-2xl font-black text-amber-700">
              {formatCurrency(grandTotal)}
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handleOpenCheckout}
            disabled={cartItems.length === 0}
            className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            <span>Proceed to Payment</span>
            <span>({formatCurrency(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* CHECKOUT / PAYMENT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Checkout & Settle
                </span>
                <h3 className="text-2xl font-black mt-0.5">
                  {formatCurrency(grandTotal)}
                  <span className="text-sm font-normal text-amber-100 ml-2">
                    ({grandTotalKHR.toLocaleString()} KHR)
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Banknote className="w-6 h-6 text-amber-600" />
                  <span className="text-xs">Cash Drawer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('KHQR')}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'KHQR'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <QrCode className="w-6 h-6 text-rose-600" />
                  <span className="text-xs">KHQR Bakong</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">Credit Card</span>
                </button>
              </div>

              {/* Dynamic Payment Body */}
              {paymentMethod === 'CASH' ? (
                <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Cash Received from Customer (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 text-lg font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Quick tender suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {[grandTotal, 5, 10, 20, 50, 100]
                      .filter((val) => val >= grandTotal)
                      .slice(0, 5)
                      .map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAmountReceived(preset.toFixed(2))}
                          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                        >
                          ${preset.toFixed(2)}
                        </button>
                      ))}
                  </div>

                  {/* Change display */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-800 uppercase">Change Due</div>
                      <div className="text-[11px] text-emerald-600">
                        ≈ {changeDueKHR.toLocaleString()} ៛
                      </div>
                    </div>
                    <div className="text-xl font-extrabold text-emerald-700">
                      {formatCurrency(changeDue)}
                    </div>
                  </div>
                </div>
              ) : paymentMethod === 'KHQR' ? (
                <div className="text-center p-6 bg-rose-50/60 border border-rose-200 rounded-2xl">
                  <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto shadow-md border border-rose-200 flex flex-col items-center justify-center">
                    <QrCode className="w-36 h-36 text-rose-700" />
                    <span className="text-[10px] font-black tracking-widest text-rose-700 mt-1 uppercase">
                      KHQR BAKONG
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mt-3">Scan to Pay via KHQR</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customer can scan with ABA Mobile, Bakong, Acleda, or any bank app.
                  </p>
                </div>
              ) : (
                <div className="text-center p-6 bg-blue-50/60 border border-blue-200 rounded-2xl">
                  <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-bold text-gray-900 text-sm">Tap or Insert Card</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Please prompt the customer to insert their chip card or tap contactless on the terminal.
                  </p>
                </div>
              )}

              {/* Complete Action */}
              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isProcessingPayment || (paymentMethod === 'CASH' && cashNum < grandTotal)}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl shadow-lg transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isProcessingPayment ? 'Processing Payment...' : 'Complete & Close Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT / SUCCESS MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-5 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-bold">Payment Successful!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Receipt #{completedOrder.orderNumber}
              </p>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-6 bg-amber-50/30 text-xs font-mono space-y-3 print:p-0">
              <div className="text-center border-b border-dashed border-gray-300 pb-3">
                <h4 className="font-bold text-sm tracking-wider uppercase">Coffee Shop POS</h4>
                <p className="text-gray-500 text-[11px]">123 Boulevard, Phnom Penh</p>
                <p className="text-gray-500 text-[11px]">
                  {formatDateTime(completedOrder.createdAt)}
                </p>
                <div className="my-2 py-1.5 px-2 bg-amber-100/70 border border-amber-300 rounded text-center">
                  <span className="font-black text-gray-900 text-xs block tracking-wide">
                    CASHIER: {completedOrder.cashierName || user?.name || 'Staff A (Cashier)'}
                  </span>
                  <span className="text-[10px] text-gray-600 block mt-0.5">
                    REGISTER: Station 1 • Order Type: {completedOrder.orderType}
                  </span>
                </div>
              </div>

              {/* Itemized lines */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-gray-300">
                {completedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 pt-1 border-b border-dashed border-gray-300 pb-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedOrder.subtotal)}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(completedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>{formatCurrency(completedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(completedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Total (KHR):</span>
                  <span>{completedOrder.totalKHR.toLocaleString()} ៛</span>
                </div>
                <div className="flex justify-between text-gray-600 pt-1">
                  <span>Paid ({completedOrder.paymentMethod}):</span>
                  <span>{formatCurrency(completedOrder.amountReceived)}</span>
                </div>
                {completedOrder.changeDue > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>Change:</span>
                    <span>{formatCurrency(completedOrder.changeDue)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-gray-500 pt-2">
                Thank you for your visit! <br />
                Please come again.
              </div>
            </div>

            {/* Receipt Modal Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                <Sparkles className="w-4 h-4" />
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
