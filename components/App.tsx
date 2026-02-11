import React, { useState, useEffect } from 'react';
import { Menu, Mail, Wallet, LayoutGrid, ChevronLeft, ShieldAlert, Lock, AlertOctagon, LogOut, Send, X, MessageSquare } from 'lucide-react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { Tab, UserProfile, Tournament } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './firebase';
import { ref, onValue, update, push } from 'firebase/database';
import Toast from './components/Toast';
import Inbox from './components/Inbox';

// Pages
import Home from './pages/Home';
import Matches from './pages/Matches';
import Vault from './pages/Vault';
import Profile from './pages/Profile';
import Store from './pages/Store';
import Support from './pages/Support';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import GameRules from './pages/GameRules';
import TournamentDetails from './pages/TournamentDetails';
import Legal from './pages/Legal';
import Vip from './pages/Vip';

const AppContent: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showInbox, setShowInbox] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [hasUnreadMail, setHasUnreadMail] = useState(false);
  
  // Ban Appeal State
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('theme');
      return saved === 'dark';
  });

  // Apply Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    if (hasOnboarded) {
      setShowOnboarding(false);
    }
  }, []);

  // Fetch Real-time User Data & SENTINEL SECURITY CHECK
  useEffect(() => {
    if (currentUser) {
      const userRef = ref(db, 'users/' + currentUser.uid);
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserData(data);
          
          // --- SENTINEL ANTI-CHEAT SYSTEM ---
          // Detect suspicious activity and auto-ban
          if (!data.banned) {
              const maxAllowedBalance = 50000; // Arbitrary high limit
              const suspicious = 
                (data.balance > maxAllowedBalance) || 
                (data.balance < 0) ||
                (isNaN(data.balance)) ||
                (data.winnings > data.balance && data.winnings > 0); // Winnings usually part of balance logic depending on implementation

              if (suspicious) {
                  // Trigger Ban
                  update(ref(db, 'users/' + currentUser.uid), {
                      banned: true,
                      banReason: "SENTINEL: Suspicious Balance Manipulation Detected. System ID: #ERR-909"
                  });
              }
          }

          // Simple unread check if mails exist
          if (data.mails && Object.keys(data.mails).length > 0) {
              setHasUnreadMail(true);
          } else {
              setHasUnreadMail(false);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleFinishOnboarding = () => {
    localStorage.setItem('hasOnboarded', 'true');
    setShowOnboarding(false);
  };

  const handleShowToast = (message: string, type: 'success' | 'error' | 'info') => {
      setToast({ message, type });
  };

  const handleBack = () => {
      if (selectedTournament) {
          setSelectedTournament(null);
      } else {
          setActiveTab('home');
      }
  };
  
  const handleLogout = async () => {
      try {
          await logout();
      } catch (e) {
          console.error("Logout failed", e);
      }
  };

  const submitAppeal = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!appealText.trim()) return;
      
      setAppealLoading(true);
      try {
          await push(ref(db, 'ban_appeals'), {
              userId: currentUser?.uid,
              email: currentUser?.email,
              username: userData?.username || 'Unknown',
              reason: appealText,
              timestamp: Date.now(),
              status: 'OPEN'
          });
          setToast({ message: "Appeal Sent to Admin", type: "success" });
          setShowAppealModal(false);
          setAppealText("");
      } catch (err) {
          setToast({ message: "Failed to send appeal", type: "error" });
      } finally {
          setAppealLoading(false);
      }
  };

  if (showOnboarding) {
    return <Onboarding onFinish={handleFinishOnboarding} />;
  }

  if (!currentUser) {
    return <Auth />;
  }

  // --- BANNED SCREEN VIEW ---
  if (userData?.banned) {
      return (
          <div className="fixed inset-0 z-[999] bg-[#1a0505] flex flex-col items-center justify-center p-6 text-center">
              {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
              
              <div className="bg-red-900/20 p-8 rounded-full mb-8 border-4 border-red-600/50 animate-pulse relative">
                  <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 rounded-full"></div>
                  <ShieldAlert size={80} className="text-red-500 relative z-10" />
              </div>
              
              <h1 className="text-5xl font-display font-black text-white italic tracking-widest uppercase mb-2 drop-shadow-lg">
                  BLOCKED
              </h1>
              
              <div className="bg-black/40 backdrop-blur-md border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                  <div className="flex items-center justify-center space-x-2 text-red-400 mb-4 font-bold uppercase text-xs tracking-wider border-b border-red-500/20 pb-2">
                      <AlertOctagon size={14} />
                      <span>Security Violation</span>
                  </div>
                  <p className="text-gray-300 text-sm font-mono mb-6 leading-relaxed">
                      {userData.banReason || "Violation of Fair Play Policy. Your account has been suspended permanently due to suspicious activity."}
                  </p>
                  <div className="text-[10px] text-red-600 font-bold uppercase tracking-widest bg-red-950/50 py-2 rounded border border-red-900/50">
                      Device ID Logged • IP Blacklisted
                  </div>
              </div>

              <div className="mt-8 flex flex-col w-full max-w-xs space-y-3">
                <button 
                    onClick={() => setShowAppealModal(true)} 
                    className="w-full py-3.5 bg-white text-black font-bold uppercase tracking-wider rounded-xl hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center space-x-2 text-xs"
                >
                    <MessageSquare size={16} />
                    <span>Contact Support / Appeal</span>
                </button>

                <button 
                    onClick={handleLogout} 
                    className="w-full py-3.5 bg-red-900/30 text-red-400 border border-red-900/50 font-bold uppercase tracking-wider rounded-xl hover:bg-red-900/50 transition flex items-center justify-center space-x-2 text-xs"
                >
                    <LogOut size={16} />
                    <span>Switch Account</span>
                </button>
              </div>

              {/* Appeal Modal */}
              {showAppealModal && (
                  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowAppealModal(false)}></div>
                      <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 relative z-10 border border-slate-700 shadow-2xl animate-slide-up">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-display font-bold text-white uppercase italic">Submit Appeal</h3>
                              <button onClick={() => setShowAppealModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                          </div>
                          <p className="text-xs text-gray-400 mb-4">
                              Explain why you think this is a mistake. Our team will review your account manually.
                          </p>
                          <form onSubmit={submitAppeal} className="space-y-4">
                              <textarea 
                                value={appealText}
                                onChange={(e) => setAppealText(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-red-500 h-32 resize-none"
                                placeholder="Write your message here..."
                                required
                              />
                              <button 
                                type="submit"
                                disabled={appealLoading}
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl uppercase tracking-wide transition-colors flex justify-center items-center space-x-2 shadow-lg shadow-red-600/20"
                              >
                                  {appealLoading ? (
                                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                  ) : (
                                      <>
                                          <Send size={16} />
                                          <span>Submit Appeal</span>
                                      </>
                                  )}
                              </button>
                          </form>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  const renderContent = () => {
    // If a tournament is selected, override other views (acts as a sub-view of Home)
    if (selectedTournament) {
        return (
            <TournamentDetails 
                tournament={selectedTournament} 
                user={userData} 
                onBack={() => setSelectedTournament(null)}
                onJoinSuccess={() => handleShowToast("Joined Successfully!", "success")}
                onError={(msg) => handleShowToast(msg, "error")}
            />
        );
    }

    switch (activeTab) {
      case 'home': return <Home user={userData} onSelectTournament={setSelectedTournament} onJoin={() => {}} />;
      case 'matches': return <Matches />;
      case 'store': return <Store />;
      case 'vault': return <Vault user={userData} onShowToast={handleShowToast} />;
      case 'profile': return <Profile user={userData} />;
      case 'rules': return <GameRules />;
      case 'support': return <Support onShowToast={handleShowToast} />;
      case 'vip': return <Vip onBack={() => setActiveTab('home')} />;
      case 'about':
      case 'app_rules':
      case 'privacy':
      case 'fair_play':
      case 'terms':
        return <Legal type={activeTab} />;
      default: return <Home user={userData} onSelectTournament={setSelectedTournament} onJoin={() => {}} />;
    }
  };

  // Logic to determine if Back button should be shown
  // We do NOT show back button for top-level tabs (Bottom Nav items)
  const topLevelTabs: Tab[] = ['home', 'matches', 'store', 'vault', 'profile'];
  const showBackButton = selectedTournament !== null || !topLevelTabs.includes(activeTab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 md:pb-0 font-sans flex transition-colors duration-300">
      {/* Toast Notification Layer */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Inbox Modal */}
      {showInbox && <Inbox onClose={() => setShowInbox(false)} />}

      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden md:block w-64 bg-white dark:bg-slate-900 h-screen sticky top-0 border-r border-gray-200 dark:border-slate-800 z-50">
        <div className="p-6">
             <div className="flex items-center text-3xl font-display font-bold italic tracking-wider text-slate-800 dark:text-white mb-8">
                <span>ARENA</span>
                <span className="text-blue-600 ml-1">AR</span>
             </div>
             
             <nav className="space-y-2">
                {[
                  { id: 'home', label: 'Dashboard', icon: LayoutGrid },
                  { id: 'vault', label: 'My Wallet', icon: Wallet },
                  { id: 'profile', label: 'Profile', icon: Mail },
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as Tab); setSelectedTournament(null); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === item.id && !selectedTournament
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-bold text-sm">{item.label}</span>
                  </button>
                ))}
             </nav>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(tab) => { setActiveTab(tab); setSelectedTournament(null); }}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto">
        
        {/* Header (Hidden on VIP) */}
        {activeTab !== 'vip' && (
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between md:px-8 md:py-4 transition-all duration-300">
            
            {/* Left Control: Menu OR Back */}
            <div className="flex items-center">
                {showBackButton ? (
                    <button onClick={handleBack} className="p-1 md:hidden text-slate-800 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft size={28} strokeWidth={2.5} />
                    </button>
                ) : (
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1 md:hidden text-slate-800 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <Menu size={28} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {/* Mobile Logo (Center) */}
            <div className="flex flex-col items-center md:hidden absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
                <div className="flex items-center text-2xl font-display font-bold italic tracking-wider text-slate-800 dark:text-white">
                    <span>ARENA</span>
                    <span className="text-blue-600 ml-1">AR</span>
                </div>
            </div>

            {/* Desktop Title / Empty Spacer */}
            <div className="hidden md:block font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase text-sm">
                {selectedTournament ? 'Operation Details' : activeTab === 'home' ? 'Tournament Lobby' : activeTab.replace('_', ' ').toUpperCase()}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
                {/* Removed Top Toggle, functionality moved to Sidebar */}
                
                <button 
                  onClick={() => setActiveTab('vault')}
                  className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2 active:scale-95 transition-transform"
                >
                  <Wallet size={16} className="text-blue-600 dark:text-blue-400" fill="currentColor" />
                  <span className="font-bold text-slate-800 dark:text-white text-sm">₹ {userData?.balance || 0}</span>
                </button>
                
                <button 
                  onClick={() => setShowInbox(true)}
                  className="relative p-1 active:scale-95 transition-transform text-slate-600 dark:text-slate-300"
                >
                  <Mail size={24} />
                  {hasUnreadMail && (
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                  )}
                </button>
            </div>
            </header>
        )}

        {/* Dynamic Content Container */}
        <main className={`${activeTab === 'vip' ? 'p-0' : 'p-4 md:p-8'} max-w-md mx-auto md:max-w-none`}>
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {activeTab !== 'vip' && (
        <div className="md:hidden">
            <BottomNav activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setSelectedTournament(null); }} />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;