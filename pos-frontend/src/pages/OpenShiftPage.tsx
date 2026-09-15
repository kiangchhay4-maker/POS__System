import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Coffee } from 'lucide-react';
import { shiftApi } from '../api/shift.api';
import { useShiftStore } from '../stores/shift.store';
import { useAuthStore } from '../stores/auth.store';
import { formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/error';

export default function OpenShiftPage() {
  const [openingCash, setOpeningCash] = useState('0.00');
  const navigate = useNavigate();
  const { setCurrentShift } = useShiftStore();
  const { user } = useAuthStore();

  const openShiftMutation = useMutation({
    mutationFn: () => shiftApi.openShift({ openingCash: parseFloat(openingCash) }),
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
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
              <Coffee className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Open Shift
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Start your shift to begin selling
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cashier info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cashier:</span>
                <span className="font-medium text-gray-900">{user?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">{formatDate(new Date())}</span>
              </div>
            </div>

            {/* Opening cash */}
            <div>
              <label htmlFor="openingCash" className="block text-sm font-medium text-gray-700 mb-2">
                Opening Cash
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  id="openingCash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter the cash amount in the drawer at the start of your shift
              </p>
            </div>

            {/* Error message */}
            {openShiftMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  {getErrorMessage(openShiftMutation.error)}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={openShiftMutation.isPending}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {openShiftMutation.isPending ? 'Opening Shift...' : 'Open Shift'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
