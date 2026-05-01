import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FileUpload from '../components/FileUpload';
import { Plus, ExternalLink, Download } from 'lucide-react';
import * as emissionsApi from '../api/emissionsApi';
import { useRole } from '../hooks/useRole';
import { formatDateTime, labelify } from '../utils/formatters';
import { DOC_TYPES } from '../utils/constants';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { isIndustry, isAdmin, isOfficer } = useRole();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ industryId: '', industryName: '', docType: 'PERMIT', description: '' });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => emissionsApi.getDocuments().then(r => r.data).catch(() => []),
  });

  const submitMut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('industryId', form.industryId);
      fd.append('industryName', form.industryName);
      fd.append('docType', form.docType);
      if (form.description) fd.append('description', form.description);
      fd.append('file', file);
      return emissionsApi.submitDocument(fd, e => setProgress(Math.round(e.loaded / e.total * 100)));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document submitted'); setModal(false); setProgress(0); setFile(null); },
    onError: () => { toast.error('Upload failed'); setProgress(0); },
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, status }) => emissionsApi.verifyDocument(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document updated'); },
  });

  const columns = [
    { key: 'id', label: '#', render: r => <span className="text-xs text-bark-400">#{r.id}</span> },
    { key: 'industryName', label: 'Industry', sortable: true },
    { key: 'docType', label: 'Type', render: r => <span className="text-xs font-medium">{r.docType}</span> },
    { key: 'fileName', label: 'File', render: r => <span className="text-xs text-bark-600 truncate max-w-[120px] block">{r.fileName}</span> },
    { key: 'verificationStatus', label: 'Status', render: r => <StatusBadge status={r.verificationStatus} /> },
    { key: 'uploadedAt', label: 'Uploaded', render: r => <span className="text-xs text-bark-400">{formatDateTime(r.uploadedAt)}</span> },
    {
      label: 'Actions', render: (r) => (
        <div className="flex items-center gap-1">
          <a href={emissionsApi.getDocumentViewUrl(r.id)} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost"><ExternalLink size={13} /></Button>
          </a>
          <a href={emissionsApi.getDocumentDownloadUrl(r.id)} download>
            <Button size="sm" variant="ghost"><Download size={13} /></Button>
          </a>
          {(isAdmin || isOfficer) && r.verificationStatus === 'SUBMITTED' && (
            <>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => verifyMut.mutate({ id: r.id, status: 'APPROVED' })}>Approve</Button>
              <Button size="sm" variant="danger" className="text-xs" onClick={() => verifyMut.mutate({ id: r.id, status: 'REJECTED' })}>Reject</Button>
            </>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Industry Documents" description="Permits, compliance documents, and certificates"
        action={(isIndustry || isAdmin) && <Button onClick={() => setModal(true)}><Plus size={16} /> Upload Document</Button>}
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={docs} loading={isLoading} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Submit Compliance Document" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[['industryId', 'Industry ID', 'number'], ['industryName', 'Industry Name', 'text']].map(([k, label, type]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
                <input type={type} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                  value={form[k]} onChange={set(k)} />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Document Type</label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.docType} onChange={set('docType')}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Description</label>
            <input className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.description} onChange={set('description')} />
          </div>
          <FileUpload onFile={setFile} accept=".pdf" label="Upload PDF (max 10 MB)" progress={progress} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={() => submitMut.mutate()} loading={submitMut.isPending} disabled={!file}>Submit</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

