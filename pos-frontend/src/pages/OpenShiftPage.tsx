import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Coffee, Globe } from 'lucide-react';
import { shiftApi } from '../api/shift.api';
import { useShiftStore } from '../stores/shift.store';
import { useAuthStore } from '../stores/auth.store';
import { useLanguageStore } from '../stores/language.store';
import { formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/error';

export default function OpenShiftPage() {
  const [openingCash, setOpeningCash] = useState('0.00');
  const navigate = useNavigate();
  const { setCurrentShift } = useShiftStore();
  const { user } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();

  const openShiftMutation = useMutation({
    mutationFn: () => shiftApi.openShift({ openingCash: parseFloat(openingCash) || 0 }),
    onSuccess: (data) => {
      setCurrentShift(data);
      navigate('/pos');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openShiftMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative">
          {/* Language Switcher */}
          <div className="absolute top-6 right-6">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-gray-200 bg-gray-50 hover:bg-amber-50 text-[11px] font-bold text-gray-700 transition-colors cursor-pointer"
              title={language === 'km' ? 'Switch to English' : 'ប្ដូរទៅភាសាខ្មែរ'}
            >
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'km' ? '🇰🇭 ខ្មែរ' : '🇺🇸 EN'}</span>
            </button>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-600/20">
              <Coffee className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-center text-gray-900 mb-1">
            {t('openShift')}
          </h1>
          <p className="text-center text-xs text-gray-500 mb-8">
            {t('noActiveShiftSubtitle')}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cashier info */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-200/80 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">{t('cashier')}:</span>
                <span className="font-bold text-gray-900">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">{t('date')}:</span>
                <span className="font-bold text-gray-900">{formatDate(new Date())}</span>
              </div>
            </div>

            {/* Opening cash */}
            <div>
              <label htmlFor="openingCash" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {t('openingFloat')} ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  id="openingCash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 text-lg font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-gray-50/50"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                {t('startingFloatPrompt')}
              </p>
            </div>

            {/* Error message */}
            {openShiftMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs text-red-800">
                  {getErrorMessage(openShiftMutation.error)}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={openShiftMutation.isPending}
              className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {openShiftMutation.isPending ? t('signingIn') : t('startShiftBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
