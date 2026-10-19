import React, { useEffect, useState } from 'react';
import { Folder, Search, X } from 'lucide-react';

const MoveModal = ({ isOpen, onClose, folders, onConfirm, fileName, busy = false }) => {
  const [query, setQuery] = useState('');

  useEffect(() => { if (!isOpen) setQuery(''); }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = event => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, busy]);

  if (!isOpen) return null;
  const visibleFolders = folders.filter(folder => folder.fileName.toLowerCase().includes(query.trim().toLowerCase()));

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071D32]/60 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="move-dialog-title" aria-busy={busy} className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2F6] text-[#123458]"><Folder size={21} /></span><button onClick={onClose} disabled={busy} aria-label="Close move dialog" className="rounded-lg p-2 text-[#60758A] hover:bg-[#F1F5F8] disabled:opacity-50"><X size={19} /></button></div>
      <h2 id="move-dialog-title" className="mt-5 font-serif text-2xl font-bold text-[#123458]">Move to folder</h2>
      <p className="mt-1 truncate text-sm text-[#60758A]" title={fileName}>Choose a destination for {fileName}.</p>
      <label className="mt-6 flex items-center gap-2 rounded-xl border border-[#D6E0E8] bg-[#FBFCFD] px-3 text-[#60758A]"><Search size={17} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} aria-label="Find a folder" placeholder="Find a folder" className="w-full bg-transparent py-3 text-sm text-[#123458] outline-none placeholder:text-[#60758A]" /></label>
      <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
        {visibleFolders.map(folder => <button key={folder._id} onClick={() => onConfirm(folder._id)} disabled={busy} className="flex w-full items-center gap-3 rounded-xl border border-[#E0E7ED] px-4 py-3 text-left text-sm font-semibold text-[#123458] transition hover:border-[#89AFC1] hover:bg-[#F4F8FA] disabled:cursor-not-allowed disabled:opacity-50"><Folder size={18} className="shrink-0 text-[#D8891B]" /><span className="truncate">{folder.fileName}</span></button>)}
        {!visibleFolders.length && <p className="rounded-xl bg-[#F7F9FB] px-4 py-6 text-center text-sm text-[#60758A]">No folders found.</p>}
      </div>
    </div>
  </div>;
};

export default MoveModal;
