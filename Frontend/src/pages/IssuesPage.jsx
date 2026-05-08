import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { Plus, Trash2, Eye, MapPin, Calendar, ChevronRight } from 'lucide-react';
import * as issuesApi from '../api/issuesApi';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, labelify } from '../utils/formatters';
import { ISSUE_STATUSES, ISSUE_TYPES } from '../utils/constants';
import { toast } from 'sonner';

// ── Status filter pill ────────────────────────────────────────
// Active (selected) styles
const STATUS_PILL_STYLES = {
  '':            'bg-[#f0fdf4] text-[#14532d] border-[#bbf7d0]',
  OPEN:          'bg-orange-100 text-orange-700 border-orange-200',
  IN_PROGRESS:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  RESOLVED:      'bg-green-100 text-green-700 border-green-200',
  CLOSED:        'bg-gray-100  text-gray-600   border-gray-200',
};

// Hover styles for unselected pills
const STATUS_PILL_HOVER = {
  '':            'hover:bg-[#f0fdf4] hover:text-[#14532d] hover:border-[#bbf7d0]',
  OPEN:          'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200',
  IN_PROGRESS:   'hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200',
  RESOLVED:      'hover:bg-green-50  hover:text-green-600  hover:border-green-200',
  CLOSED:        'hover:bg-gray-50   hover:text-gray-500   hover:border-gray-200',
};

// ── Citizen card view ─────────────────────────────────────────
const STATUS_HINT = {
  OPEN:        { text: 'Awaiting officer review',    dot: 'bg-orange-400' },
  IN_PROGRESS: { text: 'Officer is working on this', dot: 'bg-yellow-400' },
  RESOLVED:    { text: 'Issue resolved by officer',  dot: 'bg-green-500'  },
  CLOSED:      { text: 'Issue closed',               dot: 'bg-slate-400'  },
};

