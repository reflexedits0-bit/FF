import React from 'react';
import { Crown, ChevronLeft } from 'lucide-react';

interface VipProps {
  onBack: () => void;
}

const Vip: React.FC<VipProps> = ({ onBack }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-50 bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition border border-white/10"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Background Radiance */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/40 via-black to-black"></div>
      
      {/* 3D Container */}
      <div className="relative z-10 perspective-1000">
        <div className="relative w-64 h-80 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-3xl p-1 shadow-[0_0_100px_rgba(234,179,8,0.5)] animate-[float_3s_ease-in-out_infinite]">
            
            {/* Inner Card */}
            <div className="w-full h-full bg-black rounded-[20px] relative overflow-hidden flex flex-col items-center justify-center border-2 border-yellow-500/50">
                
                {/* Shaking Element */}
                <div className="animate-[shake_2.5s_ease-in-out_infinite_700ms]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-50 animate-pulse"></div>
                        <Crown size={80} className="text-yellow-400 fill-yellow-400 relative z-10 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]" />
                    </div>
                </div>

                <h1 className="text-5xl font-display font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 mt-6 tracking-wider">
                    VIP
                </h1>
                <p className="text-yellow-100/50 text-[10px] font-bold tracking-[0.3em] uppercase mt-2">
                    Access Denied
                </p>
            </div>

            {/* Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent rounded-3xl pointer-events-none mix-blend-overlay"></div>
        </div>
      </div>

      <div className="relative z-10 mt-12 text-center">
         <h2 className="text-3xl font-display font-bold text-white italic tracking-wide animate-pulse">COMING SOON</h2>
         <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">The Elite Pass is under construction</p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50% { transform: translateY(-20px) rotateX(5deg); }
        }
        @keyframes shake {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default Vip;