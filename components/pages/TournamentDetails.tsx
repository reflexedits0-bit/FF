import React, { useState } from 'react';
import { Tournament, UserProfile } from '../types';
import { Trophy, Users, Clock, Map, Shield, ChevronLeft, Calendar, Coins, Play, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { ref, update } from 'firebase/database';

interface TournamentDetailsProps {
  tournament: Tournament;
  user: UserProfile | null;
  onBack: () => void;
  onJoinSuccess: () => void;
  onError: (msg: string) => void;
}

const TournamentDetails: React.FC<TournamentDetailsProps> = ({ tournament, user, onBack, onJoinSuccess, onError }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const isJoined = currentUser && tournament.participants && tournament.participants[currentUser.uid];
  const isFull = tournament.filledSlots >= tournament.totalSlots;
  const isClosed = tournament.status !== 'OPEN';

  const handleJoin = async () => {
    if (!user || !currentUser) return;
    if (tournament.status !== 'OPEN') return;
    
    if (user.balance < tournament.entryFee) {
        onError("Insufficient Balance! Please deposit funds.");
        return;
    }

    setLoading(true);

    try {
        const updates: any = {};
        updates['/users/' + currentUser.uid + '/balance'] = user.balance - tournament.entryFee;
        updates['/tournaments/' + tournament.id + '/participants/' + currentUser.uid] = true;
        updates['/tournaments/' + tournament.id + '/filledSlots'] = (tournament.filledSlots || 0) + 1;

        await update(ref(db), updates);
        onJoinSuccess();
    } catch (e) {
        console.error(e);
        onError("Failed to join. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  // Only show the action button if the user is joined OR the tournament is open (even if full, we might want to show "Full")
  // If it is closed and not joined, we hide the button as requested ("Match closed hata do")
  const showActionButton = isJoined || !isClosed;

  return (
    <div className="pb-8 animate-fade-in relative">
        {/* Header Image */}
        <div className="h-64 relative">
            <img src={tournament.image} alt={tournament.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
            
            <button onClick={onBack} className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition border border-white/10">
                <ChevronLeft size={24} />
            </button>

            <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center space-x-2 mb-2">
                     <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{tournament.type}</span>
                     <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-white/10">{tournament.map}</span>
                </div>
                <h1 className="text-3xl font-display font-bold text-white italic tracking-wide mb-1">{tournament.title}</h1>
                <div className="flex items-center text-gray-300 text-xs font-medium space-x-4">
                    <span className="flex items-center"><Calendar size={12} className="mr-1" /> {tournament.startTime || 'Starts Soon'}</span>
                    <span className="flex items-center"><Users size={12} className="mr-1" /> {tournament.filledSlots}/{tournament.totalSlots} Slots</span>
                </div>
            </div>
        </div>

        <div className="p-4 -mt-4 bg-gray-50 dark:bg-slate-900 rounded-t-3xl relative z-10 space-y-4 transition-colors">
            {/* Prize Pool Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center relative overflow-hidden transition-colors">
                {/* Winner Takes All Badge */}
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm uppercase tracking-widest z-10">
                    Winner Takes All
                </div>
                <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prize Pool</div>
                    <div className="text-3xl font-display font-bold text-slate-800 dark:text-white">₹{tournament.prizePool}</div>
                    <div className="text-[10px] font-bold text-green-600 dark:text-green-400 mt-0.5 flex items-center">
                        <Trophy size={12} className="mr-1 fill-current" />
                        <span>Rank #1 Player Only</span>
                    </div>
                </div>
                <div className="h-10 w-px bg-gray-100 dark:bg-slate-700 mx-4"></div>
                <div className="text-right">
                     <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Entry Fee</div>
                     <div className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center justify-end">
                        <Coins size={16} className="mr-1" /> ₹{tournament.entryFee}
                     </div>
                </div>
            </div>

            {/* Room Details (Only if Joined) */}
            {isJoined && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-2xl p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="text-yellow-600 dark:text-yellow-500 shrink-0" size={20} />
                        <div>
                            <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-1">Room Details</h3>
                            <p className="text-xs text-yellow-700 dark:text-yellow-500/80 leading-relaxed">
                                ID & Password will be displayed here 15 minutes before match start time.
                            </p>
                            <div className="mt-3 bg-white/50 dark:bg-black/20 p-2 rounded border border-yellow-100 dark:border-yellow-900/20 text-center text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                                -- : --
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Description */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-gray-200 text-sm uppercase tracking-wide mb-3 flex items-center">
                    <FileTextIcon /> Description
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {tournament.description || "Join this exciting tournament to verify your skills. The winner takes it all! Only the Rank #1 player will receive the entire prize pool reward instantly after the match."}
                </p>
            </div>

            {/* Rules */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                <h3 className="font-bold text-slate-800 dark:text-gray-200 text-sm uppercase tracking-wide mb-3 flex items-center">
                    <Shield size={16} className="mr-2 text-blue-500" /> Match Rules
                </h3>
                <ul className="space-y-2">
                    {(tournament.rules || ["No Emulators", "No Hacking", "Lag issues are player responsibility", "Only Top 1 gets the prize"]).map((r, i) => (
                        <li key={i} className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mt-1.5 shrink-0"></div>
                            <span>{r}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Floating Action Button */}
        {showActionButton && (
            <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-auto md:w-96 md:mx-auto z-30">
                <button 
                    onClick={handleJoin}
                    disabled={isFull || isJoined || loading}
                    className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                        isJoined 
                        ? 'bg-green-600 text-white'
                        : !isFull
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {loading ? (
                        <span className="animate-pulse">Processing...</span>
                    ) : isJoined ? (
                        <><span>You are Registered</span> <Trophy size={18} /></>
                    ) : isFull ? (
                        <span>Slots Full</span>
                    ) : (
                        <><span>Join Tournament</span> <Play size={18} fill="currentColor" /></>
                    )}
                </button>
            </div>
        )}
    </div>
  );
};

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
)

export default TournamentDetails;