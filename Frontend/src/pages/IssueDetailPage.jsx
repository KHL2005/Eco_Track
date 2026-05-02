import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { ArrowLeft, MapPin, Calendar, User, Upload, Trash2, CheckCircle } from 'lucide-react';
import * as issuesApi from '../api/issuesApi';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, labelify } from '../utils/formatters';
import { ISSUE_STATUSES, RESOLUTION_STATUSES } from '../utils/constants';
import { toast } from 'sonner';

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { canManageIssues } = useRole();
  const { user } = useAuth();
  const [statusModal, setStatusModal] = useState(false);
  const [resolutionModal, setResolutionModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resForm, setResForm] = useState({ actions: '', status: 'PENDING' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef();

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => issuesApi.getIssueById(id).then(r => r.data),
  });

  const { data: resolution } = useQuery({
    queryKey: ['resolution', 'issue', id],
    queryFn: () => issuesApi.getResolutionByIssue(id).then(r => r.data).catch(() => null),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => issuesApi.updateIssueStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['issue', id] }); toast.success('Status updated'); setStatusModal(false); },
    onError: () => toast.error('Failed to update status'),
  });

  const addResolution = useMutation({
    mutationFn: (data) => issuesApi.addResolution(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resolution', 'issue', id] }); toast.success('Resolution added'); setResolutionModal(false); },
    onError: () => toast.error('Failed to add resolution'),
  });

  const uploadMedia = useMutation({
    mutationFn: (file) => issuesApi.uploadMedia(id, file, (e) => setUploadProgress(Math.round(e.loaded / e.total * 100))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['issue', id] }); toast.success('File uploaded'); setUploadProgress(0); },
    onError: () => { toast.error('Upload failed'); setUploadProgress(0); },
  });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-64 bg-earth-100 rounded-2xl" /></DashboardLayout>;
  if (!issue) return <DashboardLayout><p className="text-bark-400">Issue not found.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</Button>
        </div>

        <Card className="mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-bark-800">{issue.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-bark-400">
                <span className="flex items-center gap-1"><User size={14} />{issue.citizenName}</span>
                <span className="flex items-center gap-1"><Calendar size={14} />{formatDateTime(issue.createdAt)}</span>
                {issue.location && <span className="flex items-center gap-1"><MapPin size={14} />{issue.location}</span>}
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

          <div className="bg-earth-100 rounded-xl p-4 mb-4">
            <span className="text-xs font-semibold text-bark-400 uppercase tracking-wide">Type</span>
            <p className="text-sm text-bark-800 mt-0.5">{labelify(issue.type)}</p>
          </div>

          <p className="text-bark-600 text-sm leading-relaxed">{issue.description}</p>
        </Card>

        {/* Media */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-bark-800">Media</h3>
            <div>
              <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*"
                onChange={e => e.target.files[0] && uploadMedia.mutate(e.target.files[0])} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} loading={uploadMedia.isPending}>
                <Upload size={14} /> Upload
              </Button>
            </div>
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="h-1.5 bg-earth-100 rounded-full mb-3 overflow-hidden">
              <div className="h-full bg-forest-600 transition-all rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {issue.mediaUrls?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {issue.mediaUrls.map((url) => {
                const fileName = url.split('/').pop();
                const imgUrl = issuesApi.getMediaUrl(id, fileName);
                return (
                  <div key={url} className="relative group aspect-video bg-earth-100 rounded-xl overflow-hidden">
                    <img src={imgUrl} alt={fileName} className="w-full h-full object-cover" />
                    {canManageIssues && (
                      <button
                        className="absolute top-1 right-1 bg-white/80 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity text-danger"
                        onClick={() => {/* deleteMedia */}}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-bark-400">No media attached.</p>}
        </Card>

        {/* Resolution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-bark-800">Resolution</h3>
            {canManageIssues && !resolution && (
              <Button size="sm" variant="outline" onClick={() => setResolutionModal(true)}>
                <CheckCircle size={14} /> Add Resolution
              </Button>
            )}
          </div>
          {resolution ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={resolution.status} />
                <span className="text-sm text-bark-400">by {resolution.officerName}</span>
              </div>
              <p className="text-sm text-bark-600 leading-relaxed">{resolution.actions}</p>
            </div>
          ) : (
            <p className="text-sm text-bark-400">No resolution recorded yet.</p>
          )}
        </Card>
      </div>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Issue Status" size="sm">
        <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-forest-600/30"
          value={newStatus} onChange={e => setNewStatus(e.target.value)}>
          {ISSUE_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
        </select>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
          <Button onClick={() => updateStatus.mutate({ id, status: newStatus })} loading={updateStatus.isPending}>Update</Button>
        </div>
      </Modal>

      {/* Resolution Modal */}
      <Modal open={resolutionModal} onClose={() => setResolutionModal(false)} title="Add Resolution">
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
            <Button onClick={() => addResolution.mutate({ ...resForm, officerId: user?.userId, officerName: user?.name })} loading={addResolution.isPending}>Submit</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

