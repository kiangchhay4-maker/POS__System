import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Coffee, Lock, Phone } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';
import { getErrorMessage } from '../utils/error';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ phone, password }),
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/pos');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-600/20">
              <Coffee className="w-9 h-9 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-center text-gray-900 mb-1">
            Coffee Shop POS
          </h1>
          <p className="text-center text-xs text-gray-500 mb-8">
            Sign in to start your shift
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number / Login ID
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50/50"
                  placeholder="Enter phone number"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50/50"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {loginMutation.isError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {getErrorMessage(loginMutation.error)}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-sm"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In to POS'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Coffee Shop POS System • Enterprise Edition
        </p>
      </div>
    </div>
  );
}
