import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Trash2, Eye, Filter } from 'lucide-react';
import * as issuesApi from '../api/issuesApi';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, labelify } from '../utils/formatters';
import { ISSUE_STATUSES, ISSUE_TYPES } from '../utils/constants';
import { toast } from 'sonner';

export default function IssuesPage({ mine = false }) {
  const { canManageIssues, isCitizen } = useRole();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

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

  const filtered = issues.filter(i => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterType && i.type !== filterType) return false;
    return true;
  });

  const columns = [
    { key: 'id', label: '#', sortable: true, render: r => <span className="text-bark-400 text-xs">#{r.id}</span> },
    { key: 'title', label: 'Title', sortable: true, render: r => (
      <Link to={`/issues/${r.id}`} className="font-medium text-forest-600 hover:text-forest-700 hover:underline">{r.title}</Link>
    )},
    { key: 'type', label: 'Type', render: r => <span className="text-xs text-bark-600">{labelify(r.type)}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'citizenName', label: 'Reported By', sortable: true },
    { key: 'createdAt', label: 'Date', sortable: true, render: r => <span className="text-xs text-bark-400">{formatDateTime(r.createdAt)}</span> },
    {
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Link to={`/issues/${r.id}`}><Button size="sm" variant="ghost"><Eye size={14} /></Button></Link>
          {canManageIssues && (
            <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => setDeleteTarget(r)}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
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
        onConfirm={() => deleteMut.mutate(deleteTarget?.id)}
        title="Delete Issue"
        message={`Are you sure you want to delete issue "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={deleteMut.isPending}
      />
    </DashboardLayout>
  );
}

