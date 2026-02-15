import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  Plus, CloudUpload, Star, Info, FolderPlus, File, 
  Folder, RefreshCw, Trash2, Move, ExternalLink, ChevronLeft
} from 'lucide-react';

// --- IMPORTS ---
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import Toast from './Toast'; 
import MoveModal from './MoveModal';

const Dashboard = ({ user, onLogout }) => {
  const [vaultFiles, setVaultFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // --- UI STATES ---
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [moveData, setMoveData] = useState({ isOpen: false, fileId: null, fileName: '' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  // --- 1. DATA FETCHING ---
  const fetchVaultContent = async () => {
    setLoading(true);
    const token = localStorage.getItem('vaultToken');
    try {
      const response = await fetch('http://localhost:5000/api/files/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setVaultFiles(data.files);
    } catch (err) {
      console.error("Vault Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVaultContent(); }, []);

  // --- 2. DELETE LOGIC ---
  const handleDelete = async (fileId) => {
    if (!window.confirm("Purge this item from the sanctum?")) return;
    
    const token = localStorage.getItem('vaultToken');
    try {
      const response = await fetch(`http://localhost:5000/api/files/${fileId}`, {
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

  // --- 3. FOLDER CREATION ---
  const handleCreateFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (!folderName) return;

    const token = localStorage.getItem('vaultToken');
    try {
      const response = await fetch('http://localhost:5000/api/files/create-folder', {
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

  // --- 4. UPLOAD LOGIC ---
  const onUpload = async (fileObject) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', fileObject);
    formData.append('parentId', currentFolderId);

    const token = localStorage.getItem('vaultToken');
    try {
      const response = await fetch('http://localhost:5000/api/files/upload', {
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
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  // --- 5. MOVE LOGIC ---
  const handleMoveInit = (fileId, fileName) => {
    const folders = vaultFiles.filter(f => f.isFolder && f._id !== fileId);
    if (folders.length === 0) return triggerToast("No target folders available", "error");
    setMoveData({ isOpen: true, fileId, fileName });
  };

  const handleMoveConfirm = async (targetFolderId) => {
    const { fileId } = moveData;
    const token = localStorage.getItem('vaultToken');
    
    try {
      const response = await fetch(`http://localhost:5000/api/files/move/${fileId}`, {
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

  // --- 6. FILE BROWSER COMPONENT ---
  const FileBrowser = () => {
    const displayedItems = vaultFiles.filter(f => f.parentId === currentFolderId);

    return (
      <main 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={handleDrop}
        className="flex-1 flex flex-col p-8 relative bg-[#F1EFEC] min-w-0"
      >
        <div className="flex items-center gap-2 mb-8 text-[#123458]">
          <button onClick={() => setCurrentFolderId('root')} className="font-black text-xs uppercase tracking-widest hover:underline">Root</button>
          {currentFolderId !== 'root' && (
            <>
              <ChevronLeft size={14} />
              <span className="font-bold text-xs opacity-50">Inside Folder</span>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><RefreshCw className="animate-spin" size={48} /></div>
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
                  {file.isFolder ? <Folder size={48} fill="#123458" /> : file.fileType?.includes('image') ? <img src={file.fileUrl} className="w-full h-full object-cover" /> : <File size={40} />}
                  
                  {/* ACTION OVERLAY */}
                  <div className="absolute inset-0 bg-[#123458]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    {!file.isFolder ? (
                      <>
                        <button onClick={(e) => {e.stopPropagation(); window.open(file.fileUrl, '_blank')}} className="p-2.5 bg-white rounded-xl text-[#123458] hover:scale-110 transition-transform">
                          <ExternalLink size={18}/>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleMoveInit(file._id, file.fileName);
                          }} 
                          className="p-2.5 bg-white rounded-xl text-[#123458] hover:scale-110 transition-transform"
                        >
                          <Move size={18}/>
                        </button>
                        <button onClick={(e) => {e.stopPropagation(); handleDelete(file._id)}} className="p-2.5 bg-red-500 rounded-xl text-white hover:scale-110 transition-transform shadow-lg">
                          <Trash2 size={18}/>
                        </button>
                      </>
                    ) : (
                      <button onClick={(e) => {e.stopPropagation(); handleDelete(file._id)}} className="p-2.5 bg-red-500 rounded-xl text-white hover:scale-110 transition-transform shadow-lg">
                        <Trash2 size={18}/>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs font-bold truncate w-full text-center">{file.fileName}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="h-screen w-full flex bg-[#F1EFEC] overflow-hidden relative">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onLogout={onLogout} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Topbar user={user} />
        
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-64 bg-white border-r p-6 hidden md:flex flex-col gap-4">
            <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="w-full bg-[#123458] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              <Plus size={20} /> Add Item
            </button>
            {isAddMenuOpen && (
              <div className="bg-[#F1EFEC] rounded-xl p-2 border space-y-1">
                <button onClick={handleCreateFolder} className="w-full text-left px-4 py-2 hover:bg-[#D4C9BE] rounded-lg flex items-center gap-2 text-sm font-bold">
                  <FolderPlus size={16}/> New Folder
                </button>
                <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-2 hover:bg-[#D4C9BE] rounded-lg flex items-center gap-2 text-sm font-bold">
                  <CloudUpload size={16}/> Upload File
                </button>
                <input type="file" ref={fileInputRef} onChange={(e) => onUpload(e.target.files[0])} className="hidden" />
              </div>
            )}
          </aside>
          
          <FileBrowser />
        </div>
      </div>

      {/* --- CUSTOM STYLED UI COMPONENTS --- */}
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