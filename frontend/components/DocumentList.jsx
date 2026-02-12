import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  Trash2, 
  ExternalLink,
  Plus,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

const DocumentList = ({ documents, setDocuments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || doc.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    /* Removed max-w to ensure it is flush with your sidebar and topbar */
    <div className="w-full min-h-screen bg-[#F1EFEC] animate-page-smooth font-inter">
      <div className="p-8 md:p-12 space-y-10">
        
        {/* Header Section - Navy Theme */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-[#123458] tracking-tight font-serif mb-2">Document Vault</h1>
            <p className="text-[#D4C9BE] font-bold uppercase text-[10px] tracking-[0.2em]">Manage, search and organize your encrypted documents.</p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-[#123458] text-[#F1EFEC] px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all">
            <Plus size={18} strokeWidth={3} />
            Upload Document
          </button>
        </div>

        {/* Filters & Search - Tactile Style */}
        <div className="bg-[#D4C9BE]/10 border-2 border-[#D4C9BE] rounded-3xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-inner">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4C9BE]" size={18} />
            <input 
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F1EFEC] border border-[#D4C9BE] rounded-xl py-2.5 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-[#123458]/5 focus:border-[#123458] transition-all font-semibold text-[#123458] placeholder-[#D4C9BE]"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 md:w-40 bg-[#F1EFEC] border border-[#D4C9BE] rounded-xl py-2.5 px-4 font-bold text-xs text-[#123458] focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Legal">Legal</option>
              <option value="Finance">Finance</option>
              <option value="Medical">Medical</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
        </div>

        {/* Document Table - Redesigned with Navy/Bone Contrast */}
        <div className="bg-[#123458] rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#D4C9BE]/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-[#D4C9BE]">
                  <th className="px-8 py-6">Document Name</th>
                  <th className="px-6 py-6">Category</th>
                  <th className="px-6 py-6">Size</th>
                  <th className="px-6 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#F1EFEC]/10 rounded-xl flex items-center justify-center text-[#F1EFEC]">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#F1EFEC]">{doc.name}</p>
                          <p className="text-[10px] text-[#D4C9BE] font-bold uppercase">Uploaded {doc.date || '2024-03-12'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-[#F1EFEC]/5 border border-[#D4C9BE]/30 rounded-lg text-[9px] font-black text-[#D4C9BE] uppercase tracking-widest">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-[#D4C9BE]">{doc.size}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'SAFE' ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`}></div>
                        <span className={`text-[10px] font-black tracking-widest ${doc.status === 'SAFE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {doc.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-[#D4C9BE] hover:text-[#F1EFEC] transition-colors"><ExternalLink size={16} /></button>
                        <button className="p-2 text-[#D4C9BE] hover:text-[#F1EFEC] transition-colors"><Download size={16} /></button>
                        <button className="p-2 text-[#D4C9BE] hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          <div className="bg-[#123458] p-8 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldCheck size={100} />
            </div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-xl font-black text-[#F1EFEC] font-serif">End-to-End Privacy</h4>
              <p className="text-sm text-[#D4C9BE] leading-relaxed max-w-sm">All documents are encrypted client-side using AES-256 before upload.</p>
            </div>
          </div>
          <div className="bg-[#F1EFEC] border-2 border-[#D4C9BE] p-8 rounded-[2rem] shadow-inner flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-black text-[#123458] font-serif">Vault Storage</h4>
              <span className="px-2 py-0.5 bg-[#123458]/10 text-[#123458] rounded-md text-[9px] font-black uppercase tracking-widest border border-[#123458]/20">42% Used</span>
            </div>
            <div className="space-y-4">
              <div className="h-2 w-full bg-[#D4C9BE]/30 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-[#123458] rounded-full w-[42%]"></div>
              </div>
              <p className="text-[10px] text-[#D4C9BE] font-black uppercase tracking-widest">Using 4.2GB of 10GB secure cloud storage.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentList;