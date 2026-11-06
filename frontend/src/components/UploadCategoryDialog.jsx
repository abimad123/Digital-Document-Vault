import React from 'react';
import { X } from 'lucide-react';

const categories = ['Academic', 'Finance', 'Personal', 'Other'];

export default function UploadCategoryDialog({ queue, onChange, onCancel, onUpload }) {
  if (!queue) return null;
  return <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#123458]/55 p-4" onClick={onCancel}>
    <div role="dialog" aria-modal="true" aria-labelledby="upload-category-title" onClick={event => event.stopPropagation()} className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="upload-category-title" className="font-serif text-2xl font-bold text-[#123458]">Upload files</h2><p className="mt-1 text-sm text-[#52677C]">Review the suggested categories. You can change them before uploading.</p></div>
        <button onClick={onCancel} aria-label="Cancel upload" className="rounded-lg p-2 text-[#123458] hover:bg-[#F1F5F8]"><X size={20} /></button>
      </div>
      <div className="mt-5 overflow-y-auto">
        {queue.length > 1 && <div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-[#123458]">Apply to all</span><select aria-label="Apply category to all files" defaultValue="" onChange={event => onChange(queue.map(item => ({ ...item, category: event.target.value, userEdited: true })))} className="min-h-10 rounded-lg border border-[#CAD7E0] bg-white px-3 text-sm text-[#123458]"><option value="">Choose category</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></div>}
        {queue.map((item, index) => <div key={item.id} className="flex flex-wrap items-center gap-2 border-t border-[#E8EDF1] py-3">
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#123458]" title={item.file.name}>{item.file.name}</span><span className="text-xs text-[#60758A]">{item.suggestion ? `${item.source === 'model' ? 'Model' : 'Filename'} suggestion: ${item.suggestion}` : 'No clear suggestion yet'}</span></span>
          <select aria-label={`Category for ${item.file.name}`} value={item.category} onChange={event => onChange(queue.map((entry, position) => position === index ? { ...entry, category: event.target.value, userEdited: true } : entry))} className="min-h-10 rounded-lg border border-[#CAD7E0] bg-white px-3 text-sm text-[#123458]"><option value="">No category</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
        </div>)}
      </div>
      <div className="mt-5 flex justify-end gap-2"><button onClick={onCancel} className="min-h-11 rounded-xl border border-[#CAD7E0] px-4 text-sm font-semibold text-[#123458]">Cancel</button><button onClick={onUpload} className="min-h-11 rounded-xl bg-[#123458] px-5 text-sm font-semibold text-white">Upload {queue.length} {queue.length === 1 ? 'file' : 'files'}</button></div>
    </div>
  </div>;
}
