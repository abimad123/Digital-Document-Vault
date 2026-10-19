import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  const isSuccess = type === 'success';
  
  return (
    <div role="status" className={`fixed bottom-5 left-4 right-4 z-[110] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl sm:left-auto sm:right-6 sm:max-w-md ${
      isSuccess ? 'bg-[#123458] border-[#123458] text-white' : 'bg-white border-rose-300 text-rose-800'
    }`}>
      {isSuccess ? <CheckCircle className="shrink-0 text-[#D9EECF]" size={20} /> : <AlertCircle className="shrink-0" size={20} />}
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} aria-label="Dismiss notification" className="rounded-md p-1 opacity-75 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
