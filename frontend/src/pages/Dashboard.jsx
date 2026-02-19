import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  Plus, CloudUpload, FolderPlus, File, 
  Folder, RefreshCw, Trash2, Move, ExternalLink, ChevronLeft, ChevronDown, Check, ArrowDownUp
} from 'lucide-react';

import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast'; 
import MoveModal from '../components/MoveModal';
import Profile from '../pages/ProfilePage';        
import ActivityLog from './ActivityLog';
import { API_BASE_URL } from '../config'; 

const Dashboard = ({ onLogout }) => {
  const [vaultFiles, setVaultFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ by: 'name', direction: 'asc', folders: 'top' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [currentUser, setCurrentUser] = useState({ 
    name: 'Loading...', 
    tier: 'Free',
    avatar: null 
  });

  const fileInputRef = useRef(null);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [moveData, setMoveData] = useState({ isOpen: false, fileId: null, fileName: '' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  const fetchVaultContent = async () => {
    setLoading(true);
    const token = localStorage.getItem('vaultToken');
    try {
      const filesRes = await fetch(`${API_BASE_URL}/api/files/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const filesData = await filesRes.json();
      if (filesData.success) setVaultFiles(filesData.files);

      const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (userData.success) setCurrentUser(userData.user);

    } catch (err) {
      console.error("Vault Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVaultContent(); }, []);

  const handleDelete = async (fileId) => {
    if (!window.confirm("Purge this item from the sanctum?")) return;
    
    const token = localStorage.getItem('vaultToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setVaultFiles(prev => prev.filter(f => f._id !== fileId));
        triggerToast("Item purged successfully.", "success");
      }
    } catch (err) {
      triggerToast("Purge failed.", "error");
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (!folderName) return;

    const token = localStorage.getItem('vaultToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/create-folder`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ fileName: folderName, parentId: currentFolderId })
      });
      const data = await response.json();
      if (data.success) setVaultFiles(prev => [data.folder, ...prev]);
    } catch (err) {
      triggerToast("Folder creation failed.", "error");
    }
    setIsAddMenuOpen(false);
  };

  const onUpload = async (fileObject) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', fileObject);
    formData.append('parentId', currentFolderId);

    const token = localStorage.getItem('vaultToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (data.success) setVaultFiles(prev => [data.file, ...prev]);
    } catch (err) {
      triggerToast("Upload failed.", "error");
    } finally {
      setLoading(false);
    }
    setIsAddMenuOpen(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  const handleMoveInit = (fileId, fileName) => {
    const folders = vaultFiles.filter(f => f.isFolder && f._id !== fileId);
    if (folders.length === 0) return triggerToast("No target folders available", "error");
    setMoveData({ isOpen: true, fileId, fileName });
  };

  const handleMoveConfirm = async (targetFolderId) => {
    const { fileId } = moveData;
    const token = localStorage.getItem('vaultToken');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/move/${fileId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ targetFolderId })
      });

      if (response.ok) {
        setVaultFiles(prev => prev.map(f => 
          f._id === fileId ? { ...f, parentId: targetFolderId } : f
        ));
        triggerToast("File relocated successfully", "success");
      }
    } catch (err) {
      triggerToast("Relocation failed", "error");
    } finally {
      setMoveData({ isOpen: false, fileId: null, fileName: '' });
    }
  };

  const DocumentsView = () => {
    let displayedItems = vaultFiles.filter(f => f.parentId === currentFolderId);

    displayedItems.sort((a, b) => {
      let valA, valB;
      if (sortConfig.by === 'name') {
        valA = (a.fileName || '').toLowerCase();
        valB = (b.fileName || '').toLowerCase();
      } else {
        valA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        valB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    if (sortConfig.folders === 'top') {
      const folders = displayedItems.filter(f => f.isFolder);
      const files = displayedItems.filter(f => !f.isFolder);
      displayedItems = [...folders, ...files];
    }

    return (
      <div className="flex-1 flex overflow-hidden">
        <main 
          onDragOver={(e) => e.preventDefault()} 
          onDrop={handleDrop}
          className="flex-1 flex flex-col p-8 relative bg-[#F1EFEC] min-w-0 overflow-y-auto"
        >
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 text-[#123458]">
              <button onClick={() => setCurrentFolderId('root')} className="font-black text-xs uppercase tracking-widest hover:underline">Root</button>
              {currentFolderId !== 'root' && (
                <>
                  <ChevronLeft size={14} />
                  <span className="font-bold text-xs opacity-50">Inside Folder</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => { setIsSortMenuOpen(!isSortMenuOpen); setIsAddMenuOpen(false); }} 
                  className="px-4 py-2.5 bg-white border border-[#D4C9BE] text-[#123458] rounded-xl font-bold flex items-center gap-2 hover:bg-[#D4C9BE]/20 transition-all shadow-sm"
                >
                  <ArrowDownUp size={16} /> Sort <ChevronDown size={14} />
                </button>
                
                {isSortMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-xl rounded-xl border border-[#D4C9BE]/50 z-50 py-2 text-sm text-[#123458] animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-1 text-[10px] font-black opacity-50 uppercase tracking-wider">Sort by</div>
                    <button onClick={() => setSortConfig({...sortConfig, by: 'name'})} className="w-full text-left px-4 py-2 hover:bg-[#F1EFEC] flex items-center justify-between font-medium">
                      Name {sortConfig.by === 'name' && <Check size={16} />}
                    </button>
                    <button onClick={() => setSortConfig({...sortConfig, by: 'date'})} className="w-full text-left px-4 py-2 hover:bg-[#F1EFEC] flex items-center justify-between font-medium">
                      Date modified {sortConfig.by === 'date' && <Check size={16} />}
                    </button>
                    
                    <div className="h-px bg-[#D4C9BE]/30 my-1"></div>
                    
                    <div className="px-4 py-1 text-[10px] font-black opacity-50 uppercase tracking-wider">Sort direction</div>
                    <button onClick={() => setSortConfig({...sortConfig, direction: 'asc'})} className="w-full text-left px-4 py-2 hover:bg-[#F1EFEC] flex items-center justify-between font-medium">
                      {sortConfig.by === 'name' ? 'A to Z' : 'Oldest first'} {sortConfig.direction === 'asc' && <Check size={16} />}
                    </button>
                    <button onClick={() => setSortConfig({...sortConfig, direction: 'desc'})} className="w-full text-left px-4 py-2 hover:bg-[#F1EFEC] flex items-center justify-between font-medium">
                      {sortConfig.by === 'name' ? 'Z to A' : 'Newest first'} {sortConfig.direction === 'desc' && <Check size={16} />}
                    </button>

                    <div className="h-px bg-[#D4C9BE]/30 my-1"></div>
                    
                    <div className="px-4 py-1 text-[10px] font-black opacity-50 uppercase tracking-wider">Folders</div>
                    <button onClick={() => setSortConfig({...sortConfig, folders: 'top'})} className="w-full text-left px-4 py-2 hover:bg-[#F1EFEC] flex items-center justify-between font-medium">
                      On top {sortConfig.folders === 'top' && <Check size={16} />}
                    </button>
                    <button onClick={() => setSortConfig({...sortConfig, folders: 'mixed'})} className="w-full text-left px-4 py-2 hover:bg-[#F1EFEC] flex items-center justify-between font-medium">
                      Mixed with files {sortConfig.folders === 'mixed' && <Check size={16} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Add Item Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => { setIsAddMenuOpen(!isAddMenuOpen); setIsSortMenuOpen(false); }} 
                  className="bg-[#123458] text-[#F1EFEC] px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all"
                >
                  <Plus size={20} /> Add Item
                </button>
                
                {isAddMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl rounded-xl border border-[#D4C9BE]/50 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <button onClick={handleCreateFolder} className="w-full text-left px-4 py-2 hover:bg-[#F1EFEC] rounded-lg flex items-center gap-2 text-sm font-bold text-[#123458]">
                      <FolderPlus size={16}/> New Folder
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-2 hover:bg-[#F1EFEC] rounded-lg flex items-center gap-2 text-sm font-bold text-[#123458]">
                      <CloudUpload size={16}/> Upload File
                    </button>
                    <input type="file" ref={fileInputRef} onChange={(e) => onUpload(e.target.files[0])} className="hidden" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center"><RefreshCw className="animate-spin text-[#123458]" size={48} /></div>
          ) : displayedItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <CloudUpload size={64} className="text-[#D4C9BE]" />
              <h2 className="text-xl font-bold text-[#123458]">This directory is empty.</h2>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {displayedItems.map((file) => (
                <div key={file._id} className="group flex flex-col items-center gap-2">
                  <div 
                    onClick={() => file.isFolder && setCurrentFolderId(file._id)}
                    className={`w-full aspect-square rounded-[2rem] border-2 flex items-center justify-center transition-all relative overflow-hidden cursor-pointer ${file.isFolder ? 'bg-[#123458]/5 border-[#123458]' : 'bg-white border-[#D4C9BE]'}`}
                  >
                    {file.isFolder ? <Folder size={48} fill="#123458" /> : file.fileType?.includes('image') ? <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" /> : <File size={40} />}
                    
                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-[#123458]/90 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-300 backdrop-blur-sm">
                      {!file.isFolder ? (
                        <>
                          <button onClick={(e) => {e.stopPropagation(); window.open(file.fileUrl, '_blank')}} className="p-2 bg-white rounded-xl text-[#123458] hover:scale-110"><ExternalLink size={16}/></button>
                          <button onClick={(e) => {e.stopPropagation(); handleMoveInit(file._id, file.fileName)}} className="p-2 bg-white rounded-xl text-[#123458] hover:scale-110"><Move size={16}/></button>
                          <button onClick={(e) => {e.stopPropagation(); handleDelete(file._id)}} className="p-2 bg-rose-500 text-white rounded-xl hover:scale-110 shadow-lg"><Trash2 size={16}/></button>
                        </>
                      ) : (
                        <button onClick={(e) => {e.stopPropagation(); handleDelete(file._id)}} className="p-2 bg-rose-500 text-white rounded-xl hover:scale-110 shadow-lg"><Trash2 size={16}/></button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-bold truncate w-full text-center text-[#123458]">{file.fileName}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex bg-[#F1EFEC] overflow-hidden relative font-inter">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onLogout={onLogout} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        
        <Topbar user={currentUser} />
        
        <Routes>
          <Route index element={<Navigate to="documents" replace />} />
          <Route path="documents" element={<DocumentsView />} />
          <Route path="profile" element={<Profile />} />
          <Route path="activity" element={<ActivityLog />} />
          <Route path="settings" element={
            <div className="flex-1 flex items-center justify-center text-[#123458] font-bold text-xl opacity-50">
              Settings Configuration: Coming Soon
            </div>
          } />
        </Routes>
      </div>

      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, show: false }))} 
        />
      )}

      <MoveModal 
        isOpen={moveData.isOpen}
        fileName={moveData.fileName}
        folders={vaultFiles.filter(f => f.isFolder && f._id !== moveData.fileId)}
        onClose={() => setMoveData({ isOpen: false, fileId: null, fileName: '' })}
        onConfirm={handleMoveConfirm}
      />
    </div>
  );
};

export default Dashboard;