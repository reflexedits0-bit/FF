import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, update, push } from 'firebase/database';
import { Loader, Info, Play, Users, MapPin, Coins, Trophy, Calendar, Crosshair, Clock } from 'lucide-react';
import { Tournament, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from '../components/Skeleton';
import Toast from '../components/Toast';

interface HomeProps {
  user: UserProfile | null;
  onSelectTournament: (t: Tournament) => void;
  onJoin: (t: Tournament) => void; 
}

interface Banner {
    id: string;
    image: string;
    title?: string;
    subtitle?: string;
    type?: string;
}

type TabFilter = 'ALL' | 'UPCOMING' | 'LIVE' | 'COMPLETED';

const Home: React.FC<HomeProps> = ({ user, onSelectTournament }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // State for Countdown Timer
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Update timer every second
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch Tournaments
    const tourneyRef = ref(db, 'tournaments');
    const unsubscribeTourney = onValue(tourneyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTournaments(list);
      } else {
        setTournaments([]);
      }
      setLoading(false);
    });

    // Fetch Banners
    const bannersRef = ref(db, 'admin/banners');
    const unsubscribeBanners = onValue(bannersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const list = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            setBanners(list);
        } else {
            setBanners([]);
        }
    });

    return () => {
        unsubscribeTourney();
        unsubscribeBanners();
    };
  }, []);

  // Auto Slider Logic
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
        setCurrentBannerIndex(prev => (prev + 1) % banners.length);
    }, 4000); // 4 Seconds

    return () => clearInterval(interval);
  }, [banners]);

  const handleQuickJoin = async (e: React.MouseEvent, t: Tournament) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user || !currentUser) return;
    
    // Strict Check: Can only join UPCOMING (OPEN) tournaments
    if (t.status !== 'OPEN') {
        setToast({ message: "Registration is closed for this match.", type: "error" });
        return;
    }
    
    if (user.balance < t.entryFee) {
        setToast({ message: "Insufficient Balance!", type: "error" });
        return;
    }

    setJoiningId(t.id);

    try {
        const updates: any = {};
        
        let remainingCost = t.entryFee;
        let currentDeposit = user.deposit || 0;
        let currentWinnings = user.winnings || 0;
        
        let newDeposit = currentDeposit;
        let newWinnings = currentWinnings;

        if (newDeposit >= remainingCost) {
            newDeposit -= remainingCost;
            remainingCost = 0;
        } else {
            remainingCost -= newDeposit;
            newDeposit = 0;
        }

        if (remainingCost > 0) {
            newWinnings = Math.max(0, newWinnings - remainingCost);
        }

        const newBalance = newDeposit + newWinnings;

        updates['/users/' + currentUser.uid + '/balance'] = newBalance;
        updates['/users/' + currentUser.uid + '/deposit'] = newDeposit;
        updates['/users/' + currentUser.uid + '/winnings'] = newWinnings;

        updates['/tournaments/' + t.id + '/participants/' + currentUser.uid] = true;
        updates['/tournaments/' + t.id + '/filledSlots'] = (t.filledSlots || 0) + 1;

        const txRef = push(ref(db, 'users/' + currentUser.uid + '/transactions'));
        updates['/users/' + currentUser.uid + '/transactions/' + txRef.key] = {
             amount: t.entryFee,
             type: 'ENTRY_FEE',
             date: new Date().toLocaleString(),
             status: 'SUCCESS',
             tournamentId: t.id,
             title: t.title
        };

        await update(ref(db), updates);
        setToast({ message: "Joined Successfully!", type: "success" });
    } catch (e) {
        console.error(e);
        setToast({ message: "Failed to join.", type: "error" });
    } finally {
        setJoiningId(null);
    }
  };

  const getFilteredTournaments = () => {
      let filtered = tournaments;
      
      if (activeTab === 'UPCOMING') {
          filtered = tournaments.filter(t => t.status === 'OPEN' || t.status === 'CLOSED');
      } else if (activeTab === 'LIVE') {
          filtered = tournaments.filter(t => t.status === 'LIVE');
      } else if (activeTab === 'COMPLETED') {
          filtered = tournaments.filter(t => t.status === 'COMPLETED');
      }
      // For 'ALL', we show everything but sorted

      // Sort: LIVE -> OPEN -> CLOSED -> COMPLETED
      return filtered.sort((a, b) => {
          const statusPriority: Record<string, number> = { 'LIVE': 0, 'OPEN': 1, 'CLOSED': 2, 'COMPLETED': 3 };
          const priorityA = statusPriority[a.status] ?? 4;
          const priorityB = statusPriority[b.status] ?? 4;
          return priorityA - priorityB;
      });
  };

  // Helper to calculate time remaining
  const getTimeRemaining = (startTime?: string) => {
    if (!startTime) return null;
    const total = Date.parse(startTime) - now;
    if (total <= 0) return null;
    
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredTournaments = getFilteredTournaments();

  return (
    <div className="space-y-6 pb-24 relative font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Auto-Slider Banner (Only shows if banners exist) */}
      {banners.length > 0 && (
          <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-2xl group border border-gray-100 dark:border-slate-800">
            {banners.map((banner, index) => (
                <div 
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    <img 
                        src={banner.image} 
                        alt={banner.title || "Banner"} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    
                    {/* Content */}
                    <div className="absolute bottom-6 left-6 right-6 z-20">
                        {banner.type && (
                            <div className="inline-block bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-lg border border-red-400/50 shadow-lg mb-2">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{banner.type}</span>
                            </div>
                        )}
                        <h2 className="text-4xl font-display font-black text-white italic leading-none drop-shadow-md">
                            {banner.title}
                        </h2>
                        {banner.subtitle && (
                            <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mt-1">{banner.subtitle}</p>
                        )}
                    </div>
                </div>
            ))}
            
            {/* Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-3 right-4 z-30 flex space-x-1.5">
                    {banners.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentBannerIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                            }`}
                        ></div>
                    ))}
                </div>
            )}
          </div>
      )}

      {/* Tabs / Filters */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex justify-between overflow-x-auto no-scrollbar gap-1">
        {(['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'] as TabFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-2 min-w-[70px] text-[10px] font-black tracking-widest rounded-lg transition-all duration-200 uppercase font-display whitespace-nowrap ${
              activeTab === tab
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md' 
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between pl-1">
        <h3 className="text-xl font-display font-bold italic text-slate-800 dark:text-white flex items-center">
            <span className={`w-1 h-6 rounded-full mr-3 ${activeTab === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-blue-600'}`}></span>
            {activeTab} <span className="text-blue-600 ml-1">MATCHES</span>
        </h3>
        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
            {filteredTournaments.length} FOUND
        </span>
      </div>

      {/* Tournament Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
           // Skeleton Loaders
           Array(3).fill(0).map((_, i) => (
             <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
               <div className="flex space-x-4">
                 <Skeleton className="w-24 h-24 rounded-2xl" />
                 <div className="flex-1 space-y-2 py-1">
                   <Skeleton className="w-3/4 h-6 rounded-md" />
                   <div className="flex space-x-2">
                     <Skeleton className="w-16 h-5 rounded-md" />
                     <Skeleton className="w-16 h-5 rounded-md" />
                   </div>
                   <Skeleton className="w-full h-8 mt-2 rounded-lg" />
                 </div>
               </div>
             </div>
           ))
        ) : filteredTournaments.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 opacity-50">
                <Trophy size={48} className="text-gray-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Matches Found</p>
            </div>
        ) : (
          filteredTournaments.map((t) => {
            const isFull = t.filledSlots >= t.totalSlots;
            const isJoined = currentUser && t.participants && t.participants[currentUser.uid];
            const timeLeft = getTimeRemaining(t.startTime);

            // Status Indicator Logic
            let statusColor = 'bg-gray-400';
            let statusText = t.status;
            
            // Badge Logic for Image
            let badgeText = t.status;
            let badgeColorClass = 'bg-gray-500';

            if (t.status === 'OPEN' || t.status === 'CLOSED') {
                badgeText = 'UPCOMING';
                badgeColorClass = 'bg-blue-600';
            } else if (t.status === 'LIVE') {
                badgeText = 'LIVE';
                badgeColorClass = 'bg-red-600 animate-pulse';
            } else if (t.status === 'COMPLETED') {
                badgeText = 'COMPLETED';
                badgeColorClass = 'bg-green-600';
            }

            if (t.status === 'LIVE') {
                statusColor = 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)] animate-pulse';
            } else if (t.status === 'OPEN') {
                if (isFull) {
                    statusColor = 'bg-orange-500';
                    statusText = 'FULL';
                } else {
                    statusColor = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
                    statusText = 'OPEN';
                }
            } else if (t.status === 'COMPLETED') {
                statusColor = 'bg-blue-500';
            } else if (t.status === 'CLOSED') {
                statusColor = 'bg-gray-500';
            }

            return (
            <div key={t.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-4 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden flex flex-col group hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5">
              
              <div className="flex space-x-4">
                {/* Game Image */}
                <div className="relative w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-inner group-hover:shadow-md transition-all">
                    <img src={t.image} alt={t.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10"></div>
                    
                    {/* Game Logo Overlay */}
                    <div className="absolute bottom-0 left-0 w-full p-2 flex justify-center">
                         <img 
                            src="https://upload.wikimedia.org/wikipedia/en/2/21/Free_Fire_Logo.png" 
                            alt="FF Logo"
                            className="w-16 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                         />
                    </div>

                    {/* Type Badge (Left) */}
                    <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase tracking-wider font-display">
                        {t.type}
                    </div>

                    {/* Status Badge (Right) - NEW */}
                    <div className={`absolute top-1 right-1 px-2 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-wider font-display shadow-sm ${badgeColorClass}`}>
                        {badgeText}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xl font-black text-slate-800 dark:text-gray-100 uppercase leading-tight tracking-tight truncate w-full pr-2 font-display">{t.title}</h4>
                         <div className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${statusColor}`}></div>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-2 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {/* Map Badge - Enhanced */}
                        <div className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                            <MapPin size={10} />
                            <span className="font-display tracking-widest">{t.map}</span>
                        </div>

                        {/* Weapon Badge - NEW */}
                        {t.weapon && (
                            <div className="flex items-center space-x-1 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50">
                                <Crosshair size={10} />
                                <span className="font-display tracking-widest">{t.weapon}</span>
                            </div>
                        )}

                        {/* Time Badge */}
                        <div className="flex items-center space-x-1 bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-700">
                             <Calendar size={10} />
                             <span>{t.startTime ? new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Soon'}</span>
                        </div>
                      </div>
                  </div>

                  {/* Refined Prize/Entry Layout */}
                  <div className="flex items-center mt-3 space-x-3">
                     <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-2 border border-gray-100 dark:border-slate-700 flex flex-col justify-center pl-3">
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Prize Pool</span>
                       <span className="text-xl font-display font-bold text-slate-800 dark:text-white leading-none mt-0.5">₹{t.prizePool}</span>
                     </div>
                     
                     <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-2 border border-green-100 dark:border-green-900/20 flex flex-col justify-center pl-3">
                       <span className="text-[8px] font-bold text-green-600/70 dark:text-green-400/70 uppercase tracking-widest">Entry</span>
                       <div className="flex items-center text-green-600 dark:text-green-400 font-display font-bold text-xl leading-none mt-0.5">
                         <Coins size={14} className="mr-1 opacity-80" strokeWidth={2.5} />
                         {t.entryFee}
                       </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="mt-4 pt-3 border-t border-gray-50 dark:border-slate-800/50">
                 <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1.5 tracking-wide uppercase">
                    <div className="flex items-center space-x-1">
                        <Users size={10} />
                        <span>Registered: {t.filledSlots}/{t.totalSlots}</span>
                    </div>
                    <span className={t.filledSlots/t.totalSlots > 0.8 ? "text-red-500" : "text-green-500"}>
                      {statusText}
                    </span>
                 </div>
                 
                 {/* Progress Bar */}
                 <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-4 relative">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                            t.filledSlots/t.totalSlots > 0.8 ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                        }`}
                        style={{ width: `${(t.filledSlots / t.totalSlots) * 100}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                    </div>
                 </div>

                 <div className="flex space-x-2">
                    {/* DETAILS Button - Changed to RED */}
                    <button 
                        onClick={() => onSelectTournament(t)}
                        className="flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center space-x-1"
                    >
                        <Info size={14} />
                        <span>DETAILS</span>
                    </button>
                    
                    {/* Strict Join Button Logic - Changed to GREEN */}
                    <button 
                        onClick={(e) => handleQuickJoin(e, t)}
                        disabled={t.status !== 'OPEN' || isFull || isJoined || joiningId === t.id}
                        className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-1 ${
                            isJoined 
                            ? 'bg-slate-800 dark:bg-slate-800 border border-slate-700 text-white cursor-not-allowed'
                            : t.status === 'OPEN' && !isFull
                                ? 'bg-green-600 text-white hover:bg-green-500 shadow-green-600/20 border-0'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-slate-700'
                        }`}
                    >
                         {joiningId === t.id ? (
                            <Loader className="animate-spin" size={14} />
                         ) : isJoined ? (
                            // Show Countdown Timer if Joined
                            timeLeft ? (
                                <div className="flex items-center space-x-1.5 animate-pulse text-yellow-400">
                                    <Clock size={14} />
                                    <span className="font-mono text-xs">{timeLeft}</span>
                                </div>
                            ) : (
                                <>
                                    <span>STARTING...</span>
                                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full ml-1"></div>
                                </>
                            )
                         ) : isFull ? (
                            <span>FULL</span>
                         ) : t.status === 'OPEN' ? (
                            <>
                                <Play size={14} fill="currentColor" />
                                <span>JOIN NOW</span>
                            </>
                         ) : (
                             <span>LOCKED</span>
                         )}
                    </button>
                 </div>
              </div>
            </div>
          )})
        )}
      </div>
    </div>
  );
};

export default Home;