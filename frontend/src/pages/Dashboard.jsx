import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownAZ, Check, CheckSquare, ChevronRight, CloudUpload, Download, File,
  Folder, FolderPlus, Grid2X2, HardDrive, Info, LayoutList, MoreVertical,
  Move, RefreshCw, RotateCcw, SearchX, Star, Trash2, X
} from 'lucide-react';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import MoveModal from '../components/MoveModal';
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
  const [folderId, setFolderId] = useState('root');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [layout, setLayout] = useState(() => localStorage.getItem('vaultLayout') || 'grid');
  const [sort, setSort] = useState('name');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [menuId, setMenuId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [details, setDetails] = useState(null);
  const [toast, setToast] = useState(null);
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

  const createFolder = async () => {
    const fileName = window.prompt('Folder name:')?.trim();
    if (!fileName) return;
    await perform('/api/files/create-folder', 'POST', { fileName, parentId: folderId }, 'Folder created');
  };

  const uploadFiles = async (fileList) => {
    const selected = [...fileList];
    if (!selected.length) return;
    setBusy(true);
    let uploaded = 0;
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
    }
    try { await refresh(); } catch (error) { lastError = error.message; }
    setBusy(false);
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

  const renameItem = async (file) => {
    const fileName = window.prompt('New name:', file.fileName)?.trim();
    if (!fileName || fileName === file.fileName) return;
    await perform(`/api/files/rename/${file._id}`, 'PUT', { fileName }, 'Item renamed');
  };

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
    <div className="absolute right-2 top-11 z-50 w-48 rounded-xl border border-[#D4C9BE]/60 bg-white p-1.5 shadow-2xl text-sm" onClick={event => event.stopPropagation()}>
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
    ? <Folder size={size} className="text-amber-500" fill="currentColor" fillOpacity={0.16} />
    : file.fileType?.startsWith('image/') && file.fileUrl
      ? <img src={file.fileUrl} alt="" className="h-full w-full object-cover" />
      : <File size={size} className="text-[#123458]" />;

  const fileCard = (file) => (
    <div key={file._id} draggable={!selectMode && view !== 'trash'} onDragStart={event => dragItem(event, file._id)} onDragOver={event => folderDragOver(event, file)} onDragLeave={() => dropTargetId === file._id && setDropTargetId(null)} onDrop={event => folderDrop(event, file)} onContextMenu={event => { event.preventDefault(); if (!selectMode) setMenuId(file._id); }} className={`group relative rounded-2xl border bg-white transition hover:shadow-lg ${selectedIds.includes(file._id) || dropTargetId === file._id ? 'border-[#123458] ring-2 ring-[#123458]/20' : 'border-[#D4C9BE]/50 hover:border-[#123458]/50'}`}>
      <button type="button" onClick={() => selectMode ? toggleSelection(file._id) : openItem(file)} className="w-full text-left" title={file.fileName}>
        <div className="flex h-32 items-center justify-center overflow-hidden rounded-t-2xl bg-[#F1EFEC]/75">{fileIcon(file, file.isFolder ? 54 : 40)}</div>
        <div className="flex items-center gap-2 px-3 py-3 pr-12">
          {selectMode && <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selectedIds.includes(file._id) ? 'bg-[#123458] text-white' : 'bg-white'}`}>{selectedIds.includes(file._id) && <Check size={13} />}</span>}
          <span className="truncate text-sm font-semibold text-[#123458]">{file.fileName}</span>
          {file.isStarred && <Star size={14} className="shrink-0 fill-amber-400 text-amber-400" />}
        </div>
      </button>
      {!selectMode && <button aria-label={`Actions for ${file.fileName}`} onClick={event => showMenu(event, file._id)} className="absolute bottom-2 right-2 rounded-lg p-2 text-[#123458] hover:bg-[#F1EFEC]"><MoreVertical size={18} /></button>}
      {menuId === file._id && menu(file)}
    </div>
  );

  const fileRow = (file) => (
    <div key={file._id} draggable={!selectMode && view !== 'trash'} onDragStart={event => dragItem(event, file._id)} onDragOver={event => folderDragOver(event, file)} onDragLeave={() => dropTargetId === file._id && setDropTargetId(null)} onDrop={event => folderDrop(event, file)} onContextMenu={event => { event.preventDefault(); if (!selectMode) setMenuId(file._id); }} className={`group relative flex items-center gap-3 border-b border-[#D4C9BE]/30 px-4 py-2.5 hover:bg-[#F1EFEC] ${selectedIds.includes(file._id) || dropTargetId === file._id ? 'bg-[#123458]/10' : ''}`}>
      <button onClick={() => selectMode ? toggleSelection(file._id) : openItem(file)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {selectMode && <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selectedIds.includes(file._id) ? 'bg-[#123458] text-white' : 'bg-white'}`}>{selectedIds.includes(file._id) && <Check size={13} />}</span>}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F1EFEC]">{fileIcon(file, 21)}</span>
        <span className="truncate font-semibold text-[#123458]">{file.fileName}</span>
        {file.isStarred && <Star size={14} className="shrink-0 fill-amber-400 text-amber-400" />}
      </button>
      <span className="hidden w-32 shrink-0 text-xs text-[#123458]/60 sm:block">{formatSize(file)}</span>
      <span className="hidden w-32 shrink-0 text-xs text-[#123458]/60 md:block">{formatDate(view === 'trash' ? file.trashedAt : file.updatedAt || file.createdAt)}</span>
      {!selectMode && <button aria-label={`Actions for ${file.fileName}`} onClick={event => showMenu(event, file._id)} className="rounded-lg p-2 text-[#123458] hover:bg-white"><MoreVertical size={18} /></button>}
      {menuId === file._id && menu(file)}
    </div>
  );

  const driveView = () => (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#F1EFEC] px-4 pb-12 pt-6 md:px-8" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (view === 'documents') uploadFiles(event.dataTransfer.files); }} onClick={() => menuId && setMenuId(null)}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#123458]/50">Your workspace</p>
            <h1 className="font-serif text-3xl font-bold text-[#123458] md:text-4xl">{viewNames[view] || 'My Drive'}</h1>
            <p className="mt-1 text-sm text-[#123458]/60">{view === 'trash' ? 'Restore items or delete them permanently.' : `${displayed.length} item${displayed.length === 1 ? '' : 's'} in this view`}</p>
          </div>
          {view === 'documents' && <div className="flex flex-wrap gap-2">
            <button onClick={createFolder} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-[#D4C9BE] bg-white px-4 py-2.5 text-sm font-bold text-[#123458] hover:bg-[#D4C9BE]/20 disabled:opacity-50"><FolderPlus size={17} /> New folder</button>
            <button onClick={() => fileInputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#123458] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#1a4979] disabled:opacity-50"><CloudUpload size={17} /> Upload files</button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={event => { uploadFiles(event.target.files); event.target.value = ''; }} />
          </div>}
        </div>

        {view === 'documents' && folderId === 'root' && <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Files', value: stats.files, icon: File },
            { label: 'Folders', value: stats.folders, icon: Folder },
            { label: 'Starred', value: stats.starred, icon: Star },
            { label: 'Storage used', value: `${(stats.storage / 1024 / 1024).toFixed(1)} MB`, icon: HardDrive }
          ].map(card => <div key={card.label} className="rounded-2xl border border-[#D4C9BE]/50 bg-white p-4 shadow-sm"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#123458]/8 text-[#123458]"><card.icon size={19} /></div><p className="text-2xl font-black text-[#123458]">{card.value}</p><p className="text-xs font-semibold uppercase tracking-wider text-[#123458]/50">{card.label}</p></div>)}
        </div>}

        {view === 'documents' && <nav aria-label="Folder path" className="mb-5 flex flex-wrap items-center gap-1 text-sm text-[#123458]">
          <button onClick={() => setFolderId('root')} className="rounded-lg px-2 py-1 font-bold hover:bg-white">My Drive</button>
          {breadcrumbs.map(folder => <React.Fragment key={folder._id}><ChevronRight size={16} className="opacity-40" /><button onClick={() => setFolderId(folder._id)} className="max-w-40 truncate rounded-lg px-2 py-1 font-semibold hover:bg-white">{folder.fileName}</button></React.Fragment>)}
        </nav>}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D4C9BE]/50 bg-white p-2.5 shadow-sm">
          {selectMode ? <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 text-sm font-bold text-[#123458]">{selectedIds.length} selected</span>
            <button disabled={!selectedIds.length || busy} onClick={() => setMoveItem({ bulk: true })} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#123458] hover:bg-[#F1EFEC] disabled:opacity-40"><Move size={16} className="mr-1 inline" /> Move</button>
            <button disabled={!selectedIds.length || busy} onClick={bulkTrash} className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={16} className="mr-1 inline" /> Trash</button>
            <button onClick={() => { setSelectMode(false); setSelectedIds([]); }} className="rounded-lg p-2 text-[#123458] hover:bg-[#F1EFEC]" aria-label="Cancel selection"><X size={18} /></button>
          </div> : <button onClick={() => setSelectMode(true)} disabled={view === 'trash'} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#123458] hover:bg-[#F1EFEC] disabled:opacity-40"><CheckSquare size={17} /> Select</button>}
          <div className="ml-auto flex items-center gap-2">
            {view !== 'trash' && <label className="flex items-center gap-1 rounded-lg border border-[#D4C9BE]/50 px-2 text-sm text-[#123458]"><ArrowDownAZ size={16} /><select aria-label="Sort files" value={sort} onChange={event => setSort(event.target.value)} className="bg-transparent py-2 outline-none"><option value="name">Name</option><option value="recent">Recently changed</option><option value="oldest">Oldest</option><option value="size">Largest</option></select></label>}
            <div className="flex rounded-lg border border-[#D4C9BE]/50 p-1">
              <button onClick={() => selectLayout('grid')} aria-label="Grid view" aria-pressed={layout === 'grid'} className={`rounded-md p-1.5 ${layout === 'grid' ? 'bg-[#123458] text-white' : 'text-[#123458]'}`}><Grid2X2 size={17} /></button>
              <button onClick={() => selectLayout('list')} aria-label="List view" aria-pressed={layout === 'list'} className={`rounded-md p-1.5 ${layout === 'list' ? 'bg-[#123458] text-white' : 'text-[#123458]'}`}><LayoutList size={17} /></button>
            </div>
          </div>
        </div>

        {loading || busy ? <div className="flex min-h-60 items-center justify-center text-[#123458]"><RefreshCw size={30} className="animate-spin" /></div>
          : displayed.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#D4C9BE] bg-white/70 px-4 text-center"><SearchX size={38} className="mb-3 text-[#123458]/35" /><h2 className="text-lg font-bold text-[#123458]">Nothing here yet</h2><p className="mt-1 max-w-md text-sm text-[#123458]/60">{view === 'documents' ? 'Create a folder, upload files, or drop files here.' : view === 'starred' ? 'Star an item from My Drive to find it here.' : view === 'recent' ? 'Recently changed files will appear here.' : 'Items moved to Trash will appear here.'}</p></div>
          : layout === 'grid' ? <div className="grid grid-cols-2 gap-4 pb-16 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{displayed.map(fileCard)}</div>
            : <div className="overflow-visible rounded-2xl border border-[#D4C9BE]/50 bg-white pb-2 shadow-sm"><div className="flex gap-3 border-b border-[#D4C9BE]/40 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#123458]/50"><span className="flex-1">Name</span><span className="hidden w-32 sm:block">Size</span><span className="hidden w-32 md:block">Date</span><span className="w-8" /></div>{displayed.map(fileRow)}</div>}
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

  return <div className="flex h-screen w-full overflow-hidden bg-[#F1EFEC] font-inter">
    <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onLogout={onLogout} />
    <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <Topbar user={user} onOpenSearchResult={openItem} />
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

    <MoveModal isOpen={Boolean(moveItem)} onClose={() => setMoveItem(null)} folders={moveFolders} excludedIds={excludedIds} onConfirm={confirmMove} fileName={moveItem?.bulk ? `${selectedIds.length} selected items` : moveItem?.file?.fileName} />
    {details && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#123458]/50 p-4" onClick={() => setDetails(null)}><div role="dialog" aria-modal="true" aria-label="Item details" onClick={event => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-2xl font-bold text-[#123458]">Item details</h2><button onClick={() => setDetails(null)} aria-label="Close details"><X size={20} /></button></div><dl className="space-y-3 text-sm text-[#123458]"><div><dt className="font-bold">Name</dt><dd className="break-all">{details.fileName}</dd></div><div><dt className="font-bold">Type</dt><dd>{details.isFolder ? 'Folder' : details.fileType || 'File'}</dd></div><div><dt className="font-bold">Size</dt><dd>{formatSize(details)}</dd></div><div><dt className="font-bold">Created</dt><dd>{formatDate(details.createdAt)}</dd></div><div><dt className="font-bold">Location</dt><dd>{details.parentId === 'root' ? 'My Drive' : folderMap.get(details.parentId)?.fileName || 'Folder'}</dd></div></dl></div></div>}
    {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
  </div>;
};

export default Dashboard;
