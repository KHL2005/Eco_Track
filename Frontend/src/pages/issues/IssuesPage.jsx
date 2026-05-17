import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Plus, Trash2, Eye, MapPin, Calendar, ChevronRight, AlertOctagon } from 'lucide-react';
import * as issuesApi from '../../api/issuesApi';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, labelify } from '../../utils/formatters';
import { ISSUE_STATUSES, ISSUE_TYPES } from '../../utils/constants';
import { toast } from 'sonner';

// ── Helpers for citizen view ──────────────────────────────────

// Returns the active (selected) pill style for a given status
function getStatusPillActiveClass(status) {
  if (status === '') return 'bg-[#f0fdf4] text-[#14532d] border-[#bbf7d0]';
  if (status === 'OPEN') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (status === 'IN_PROGRESS') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  if (status === 'RESOLVED') return 'bg-green-100 text-green-700 border-green-200';
  if (status === 'CLOSED') return 'bg-gray-100 text-gray-600 border-gray-200';
  return '';
}

// Returns the hover style for an unselected pill
function getStatusPillHoverClass(status) {
  if (status === '') return 'hover:bg-[#f0fdf4] hover:text-[#14532d] hover:border-[#bbf7d0]';
  if (status === 'OPEN') return 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200';
  if (status === 'IN_PROGRESS') return 'hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200';
  if (status === 'RESOLVED') return 'hover:bg-green-50 hover:text-green-600 hover:border-green-200';
  if (status === 'CLOSED') return 'hover:bg-gray-50 hover:text-gray-500 hover:border-gray-200';
  return '';
}

// Returns the small "what's happening" hint shown on each citizen card
function getStatusHint(status) {
  if (status === 'OPEN')        return { text: 'Awaiting officer review',    dot: 'bg-orange-400' };
  if (status === 'IN_PROGRESS') return { text: 'Officer is working on this', dot: 'bg-yellow-400' };
  if (status === 'RESOLVED')    return { text: 'Issue resolved by officer',  dot: 'bg-green-500'  };
  if (status === 'CLOSED')      return { text: 'Issue closed',               dot: 'bg-slate-400'  };
  if (status === 'DELETED')     return { text: 'Removed by admin',           dot: 'bg-red-500'    };
  return { text: 'Awaiting officer review', dot: 'bg-orange-400' };
}

// Returns just the filename (last segment of the URL path)
function getFileNameFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

function isImageUrl(url) {
  const name = getFileNameFromUrl(url).toLowerCase();
  if (name.endsWith('.jpg'))  return true;
  if (name.endsWith('.jpeg')) return true;
  if (name.endsWith('.png'))  return true;
  if (name.endsWith('.gif'))  return true;
  return false;
}

function isVideoUrl(url) {
  const name = getFileNameFromUrl(url).toLowerCase();
  if (name.endsWith('.mp4')) return true;
  if (name.endsWith('.avi')) return true;
  if (name.endsWith('.mov')) return true;
  return false;
}

