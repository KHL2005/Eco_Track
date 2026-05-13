import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Plus, FileText } from 'lucide-react';
import * as reportsApi from '../../api/reportsApi';
import { useRole } from '../../hooks/useRole';
import { formatDateTime } from '../../utils/formatters';
import { REPORT_SCOPES } from '../../utils/constants';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { canManageIssues, isAdmin, isAgencyOfficer, isScientist, isIndustry } = useRole();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [view, setView] = useState(null);
  const [form, setForm] = useState({ title: '', scope: 'ISSUE', description: '', content: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Mirror the API Gateway's per-role allow-list so we don't fire forbidden requests.
  const canViewReports = isAdmin || isAgencyOfficer || isScientist || isIndustry;

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getReports().then(r => r.data).catch(() => []),
    enabled: canViewReports,
  });

  const createMut = useMutation({
    mutationFn: (d) => reportsApi.createReport(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); toast.success('Report generated'); setModal(false); },
    onError: () => toast.error('Failed to generate report'),
  });

   const columns = [
     { key: 'reportId', label: '#', render: r => <span className="text-xs text-bark-400">#{r.reportId}</span> },
     { key: 'scope', label: 'Scope', render: r => <span className="text-xs px-2 py-0.5 rounded-full bg-earth-100 text-bark-600">{r.scope}</span> },
     { key: 'generatedDate', label: 'Generated Date', render: r => <span className="text-xs text-bark-400">{formatDateTime(r.generatedDate)}</span> },
     { label: 'Actions', render: r => <Button size="sm" variant="ghost" onClick={() => setView(r)}><FileText size={14} /> View</Button> },
   ];

  return (
    <DashboardLayout>
      <PageHeader emoji="📜" title="Reports" description="Analytics and sustainability reports"
        action={canManageIssues && <Button onClick={() => setModal(true)}><Plus size={16} /> Generate Report</Button>}
      />

      {canViewReports && (isLoading || reports.length > 0) && (
        <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
          <DataTable columns={columns} data={reports} loading={isLoading} searchable={false} />
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Generate Report" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Report Title</label>
            <input className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.title} onChange={set('title')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Scope</label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.scope} onChange={set('scope')}>
              {REPORT_SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Description</label>
            <textarea rows={2} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.description} onChange={set('description')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Report Content / Summary</label>
            <textarea rows={5} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.content} onChange={set('content')} placeholder="Enter report content, findings, or summary…" />
          </div>
           <div className="flex gap-3 justify-end">
             <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
             <Button onClick={() => createMut.mutate({ scope: form.scope, metrics: form.content })} loading={createMut.isPending}>Generate</Button>
           </div>
        </div>
      </Modal>

       {/* View Modal */}
       <Modal open={!!view} onClose={() => setView(null)} title={`Report #${view?.reportId || ''}`} size="lg">
         {view && (
           <div className="space-y-3">
             <div className="flex items-center gap-3">
               <span className="text-xs px-2 py-0.5 rounded-full bg-earth-100 text-bark-600">{view.scope}</span>
               <span className="text-xs text-bark-400">{formatDateTime(view.generatedDate)}</span>
             </div>
             <div className="bg-earth-100 rounded-xl p-4 text-sm text-bark-800 whitespace-pre-wrap max-h-64 overflow-y-auto">{view.metrics || 'No metrics.'}</div>
           </div>
         )}
       </Modal>
    </DashboardLayout>
  );
}
