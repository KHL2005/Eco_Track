import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { Eye, Image, Film } from 'lucide-react';
import * as issuesApi from '../api/issuesApi';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, labelify } from '../utils/formatters';
import { ISSUE_STATUSES, ISSUE_TYPES } from '../utils/constants';

export default function CitizenIssues() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', 'citizen', user?.userId],
    queryFn: () => issuesApi.getIssuesByCitizen(user?.userId).then(r => r.data).catch(() => []),
    enabled: !!user?.userId,
  });

  const filtered = issues.filter(i => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterType && i.type !== filterType) return false;
    return true;
  });

   const columns = [
     { key: 'id', label: '#', sortable: true, render: r => <span className="text-bark-400 text-xs">#{r.id}</span> },
     { key: 'title', label: 'Title', sortable: true, render: r => (
       <Link to={`/citizen/issues/${r.id}`} className="font-medium text-forest-600 hover:text-forest-700 hover:underline">{r.title}</Link>
     )},
     { key: 'type', label: 'Type', render: r => <span className="text-xs text-bark-600">{labelify(r.type)}</span> },
     { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
     { key: 'media', label: 'Media', render: r => {
       if (!r.mediaUrls || r.mediaUrls.length === 0) return <span className="text-xs text-bark-300">—</span>;
       const images = r.mediaUrls.filter(url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url));
       const videos = r.mediaUrls.filter(url => /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url));
       return (
         <div className="flex items-center gap-2">
           {images.length > 0 && <span className="flex items-center gap-1 text-xs text-forest-600" title={`${images.length} image(s)`}><Image size={14} /> {images.length}</span>}
           {videos.length > 0 && <span className="flex items-center gap-1 text-xs text-blue-600" title={`${videos.length} video(s)`}><Film size={14} /> {videos.length}</span>}
         </div>
       );
     }},
     { key: 'createdAt', label: 'Date', sortable: true, render: r => <span className="text-xs text-bark-400">{formatDateTime(r.createdAt)}</span> },
     {
       label: 'Actions',
       render: (r) => (
         <div className="flex items-center gap-2">
           <Link to={`/citizen/issues/${r.id}`}><Button size="sm" variant="ghost"><Eye size={14} /></Button></Link>
         </div>
       )
     },
   ];

  return (
    <DashboardLayout>
      <PageHeader
        title="My Reported Issues"
        description="Track the status of issues you've reported"
        action={
          <Link to="/citizen/report"><Button>Report New Issue</Button></Link>
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
        <DataTable columns={columns} data={filtered} loading={isLoading} searchPlaceholder="Search your issues…" />
      </div>
    </DashboardLayout>
  );
}
