import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-slide-up w-[90%] max-w-sm">
      <div className={`flex items-center space-x-3 px-4 py-4 rounded-xl shadow-2xl border-2 ${
        type === 'success' ? 'bg-slate-900 border-green-500 text-green-400' : 
        type === 'error' ? 'bg-slate-900 border-red-500 text-red-400' :
        'bg-slate-900 border-blue-500 text-blue-400'
      }`}>
        {type === 'success' && <CheckCircle size={20} className="shrink-0" />}
        {type === 'error' && <AlertCircle size={20} className="shrink-0" />}
        {type === 'info' && <AlertCircle size={20} className="shrink-0" />}
        
        {/* Force 1 line truncation */}
        <span className="text-xs font-bold uppercase tracking-wide flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {message}
        </span>
        
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X size={16} /></button>
      </div>
    </div>
  );
};

export default Toast;