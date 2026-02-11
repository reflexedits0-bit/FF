import React from 'react';
import { Rocket } from 'lucide-react';

const Store: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      {/* Banner */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 opacity-10">
               <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 3.135L3.385 1.52A1.996 1.996 0 002 3v18c0 .55.22 1.05.585 1.415L3.385 21.615l.815-.815L15.385 9.615 5 3.135zM16.538 10.385l4.308 2.307c.769.462 1.154 1.308 1.154 2.308s-.385 1.846-1.154 2.308l-4.308 2.307-5.538-5.538 5.538-3.692zM15.385 19.615l-1.923-1.923L5 21.307l10.385-1.692zM4.192 10.77l5.538 3.692L5 3.135l-.808 7.635z"/>
               </svg>
          </div>
          
          <div className="relative z-10">
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Instant Delivery</div>
              <h2 className="text-2xl font-display font-bold italic leading-none mb-3">GOOGLE PLAY <br/> GIFT CARDS</h2>
              <p className="text-xs text-blue-100 max-w-[80%] leading-relaxed">Use your wallet balance to purchase official redeem codes.</p>
          </div>
      </div>

      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Available Cards</div>

      {/* Empty State */}
      <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl h-80 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-6 relative">
             <div className="absolute inset-0 border-4 border-t-blue-500 border-gray-100 dark:border-slate-700 rounded-full animate-spin"></div>
             <Rocket className="text-gray-400 dark:text-gray-500" size={28} />
          </div>
          <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white tracking-wide mb-2">COMING SOON</h3>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 max-w-[200px] text-center uppercase leading-relaxed">
             We are restocking our digital inventory. Check back later.
          </p>
      </div>
    </div>
  );
};

export default Store;