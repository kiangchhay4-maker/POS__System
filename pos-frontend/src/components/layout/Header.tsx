import { useAuthStore } from '../../stores/auth.store';
import { useShiftStore } from '../../stores/shift.store';
import { usePosStore } from '../../stores/pos.store';
import { Wifi, WifiOff, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { currentShift } = useShiftStore();
  const { isOnline } = usePosStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - empty for now */}
      <div className="flex-1"></div>
      
      {/* Right side - Status indicators */}
      <div className="flex items-center gap-6">
        {/* Network status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-600">Offline</span>
            </>
          )}
        </div>
        
        {/* Shift status */}
        {currentShift && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-600"></div>
            <span className="text-sm font-medium text-green-900">Shift Open</span>
          </div>
        )}
        
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{user?.name}</div>
            <div className="text-xs text-gray-500">{user?.role}</div>
          </div>
          
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
