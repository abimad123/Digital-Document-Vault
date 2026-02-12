import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  Cloud, Plus, CloudUpload, Star, Info, FolderPlus, File, 
  Folder, CheckCircle, AlertCircle, MoreVertical, X, RefreshCw, ChevronRight
} from 'lucide-react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import ProfilePage from './ProfilePage';
import DocumentList from './DocumentList';

const Dashboard = ({ 
  documents, 
  setDocuments, 
  activities, 
  user, 
  isDarkMode, 
  toggleTheme,
  vaultFiles,
  setVaultFiles,
  onLogout 
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleCreateFolder = () => {
    const name = prompt('Enter folder name:');
    if (name?.trim()) {
      const newFolder = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        type: 'folder',
        createdAt: new Date().toLocaleDateString(),
        children: []
      };
      setVaultFiles(prev => [...prev, newFolder]);
      showToast('Folder created successfully', 'success');
    }
    setIsAddMenuOpen(false);
  };

  const handleFileUpload = () => {
    const newFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Document_${Math.floor(Math.random() * 1000)}.pdf`,
      type: 'file',
      size: `${(Math.random() * 5).toFixed(1)} MB`,
      createdAt: new Date().toLocaleDateString()
    };
    setVaultFiles(prev => [...prev, newFile]);
    showToast('File uploaded successfully', 'success');
    setIsAddMenuOpen(false);
  };

  // Main File Explorer Component
  const FileBrowser = () => {
    const itemsToShow = currentFolderId ? [] : vaultFiles; 
    const isEmpty = itemsToShow.length === 0;

    return (
      // REMOVED overflow-y-auto from here so the parent handles it
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative bg-[#F1EFEC] min-w-0">
        {isEmpty ? (
          <div className="max-w-md text-center space-y-6 group">
            <div className="w-32 h-32 bg-[#D4C9BE]/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-[#D4C9BE] group-hover:border-[#123458] transition-all shadow-inner">
              <CloudUpload size={48} className="text-[#D4C9BE] group-hover:text-[#123458]" />
            </div>
            <h2 className="text-2xl font-black text-[#123458] font-serif">Your vault is clear.</h2>
            <p className="text-[#123458]/60 font-medium">Drag and drop encrypted files here.</p>
          </div>
        ) : (
          <div className="w-full h-full p-4 md:p-8 animate-content-smooth">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
              {itemsToShow.map((file) => (
                <div key={file.id} className="flex flex-col items-center gap-3 group cursor-pointer">
                  <div className="w-full aspect-square bg-[#F1EFEC] rounded-[2.5rem] border-2 border-[#D4C9BE] flex items-center justify-center group-hover:bg-[#D4C9BE]/30 group-hover:border-[#123458] transition-all shadow-inner relative">
                    {file.type === 'folder' ? <Folder size={48} className="text-[#123458]" /> : <File size={48} className="text-[#123458]/40" />}
                    <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[#123458] hover:bg-[#F1EFEC] rounded-full transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-[#123458] truncate w-full text-center px-2">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Floating Widgets */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-20">
          <button onClick={() => window.location.reload()} className="w-12 h-12 bg-[#F1EFEC] border border-[#D4C9BE] rounded-2xl flex items-center justify-center text-[#123458] hover:bg-[#D4C9BE] shadow-xl transition-all active:scale-95">
            <RefreshCw size={20} />
          </button>
          <div className="bg-[#123458] border border-[#D4C9BE]/20 rounded-2xl p-4 shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="w-10 h-10 bg-[#F1EFEC]/10 rounded-xl flex items-center justify-center text-[#F1EFEC]"><Star size={20} /></div>
            <div className="text-left pr-2 hidden sm:block">
              <p className="text-[10px] font-black uppercase text-[#D4C9BE]/60 leading-none mb-1">Status</p>
              <p className="text-sm font-bold text-[#F1EFEC]">Active Encryption</p>
            </div>
          </div>
        </div>
      </main>
    );
  };

  return (
    <div className="h-screen w-full flex bg-[#F1EFEC] text-[#030303] font-inter overflow-hidden relative transition-colors duration-300">
      
      <Sidebar 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onLogout={onLogout}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Topbar user={user} />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Internal Left Navigation/Action Sidebar */}
          <aside className="w-64 bg-white border-r border-[#D4C9BE]/20 p-6 flex flex-col gap-10 flex-shrink-0 hidden md:flex z-10">
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                className="w-full bg-[#123458] hover:bg-[#030303] text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
              >
                <Plus size={20} strokeWidth={3} /> Add
              </button>

              {isAddMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-full bg-[#F1EFEC] border border-[#D4C9BE] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <button onClick={handleCreateFolder} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-[#123458] hover:bg-[#D4C9BE]/30 transition-all">
                    <FolderPlus size={18} /> New Folder
                  </button>
                  <button onClick={handleFileUpload} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-[#123458] hover:bg-[#D4C9BE]/30 transition-all">
                    <File size={18} /> File Upload
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#D4C9BE]/10 rounded-2xl border border-[#D4C9BE]/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#123458]/40 mb-3">System Node</p>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-[#123458]">US-PACIFIC-1 ACTIVE</span>
              </div>
            </div>
          </aside>

          {/* MAIN DYNAMIC CONTENT AREA - UPDATED TO overflow-y-auto */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F1EFEC] scroll-smooth">
            <Routes>
              <Route index element={<FileBrowser />} />
              <Route path="documents" element={<DocumentList documents={documents} setDocuments={setDocuments} />} />
              <Route path="profile" element={<ProfilePage user={user} />} />
              <Route path="activity" element={
                <div className="p-12 text-center h-[200vh]"> {/* Extended height for testing scroll */}
                  <h2 className="text-2xl font-black text-[#123458] font-serif mb-4">Activity Log</h2>
                  <p className="text-[#D4C9BE] font-bold uppercase tracking-widest">Protocol Audit in Progress</p>
                </div>
              } />
              <Route path="settings" element={
                <div className="p-12 text-center h-[200vh]">
                  <h2 className="text-2xl font-black text-[#123458] font-serif mb-4">System Settings</h2>
                  <p className="text-[#D4C9BE] font-bold uppercase tracking-widest">Configuration Node Offline</p>
                </div>
              } />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>

          {/* Summary Sidebar - Right */}
          <aside className="w-80 border-l border-[#D4C9BE] hidden xl:flex flex-col p-8 gap-10 flex-shrink-0 bg-[#F1EFEC] z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <div className="w-24 h-24 bg-[#D4C9BE]/20 rounded-3xl flex items-center justify-center mx-auto border border-[#D4C9BE] shadow-inner">
                  <Cloud size={40} className="text-[#123458]/40" />
                </div>
                <h3 className="text-xl font-black text-[#123458] font-serif">Storage Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left pt-4 border-t border-[#D4C9BE]/50">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#D4C9BE] tracking-tight">Status</p>
                  <p className="text-sm font-bold text-[#123458]">Protected</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-[#D4C9BE] tracking-tight">Vault Items</p>
                  <p className="text-sm font-bold text-[#123458]">{vaultFiles.length}</p>
                </div>
              </div>
              <div className="p-4 bg-[#123458] rounded-2xl flex items-center gap-4 shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-[#F1EFEC]/10 flex items-center justify-center text-[#F1EFEC]"><Info size={16} /></div>
                <p className="text-[10px] font-bold text-[#F1EFEC] leading-tight">Encryption keys are cycled every 24 hours.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;