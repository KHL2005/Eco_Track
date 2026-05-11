import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FileUpload from '../components/FileUpload';
import { Plus, Download, Trash2, FileText } from 'lucide-react';
import * as emissionsApi from '../api/emissionsApi';
import { useRole } from '../hooks/useRole';
import { formatDateTime } from '../utils/formatters';
import { DOC_TYPES } from '../utils/constants';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { isIndustry, isAdmin, isComplianceOfficer } = useRole();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ registrationNumber: '', industryName: '', docType: 'PERMIT', description: '' });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const closeModal = () => { setModal(false); setForm({ registrationNumber: '', industryName: '', docType: 'PERMIT', description: '' }); setFile(null); setProgress(0); };

  const handleDownloadPdf = async (docId, fileName) => {
    try {
      const res = await emissionsApi.downloadDocumentBlob(docId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `document-${docId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      toast.error('Failed to download document');
    }
  };

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => emissionsApi.getDocuments().then(r => r.data).catch(() => []),
  });

  const submitMut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('registrationNumber', form.registrationNumber);
      fd.append('industryName', form.industryName);
      fd.append('docType', form.docType);
      fd.append('description', form.description);
      fd.append('file', file);
      return emissionsApi.submitDocument(fd, e => setProgress(Math.round(e.loaded / e.total * 100)));
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document submitted'); closeModal(); },
    onError: () => { toast.error('Upload failed'); setProgress(0); },
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, status }) => emissionsApi.verifyDocument(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: (docId) => emissionsApi.deleteDocument(docId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['documents'] }); toast.success('Document deleted'); },
    onError: () => toast.error('Failed to delete document'),
  });

  const columns = [
    { key: 'documentId', label: 'ID', render: r => <span className="text-sm text-bark-700">{r.documentId}</span> },
    { key: 'industryName', label: 'Industry', sortable: true, render: r => <span className="text-sm text-bark-700">{r.industryName}</span> },
    { key: 'registrationNumber', label: 'Reg. Number', render: r => <code className="text-xs font-mono bg-bark-100 text-bark-700 px-1.5 py-0.5 rounded">{r.registrationNumber}</code> },
    { key: 'docType', label: 'Type', render: r => <span className="text-sm text-bark-700">{r.docType}</span> },
    { key: 'description', label: 'Description', render: r => <span title={r.description || ''} className="text-sm text-bark-600 truncate max-w-[120px] block">{r.description || '—'}</span> },
    { key: 'verificationStatus', label: 'Status', render: r => (
      <div className="flex flex-col gap-0.5">
        <StatusBadge status={r.verificationStatus} />
        {r.updatedAt && <span className="text-xs text-bark-400">{formatDateTime(r.updatedAt)}</span>}
      </div>
    )},
    { key: 'uploadedDate', label: 'Uploaded', render: r => <span className="text-sm text-bark-700">{formatDateTime(r.uploadedDate)}</span> },
    {
      label: 'Actions', render: (r) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="flex items-center gap-1 text-xs" onClick={() => handleDownloadPdf(r.documentId || r.id, r.fileName)} title="Download PDF"><Download size={13} />Download</Button>
          {(isAdmin || isComplianceOfficer) && r.verificationStatus === 'SUBMITTED' && (
            <>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => verifyMut.mutate({ id: r.documentId || r.id, status: 'APPROVED' })}>Approve</Button>
              <Button size="sm" variant="danger" className="text-xs" onClick={() => verifyMut.mutate({ id: r.documentId || r.id, status: 'REJECTED' })}>Reject</Button>
            </>
          )}
          {isIndustry && r.verificationStatus === 'SUBMITTED' && (
            <button
              onClick={() => deleteMut.mutate(r.documentId || r.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete document"
              disabled={deleteMut.isPending}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader emoji="📄" title="Industry Documents" description="Permits, compliance documents, and certificates"
        action={(isIndustry || isAdmin) && <Button onClick={() => setModal(true)}><Plus size={16} /> Upload Document</Button>}
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        {!isLoading && docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-bark-400 gap-3">
            <FileText size={40} className="opacity-30" />
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        ) : (
          <DataTable columns={columns} data={docs} loading={isLoading} />
        )}
      </div>

      <Modal open={modal} onClose={closeModal} title="Submit Compliance Document" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[['registrationNumber', 'Registration Number (e.g. TNPCB-IND-1023)', 'text'], ['industryName', 'Industry Name', 'text']].map(([k, label, type]) => (
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
              value={form.description} onChange={set('description')} required />
          </div>
          <FileUpload onFile={setFile} accept=".pdf" label="Upload PDF (max 10 MB)" progress={progress} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={() => submitMut.mutate()} loading={submitMut.isPending} disabled={!file || !form.registrationNumber.trim() || !form.industryName.trim() || !form.description.trim()}>Submit</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

