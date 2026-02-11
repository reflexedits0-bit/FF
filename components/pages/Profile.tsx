import React, { useEffect, useState } from 'react';
import { ShieldCheck, Edit2, Copy, Gift, Youtube, Instagram, Share2, Send, Zap, Save, X, User, Hash, Trophy, Swords, ChevronRight, Activity } from 'lucide-react';
import { UserProfile } from '../types';
import Skeleton from '../components/Skeleton';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

interface ProfileProps {
  user: UserProfile | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formGameId, setFormGameId] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [socials, setSocials] = useState<{
    youtube?: string;
    instagram?: string;
    telegram?: string;
    discord?: string;
  }>({});

  // Fetch Social Links from Admin Panel
  useEffect(() => {
    const socialsRef = ref(db, 'admin/socials');
    const unsubscribe = onValue(socialsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setSocials(data);
        }
    });
    return () => unsubscribe();
  }, []);

  // Pre-fill form when user data is loaded
  useEffect(() => {
    if (user) {
        setFormName(user.username || '');
        setFormGameId(user.gameId || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    if (!formName.trim()) {
        setToast({ message: "Username cannot be empty", type: 'error' });
        return;
    }
    
    setLoading(true);
    try {
        const updates: any = {};
        updates[`/users/${currentUser.uid}/username`] = formName;
        updates[`/users/${currentUser.uid}/gameId`] = formGameId;
        
        await update(ref(db), updates);
        setToast({ message: "Profile Updated Successfully", type: 'success' });
        setIsEditing(false);
    } catch (e) {
        setToast({ message: "Failed to update profile", type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  const openLink = (url?: string) => {
      if (url) {
        window.open(url, '_blank');
      } else {
        setToast({ message: "Link not configured yet", type: 'error' });
      }
  };

  const handleCopyCode = () => {
    const code = user?.referralCode || '';
    if (!code) return;

    // Try modern API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code)
            .then(() => setToast({ message: "Code Copied!", type: 'success' }))
            .catch(() => fallbackCopy(code));
    } else {
        fallbackCopy(code);
    }
  };

  const fallbackCopy = (text: string) => {
      try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setToast({ message: "Code Copied!", type: 'success' });
      } catch (err) {
          setToast({ message: "Failed to copy code", type: 'error' });
      }
  };

  return (
    <div className="p-4 space-y-4 pb-24 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Main Profile Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 group w-full">
        
        {/* Colorful Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 animate-[pulse_5s_infinite]">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10 mix-blend-overlay"></div>
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/30 rounded-full blur-3xl -ml-5 -mb-5 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 p-5 flex flex-col items-center text-white">
             
             {/* Header Actions */}
             <div className="w-full flex justify-between items-center mb-1">
                 <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/30 shadow-sm">
                    <span className="text-[9px] font-bold tracking-widest uppercase flex items-center gap-1">
                        <ShieldCheck size={10} /> Elite
                    </span>
                 </div>
                 
                 <div className="flex items-center space-x-2">
                     {/* System Online Badge */}
                     <div className="flex items-center space-x-1.5 bg-black/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">SYSTEM ONLINE</span>
                     </div>

                     <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-all border border-white/30 hover:scale-105 shadow-sm active:scale-95"
                        aria-label="Edit Profile"
                     >
                        <Edit2 size={14} />
                     </button>
                 </div>
             </div>

             {/* Avatar Area - Clean Design */}
             <div className="relative mb-2 mt-2">
                 {/* Replaced Blur with a clean ring container */}
                 <div className="relative w-28 h-28 rounded-full p-1 bg-white/20 backdrop-blur-sm border border-white/40 shadow-xl">
                    <div className="w-full h-full bg-indigo-600 rounded-full overflow-hidden flex items-center justify-center relative border-[3px] border-white shadow-inner">
                       {user ? (
                         user.image ? (
                             <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full bg-gradient-to-tr from-white/20 to-transparent flex items-center justify-center">
                                <span className="text-4xl font-black text-white/80 select-none font-display drop-shadow-md">
                                    {(user.username || 'U').charAt(0).toUpperCase()}
                                </span>
                             </div>
                         )
                       ) : (
                         <Skeleton className="w-full h-full rounded-full" />
                       )}
                    </div>
                    {/* Status Indicator Dot */}
                    <div className="absolute bottom-1 right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm z-20"></div>
                 </div>
             </div>

             {/* User Info */}
             {user ? (
                <div className="text-center space-y-1 mb-5">
                    <h2 className="text-3xl font-display font-bold italic tracking-wider flex items-center justify-center gap-2 drop-shadow-md leading-none">
                        {user.username || 'Unknown Soldier'}
                    </h2>
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-1 mb-4 w-full">
                    <Skeleton className="w-24 h-6 bg-white/20" />
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[220px]">
                <StatBox icon={Trophy} label="Wins" value={user?.stats?.victories || 0} />
                <StatBox icon={Swords} label="Matches" value={user?.stats?.matches || 0} />
            </div>
        </div>
      </div>

      {/* Refer & Earn */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-indigo-950 shadow-lg border border-gray-100 dark:border-indigo-900/50 p-5 group transition-all w-full">
         <div className="flex justify-between items-center relative z-10">
             <div className="flex flex-col flex-1 mr-4">
                 <div className="flex items-center space-x-2 mb-1">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded-lg text-yellow-600 dark:text-yellow-400">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">Refer & Earn</h3>
                 </div>
                 <p className="text-[10px] text-gray-500 dark:text-indigo-200/70 font-medium mb-3">Both you and your friend get ₹5 instantly.</p>
                 
                 <div className="bg-gray-50 dark:bg-indigo-900/50 rounded-xl p-1.5 flex items-center border border-gray-200 dark:border-indigo-800 w-full max-w-[200px]">
                    <input 
                        readOnly 
                        value={user?.referralCode || 'ARENA2025'} 
                        className="bg-transparent border-none text-slate-800 dark:text-white text-xs font-mono font-bold tracking-widest w-full outline-none px-2 select-text"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <button 
                        onClick={handleCopyCode}
                        className="bg-white dark:bg-indigo-800 text-slate-900 dark:text-white px-2 py-1.5 rounded-lg shadow-sm text-[9px] font-bold flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-indigo-700 transition shrink-0"
                    >
                        <Copy size={10} />
                        <span>COPY</span>
                    </button>
                 </div>
             </div>
             
             <div className="opacity-90 transform rotate-12 group-hover:scale-110 transition-transform duration-300">
                 <Gift size={64} className="text-yellow-500 dark:text-yellow-400 drop-shadow-xl" strokeWidth={1.2} />
             </div>
         </div>
      </div>

      {/* Social Media Grid */}
      <div>
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3 flex items-center">
            Join Community <ChevronRight size={12} />
        </h4>
        <div className="grid grid-cols-4 gap-3">
            <SocialButton onClick={() => openLink(socials.youtube)} icon={Youtube} label="YT" color="text-red-600" bg="bg-red-50 hover:bg-red-100 border-red-100 dark:bg-red-900/10 dark:border-red-900/20" />
            <SocialButton onClick={() => openLink(socials.instagram)} icon={Instagram} label="Insta" color="text-pink-600" bg="bg-pink-50 hover:bg-pink-100 border-pink-100 dark:bg-pink-900/10 dark:border-pink-900/20" />
            <SocialButton onClick={() => openLink(socials.telegram)} icon={Send} label="Join" color="text-blue-500" bg="bg-blue-50 hover:bg-blue-100 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20" />
            <SocialButton onClick={() => navigator.share ? navigator.share({title: 'Arena AR', url: window.location.href}) : null} icon={Share2} label="Share" color="text-emerald-600" bg="bg-emerald-50 hover:bg-emerald-100 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20" />
        </div>
      </div>

      {/* Edit Profile Bottom Sheet */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* No Blur Backdrop */}
            <div 
                className="absolute inset-0" 
                onClick={() => setIsEditing(false)}
            ></div>
            
            {/* Drawer Content */}
            <div className="bg-white dark:bg-indigo-950 w-full max-w-md rounded-t-[2.5rem] p-6 relative z-10 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-white/10">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-indigo-800 rounded-full mx-auto mb-6"></div>
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <Edit2 size={20} className="text-blue-500" />
                        Edit Profile
                    </h2>
                    <button onClick={() => setIsEditing(false)} className="bg-gray-100 dark:bg-indigo-900 p-2 rounded-full text-slate-600 dark:text-indigo-300 hover:bg-gray-200 dark:hover:bg-indigo-800 transition">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="space-y-5">
                    {/* Name Input */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 dark:text-indigo-300 uppercase tracking-widest mb-2 block ml-1">
                            Display Name
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500 transition-transform group-focus-within:scale-110">
                                <User size={20} />
                            </div>
                            <input 
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-indigo-900/50 border border-gray-200 dark:border-indigo-800 text-slate-800 dark:text-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    {/* UID Input */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 dark:text-indigo-300 uppercase tracking-widest mb-2 block ml-1">
                            Game UID
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-500 transition-transform group-focus-within:scale-110">
                                <Hash size={20} />
                            </div>
                            <input 
                                type="text"
                                value={formGameId}
                                onChange={(e) => setFormGameId(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-indigo-900/50 border border-gray-200 dark:border-indigo-800 text-slate-800 dark:text-white rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
                                placeholder="e.g. 1234567890"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-indigo-300/60 mt-2 px-2 flex items-center">
                             This UID will be used for prize distribution.
                        </p>
                    </div>

                    <button 
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl uppercase tracking-wider hover:shadow-lg hover:shadow-blue-600/30 flex items-center justify-center space-x-2 mt-4 active:scale-95 transition-all"
                    >
                        {loading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Helper Component for Stats
const StatBox: React.FC<{ icon: any; label: string; value: number }> = ({ icon: Icon, label, value }) => (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center justify-center border border-white/10 hover:bg-white/20 transition-colors cursor-default">
        <Icon size={16} className="text-white/80 mb-1" />
        <span className="text-lg font-display font-bold text-white leading-none mt-1">{value}</span>
        <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
);

// Helper Component for Social Buttons
const SocialButton: React.FC<{ icon: any; label: string; color: string; bg: string; onClick?: () => void }> = ({ icon: Icon, label, color, bg, onClick }) => (
    <button onClick={onClick} className={`relative overflow-hidden rounded-2xl py-3.5 flex flex-col items-center justify-center shadow-sm border ${bg} group active:scale-95 transition-all`}>
        <Icon size={24} className={`${color} mb-1 drop-shadow-sm transition-transform group-hover:scale-110`} strokeWidth={1.5} />
        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</span>
    </button>
);

export default Profile;