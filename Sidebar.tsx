import React, { useState } from 'react';
import { X, Info, Book, Shield, FileText, Scale, Power, MessageCircle, Moon, ChevronRight, Crown, Sun, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tab } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, isDarkMode, onToggleTheme }) => {
  const { logout, currentUser } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleNav = (tab: Tab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <>
      {/* Backdrop - Lighter */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-md z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white dark:bg-slate-900 z-[70] transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex flex-col">
             <h2 className="text-2xl font-display font-bold italic tracking-wide text-slate-800 dark:text-white">
                MAIN <span className="text-blue-600">MENU</span>
             </h2>
             {currentUser && <span className="text-xs text-gray-400 font-bold">{currentUser.email}</span>}
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            
          {/* VIP Banner */}
          <div 
            onClick={() => handleNav('vip')}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-4 flex items-center justify-between shadow-md mb-6 text-white cursor-pointer hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                    <Crown size={20} fill="white" />
                </div>
                <div>
                    <div className="font-bold text-sm uppercase">Purchase VIP</div>
                    <div className="text-xs text-yellow-100">Unlock Golden Benefits</div>
                </div>
            </div>
            <ChevronRight size={20} />
          </div>

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-4">Legal & Info</div>

          <MenuItem icon={Book} label="Game Rules" onClick={() => handleNav('rules')} />
          <MenuItem icon={Info} label="About App" onClick={() => handleNav('about')} />
          <MenuItem icon={Shield} label="App Rules" onClick={() => handleNav('app_rules')} />
          <MenuItem icon={FileText} label="Privacy Policy" onClick={() => handleNav('privacy')} />
          <MenuItem icon={Scale} label="Fair Play" onClick={() => handleNav('fair_play')} />
          <MenuItem icon={FileText} label="Terms & Conditions" onClick={() => handleNav('terms')} />
          
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-6">System</div>
          <MenuItem icon={MessageCircle} label="Support Center" onClick={() => handleNav('support')} />

        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
           
           {/* Dark Mode Toggle */}
           <button 
             onClick={onToggleTheme}
             className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl w-full transition-colors active:scale-95"
           >
              <div className="flex items-center space-x-3 text-slate-700 dark:text-gray-300">
                 {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                 <span className="font-semibold text-sm">Dark Mode</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </div>
           </button>

           <button 
             onClick={() => setShowLogoutConfirm(true)}
             className="flex items-center space-x-3 text-red-500 font-semibold p-3 w-full hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
           >
             <Power size={18} />
             <span className="text-sm">Log Out</span>
           </button>
        </div>
      </div>

      {/* Logout Confirmation Bottom Sheet */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setShowLogoutConfirm(false)}
            ></div>
            
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl p-6 relative z-10 animate-slide-up shadow-2xl border-t border-white/10">
                 <div className="w-12 h-1 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                 
                 <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <Power size={36} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-wide">Logging Out?</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[80%] mx-auto">
                        Are you sure you want to sign out of your account? You will need to login again to access your wallet.
                    </p>
                 </div>

                 <div className="flex space-x-4">
                    <button 
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmLogout}
                        className="flex-1 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 transition active:scale-95"
                    >
                        Yes, Log Out
                    </button>
                 </div>
            </div>
        </div>
      )}
    </>
  );
};

const MenuItem: React.FC<{ icon: any; label: string; onClick?: () => void }> = ({ icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center space-x-4 p-3 text-slate-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
  >
    <Icon size={20} />
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

export default Sidebar;