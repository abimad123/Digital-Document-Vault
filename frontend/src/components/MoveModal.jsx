import React, { useState } from 'react';
import { Folder, X, Search } from 'lucide-react';

const MoveModal = ({ isOpen, onClose, folders, onConfirm, fileName }) => {
  const [query, setQuery] = useState('');
  if (!isOpen) return null;

  const visibleFolders = folders.filter(folder => folder.fileName.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#123458]/40 backdrop-blur-sm">
      <div className="bg-[#F1EFEC] w-full max-w-sm rounded-[2.5rem] border border-[#D4C9BE] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black text-[#123458] font-serif">Move to folder</h3>
            <p className="text-xs font-bold text-[#123458]/60 mt-1 truncate max-w-64">{fileName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#D4C9BE]/20 rounded-full text-[#123458]"><X size={20}/></button>
        </div>

        <label className="mb-4 flex items-center gap-2 rounded-xl border border-[#D4C9BE] bg-white px-3 text-[#123458]/50"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a folder" className="w-full bg-transparent py-3 text-sm text-[#123458] outline-none" /></label>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {visibleFolders.map((folder) => (
            <button
              key={folder._id}
              onClick={() => onConfirm(folder._id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[#D4C9BE] hover:border-[#123458] hover:bg-white transition-all group"
            >
              <Folder size={20} className="text-[#D4C9BE] group-hover:text-[#123458]" />
              <span className="font-bold text-[#123458] text-sm">{folder.fileName}</span>
            </button>
          ))}
          {visibleFolders.length === 0 && <p className="py-6 text-center text-sm text-[#123458]/50">No folders found</p>}
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
