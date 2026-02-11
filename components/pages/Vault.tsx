import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { ArrowUpRight, ArrowDownLeft, X, Loader, Copy, Check, Image as ImageIcon, UploadCloud, ScanLine, AlertCircle, Filter, ShieldCheck, Trash2 } from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface VaultProps {
  user: UserProfile | null;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type FilterType = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'GAME';

const Vault: React.FC<VaultProps> = ({ user, onShowToast }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  
  // Modals
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  // Confirmation States
  const [showDepositConfirm, setShowDepositConfirm] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState(''); // For UTR
  const [withdrawUpi, setWithdrawUpi] = useState('');
  
  // Image State
  const [depositScreenshot, setDepositScreenshot] = useState<string | null>(null);
  const [withdrawQr, setWithdrawQr] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch Transactions
  useEffect(() => {
    if (currentUser) {
      const txRef = ref(db, 'users/' + currentUser.uid + '/transactions');
      const unsubscribe = onValue(txRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).reverse(); // Newest first
          setTransactions(list);
        } else {
          setTransactions([]);
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const filteredTransactions = transactions.filter(tx => {
      if (filter === 'ALL') return true;
      if (filter === 'DEPOSIT') return tx.type === 'DEPOSIT';
      if (filter === 'WITHDRAWAL') return tx.type === 'WITHDRAWAL';
      if (filter === 'GAME') return tx.type === 'ENTRY_FEE' || tx.type === 'WINNINGS';
      return true;
  });

  // Helper: Convert File to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImgState: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit size to 1MB to prevent DB issues
      if (file.size > 1024 * 1024) {
        onShowToast("Image size must be less than 1MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgState(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
      if (!currentUser) return;
      try {
          await remove(ref(db, `users/${currentUser.uid}/transactions/${txId}`));
          onShowToast("History deleted", "info");
      } catch (e) {
          onShowToast("Failed to delete", "error");
      }
  };

  // --- DEPOSIT LOGIC ---
  const initiateDeposit = () => {
      if (!amount || !transactionId || !currentUser) {
          onShowToast("Please fill all fields", "error");
          return;
      }
      if (!depositScreenshot) {
          onShowToast("Please upload payment screenshot", "error");
          return;
      }
      setShowDepositConfirm(true);
  };

  const processDeposit = async () => {
    setLoading(true);
    try {
        const reqData = {
            userId: currentUser?.uid,
            username: user?.username || 'Unknown',
            amount: Number(amount),
            transactionId: transactionId,
            screenshot: depositScreenshot,
            status: 'PENDING',
            date: new Date().toLocaleString(),
            type: 'DEPOSIT'
        };

        // 1. Add to Admin 'deposits' node
        await push(ref(db, 'deposits'), reqData);

        // 2. Add to User 'transactions' node
        await push(ref(db, 'users/' + currentUser!.uid + '/transactions'), {
            amount: Number(amount),
            status: 'PENDING',
            date: new Date().toLocaleString(),
            type: 'DEPOSIT'
        });

        onShowToast("Deposit Submitted for Verification", "success");
        setShowDepositModal(false);
        setShowDepositConfirm(false);
        setAmount('');
        setTransactionId('');
        setDepositScreenshot(null);
    } catch (e) {
        onShowToast("Network Error. Try again.", "error");
    } finally {
        setLoading(false);
    }
  };

  // --- WITHDRAW LOGIC ---
  const initiateWithdraw = () => {
      if (!amount || !user || !currentUser) return;
      
      const withdrawAmount = Number(amount);
      const availableWinnings = user.winnings || 0;

      // Strict Balance Check
      if (withdrawAmount > availableWinnings) { 
          onShowToast(`Insufficient Winnings! You only have ₹${availableWinnings}`, "error"); 
          return; 
      }
      if (withdrawAmount < 100) { 
          onShowToast("Minimum withdrawal is ₹100", "error"); 
          return; 
      }
      if (!withdrawUpi && !withdrawQr) {
          onShowToast("Provide UPI ID or QR Code", "error");
          return;
      }
      setShowWithdrawConfirm(true);
  };

  const processWithdraw = async () => {
    setLoading(true);
    const withdrawAmount = Number(amount);
    const availableWinnings = user!.winnings || 0;
    const currentBalance = user!.balance || 0;

    try {
        const reqData = {
            userId: currentUser!.uid,
            username: user?.username || 'Unknown',
            amount: withdrawAmount,
            userUpi: withdrawUpi,
            userQr: withdrawQr,
            status: 'PENDING',
            date: new Date().toLocaleString(),
            type: 'WITHDRAWAL'
        };

        // 1. Add to Admin 'withdrawals' node
        await push(ref(db, 'withdrawals'), reqData);

        // 2. Add to User transactions
        await push(ref(db, 'users/' + currentUser!.uid + '/transactions'), {
            amount: withdrawAmount,
            status: 'PENDING',
            date: new Date().toLocaleString(),
            type: 'WITHDRAWAL'
        });
        
        // 3. Deduct from User Balance & Winnings Immediately
        const updates: any = {};
        updates[`/users/${currentUser!.uid}/winnings`] = availableWinnings - withdrawAmount;
        updates[`/users/${currentUser!.uid}/balance`] = currentBalance - withdrawAmount;

        await update(ref(db), updates);

        onShowToast("Withdrawal Request Submitted.", "success");
        setShowWithdrawModal(false);
        setShowWithdrawConfirm(false);
        setAmount('');
        setWithdrawUpi('');
        setWithdrawQr(null);
    } catch (e) {
        onShowToast("Network Error. Try again.", "error");
    } finally {
        setLoading(false);
    }
  };

  const copyUpi = () => {
      navigator.clipboard.writeText('arenaadmin@upi');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast("Admin UPI Copied", "success");
  }

  const resetModals = () => {
      setShowDepositModal(false);
      setShowWithdrawModal(false);
      setShowDepositConfirm(false);
      setShowWithdrawConfirm(false);
  }

  return (
    <div className="p-4 space-y-5 pb-24">
      
      {/* Wallet Card */}
      <div className="w-full bg-[#0F1020] rounded-3xl p-5 text-white relative overflow-hidden shadow-2xl">
         {/* Background Effects */}
         <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/20 blur-3xl rounded-full -mr-10 -mt-10"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-600/20 blur-2xl rounded-full -ml-8 -mb-8"></div>

         <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-6 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md opacity-90 shadow-lg"></div>
                <div className="text-[10px] font-display italic text-gray-500 tracking-widest bg-white/5 px-2 py-0.5 rounded">ARENA PASS</div>
            </div>
            
            <div className="flex justify-between items-end mb-5">
                <div>
                   <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-0.5">Total Balance</div>
                   <div className="text-3xl font-display font-bold flex items-center leading-none">
                     <span className="text-xl mr-1 text-gray-400">₹</span> {user?.balance || 0}
                   </div>
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-medium text-gray-400 border-t border-white/10 pt-3">
               <div>
                   <div className="text-[9px] uppercase tracking-wider opacity-70">Unutilized (Deposit)</div>
                   <span className="text-white text-sm font-bold">₹{user?.deposit || 0}</span>
               </div>
               <div className="text-right">
                   <div className="text-[9px] uppercase tracking-wider opacity-70 text-green-400">Withdrawable (Winnings)</div>
                   <span className="text-green-400 text-sm font-bold">₹{user?.winnings || 0}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
               <button 
                  onClick={() => { resetModals(); setShowDepositModal(true); }}
                  className="bg-white text-black py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
                >
                 <ArrowDownLeft size={14} />
                 <span>Add Funds</span>
               </button>
               <button 
                  onClick={() => { resetModals(); setShowWithdrawModal(true); }}
                  className="bg-white/10 backdrop-blur-md text-white border border-white/20 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-white/20 transition-colors flex items-center justify-center space-x-2"
                >
                 <ArrowUpRight size={14} />
                 <span>Withdraw</span>
               </button>
            </div>
         </div>
      </div>

      {/* Transaction Filters */}
      <div>
         <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Filter size={12} /> Transactions
            </h3>
         </div>
         <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'GAME'].map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f as FilterType)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        filter === f
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-slate-900 text-gray-400 border-gray-100 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                    }`}
                >
                    {f}
                </button>
            ))}
         </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3 pb-4">
        {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
          <div key={tx.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between transition-colors">
             <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'WITHDRAWAL' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 
                    tx.type === 'DEPOSIT' ? 'bg-green-50 text-green-500 dark:bg-green-900/20' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20'
                }`}>
                    {tx.type === 'WITHDRAWAL' ? <ArrowUpRight size={16} /> : tx.type === 'DEPOSIT' ? <ArrowDownLeft size={16} /> : <AlertCircle size={16} />}
                </div>
                <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-gray-200 capitalize">
                        {tx.type === 'WITHDRAWAL' ? 'Withdrawal' : tx.type === 'DEPOSIT' ? 'Deposit' : tx.type === 'ENTRY_FEE' ? 'Match Entry' : 'Match Winnings'}
                    </div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{tx.date}</div>
                </div>
             </div>
             <div className="flex items-center space-x-3">
                <div className="text-right">
                    <div className={`font-black text-sm ${tx.type === 'WITHDRAWAL' || tx.type === 'ENTRY_FEE' ? 'text-red-500' : 'text-green-500'}`}>
                        {tx.type === 'WITHDRAWAL' || tx.type === 'ENTRY_FEE' ? '-' : '+'}₹{tx.amount}
                    </div>
                    <div className={`flex items-center justify-end text-[9px] font-bold ${
                        tx.status === 'SUCCESS' ? 'text-green-500' : tx.status === 'FAILED' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                        {tx.status}
                    </div>
                </div>
                
                {/* Delete Button for Finished Transactions */}
                {tx.status !== 'PENDING' && (
                    <button 
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
             </div>
          </div>
        )) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                <ScanLine className="text-gray-400 mb-2" size={32} />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Transactions Found</span>
            </div>
        )}
      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0" onClick={resetModals}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="w-12 h-1 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
                
                {showWithdrawConfirm ? (
                    // WITHDRAW CONFIRMATION VIEW
                    <div className="space-y-6">
                        <div className="text-center">
                             <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <ArrowUpRight size={32} className="text-red-500" />
                             </div>
                             <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase">Confirm Withdrawal</h2>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please verify your details before proceeding.</p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-5 space-y-4 border border-gray-100 dark:border-slate-700">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">Withdraw Amount</span>
                                 <span className="font-display font-bold text-xl text-slate-900 dark:text-white">₹{amount}</span>
                             </div>
                             
                             <div className="h-px bg-gray-200 dark:bg-slate-700 w-full"></div>

                             <div className="flex justify-between items-start text-sm">
                                 <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider mt-1">Transfer To</span>
                                 <div className="text-right">
                                     <div className="font-bold text-slate-900 dark:text-white flex items-center justify-end gap-1">
                                        {withdrawUpi ? (
                                            <><span>UPI ID</span></>
                                        ) : (
                                            <><span>QR Code</span></>
                                        )}
                                     </div>
                                     <div className="text-xs text-blue-500 font-mono font-bold mt-0.5 break-all">
                                        {withdrawUpi ? withdrawUpi : 'Screenshot Attached'}
                                     </div>
                                 </div>
                             </div>

                             <div className="h-px bg-gray-200 dark:bg-slate-700 w-full"></div>

                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider">Remaining Winnings</span>
                                 <span className="font-bold text-green-500">₹{(user?.winnings || 0) - Number(amount)}</span>
                             </div>
                        </div>

                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setShowWithdrawConfirm(false)} 
                                className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase bg-gray-100 dark:bg-slate-800 text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={processWithdraw} 
                                disabled={loading} 
                                className="flex-[2] py-3.5 rounded-xl font-bold text-xs uppercase bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center hover:bg-red-700 transition"
                            >
                                {loading ? <Loader className="animate-spin" size={18} /> : "Confirm Request"}
                            </button>
                        </div>
                    </div>
                ) : (
                    // WITHDRAW FORM VIEW
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-wide">Withdraw Winnings</h2>
                            <button onClick={resetModals} className="bg-gray-100 dark:bg-slate-800 p-1.5 rounded-full text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Withdraw Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-bold">₹</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl py-3 pl-8 pr-4 font-bold text-lg focus:outline-none focus:border-blue-500"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold mt-1.5">
                                    <span className="text-red-400">Min: ₹100</span>
                                    <span className="text-green-600 dark:text-green-400">Withdrawable: ₹{user?.winnings || 0}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Your UPI ID</label>
                                <input 
                                type="text" 
                                placeholder="e.g. 9876543210@paytm" 
                                value={withdrawUpi}
                                onChange={(e) => setWithdrawUpi(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Upload Your QR Code</label>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, setWithdrawQr)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl h-32 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800 overflow-hidden">
                                        {withdrawQr ? (
                                            <img src={withdrawQr} alt="QR Preview" className="h-full object-contain" />
                                        ) : (
                                            <>
                                                <UploadCloud size={24} className="text-blue-500 mb-2" />
                                                <span className="text-xs font-bold text-gray-400">Tap to Upload QR</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={initiateWithdraw}
                                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl uppercase tracking-wider hover:bg-green-700 transition shadow-lg shadow-green-600/30 flex items-center justify-center"
                            >
                                Request Withdrawal
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

      {/* DEPOSIT MODAL COMPACT */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={resetModals}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 relative z-10 animate-slide-up shadow-2xl">
                
                {showDepositConfirm ? (
                    // DEPOSIT CONFIRMATION VIEW
                     <div className="space-y-6 pt-4">
                        <div className="text-center">
                             <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck size={32} className="text-blue-500" />
                             </div>
                             <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase">Confirm Deposit</h2>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review transaction details</p>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-gray-500 font-bold">Amount</span>
                                 <span className="font-bold text-slate-900 dark:text-white">₹{amount}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-gray-500 font-bold">UTR / Ref No.</span>
                                 <span className="font-bold text-slate-900 dark:text-white font-mono">{transactionId}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-slate-700 pt-2">
                                 <span className="text-gray-500 font-bold">Status</span>
                                 <span className="font-bold text-yellow-500 uppercase text-[10px] border border-yellow-500 px-1.5 rounded">Pending Review</span>
                             </div>
                        </div>

                        <div className="flex space-x-3">
                            <button onClick={() => setShowDepositConfirm(false)} className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase bg-gray-100 dark:bg-slate-800 text-slate-500">Back</button>
                            <button onClick={processDeposit} disabled={loading} className="flex-[2] py-3.5 rounded-xl font-bold text-xs uppercase bg-black dark:bg-white text-white dark:text-black shadow-lg flex items-center justify-center">
                                {loading ? <Loader className="animate-spin" size={18} /> : "Submit to Admin"}
                            </button>
                        </div>
                    </div>
                ) : (
                    // DEPOSIT FORM VIEW
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                <ArrowDownLeft className="text-blue-500" size={20} /> Add Funds
                            </h2>
                            <button onClick={resetModals} className="bg-gray-100 dark:bg-slate-800 p-1.5 rounded-full text-slate-500"><X size={16} /></button>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex space-x-3">
                                <div className="bg-white p-2 rounded-xl border border-gray-200 shrink-0 flex items-center justify-center">
                                    <img 
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=arenaadmin@upi&pn=ArenaGames&mc=0000&mode=02&purpose=00" 
                                        alt="Admin QR" 
                                        className="w-24 h-24 mix-blend-multiply"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-2 flex items-center justify-between">
                                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-gray-300 truncate mr-1">arenaadmin@upi</span>
                                        <button onClick={copyUpi} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"><Copy size={12} /></button>
                                    </div>
                                    <div className="relative mt-2">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 font-bold text-sm">₹</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-lg py-2 pl-6 pr-2 font-bold text-sm focus:outline-none focus:border-blue-500"
                                            placeholder="Amount"
                                        />
                                    </div>
                                    <div className="flex space-x-1 mt-2 overflow-x-auto no-scrollbar">
                                        {['50', '100', '200', '500'].map(val => (
                                            <button key={val} onClick={() => setAmount(val)} className="shrink-0 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition text-slate-800 dark:text-white px-2 py-1 rounded text-[10px] font-bold">₹{val}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <input 
                                type="text" 
                                placeholder="Enter 12-digit UTR Number" 
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" 
                                />
                            </div>
                            <div className="flex space-x-3 h-12">
                                <div className="relative w-1/3 shrink-0">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, setDepositScreenshot)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`border-2 border-dashed rounded-xl h-full flex flex-col items-center justify-center transition-colors ${depositScreenshot ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800'}`}>
                                        {depositScreenshot ? <Check size={16} className="text-green-600"/> : <UploadCloud size={16} className="text-gray-400"/>}
                                        <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{depositScreenshot ? 'Added' : 'Proof'}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={initiateDeposit}
                                    className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl uppercase tracking-wider hover:bg-gray-900 dark:hover:bg-gray-200 transition shadow-lg flex items-center justify-center text-xs"
                                >
                                    Verify & Deposit
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Vault;