// ── Citizen card view ─────────────────────────────────────────
function CitizenIssueCard({ issue }) {
  let issueId = issue.issueId;
  if (!issueId) {
    issueId = issue.id;
  }

  let mediaUrls = [];
  if (issue.mediaUrls) {
    mediaUrls = issue.mediaUrls;
  }

  // Count images and videos with a simple loop
  let imageCount = 0;
  let videoCount = 0;
  for (let i = 0; i < mediaUrls.length; i++) {
    if (isImageUrl(mediaUrls[i])) imageCount = imageCount + 1;
    if (isVideoUrl(mediaUrls[i])) videoCount = videoCount + 1;
  }

  const isDeleted = issue.deletionReason ? true : false;

  let hint;
  if (isDeleted) {
    hint = getStatusHint('DELETED');
  } else {
    hint = getStatusHint(issue.status);
  }

  let statusForBadge = issue.status;
  if (isDeleted) {
    statusForBadge = 'DELETED';
  }

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
        <StatusBadge status={statusForBadge} />
      </div>

      {/* Location + date */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748b] mt-2">
        {issue.location && (
          <span className="flex items-center gap-1"><MapPin size={11} /> {issue.location}</span>
        )}
        <span className="flex items-center gap-1"><Calendar size={11} /> {formatDateTime(issue.createdAt)}</span>
      </div>

      {/* Deletion banner — shown only for issues an admin removed */}
      {isDeleted && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertOctagon size={14} className="text-red-600 mt-0.5 shrink-0" />
          <div className="text-xs text-red-700 leading-relaxed">
            <span className="font-semibold">Removed by admin.</span>
            {issue.deletionReason && (
              <> Reason: <span className="font-medium">{issue.deletionReason}</span></>
            )}
          </div>
        </div>
      )}

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
  const { canManageIssues, isCitizen, isAgencyOfficer } = useRole();
  const { user } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [statusModal, setStatusModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  async function loadIssues() {
    if (mine && !user?.userId) return;
    setIsLoading(true);
    try {
      const res = mine
        ? await issuesApi.getIssuesByCitizen(user?.userId)
        : await issuesApi.getIssues();
      setIssues(res.data);
    } catch {
      setIssues([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadIssues();
  }, [mine, user?.userId]);

  const handleConfirmDelete = async () => {
    const reason = deleteReason.trim();
    if (reason.length < 5) {
      toast.error('Please enter a reason (at least 5 characters)');
      return;
    }
    setDeleteLoading(true);
    try {
      await issuesApi.deleteIssue(deleteTarget?.issueId, reason);
      await loadIssues();
      toast.success('Issue deleted');
      setDeleteTarget(null);
      setDeleteReason('');
    } catch (error) {
      const message = error.response?.data?.message
        || error.response?.data?.messages?.reason
        || error.message
        || 'Failed to delete issue';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setStatusLoading(true);
    try {
      await issuesApi.updateIssueStatus(selectedIssue?.issueId, newStatus);
      await loadIssues();
      toast.success('Status updated');
      setStatusModal(false);
      setSelectedIssue(null);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update status';
      console.error('Status update error:', message, error);
      toast.error(message);
    } finally {
      setStatusLoading(false);
    }
  };

  // Apply filters with a simple loop
  const filtered = [];
  for (let i = 0; i < issues.length; i++) {
    const it = issues[i];
    if (filterStatus !== '' && it.status !== filterStatus) continue;
    if (filterType !== '' && it.type !== filterType) continue;
    filtered.push(it);
  }

  // Count how many issues exist per status (used by the filter pills)
  function countByStatus(status) {
    let count = 0;
    for (let i = 0; i < issues.length; i++) {
      if (issues[i].status === status) count = count + 1;
    }
    return count;
  }

  // ── CITIZEN "MY ISSUES" VIEW ──────────────────────────────
  if (mine && isCitizen) {
    // Build the list of pill options: '' (All), then every issue status
    const pillOptions = [''];
    for (let i = 0; i < ISSUE_STATUSES.length; i++) {
      pillOptions.push(ISSUE_STATUSES[i]);
    }

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
          {pillOptions.map((s) => {
            const isSelected = filterStatus === s;
            let pillClass;
            if (isSelected) {
              pillClass = getStatusPillActiveClass(s) + ' ring-2 ring-offset-1 ring-forest-600/30';
            } else {
              pillClass = 'bg-white text-[#64748b] border-[#cbd5e1] ' + getStatusPillHoverClass(s);
            }
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={'px-3 py-1.5 rounded-full text-xs font-medium border transition-all ' + pillClass}
              >
                {s === '' ? 'All' : labelify(s)}
                {s !== '' && (
                  <span className="ml-1.5 font-bold">
                    ({countByStatus(s)})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Issue cards */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-24 bg-earth-100 rounded-2xl animate-pulse" />
            <div className="h-24 bg-earth-100 rounded-2xl animate-pulse" />
            <div className="h-24 bg-earth-100 rounded-2xl animate-pulse" />
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
            {filtered.map((issue) => {
              let key = issue.issueId;
              if (!key) key = issue.id;
              return <CitizenIssueCard key={key} issue={issue} />;
            })}
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
    { key: 'status',     label: 'Status',      render: r => <StatusBadge status={r.deletionReason ? 'DELETED' : r.status} /> },
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
              <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => { setDeleteTarget(r); setDeleteReason(''); }}>
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
          isCitizen && (
            <Link to="/issues/new">
              <Button>
                <Plus size={16} /> Report Issue
              </Button>
            </Link>
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

      {/* Delete Modal — reason required, soft-deletes and shows on citizen card */}
      <Modal
        open={!!deleteTarget}
        onClose={() => { if (!deleteLoading) { setDeleteTarget(null); setDeleteReason(''); } }}
        title={`Delete Issue #${deleteTarget?.issueId}`}
        size="sm"
      >
        <p className="text-sm text-bark-600 mb-2">
          Deleting <span className="font-semibold">&ldquo;{deleteTarget?.title}&rdquo;</span>. The reporting citizen will see this in their dashboard along with the reason below.
        </p>
        <label className="block text-xs font-medium text-bark-600 mb-1.5">
          Reason <span className="text-danger">*</span>
        </label>
        <textarea
          className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-danger/30 min-h-[88px]"
          placeholder="e.g. Duplicate of issue #12, or insufficient evidence to proceed."
          value={deleteReason}
          onChange={e => setDeleteReason(e.target.value)}
          maxLength={500}
          autoFocus
        />
        <p className="text-xs text-bark-400 mb-4">{deleteReason.trim().length}/500 — minimum 5 characters.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => { setDeleteTarget(null); setDeleteReason(''); }} disabled={deleteLoading}>Cancel</Button>
          <Button
            className="bg-danger hover:bg-danger/90 text-white"
            onClick={handleConfirmDelete}
            loading={deleteLoading}
            disabled={deleteReason.trim().length < 5}
          >
            Delete
          </Button>
        </div>
      </Modal>

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
          <Button onClick={handleUpdateStatus} loading={statusLoading}>Update</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
