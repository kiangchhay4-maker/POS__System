import { useAuthStore } from '../../stores/auth.store';
import { useShiftStore } from '../../stores/shift.store';
import { usePosStore } from '../../stores/pos.store';
import { useLanguageStore } from '../../stores/language.store';
import { Wifi, WifiOff, LogOut, Globe } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { currentShift } = useShiftStore();
  const { isOnline } = usePosStore();
  const { language, toggleLanguage, t } = useLanguageStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
          ☕ {t('appName')}
        </span>
      </div>
      
      {/* Right side - Status indicators & Language switcher */}
      <div className="flex items-center gap-5">
        {/* Language Switcher Button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-amber-50 hover:border-amber-300 transition-all text-xs font-bold text-gray-700 shadow-xs cursor-pointer"
          title={language === 'km' ? 'Switch to English' : 'ប្ដូរទៅភាសាខ្មែរ'}
        >
          <Globe className="w-3.5 h-3.5 text-amber-700" />
          <span>{language === 'km' ? '🇰🇭 ភាសាខ្មែរ' : '🇺🇸 English'}</span>
          <span className="text-[10px] text-gray-400 border-l border-gray-300 pl-1.5 font-semibold">
            {language === 'km' ? 'EN' : 'ខ្មែរ'}
          </span>
        </button>

        {/* Network status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">{t('online')}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">{t('offline')}</span>
            </>
          )}
        </div>
        
        {/* Shift status */}
        {currentShift && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200/60 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
            <span className="text-xs font-semibold text-green-900">{t('shiftOpen')}</span>
          </div>
        )}
        
        {/* User info */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</div>
            <div className="text-[11px] font-semibold text-amber-700">
              {user?.role === 'ADMIN' ? t('adminBadge') : t('staffCashiers')}
            </div>
          </div>
          
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
