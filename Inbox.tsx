import React, { useEffect, useState } from 'react';
import { X, MailOpen, Bell, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from './Skeleton';

interface InboxProps {
  onClose: () => void;
}

interface MailItem {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'SYSTEM' | 'ADMIN' | 'REWARD';
  read: boolean;
}

const Inbox: React.FC<InboxProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [mails, setMails] = useState<MailItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const mailsRef = ref(db, `users/${currentUser.uid}/mails`);
    const unsubscribe = onValue(mailsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMails: MailItem[] = [];
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      if (data) {
        Object.keys(data).forEach((key) => {
          const mail = { id: key, ...data[key] };
          
          // Auto-delete if older than 24 hours
          if (now - mail.timestamp > ONE_DAY_MS) {
             remove(ref(db, `users/${currentUser.uid}/mails/${key}`));
          } else {
             loadedMails.push(mail);
          }
        });
        // Sort by newest
        loadedMails.sort((a, b) => b.timestamp - a.timestamp);
      }
      setMails(loadedMails);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Lighter Backdrop */}
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Bell className="text-blue-600 dark:text-blue-500" size={24} />
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-wide">Inbox</h2>
          </div>
          <button onClick={onClose} className="bg-gray-100 dark:bg-slate-800 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition">
            <X size={20} className="text-slate-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {loading ? (
                Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex space-x-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="w-3/4 h-4 rounded" />
                            <Skeleton className="w-full h-12 rounded" />
                        </div>
                    </div>
                ))
            ) : mails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <MailOpen size={48} strokeWidth={1} className="mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs font-bold uppercase tracking-widest">No New Messages</p>
                    <p className="text-[10px] mt-1 text-gray-400 dark:text-gray-500">System messages are deleted after 24 hours.</p>
                </div>
            ) : (
                mails.map(mail => (
                    <div key={mail.id} className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 relative group transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                mail.type === 'ADMIN' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                                mail.type === 'REWARD' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}>
                                {mail.type}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400">
                                {new Date(mail.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{mail.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">{mail.message}</p>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;