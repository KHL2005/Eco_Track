import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { ArrowLeft, MapPin, Calendar, User, Upload, Trash2, CheckCircle, ImageIcon, Video, X, ZoomIn } from 'lucide-react';
import * as issuesApi from '../../api/issuesApi';
import { AuthenticatedImage, AuthenticatedVideo } from '../../components/common/AuthenticatedMedia';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, labelify } from '../../utils/formatters';
import { ISSUE_STATUSES, RESOLUTION_STATUSES } from '../../utils/constants';
import { toast } from 'sonner';

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageIssues } = useRole();
  const { user } = useAuth();
  const [statusModal, setStatusModal] = useState(false);
  const [resolutionModal, setResolutionModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resForm, setResForm] = useState({ actions: '', status: 'PENDING' });
  const [editingResolution, setEditingResolution] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const fileRef = useRef();
  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resolution, setResolution] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [addResLoading, setAddResLoading] = useState(false);
  const [updateResLoading, setUpdateResLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Close lightbox on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setLightboxUrl(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function loadIssue() {
    setIsLoading(true);
    try {
      const res = await issuesApi.getIssueById(id);
      setIssue(res.data);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadResolution() {
    try {
      const res = await issuesApi.getResolutionByIssue(id);
      setResolution(res.data);
    } catch {
      setResolution(null);
    }
  }

  useEffect(() => {
    loadIssue();
    loadResolution();
  }, [id]);

  const handleUpdateStatus = async () => {
    setStatusLoading(true);
    try {
      await issuesApi.updateIssueStatus(id, newStatus);
      await loadIssue();
      toast.success('Status updated');
      setStatusModal(false);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update status';
      toast.error(message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddResolution = async (data) => {
    setAddResLoading(true);
    try {
      await issuesApi.addResolution(id, data);
      await loadResolution();
      toast.success('Resolution added');
      setResolutionModal(false);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add resolution';
      toast.error(message);
    } finally {
      setAddResLoading(false);
    }
  };

  const handleUpdateResolution = async (resId, data) => {
    setUpdateResLoading(true);
    try {
      await issuesApi.updateResolution(resId, data);
      await loadResolution();
      toast.success('Resolution updated');
      setResolutionModal(false);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update resolution';
      toast.error(message);
    } finally {
      setUpdateResLoading(false);
    }
  };

  const handleUploadMedia = async (file) => {
    setUploadLoading(true);
    try {
      await issuesApi.uploadMedia(id, file, (e) => setUploadProgress(Math.round(e.loaded / e.total * 100)));
      await loadIssue();
      toast.success('File uploaded');
      setUploadProgress(0);
    } catch {
      toast.error('Upload failed');
      setUploadProgress(0);
    } finally {
      setUploadLoading(false);
    }
  };

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-64 bg-green-50 rounded-2xl" /></DashboardLayout>;
  if (!issue) return <DashboardLayout><p className="text-slate-400">Issue not found.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#16a34a] hover:text-[#15803d] transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>
        </div>

        {/* ── Issue header card ── */}
        <div className="bg-white rounded-2xl border border-[#bbf7d0] shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-[#14532d] flex items-center gap-2"><span aria-hidden="true">⚠️</span> <span>{issue.title}</span></h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#64748b]">
                <span className="flex items-center gap-1"><User size={13} />{issue.citizenName}</span>
                <span className="flex items-center gap-1"><Calendar size={13} />{formatDateTime(issue.createdAt)}</span>
                {issue.location && <span className="flex items-center gap-1"><MapPin size={13} />{issue.location}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={issue.status} />
              {canManageIssues && (
                <Button size="sm" variant="outline" onClick={() => { setNewStatus(issue.status); setStatusModal(true); }}>
                  Update Status
                </Button>
              )}
            </div>
          </div>

          {/* Issue type pill */}
          <div className="inline-flex items-center gap-2 bg-[#dcfce7] text-[#14532d] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <span className="uppercase tracking-wide">Type:</span>
            <span>{labelify(issue.type)}</span>
          </div>

          {/* Description */}
          <p className="text-[#334155] text-sm leading-relaxed">{issue.description}</p>
        </div>

        {/* ── Attached Media ── */}
        <div className="bg-white rounded-2xl border border-[#bbf7d0] shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#14532d]">Attached Media</h3>
              {issue.mediaUrls?.length > 0 && (
                <p className="text-xs text-[#64748b] mt-0.5 flex items-center gap-3">
                  {issue.mediaUrls.filter(u => /\.(jpg|jpeg|png|gif)$/i.test(u.split('/').pop())).length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon size={11} />
                      {issue.mediaUrls.filter(u => /\.(jpg|jpeg|png|gif)$/i.test(u.split('/').pop())).length} image(s)
                    </span>
                  )}
                  {issue.mediaUrls.filter(u => /\.(mp4|avi|mov)$/i.test(u.split('/').pop())).length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Video size={11} />
                      {issue.mediaUrls.filter(u => /\.(mp4|avi|mov)$/i.test(u.split('/').pop())).length} video(s)
                    </span>
                  )}
                </p>
              )}
            </div>
            {canManageIssues && (
              <div>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*"
                  onChange={e => e.target.files[0] && handleUploadMedia(e.target.files[0])} />
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} loading={uploadLoading}>
                  <Upload size={14} /> Upload
                </Button>
              </div>
            )}
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="h-1.5 bg-[#dcfce7] rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-[#16a34a] transition-all rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          {issue.mediaUrls?.length > 0 ? (
            <div className="space-y-5">

              {/* Images */}
              {issue.mediaUrls.filter(u => /\.(jpg|jpeg|png|gif)$/i.test(u.split('/').pop())).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#16a34a] uppercase tracking-wide mb-2 flex items-center gap-1">
                    <ImageIcon size={12} /> Images
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {issue.mediaUrls
                      .filter(u => /\.(jpg|jpeg|png|gif)$/i.test(u.split('/').pop()))
                      .map((url) => {
                        const fileName = url.split('/').pop();
                        const mediaUrl = issuesApi.getMediaUrl(id, fileName);
                        return (
                          <div
                            key={url}
                            className="relative group aspect-video bg-[#f0fdf4] rounded-xl overflow-hidden cursor-zoom-in border border-[#bbf7d0]"
                          >
                            <AuthenticatedImage
                              src={mediaUrl}
                              alt={fileName}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              onClick={(blobUrl) => setLightboxUrl(blobUrl)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                              <ZoomIn size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                            </div>
                            {canManageIssues && (
                              <button
                                className="absolute top-1 right-1 bg-white/90 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 z-10"
                                onClick={e => { e.stopPropagation(); }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}

              {/* Videos */}
              {issue.mediaUrls.filter(u => /\.(mp4|avi|mov)$/i.test(u.split('/').pop())).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#16a34a] uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Video size={12} /> Videos
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {issue.mediaUrls
                      .filter(u => /\.(mp4|avi|mov)$/i.test(u.split('/').pop()))
                      .map((url) => {
                        const fileName = url.split('/').pop();
                        const mediaUrl = issuesApi.getMediaUrl(id, fileName);
                        return (
                          <div key={url} className="relative group rounded-xl overflow-hidden bg-[#0f172a] border border-[#bbf7d0]">
                            <AuthenticatedVideo
                              src={mediaUrl}
                              className="w-full max-h-64 object-contain"
                            />
                            <p className="text-xs text-[#94a3b8] px-3 py-1.5 truncate bg-[#1e293b] border-t border-white/10">
                              {fileName}
                            </p>
                            {canManageIssues && (
                              <button
                                className="absolute top-1 right-1 bg-white/80 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                                onClick={() => {}}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-12 h-12 bg-[#dcfce7] rounded-full flex items-center justify-center">
                <ImageIcon size={22} className="text-[#16a34a]" />
              </div>
              <p className="text-sm text-[#64748b]">No media attached to this issue</p>
            </div>
          )}
        </div>

        {/* Image lightbox — rendered via Portal directly on document.body */}
        {lightboxUrl && createPortal(
          <div
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setLightboxUrl(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-white bg-white/15 hover:bg-white/30 rounded-full p-2 transition-colors"
              style={{ zIndex: 10000 }}
              onClick={() => setLightboxUrl(null)}
            >
              <X size={22} />
            </button>

            {/* ESC hint */}
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
              Press ESC or click anywhere to close
            </span>

            {/* Image */}
            <img
              src={lightboxUrl}
              alt="Full view"
              className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl select-none"
              onClick={e => e.stopPropagation()}
            />
          </div>,
          document.body
        )}

        {/* ── Resolution ── */}
        <div className="bg-white rounded-2xl border border-[#bbf7d0] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#14532d]">Resolution</h3>
            {canManageIssues && (
              <Button size="sm" variant="outline" onClick={() => {
                if (!id) {
                  toast.error('Invalid issue. Please refresh the page.');
                  return;
                }
                if (resolution) {
                  setResForm({ actions: resolution.actions, status: resolution.status });
                  setEditingResolution(true);
                } else {
                  setResForm({ actions: '', status: 'PENDING' });
                  setEditingResolution(false);
                }
                setResolutionModal(true);
              }} disabled={!id}>
                <CheckCircle size={14} /> {resolution ? 'Edit Resolution' : 'Add Resolution'}
              </Button>
            )}
          </div>
          {resolution && (canManageIssues || resolution.status) ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={resolution.status} />
                <span className="text-sm text-[#64748b]">by Officer</span>
              </div>
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4">
                <p className="text-sm text-[#1e293b] leading-relaxed">{resolution.actions}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-10 h-10 bg-[#fef9c3] rounded-full flex items-center justify-center">
                <CheckCircle size={18} className="text-[#ca8a04]" />
              </div>
              <p className="text-sm text-[#64748b]">No resolution recorded yet</p>
              <p className="text-xs text-[#94a3b8]">An officer will review and respond to your report</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Issue Status" size="sm">
        <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-forest-600/30"
          value={newStatus} onChange={e => setNewStatus(e.target.value)}>
          {ISSUE_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
        </select>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} loading={statusLoading}>Update</Button>
        </div>
      </Modal>

      {/* Resolution Modal */}
      <Modal open={resolutionModal} onClose={() => setResolutionModal(false)} title={editingResolution ? "Edit Resolution" : "Add Resolution"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Actions Taken</label>
            <textarea rows={4} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={resForm.actions} onChange={e => setResForm(f => ({ ...f, actions: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Status</label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={resForm.status} onChange={e => setResForm(f => ({ ...f, status: e.target.value }))}>
              {RESOLUTION_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setResolutionModal(false)}>Cancel</Button>
             <Button onClick={() => {
               if (!id) {
                 toast.error('Invalid issue. Please refresh the page.');
                 return;
               }
               if (editingResolution) {
                 handleUpdateResolution(resolution.resolutionId, { actions: resForm.actions, status: resForm.status });
               } else {
                 handleAddResolution({ actions: resForm.actions, officerId: user?.userId });
               }
             }} loading={editingResolution ? updateResLoading : addResLoading} disabled={!resForm.actions.trim() || !id}>
              {editingResolution ? "Update Resolution" : "Submit"}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

