import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue, push } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { Tournament, UserProfile } from '../types';
import { LayoutGrid, Upload, Check, Loader, Copy, AlertTriangle, Play, Clock, Trophy } from 'lucide-react';
import Toast from '../components/Toast';
import Skeleton from '../components/Skeleton';

const Matches: React.FC = () => {
    const { currentUser } = useAuth();
    const [matches, setMatches] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        const tourneyRef = ref(db, 'tournaments');
        const unsubscribe = onValue(tourneyRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const joinedMatches: Tournament[] = [];
                Object.keys(data).forEach(key => {
                    const t = data[key];
                    if (t.participants && t.participants[currentUser.uid]) {
                        joinedMatches.push({ id: key, ...t });
                    }
                });
                // Sort: Live first, then Open, then Completed/Closed
                joinedMatches.sort((a, b) => {
                    const statusOrder = { 'LIVE': 1, 'OPEN': 2, 'CLOSED': 3, 'COMPLETED': 4 };
                    return (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9);
                });
                setMatches(joinedMatches);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, tournamentId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB Limit
            setToast({ message: "Image too large (Max 2MB)", type: 'error' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result as string;
            await submitResult(tournamentId, base64Data);
        };
        reader.readAsDataURL(file);
    };

    const submitResult = async (tournamentId: string, imageBase64: string) => {
        if (!currentUser) return;
        setUploadingId(tournamentId);

        try {
            await push(ref(db, `match_results/${tournamentId}/${currentUser.uid}`), {
                userId: currentUser.uid,
                email: currentUser.email,
                screenshot: imageBase64,
                timestamp: Date.now(),
                status: 'SUBMITTED'
            });
            setToast({ message: "Result Uploaded Successfully!", type: 'success' });
        } catch (e) {
            console.error(e);
            setToast({ message: "Upload failed. Try again.", type: 'error' });
        } finally {
            setUploadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                 {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8">
                <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-full mb-4 transition-colors">
                    <div className="text-gray-400 dark:text-gray-500">
                        <LayoutGrid size={48} strokeWidth={1.5} />
                    </div>
                </div>
                <h3 className="text-slate-700 dark:text-gray-300 font-display font-bold text-lg tracking-wide mb-1">NO MATCHES JOINED</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 max-w-xs mx-auto mb-6">You haven't registered for any tournaments yet. Join one from the Home screen.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24 font-sans">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="flex items-center space-x-3 mb-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase italic tracking-wide">
                    MY MATCHES <span className="text-blue-600 text-sm not-italic ml-2 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">{matches.length}</span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {matches.map(match => (
                    <div key={match.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-lg border border-gray-100 dark:border-slate-800 relative group">
                        
                        {/* Status Strip */}
                        <div className={`h-1.5 w-full ${
                            match.status === 'LIVE' ? 'bg-red-600 animate-pulse' : 
                            match.status === 'COMPLETED' ? 'bg-blue-600' : 'bg-green-500'
                        }`}></div>

                        <div className="p-5">
                             {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase font-display leading-tight">{match.title}</h3>
                                    <div className="flex items-center space-x-2 mt-1">
                                         <span className="text-[10px] font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase tracking-widest">{match.map}</span>
                                         <span className="text-[10px] font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase tracking-widest">{match.type}</span>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                    match.status === 'LIVE' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800' :
                                    match.status === 'COMPLETED' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800' :
                                    'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800'
                                }`}>
                                    {match.status}
                                </div>
                            </div>

                            {/* Room Details Section */}
                            <div className="bg-gray-50 dark:bg-black/30 rounded-xl p-4 border border-gray-200 dark:border-slate-800 mb-4 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <Trophy size={10} /> Room Details
                                    </span>
                                    {match.status === 'LIVE' && <span className="text-[9px] font-bold text-red-500 animate-pulse">● LIVE NOW</span>}
                                </div>

                                {match.roomId && match.roomPass ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
                                            <span className="text-[8px] text-gray-400 font-bold block">ROOM ID</span>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-mono font-bold text-slate-800 dark:text-white select-all">{match.roomId}</span>
                                                <button onClick={() => navigator.clipboard.writeText(match.roomId || '')} className="text-blue-500"><Copy size={12}/></button>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
                                            <span className="text-[8px] text-gray-400 font-bold block">PASSWORD</span>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-mono font-bold text-slate-800 dark:text-white select-all">{match.roomPass}</span>
                                                <button onClick={() => navigator.clipboard.writeText(match.roomPass || '')} className="text-blue-500"><Copy size={12}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-3 text-center">
                                        {match.status === 'COMPLETED' ? (
                                            <span className="text-xs font-bold text-gray-400">Match Ended</span>
                                        ) : (
                                            <>
                                                <Clock size={20} className="text-gray-400 mb-1" />
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">ID/Pass will appear here 15 min before start</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Area */}
                            {match.status === 'COMPLETED' ? (
                                <div className="mt-4">
                                    <label className={`w-full flex flex-col items-center justify-center px-4 py-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer group ${
                                        uploadingId === match.id 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                                        : 'border-gray-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => handleImageUpload(e, match.id)}
                                            disabled={uploadingId === match.id}
                                        />
                                        
                                        {uploadingId === match.id ? (
                                            <div className="flex flex-col items-center">
                                                <Loader size={24} className="animate-spin text-blue-600 mb-2" />
                                                <span className="text-xs font-bold text-blue-600">Uploading Result...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload size={24} className="text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide group-hover:text-blue-500">Upload Result Screenshot</span>
                                                <span className="text-[9px] text-gray-400 mt-1">Required for Winnings Claim</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl flex items-start space-x-3">
                                    <AlertTriangle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Important</p>
                                        <p className="text-[10px] text-blue-700 dark:text-blue-400/80 leading-relaxed">
                                            Wait for the match to complete. Once finished, the option to upload your result screenshot will appear here.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Matches;