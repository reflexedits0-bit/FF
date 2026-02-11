import React, { useState } from 'react';
import { db } from '../firebase';
import { ref, push } from 'firebase/database';
import { MessageCircle, AlertTriangle, ChevronDown, Upload, X, Loader } from 'lucide-react';
import { FAQS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface SupportProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const Support: React.FC<SupportProps> = ({ onShowToast }) => {
  const { currentUser } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [issue, setIssue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitTicket = async () => {
    if (!issue.trim() || !currentUser) return;
    setLoading(true);
    try {
        await push(ref(db, 'support'), {
            userId: currentUser.uid,
            issue: issue,
            status: 'OPEN',
            date: new Date().toLocaleString(),
            email: currentUser.email
        });
        onShowToast("Ticket Submitted Successfully!", "success");
        setShowTicketModal(false);
        setIssue('');
    } catch (e) {
        onShowToast("Failed to submit ticket.", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
       
       <div className="grid grid-cols-2 gap-4">
           <button className="bg-green-500 text-white p-6 rounded-2xl shadow-lg shadow-green-500/20 flex flex-col items-center justify-center hover:bg-green-600 transition">
               <MessageCircle size={32} className="mb-2" />
               <span className="font-display font-bold text-lg tracking-wide uppercase">WhatsApp</span>
           </button>
           <button 
             onClick={() => setShowTicketModal(true)}
             className="bg-white dark:bg-slate-800 text-red-500 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition"
           >
               <AlertTriangle size={32} className="mb-2" />
               <span className="font-bold text-[10px] tracking-widest uppercase text-gray-500 dark:text-gray-400">Report Issue</span>
           </button>
       </div>

       <div>
           <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">FAQ</h3>
           <div className="space-y-3">
               {FAQS.map((faq, index) => (
                   <div key={index} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm transition-colors">
                       <button 
                         onClick={() => setOpenFaq(openFaq === index ? null : index)}
                         className="w-full flex items-center justify-between p-4 text-left"
                       >
                           <span className="font-bold text-sm text-slate-800 dark:text-white">{faq.question}</span>
                           <ChevronDown size={16} className={`text-gray-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                       </button>
                       {openFaq === index && (
                           <div className="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                               {faq.answer}
                           </div>
                       )}
                   </div>
               ))}
           </div>
       </div>

       {/* Submit Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Lighter Backdrop */}
            <div className="absolute inset-0" onClick={() => setShowTicketModal(false)}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up shadow-2xl">
                <div className="w-12 h-1 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-wide">Submit Ticket</h2>
                    <button onClick={() => setShowTicketModal(false)} className="bg-gray-100 dark:bg-slate-800 p-1.5 rounded-full text-slate-500"><X size={18} /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Describe Your Issue</label>
                        <textarea 
                          value={issue}
                          onChange={(e) => setIssue(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 h-24 resize-none"
                          placeholder="Please provide details regarding your problem..."
                        ></textarea>
                    </div>

                    <div>
                         <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Upload Screenshot</label>
                         <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl h-24 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-slate-800">
                            <Upload size={24} className="mb-2" />
                            <span className="text-xs font-bold">ATTACH IMAGE</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmitTicket}
                        disabled={loading}
                        className="w-full bg-red-600 text-white font-bold py-4 rounded-xl uppercase tracking-wider hover:bg-red-700 transition shadow-lg shadow-red-500/30 flex justify-center"
                    >
                         {loading ? <Loader className="animate-spin" size={20} /> : "Submit Report"}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Support;