function CitizenIssueCard({ issue }) {
  const issueId    = issue.issueId ?? issue.id;
  const mediaUrls  = issue.mediaUrls ?? [];
  const imageCount = mediaUrls.filter(u => /\.(jpg|jpeg|png|gif)$/i.test(u.split('/').pop())).length;
  const videoCount = mediaUrls.filter(u => /\.(mp4|avi|mov)$/i.test(u.split('/').pop())).length;
  const hint       = STATUS_HINT[issue.status] || STATUS_HINT.OPEN;

  return (
    <Link
      to={`/issues/${issueId}`}
      className="block bg-white border border-[#bbf7d0] rounded-2xl p-4 hover:shadow-md hover:border-[#86efac] transition-all group"
    >
      {/* Title + status */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#14532d] truncate group-hover:text-[#16a34a] transition-colors">
            {issue.title || '(No title)'}
          </p>
          <span className="inline-block text-xs bg-[#dcfce7] text-[#15803d] font-medium px-2 py-0.5 rounded-full mt-1">
            {labelify(issue.type)}
          </span>
        </div>
        <StatusBadge status={issue.status} />
      </div>

      {/* Location + date */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748b] mt-2">
        {issue.location && (
          <span className="flex items-center gap-1"><MapPin size={11} /> {issue.location}</span>
        )}
        <span className="flex items-center gap-1"><Calendar size={11} /> {formatDateTime(issue.createdAt)}</span>
      </div>

      {/* Footer: hint + media badge + arrow */}
      <div className="mt-3 pt-3 border-t border-[#dcfce7] flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hint.dot}`} />
          {hint.text}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {mediaUrls.length > 0 && (
            <span className="text-xs text-[#16a34a] bg-[#dcfce7] px-2 py-0.5 rounded-full font-medium">
              {imageCount > 0 && `${imageCount} img`}
              {imageCount > 0 && videoCount > 0 && ' · '}
              {videoCount > 0 && `${videoCount} vid`}
            </span>
          )}
          <ChevronRight size={14} className="text-[#94a3b8] group-hover:text-[#16a34a] transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────
export default function IssuesPage({ mine = false }) {
  const { canManageIssues, isCitizen } = useRole();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [statusModal, setStatusModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const queryKey = mine ? ['issues', 'citizen', user?.userId] : ['issues'];
  const { data: issues = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => (mine
      ? issuesApi.getIssuesByCitizen(user?.userId)
      : issuesApi.getIssues()
    ).then(r => r.data).catch(() => []),
    enabled: !mine || !!user?.userId,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => issuesApi.deleteIssue(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['issues'] }); toast.success('Issue deleted'); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete issue'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => issuesApi.updateIssueStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] });
      qc.invalidateQueries({ queryKey: ['issue'] });
      qc.invalidateQueries({ queryKey: ['issues', 'citizen'] });
      toast.success('Status updated');
      setStatusModal(false);
      setSelectedIssue(null);
    },
    onError: (error) => {
      const message = error.response?.data?.message || error.message || 'Failed to update status';
      console.error('Status update error:', message, error);
      toast.error(message);
    },
  });

  const filtered = issues.filter(i => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterType   && i.type   !== filterType)   return false;
    return true;
  });

  // ── CITIZEN "MY ISSUES" VIEW ──────────────────────────────
  if (mine && isCitizen) {
    return (
      <DashboardLayout>
        <PageHeader
          emoji="📋"
          title="My Reported Issues"
          description="Track the status and officer resolution of your submitted reports"
          action={
            <Link to="/issues/new">
              <Button><Plus size={16} /> Report Issue</Button>
            </Link>
          }
        />

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['', ...ISSUE_STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterStatus === s
                  ? STATUS_PILL_STYLES[s] + ' ring-2 ring-offset-1 ring-forest-600/30'
                  : `bg-white text-[#64748b] border-[#cbd5e1] ${STATUS_PILL_HOVER[s]}`
              }`}
            >
              {s === '' ? 'All' : labelify(s)}
              {s !== '' && (
                <span className="ml-1.5 font-bold">
                  ({issues.filter(i => i.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Issue cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-24 bg-earth-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-bark-400 gap-3">
            <Plus size={36} className="opacity-20" />
            <p className="text-sm font-medium">
              {filterStatus ? `No issues with status "${labelify(filterStatus)}"` : 'You have not reported any issues yet'}
            </p>
            <Link to="/issues/new">
              <Button size="sm"><Plus size={14} /> Report your first issue</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(issue => (
              <CitizenIssueCard key={issue.issueId ?? issue.id} issue={issue} />
            ))}
          </div>
        )}
      </DashboardLayout>
    );
  }

  // ── OFFICER / ADMIN TABLE VIEW ────────────────────────────
  const columns = [
    { key: 'issueId', label: '#', sortable: true, render: r => <span className="text-bark-400 text-xs">#{r.issueId}</span> },
    { key: 'title', label: 'Title', sortable: true, render: r => (
      <Link to={`/issues/${r.issueId}`} className="font-medium text-forest-600 hover:text-forest-700 hover:underline">{r.title}</Link>
    )},
    { key: 'type',       label: 'Type',        render: r => <span className="text-xs text-bark-600">{labelify(r.type)}</span> },
    { key: 'status',     label: 'Status',      render: r => <StatusBadge status={r.status} /> },
    { key: 'citizenName',label: 'Reported By', sortable: true },
    { key: 'createdAt',  label: 'Date',        sortable: true, render: r => <span className="text-xs text-bark-400">{formatDateTime(r.createdAt)}</span> },
    {
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Link to={`/issues/${r.issueId}`}><Button size="sm" variant="ghost"><Eye size={14} /></Button></Link>
          {canManageIssues && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setSelectedIssue(r); setNewStatus(r.status); setStatusModal(true); }}>
                Status
              </Button>
              <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => setDeleteTarget(r)}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        emoji="⚠️"
        title={mine ? 'My Reported Issues' : 'All Issues'}
        description="Environmental issues reported by citizens"
        action={
          (isCitizen || canManageIssues) && (
            <Link to="/issues/new"><Button><Plus size={16} /> Report Issue</Button></Link>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="text-sm border border-bark-400/20 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/30"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {ISSUE_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
        </select>
        <select className="text-sm border border-bark-400/20 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/30"
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {ISSUE_TYPES.map(t => <option key={t} value={t}>{labelify(t)}</option>)}
        </select>
        {(filterStatus || filterType) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(''); setFilterType(''); }}>Clear filters</Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={filtered} loading={isLoading} searchPlaceholder="Search issues…" />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget?.issueId)}
        title="Delete Issue"
        message={`Are you sure you want to delete issue "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={deleteMut.isPending}
      />

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title={`Update Status for Issue #${selectedIssue?.issueId}`} size="sm">
        <p className="text-xs text-bark-400 mb-3">
          <strong>Valid transitions:</strong> OPEN → IN_PROGRESS or CLOSED | IN_PROGRESS → RESOLVED or CLOSED | RESOLVED → CLOSED
        </p>
        <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-forest-600/30"
          value={newStatus} onChange={e => setNewStatus(e.target.value)}>
          {ISSUE_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
        </select>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
          <Button onClick={() => updateStatus.mutate({ id: selectedIssue?.issueId, status: newStatus })} loading={updateStatus.isPending}>Update</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
