import { useState } from 'react';
import {
  Store,
  User,
  Shield,
  LogOut,
  Save,
  CheckCircle,
  Database,
  Coffee,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [storeName, setStoreName] = useState('Artisan Coffee & Roastery');
  const [address, setAddress] = useState('123 Boulevard, Phnom Penh');
  const [phone, setPhone] = useState('+855 12 345 678');
  const [taxRate, setTaxRate] = useState('10');
  const [khrRate, setKhrRate] = useState('4100');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-amber-600" />
          Settings & Configuration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure store details, tax rates, currency conversion, and user accounts.
        </p>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        {savedMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Settings saved successfully!
          </div>
        )}

        {/* Store Profile */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600" />
              Coffee Shop Information
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">This information will appear on printed customer receipts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Store Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Store Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                USD to KHR Rate (1 USD =)
              </label>
              <input
                type="number"
                value={khrRate}
                onChange={(e) => setKhrRate(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>

        {/* User Account Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Active Account
            </h3>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-gray-900 text-sm">{user?.name || 'Administrator'}</div>
              <div className="text-gray-500">{user?.phone || '+855 12 345 678'}</div>
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                <Shield className="w-3 h-3 text-amber-700" />
                Role: {user?.role || 'ADMIN'}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* System & Database Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900">System Environment</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-400 block">Version</span>
              <span className="font-semibold text-gray-800">Coffee POS v1.0.0</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-400 block">API Host</span>
              <span className="font-semibold text-gray-800">http://localhost:8080</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-400 block">Status</span>
              <span className="font-semibold text-emerald-600">Online / Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
