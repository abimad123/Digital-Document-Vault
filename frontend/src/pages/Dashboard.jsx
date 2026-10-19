import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownAZ, ArrowRight, Check, CheckSquare, ChevronRight, CloudUpload, Download, File,
  Folder, FolderPlus, Grid2X2, HardDrive, Info, LayoutList, MoreVertical,
  Move, RefreshCw, RotateCcw, SearchX, Star, Trash2, X
} from 'lucide-react';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import MoveModal from '../components/MoveModal';
import NameDialog from '../components/NameDialog';
import Profile from './ProfilePage';
import StoragePage from './StoragePage';
import ActivityLog from './ActivityLog';
import { API_BASE_URL } from '../config';

const viewNames = { documents: 'My Drive', starred: 'Starred', recent: 'Recent', trash: 'Trash' };
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const sizeBytesFor = (file) => typeof file.sizeBytes === 'number'
  ? file.sizeBytes
  : (parseFloat(file.fileSize) || 0) * 1024 * 1024;
const formatSize = (file) => {
  if (file.isFolder) return 'Folder';
  if (typeof file.sizeBytes === 'number') {
    if (file.sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(file.sizeBytes / 1024))} KB`;
    return `${(file.sizeBytes / 1024 / 1024).toFixed(2)} MB`;
  }
  return file.fileSize || 'File';
};
const fileKind = file => file.isFolder ? 'folder' : file.fileType?.startsWith('image/') ? 'image' : 'file';
const itemType = file => file.isFolder ? 'Folder' : file.fileType?.startsWith('image/') ? 'Image' : (file.fileName?.split('.').pop() || 'File').toUpperCase();

async function request(path, method = 'GET', body) {
  const token = localStorage.getItem('vaultToken');
  const headers = { Authorization: `Bearer ${token}` };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method, headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || data.msg || `Request failed (${response.status})`);
  return data;
}

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const view = location.pathname.split('/')[2] || 'documents';
  const [files, setFiles] = useState([]);
  const [user, setUser] = useState({ name: 'User', tier: 'Personal' });
  const [accountStats, setAccountStats] = useState({ storageLimit: 1024 });
  const [folderId, setFolderId] = useState('root');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [layout, setLayout] = useState(() => localStorage.getItem('vaultLayout') || 'grid');
  const [sort, setSort] = useState('name');
  const [kindFilter, setKindFilter] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [menuId, setMenuId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [details, setDetails] = useState(null);
  const [toast, setToast] = useState(null);
  const [nameDialog, setNameDialog] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);

  const notify = (message, type = 'success') => setToast({ message, type, id: Date.now() });
  const refresh = async () => {
    const data = await request('/api/files/all');
    setFiles(data.files);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [fileData, userData] = await Promise.all([request('/api/files/all'), request('/api/auth/me')]);
        if (!mounted) return;
        setFiles(fileData.files);
        setUser(userData.user);
        setAccountStats(userData.stats || { storageLimit: 1024 });
      } catch (error) {
        if (mounted) {
          notify(error.message, 'error');
          if (/401|token|authorization/i.test(error.message)) onLogout();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setSelectedIds([]);
    setSelectMode(false);
    setMenuId(null);
    setKindFilter('all');
  }, [location.pathname, folderId]);

  const activeFiles = useMemo(() => files.filter(file => !file.trashedAt), [files]);
  const folders = useMemo(() => activeFiles.filter(file => file.isFolder), [activeFiles]);
  const folderMap = useMemo(() => new Map(folders.map(folder => [folder._id, folder])), [folders]);
  const breadcrumbs = useMemo(() => {
    const chain = [];
    const seen = new Set();
    let cursor = folderId;
    while (cursor !== 'root' && folderMap.has(cursor) && !seen.has(cursor)) {
      seen.add(cursor);
      const folder = folderMap.get(cursor);
      chain.unshift(folder);
      cursor = folder.parentId || 'root';
    }
    return chain;
  }, [folderId, folderMap]);

  const displayed = useMemo(() => {
    let items;
    if (view === 'starred') items = activeFiles.filter(file => file.isStarred);
    else if (view === 'recent') items = activeFiles.filter(file => !file.isFolder);
    else if (view === 'trash') items = files.filter(file => file.trashedAt);
    else items = activeFiles.filter(file => (file.parentId || 'root') === folderId);
    const ordered = [...items];
    ordered.sort((a, b) => {
      if (view === 'trash') return new Date(b.trashedAt) - new Date(a.trashedAt);
      if (view === 'recent' || sort === 'recent') return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'size') return sizeBytesFor(b) - sizeBytesFor(a);
      if (a.isFolder !== b.isFolder && view === 'documents') return a.isFolder ? -1 : 1;
      return a.fileName.localeCompare(b.fileName);
    });
    return ordered;
  }, [activeFiles, files, folderId, sort, view]);
  const visibleItems = useMemo(() => kindFilter === 'all' ? displayed : displayed.filter(file => fileKind(file) === kindFilter || (kindFilter === 'file' && !file.isFolder)), [displayed, kindFilter]);
  const recentFiles = useMemo(() => activeFiles.filter(file => !file.isFolder).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 4), [activeFiles]);

  const stats = {
    files: activeFiles.filter(file => !file.isFolder).length,
    folders: folders.length,
    starred: activeFiles.filter(file => file.isStarred).length,
    storage: files.reduce((sum, file) => sum + sizeBytesFor(file), 0)
  };

  const perform = async (path, method, body, successMessage) => {
    setBusy(true);
    try {
      const result = await request(path, method, body);
      await refresh();
      if (successMessage) notify(successMessage);
      return result;
    } catch (error) {
      notify(error.message, 'error');
      return null;
    } finally {
      setBusy(false);
      setMenuId(null);
    }
  };

  const createFolder = () => setNameDialog({ mode: 'create', title: 'New folder', initialValue: '', label: 'Folder name' });
  const submitName = async value => {
    if (!nameDialog) return;
    const result = nameDialog.mode === 'create'
      ? await perform('/api/files/create-folder', 'POST', { fileName: value, parentId: folderId }, 'Folder created')
      : await perform(`/api/files/rename/${nameDialog.file._id}`, 'PUT', { fileName: value }, 'Item renamed');
    if (result) setNameDialog(null);
  };

  const uploadFiles = async (fileList) => {
    const selected = [...fileList];
    if (!selected.length) return;
    setBusy(true);
    setUploadProgress({ done: 0, total: selected.length });
    let uploaded = 0;
    let processed = 0;
    let lastError = '';
    for (const file of selected) {
      const form = new FormData();
      form.append('file', file);
      form.append('parentId', folderId);
      try {
        await request('/api/files/upload', 'POST', form);
        uploaded += 1;
      } catch (error) {
        lastError = error.message;
      }
      processed += 1;
      setUploadProgress({ done: processed, total: selected.length });
    }
    try { await refresh(); } catch (error) { lastError = error.message; }
    setBusy(false);
    setUploadProgress(null);
    notify(lastError ? `${uploaded} uploaded. ${lastError}` : `${uploaded} file${uploaded === 1 ? '' : 's'} uploaded`, lastError ? 'error' : 'success');
  };

  const openItem = (file) => {
    setMenuId(null);
    if (file.isFolder) {
      setFolderId(file._id);
      navigate('/dashboard/documents');
    } else if (file.fileUrl) {
      window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const downloadItem = async (file) => {
    setMenuId(null);
    try {
      const response = await fetch(file.fileUrl);
      if (!response.ok) throw new Error('Download failed');
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
      notify('Opened the file in a new tab. Use your browser to save it.', 'error');
    }
  };

  const renameItem = file => { setMenuId(null); setNameDialog({ mode: 'rename', file, title: 'Rename item', initialValue: file.fileName, label: 'New name' }); };

  const trashItem = async (file) => {
    if (!window.confirm(`Move “${file.fileName}” to Trash?`)) return;
    const result = await perform(`/api/files/trash/${file._id}`, 'PATCH', null, 'Moved to Trash');
    if (result && file._id === folderId) setFolderId('root');
  };

  const deleteForever = async (file) => {
    if (!window.confirm(`Permanently delete “${file.fileName}”? This cannot be undone.`)) return;
    await perform(`/api/files/${file._id}`, 'DELETE', null, 'Permanently deleted');
  };

  const toggleStar = (file) => perform(`/api/files/star/${file._id}`, 'PATCH', null, file.isStarred ? 'Removed from Starred' : 'Added to Starred');
  const restoreItem = (file) => perform(`/api/files/restore/${file._id}`, 'PATCH', null, 'Item restored');

  const bulkTrash = async () => {
    if (!selectedIds.length || !window.confirm(`Move ${selectedIds.length} selected items to Trash?`)) return;
    setBusy(true);
    let failed = 0;
    for (const id of selectedIds) {
      try { await request(`/api/files/trash/${id}`, 'PATCH'); } catch { failed += 1; }
    }
    await refresh().catch(() => {});
    setBusy(false);
    setSelectedIds([]);
    setSelectMode(false);
    notify(failed ? `${failed} items could not be moved` : 'Selected items moved to Trash', failed ? 'error' : 'success');
  };

  const confirmMove = async (targetFolderId) => {
    const ids = moveItem?.bulk ? selectedIds : [moveItem?.file._id];
    if (!ids.length) return;
    setBusy(true);
    let failed = 0;
    for (const id of ids) {
      try { await request(`/api/files/move/${id}`, 'PUT', { targetFolderId }); } catch { failed += 1; }
    }
    await refresh().catch(() => {});
    setBusy(false);
    setMoveItem(null);
    setSelectedIds([]);
    setSelectMode(false);
    notify(failed ? `${failed} items could not be moved` : 'Item moved', failed ? 'error' : 'success');
  };

  const toggleSelection = (id) => setSelectedIds(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  const showMenu = (event, id) => { event.stopPropagation(); setMenuId(previous => previous === id ? null : id); };
  const selectLayout = (next) => { setLayout(next); localStorage.setItem('vaultLayout', next); };
  const dragItem = (event, id) => event.dataTransfer.setData('application/x-vault-item', id);
  const folderDragOver = (event, file) => {
    if (!file.isFolder || !event.dataTransfer.types.includes('application/x-vault-item')) return;
    event.preventDefault();
    event.stopPropagation();
    setDropTargetId(file._id);
  };
  const folderDrop = async (event, file) => {
    if (!file.isFolder) return;
    const id = event.dataTransfer.getData('application/x-vault-item');
    if (!id) return;
    event.preventDefault();
    event.stopPropagation();
    setDropTargetId(null);
    if (id !== file._id) await perform(`/api/files/move/${id}`, 'PUT', { targetFolderId: file._id }, 'Item moved');
  };

  const menu = (file) => (
    <div className="absolute right-2 top-12 z-50 w-48 rounded-xl border border-[#DCE4EA] bg-white p-1.5 text-sm text-[#123458] shadow-2xl" onClick={event => event.stopPropagation()}>
      {view === 'trash' ? <>
        <button onClick={() => restoreItem(file)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F1EFEC]"><RotateCcw size={16} /> Restore</button>
        <button onClick={() => deleteForever(file)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-rose-600 hover:bg-rose-50"><Trash2 size={16} /> Delete forever</button>
      </> : <>
        <button onClick={() => openItem(file)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F1EFEC]"><File size={16} /> Open</button>
        <button onClick={() => toggleStar(file)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F1EFEC]"><Star size={16} /> {file.isStarred ? 'Remove star' : 'Add star'}</button>
        <button onClick={() => renameItem(file)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F1EFEC]"><ArrowDownAZ size={16} /> Rename</button>
        <button onClick={() => { setMoveItem({ file }); setMenuId(null); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F1EFEC]"><Move size={16} /> Move to</button>
        {!file.isFolder && <button onClick={() => downloadItem(file)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F1EFEC]"><Download size={16} /> Download</button>}
        <button onClick={() => { setDetails(file); setMenuId(null); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F1EFEC]"><Info size={16} /> Details</button>
        <div className="my-1 border-t border-[#D4C9BE]/40" />
        <button onClick={() => trashItem(file)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-rose-600 hover:bg-rose-50"><Trash2 size={16} /> Move to Trash</button>
      </>}
    </div>
  );

  const fileIcon = (file, size = 32) => file.isFolder
    ? <Folder size={size} className="text-[#D8891B]" fill="currentColor" fillOpacity={0.18} />
    : file.fileType?.startsWith('image/') && file.fileUrl
      ? <img src={file.fileUrl} alt="" className="h-full w-full object-cover" />
      : <File size={size} className="text-[#123458]" />;

  const fileCard = (file) => (
    <div key={file._id} draggable={!selectMode && view !== 'trash'} onDragStart={event => dragItem(event, file._id)} onDragOver={event => folderDragOver(event, file)} onDragLeave={() => dropTargetId === file._id && setDropTargetId(null)} onDrop={event => folderDrop(event, file)} onContextMenu={event => { event.preventDefault(); if (!selectMode) setMenuId(file._id); }} className={`group relative min-w-0 rounded-2xl border bg-white shadow-[0_4px_20px_-15px_#123458] transition hover:-translate-y-0.5 hover:shadow-lg ${selectedIds.includes(file._id) || dropTargetId === file._id ? 'border-[#2D7797] ring-2 ring-[#2D7797]/20' : 'border-[#E0E6EB] hover:border-[#9CB8C9]'}`}>
      <button type="button" onClick={() => selectMode ? toggleSelection(file._id) : openItem(file)} className="w-full text-left" aria-label={`${selectMode ? 'Select' : 'Open'} ${file.fileName}`} title={file.fileName}>
        <div className={`flex h-32 items-center justify-center overflow-hidden rounded-t-2xl ${file.isFolder ? 'bg-[#FFF7EB]' : fileKind(file) === 'image' ? 'bg-[#EDF4F7]' : 'bg-[#F1F5F8]'}`}>{fileIcon(file, file.isFolder ? 54 : 42)}</div>
        <div className="min-w-0 px-4 py-3.5 pr-11">
          <div className="flex min-w-0 items-center gap-2">
            {selectMode && <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selectedIds.includes(file._id) ? 'border-[#123458] bg-[#123458] text-white' : 'border-[#8A9BA9] bg-white'}`}>{selectedIds.includes(file._id) && <Check size={13} />}</span>}
            <span className="truncate text-sm font-bold text-[#123458]">{file.fileName}</span>
            {file.isStarred && <Star size={13} className="shrink-0 fill-[#D8891B] text-[#D8891B]" />}
          </div>
          <p className="mt-1.5 truncate text-xs font-medium text-[#5F7284]">{itemType(file)} · {formatSize(file)}</p>
          <p className="mt-1 text-[11px] text-[#66798A]">{formatDate(view === 'trash' ? file.trashedAt : file.updatedAt || file.createdAt)}</p>
        </div>
      </button>
      {!selectMode && <button aria-label={`Actions for ${file.fileName}`} onClick={event => showMenu(event, file._id)} className="absolute bottom-3 right-2 rounded-lg p-2 text-[#52677C] hover:bg-[#F1F5F8] hover:text-[#123458]"><MoreVertical size={18} /></button>}
      {menuId === file._id && menu(file)}
    </div>
  );

  const fileRow = (file) => (
    <div key={file._id} draggable={!selectMode && view !== 'trash'} onDragStart={event => dragItem(event, file._id)} onDragOver={event => folderDragOver(event, file)} onDragLeave={() => dropTargetId === file._id && setDropTargetId(null)} onDrop={event => folderDrop(event, file)} onContextMenu={event => { event.preventDefault(); if (!selectMode) setMenuId(file._id); }} className={`group relative flex items-center gap-3 border-b border-[#E8EDF1] px-4 py-3 hover:bg-[#F5F8FA] ${selectedIds.includes(file._id) || dropTargetId === file._id ? 'bg-[#EAF3F7]' : ''}`}>
      <button onClick={() => selectMode ? toggleSelection(file._id) : openItem(file)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {selectMode && <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selectedIds.includes(file._id) ? 'bg-[#123458] text-white' : 'bg-white'}`}>{selectedIds.includes(file._id) && <Check size={13} />}</span>}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F1F5F8]">{fileIcon(file, 22)}</span>
        <span className="min-w-0"><span className="block truncate font-semibold text-[#123458]">{file.fileName}</span><span className="block text-xs text-[#60758A] sm:hidden">{formatSize(file)} · {formatDate(view === 'trash' ? file.trashedAt : file.updatedAt || file.createdAt)}</span></span>
        {file.isStarred && <Star size={14} className="shrink-0 fill-amber-400 text-amber-400" />}
      </button>
      <span className="hidden w-28 shrink-0 text-xs font-medium text-[#5F7284] sm:block">{formatSize(file)}</span>
      <span className="hidden w-32 shrink-0 text-xs font-medium text-[#5F7284] md:block">{formatDate(view === 'trash' ? file.trashedAt : file.updatedAt || file.createdAt)}</span>
      {!selectMode && <button aria-label={`Actions for ${file.fileName}`} onClick={event => showMenu(event, file._id)} className="rounded-lg p-2 text-[#123458] hover:bg-white"><MoreVertical size={18} /></button>}
      {menuId === file._id && menu(file)}
    </div>
  );

  const driveView = () => (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FB] px-4 pb-14 pt-6 sm:px-6 lg:px-8" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (view === 'documents' && event.dataTransfer.files.length) uploadFiles(event.dataTransfer.files); }} onClick={() => menuId && setMenuId(null)}>
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#526E85]">Your workspace</p><h1 className="font-serif text-3xl font-bold text-[#123458] sm:text-4xl">{viewNames[view] || 'My Drive'}</h1><p className="mt-2 text-sm text-[#60758A]">{view === 'trash' ? 'Restore items or remove them permanently.' : view === 'starred' ? 'Keep your most important files close.' : view === 'recent' ? 'Files you worked with most recently.' : 'Organize and access everything in your vault.'}</p></div>
          {view === 'documents' && <div className="flex w-full flex-wrap gap-2 sm:w-auto"><button onClick={createFolder} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#CAD7E0] bg-white px-4 py-3 text-sm font-semibold text-[#123458] transition hover:bg-[#EAF2F6] disabled:opacity-50 sm:flex-none"><FolderPlus size={17} /> New folder</button><button onClick={() => fileInputRef.current?.click()} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#123458] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1A4A70] disabled:opacity-50 sm:flex-none"><CloudUpload size={17} /> Upload files</button><input ref={fileInputRef} type="file" multiple className="hidden" onChange={event => { uploadFiles(event.target.files); event.target.value = ''; }} /></div>}
        </div>

        {view === 'documents' && folderId === 'root' && <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: 'Files', value: stats.files, icon: File },
            { label: 'Folders', value: stats.folders, icon: Folder },
            { label: 'Starred', value: stats.starred, icon: Star },
            { label: 'Storage used', value: `${(stats.storage / 1024 / 1024).toFixed(1)} MB`, icon: HardDrive }
          ].map(card => <div key={card.label} className="flex items-center gap-3 rounded-2xl border border-[#E0E7ED] bg-white p-4 shadow-[0_6px_25px_-20px_#123458] sm:gap-4 sm:p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF2F6] text-[#123458]"><card.icon size={20} /></span><div className="min-w-0"><p className="truncate text-xl font-bold text-[#123458] sm:text-2xl">{card.value}</p><p className="text-xs font-semibold text-[#60758A]">{card.label}</p></div></div>)}
        </div>}

        {view === 'documents' && folderId !== 'root' && <nav aria-label="Folder path" className="mb-5 flex flex-wrap items-center gap-1 text-sm text-[#123458]"><button onClick={() => setFolderId('root')} className="rounded-lg px-2 py-1.5 font-semibold hover:bg-white">My Drive</button>{breadcrumbs.map(folder => <React.Fragment key={folder._id}><ChevronRight size={16} className="text-[#60758A]" /><button onClick={() => setFolderId(folder._id)} className="max-w-40 truncate rounded-lg px-2 py-1.5 font-semibold hover:bg-white">{folder.fileName}</button></React.Fragment>)}</nav>}

        {uploadProgress && <div role="status" className="mb-4 flex items-center gap-3 rounded-xl border border-[#BCD7E4] bg-[#EAF3F7] px-4 py-3 text-sm font-semibold text-[#123458]"><RefreshCw size={17} className="animate-spin" /> Uploading {uploadProgress.done} of {uploadProgress.total} files...</div>}
        {busy && !uploadProgress && <div role="status" className="mb-4 flex items-center gap-2 text-sm font-medium text-[#526E85]"><RefreshCw size={15} className="animate-spin" /> Updating your vault...</div>}

        <div className={`grid gap-6 ${view === 'documents' && folderId === 'root' ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : ''}`}>
          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><h2 className="font-serif text-xl font-bold text-[#123458]">{view === 'documents' ? folderId === 'root' ? 'Files and folders' : breadcrumbs.at(-1)?.fileName || 'Folder' : viewNames[view]}</h2><p className="mt-0.5 text-xs font-medium text-[#60758A]">{visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'} shown</p></div></div>
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#E0E7ED] bg-white p-2 shadow-sm">
              {selectMode ? <div className="flex flex-wrap items-center gap-1"><span className="px-2 text-sm font-semibold text-[#123458]">{selectedIds.length} selected</span><button onClick={() => setSelectedIds(visibleItems.every(file => selectedIds.includes(file._id)) ? [] : visibleItems.map(file => file._id))} disabled={!visibleItems.length} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-[#123458] hover:bg-[#F1F5F8] disabled:opacity-40">{visibleItems.length && visibleItems.every(file => selectedIds.includes(file._id)) ? 'Clear all' : 'Select all'}</button><button disabled={!selectedIds.length || busy} onClick={() => setMoveItem({ bulk: true })} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-[#123458] hover:bg-[#F1F5F8] disabled:opacity-40"><Move size={15} className="mr-1 inline" /> Move</button><button disabled={!selectedIds.length || busy} onClick={bulkTrash} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={15} className="mr-1 inline" /> Trash</button><button onClick={() => { setSelectMode(false); setSelectedIds([]); }} aria-label="Cancel selection" className="rounded-lg p-2 text-[#123458] hover:bg-[#F1F5F8]"><X size={17} /></button></div> : <button onClick={() => setSelectMode(true)} disabled={view === 'trash' || !displayed.length} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#123458] hover:bg-[#F1F5F8] disabled:opacity-40"><CheckSquare size={17} /> Select</button>}
              <div className="ml-auto flex flex-wrap items-center gap-2"><label className="flex items-center gap-1 rounded-lg border border-[#DCE5EC] px-2 text-sm text-[#123458]"><span className="sr-only">Filter items</span><select aria-label="Filter items" value={kindFilter} onChange={event => { setKindFilter(event.target.value); setSelectedIds([]); }} className="max-w-28 bg-white py-2 outline-none"><option value="all">All items</option><option value="folder">Folders</option><option value="file">Files</option><option value="image">Images</option></select></label>{view !== 'trash' && <label className="flex items-center gap-1 rounded-lg border border-[#DCE5EC] px-2 text-sm text-[#123458]"><ArrowDownAZ size={15} /><select aria-label="Sort files" value={sort} onChange={event => setSort(event.target.value)} className="max-w-32 bg-white py-2 outline-none"><option value="name">Name</option><option value="recent">Recently changed</option><option value="oldest">Oldest</option><option value="size">Largest</option></select></label>}<div className="flex rounded-lg border border-[#DCE5EC] p-1"><button onClick={() => selectLayout('grid')} aria-label="Grid view" aria-pressed={layout === 'grid'} className={`rounded-md p-1.5 ${layout === 'grid' ? 'bg-[#123458] text-white' : 'text-[#52677C] hover:bg-[#F1F5F8]'}`}><Grid2X2 size={17} /></button><button onClick={() => selectLayout('list')} aria-label="List view" aria-pressed={layout === 'list'} className={`rounded-md p-1.5 ${layout === 'list' ? 'bg-[#123458] text-white' : 'text-[#52677C] hover:bg-[#F1F5F8]'}`}><LayoutList size={17} /></button></div></div>
            </div>

            {loading ? <div className="flex min-h-60 items-center justify-center text-[#123458]"><RefreshCw size={30} className="animate-spin" /></div>
              : visibleItems.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D8E2] bg-white px-4 text-center"><SearchX size={38} className="mb-3 text-[#52718B]" /><h3 className="text-lg font-bold text-[#123458]">{displayed.length ? 'No matching items' : 'Nothing here yet'}</h3><p className="mt-1 max-w-md text-sm text-[#60758A]">{displayed.length ? 'Try another filter to see more items.' : view === 'documents' ? 'Create a folder, upload files, or drop files here to get started.' : view === 'starred' ? 'Add a star to important files to see them here.' : view === 'recent' ? 'Recently updated files will appear here.' : 'Items moved to Trash will appear here.'}</p>{displayed.length > 0 && <button onClick={() => setKindFilter('all')} className="mt-4 rounded-lg bg-[#123458] px-4 py-2 text-sm font-semibold text-white">Clear filter</button>}</div>
                : <div aria-busy={busy} className={busy ? 'pointer-events-none opacity-60' : ''}>{layout === 'grid' ? <div className="grid grid-cols-2 gap-3 pb-16 sm:gap-4 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">{visibleItems.map(fileCard)}</div> : <div className="rounded-2xl border border-[#E0E7ED] bg-white pb-2 shadow-sm"><div className="flex gap-3 border-b border-[#E8EDF1] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#60758A]"><span className="flex-1">Name</span><span className="hidden w-28 sm:block">Size</span><span className="hidden w-32 md:block">Updated</span><span className="w-8" /></div>{visibleItems.map(fileRow)}</div>}</div>}
          </section>

          {view === 'documents' && folderId === 'root' && <aside className="space-y-4 lg:pt-0"><div className="rounded-2xl border border-[#E0E7ED] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-[#123458]"><HardDrive size={18} /><h3 className="font-serif text-lg font-bold">Storage</h3></div><p className="mt-4 text-2xl font-bold text-[#123458]">{(stats.storage / 1024 / 1024).toFixed(1)} MB</p><p className="mt-0.5 text-xs text-[#60758A]">{accountStats.storageLimit === 'Unlimited' ? 'Unlimited storage' : `of ${accountStats.storageLimit || 1024} MB available`}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7EDF1]"><div className="h-full rounded-full bg-[#2D7797]" style={{ width: `${accountStats.storageLimit === 'Unlimited' ? 0 : Math.min(100, stats.storage / 1024 / 1024 / (Number(accountStats.storageLimit) || 1024) * 100)}%` }} /></div><button onClick={() => navigate('/dashboard/storage')} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#1B6689] hover:text-[#123458]">Manage storage <ArrowRight size={15} /></button></div><div className="rounded-2xl border border-[#E0E7ED] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="font-serif text-lg font-bold text-[#123458]">Quick access</h3><button onClick={() => navigate('/dashboard/recent')} className="text-xs font-semibold text-[#1B6689] hover:underline">View recent</button></div>{recentFiles.length ? <div className="mt-3 divide-y divide-[#E8EDF1]">{recentFiles.map(file => <button key={file._id} onClick={() => openItem(file)} className="flex w-full items-center gap-3 py-3 text-left hover:text-[#1B6689]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F8] text-[#123458]"><File size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{file.fileName}</span><span className="block text-xs text-[#60758A]">{formatSize(file)} · {formatDate(file.updatedAt || file.createdAt)}</span></span></button>)}</div> : <p className="mt-4 text-sm text-[#60758A]">Upload a file to see it here.</p>}</div></aside>}
        </div>
      </div>
    </main>
  );

  const excludedIds = moveItem?.bulk ? selectedIds : moveItem?.file ? [moveItem.file._id] : [];
  const moveFolders = [{ _id: 'root', fileName: 'My Drive' }, ...folders.filter(folder => {
    let cursor = folder._id;
    const visited = new Set();
    while (cursor !== 'root' && !visited.has(cursor)) {
      if (excludedIds.includes(cursor)) return false;
      visited.add(cursor);
      cursor = folderMap.get(cursor)?.parentId || 'root';
    }
    return true;
  })];

  return <div className="flex h-screen w-full overflow-hidden bg-[#F7F9FB] font-inter">
    <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} onLogout={onLogout} />
    <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <Topbar user={user} onOpenSearchResult={openItem} onOpenMenu={() => setMobileMenuOpen(true)} />
      <Routes>
        <Route index element={<Navigate to="documents" replace />} />
        <Route path="documents" element={driveView()} />
        <Route path="starred" element={driveView()} />
        <Route path="recent" element={driveView()} />
        <Route path="trash" element={driveView()} />
        <Route path="profile" element={<Profile onLogout={onLogout} onProfileUpdated={updated => setUser(previous => ({ ...previous, ...updated }))} />} />
        <Route path="activity" element={<ActivityLog />} />
        <Route path="storage" element={<StoragePage />} />
        <Route path="settings" element={<Navigate to="profile" replace />} />
      </Routes>
    </div>

    <MoveModal isOpen={Boolean(moveItem)} onClose={() => setMoveItem(null)} folders={moveFolders} excludedIds={excludedIds} onConfirm={confirmMove} fileName={moveItem?.bulk ? `${selectedIds.length} selected items` : moveItem?.file?.fileName} busy={busy} />
    <NameDialog dialog={nameDialog} onClose={() => setNameDialog(null)} onSubmit={submitName} busy={busy} />
    {details && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#123458]/50 p-4" onClick={() => setDetails(null)}><div role="dialog" aria-modal="true" aria-label="Item details" onClick={event => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-2xl font-bold text-[#123458]">Item details</h2><button onClick={() => setDetails(null)} aria-label="Close details"><X size={20} /></button></div><dl className="space-y-3 text-sm text-[#123458]"><div><dt className="font-bold">Name</dt><dd className="break-all">{details.fileName}</dd></div><div><dt className="font-bold">Type</dt><dd>{details.isFolder ? 'Folder' : details.fileType || 'File'}</dd></div><div><dt className="font-bold">Size</dt><dd>{formatSize(details)}</dd></div><div><dt className="font-bold">Created</dt><dd>{formatDate(details.createdAt)}</dd></div><div><dt className="font-bold">Location</dt><dd>{details.parentId === 'root' ? 'My Drive' : folderMap.get(details.parentId)?.fileName || 'Folder'}</dd></div></dl></div></div>}
    {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
  </div>;
};

export default Dashboard;
