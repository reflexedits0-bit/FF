import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo, update, push } from 'firebase/database';
import { User, Mail, Lock, ArrowRight, Loader, Zap, CheckCircle, Eye, EyeOff, HelpCircle, X } from 'lucide-react';
import Toast from '../components/Toast';

const WALLPAPERS = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2665&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop"
];

const Auth: React.FC = () => {
  const [currentWallpaper, setCurrentWallpaper] = useState(0);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Cycle Wallpapers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWallpaper(prev => (prev + 1) % WALLPAPERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case 'auth/invalid-email': return "Invalid Email Address format.";
        case 'auth/user-not-found': return "No account found with this email.";
        case 'auth/wrong-password': return "Incorrect Password. Please try again.";
        case 'auth/invalid-credential': return "Invalid Email or Password.";
        case 'auth/email-already-in-use': return "This email is already registered.";
        case 'auth/weak-password': return "Password is too weak (min 6 chars).";
        case 'auth/network-request-failed': return "Network Error. Check your internet.";
        case 'auth/too-many-requests': return "Too many attempts. Try again later.";
        case 'auth/operation-not-allowed': return "Login is currently disabled.";
        case 'auth/invalid-login-credentials': return "Invalid login details.";
        default: return "Login Failed. Please check details.";
    }
  };

  const generateReferralCode = (name: string) => {
      const random = Math.floor(1000 + Math.random() * 9000);
      const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'USR');
      return `${prefix}${random}`;
  };

  const handleReferralBonus = async (newUserId: string, code: string) => {
      if (!code) return 0;
      
      try {
          // Find referrer
          const usersRef = ref(db, 'users');
          // This query requires .indexOn rules. If missing, it throws an error in client SDK.
          const q = query(usersRef, orderByChild('referralCode'), equalTo(code));
          const snapshot = await get(q);

          if (snapshot.exists()) {
              const referrerData = snapshot.val();
              const referrerId = Object.keys(referrerData)[0];
              const referrer = referrerData[referrerId];

              // Bonus Amount
              const BONUS = 5;

              // Update Referrer
              const updates: any = {};
              const referrerNewDeposit = (referrer.deposit || 0) + BONUS;
              const referrerNewBalance = (referrer.balance || 0) + BONUS;
              
              updates[`/users/${referrerId}/deposit`] = referrerNewDeposit;
              updates[`/users/${referrerId}/balance`] = referrerNewBalance;

              // Record Referrer Transaction
              const refTx = push(ref(db, `users/${referrerId}/transactions`));
              updates[`/users/${referrerId}/transactions/${refTx.key}`] = {
                  amount: BONUS,
                  type: 'DEPOSIT', // Treated as deposit for simplicity
                  status: 'SUCCESS',
                  date: new Date().toLocaleString(),
                  method: 'REFERRAL_BONUS'
              };

              await update(ref(db), updates);
              return BONUS; // Return bonus to add to new user
          }
      } catch (e: any) {
          console.warn("Referral System Error (Likely missing index):", e.message);
          // If index is missing, we simply skip the referral bonus rather than crashing signup
      }
      return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
        setToast({ message: "Passwords do not match.", type: 'error' });
        setLoading(false);
        return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setToast({ message: "Welcome Back!", type: 'success' });
      } else {
        // Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const displayName = username || email.split('@')[0];
        
        await updateProfile(user, {
          displayName: displayName
        });

        // Generate own referral code
        const myReferralCode = generateReferralCode(displayName);
        
        // Handle Referral Bonus Logic
        let initialDeposit = 0;
        let initialBalance = 0;
        
        if (referralCode) {
            const bonus = await handleReferralBonus(user.uid, referralCode);
            if (bonus > 0) {
                initialDeposit = bonus;
                initialBalance = bonus;
                setToast({ message: "Referral Bonus Applied!", type: 'success' });
            }
        }

        // Create Database Entry
        await set(ref(db, 'users/' + user.uid), {
          username: displayName,
          email: email,
          balance: initialBalance,
          deposit: initialDeposit,
          winnings: 0,
          referralCode: myReferralCode,
          referredBy: referralCode || null,
          isSentinelProtected: true,
          stats: { victories: 0, matches: 0, xp: 0 },
          // If bonus applied, add transaction log
          transactions: initialDeposit > 0 ? {
              'initial_bonus': {
                  amount: initialDeposit,
                  type: 'DEPOSIT',
                  status: 'SUCCESS',
                  date: new Date().toLocaleString(),
                  method: 'SIGNUP_BONUS'
              }
          } : {}
        });
        
        setToast({ message: "Account Created Successfully!", type: 'success' });
      }
    } catch (err: any) {
      const msg = getFriendlyErrorMessage(err.code);
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!resetEmail) {
          setToast({message: "Please enter your email", type: "error"});
          return;
      }
      setResetLoading(true);
      try {
          await sendPasswordResetEmail(auth, resetEmail);
          setToast({message: "Password reset link sent to email", type: "success"});
          setShowForgot(false);
          setResetEmail('');
      } catch (e: any) {
          setToast({message: getFriendlyErrorMessage(e.code), type: "error"});
      } finally {
          setResetLoading(false);
      }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center px-6 overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Dynamic Backgrounds */}
      <div className="absolute inset-0 z-0">
          {WALLPAPERS.map((src, index) => (
              <div 
                key={index}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ${index === currentWallpaper ? 'opacity-100' : 'opacity-0'}`}
                style={{ backgroundImage: `url(${src})` }}
              ></div>
          ))}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-slate-950/80 to-black/95 backdrop-blur-[1px]"></div>
          
          {/* Animated Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto perspective-1000">
        <div className="text-center mb-8 flex justify-center items-center gap-3">
            <h1 className="text-6xl font-display font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transform -skew-x-12">
                ARENA
            </h1>
            <h1 className="text-6xl font-display font-black italic text-white tracking-widest transform -skew-x-12">
                AR
            </h1>
        </div>

        {/* 3D Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-slate-700/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] relative overflow-hidden">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {!isLogin && (
                    <div className="relative animate-slide-up group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <User className="text-blue-500" size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="USERNAME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-700 text-white rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] focus:shadow-none transition-all placeholder-slate-500 font-display"
                            required
                        />
                    </div>
                )}

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Mail className="text-blue-500" size={20} />
                    </div>
                    <input 
                        type="email" 
                        placeholder="EMAIL ADDRESS"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border-2 border-slate-700 text-white rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] focus:shadow-none transition-all placeholder-slate-500 font-display"
                        required
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className="text-blue-500" size={20} />
                    </div>
                    <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="PASSWORD"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border-2 border-slate-700 text-white rounded-xl py-3.5 pl-12 pr-12 text-xs font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] focus:shadow-none transition-all placeholder-slate-500 font-display"
                        required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors z-10"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {!isLogin && (
                  <>
                    <div className="relative animate-slide-up group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <CheckCircle className="text-blue-500" size={20} />
                        </div>
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="CONFIRM PASSWORD"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-700 text-white rounded-xl py-3.5 pl-12 pr-12 text-xs font-bold tracking-widest focus:outline-none focus:border-blue-500 focus:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] focus:shadow-none transition-all placeholder-slate-500 font-display"
                            required
                        />
                         <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors z-10"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="relative animate-slide-up group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <Zap className="text-yellow-500" size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="REFERRAL CODE (OPTIONAL)"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-700 text-white rounded-xl py-3.5 pl-12 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-yellow-500 focus:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] focus:shadow-none transition-all placeholder-slate-500 font-display"
                        />
                    </div>
                  </>
                )}

                {isLogin && (
                    <div className="text-right">
                        <button 
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-[10px] text-slate-400 hover:text-blue-400 font-bold tracking-wide transition-colors"
                        >
                            FORGOT PASSWORD?
                        </button>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-black py-4 rounded-xl uppercase tracking-wider shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center space-x-2 border-t border-blue-400 mt-2 font-display"
                >
                    {loading ? (
                        <Loader className="animate-spin" size={20} />
                    ) : (
                        <>
                            <span>{isLogin ? "INITIATE LOGIN" : "JOIN SQUAD"}</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>

        <div className="mt-6 text-center relative z-10">
            <button 
                onClick={() => { setIsLogin(!isLogin); setToast(null); setPassword(''); setConfirmPassword(''); }}
                className="text-slate-300 font-bold text-xs tracking-widest uppercase hover:text-white transition-colors drop-shadow-md font-display"
            >
                {isLogin ? "Need an account? Register" : "Have an account? Login"}
            </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowForgot(false)}></div>
              <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-6 relative z-10 border border-slate-700 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-display font-bold text-white uppercase italic">Reset Password</h3>
                      <button onClick={() => setShowForgot(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Enter your email address to receive a password reset link.</p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                      <input 
                        type="email" 
                        placeholder="ENTER EMAIL"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 font-display"
                        required
                      />
                      <button 
                        type="submit"
                        disabled={resetLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl uppercase tracking-wide transition-colors flex justify-center font-display"
                      >
                          {resetLoading ? <Loader className="animate-spin" size={18}/> : "Send Link"}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Auth;