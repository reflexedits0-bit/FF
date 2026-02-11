import React from 'react';
import { Home, Crosshair, Store, Wallet, User } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'matches', label: 'MATCHES', icon: Crosshair },
    { id: 'store', label: 'STORE', icon: Store },
    { id: 'vault', label: 'VAULT', icon: Wallet },
    { id: 'profile', label: 'PROFILE', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe transition-colors duration-300">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-200 ${isActive ? '-translate-y-0.5' : ''}`}
              />
              <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;