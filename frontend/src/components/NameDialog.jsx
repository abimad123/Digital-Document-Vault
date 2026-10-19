import React, { useEffect, useState } from 'react';
import { FolderPlus, Pencil, X } from 'lucide-react';

const NameDialog = ({ dialog, onClose, onSubmit, busy }) => {
  const [value, setValue] = useState(dialog?.initialValue || '');

  useEffect(() => { setValue(dialog?.initialValue || ''); }, [dialog]);
  useEffect(() => {
    if (!dialog) return undefined;
    const onKeyDown = event => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog, busy, onClose]);

  if (!dialog) return null;
  const name = value.trim();
  const maxLength = dialog.mode === 'create' ? 120 : 255;
  const valid = name.length > 0 && name.length <= maxLength && name !== dialog.initialValue;

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071D32]/60 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby="name-dialog-title" className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2F6] text-[#123458]">{dialog.mode === 'create' ? <FolderPlus size={21} /> : <Pencil size={21} />}</span><button onClick={onClose} disabled={busy} aria-label="Close dialog" className="rounded-lg p-2 text-[#60758A] hover:bg-[#F1F5F8] disabled:opacity-50"><X size={19} /></button></div>
      <h2 id="name-dialog-title" className="mt-5 font-serif text-2xl font-bold text-[#123458]">{dialog.title}</h2>
      <p className="mt-1 text-sm text-[#60758A]">{dialog.mode === 'create' ? 'Give your folder a name you can find later.' : 'Choose a clear name for this item.'}</p>
      <form onSubmit={event => { event.preventDefault(); if (valid && !busy) onSubmit(name); }} className="mt-6">
        <label htmlFor="item-name" className="mb-2 block text-sm font-semibold text-[#123458]">{dialog.label}</label>
        <input id="item-name" autoFocus maxLength={maxLength} value={value} onChange={event => setValue(event.target.value)} className="w-full rounded-xl border border-[#D6E0E8] px-4 py-3 text-sm text-[#123458] outline-none focus:border-[#2D7797] focus:ring-4 focus:ring-[#2D7797]/10" />
        <p className="mt-2 text-xs text-[#60758A]">{value.length}/{maxLength} characters</p>
        <div className="mt-7 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-[#D8E1E8] px-4 py-2.5 text-sm font-semibold text-[#52677C] hover:bg-[#F7F9FB] disabled:opacity-50">Cancel</button><button type="submit" disabled={!valid || busy} className="rounded-xl bg-[#123458] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1A4A70] disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Saving...' : dialog.mode === 'create' ? 'Create folder' : 'Save name'}</button></div>
      </form>
    </div>
  </div>;
};

export default NameDialog;
