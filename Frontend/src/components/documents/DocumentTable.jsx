import { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import ConfirmModal from '../common/ConfirmModal';
import { EmptyState } from '../common/Feedback';
import { getDocumentViewUrl, getDocumentDownloadUrl } from '../../api/emissionsApi';

export default function DocumentTable({ documents, loading: tableLoading, onDelete, onApprove, onReject, showCompany = false }) {

  // Separate state variables for the confirm modal — one per piece of information
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  function openConfirmModal(id, action) {
    setSelectedDocId(id);
    setSelectedAction(action);
    setIsModalOpen(true);
  }

  function closeConfirmModal() {
    setIsModalOpen(false);
    setSelectedDocId(null);
    setSelectedAction('');
    setIsActionLoading(false);
  }

  async function handleConfirm() {
    setIsActionLoading(true);
    try {
      if (selectedAction === 'delete') {
        await onDelete(selectedDocId);
      } else if (selectedAction === 'approve') {
        await onApprove(selectedDocId);
      } else if (selectedAction === 'reject') {
        await onReject(selectedDocId);
      }
    } finally {
      closeConfirmModal();
    }
  }

  const actionLabels = { delete: 'Delete', approve: 'Approve', reject: 'Reject' };
  const actionMessages = {
    delete: 'Are you sure you want to delete this document? The PDF will also be permanently removed.',
    approve: 'Are you sure you want to approve this document? This action cannot be undone.',
    reject: 'Are you sure you want to reject this document? This action cannot be undone.',
  };

  if (!tableLoading && (!documents || documents.length === 0)) {
    return <EmptyState message="No documents uploaded yet." />;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg text-text-muted text-left">
              <th className="px-4 py-3 font-medium">#</th>
              {showCompany && <th className="px-4 py-3 font-medium">Company</th>}
              <th className="px-4 py-3 font-medium">Doc Type</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={doc.documentId} className="border-t border-gray-50 hover:bg-bg/50 transition-colors">
                <td className="px-4 py-3 text-text-muted">{index + 1}</td>
                {showCompany && <td className="px-4 py-3 font-medium text-text">{doc.industryName}</td>}
                <td className="px-4 py-3 text-text">
                  <span className="px-2 py-0.5 bg-primary/5 text-primary text-xs font-medium rounded-md">{doc.docType}</span>
                </td>
                <td className="px-4 py-3 text-text-muted max-w-[200px] truncate">{doc.description || '—'}</td>
                <td className="px-4 py-3 text-text-muted">{new Date(doc.uploadedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3"><StatusBadge status={doc.verificationStatus} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">

                    {/* View PDF button */}
                    <a
                      href={getDocumentViewUrl(doc.documentId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-primary/60 hover:bg-accent/10 hover:text-primary transition-colors"
                      title="View PDF"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </a>

                    {/* Download PDF button */}
                    <a
                      href={getDocumentDownloadUrl(doc.documentId)}
                      className="p-1.5 rounded-lg text-primary/60 hover:bg-accent/10 hover:text-primary transition-colors"
                      title="Download"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </a>

                    {/* Compliance officer: approve and reject buttons */}
                    {onApprove && doc.verificationStatus === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => openConfirmModal(doc.documentId, 'approve')}
                          className="px-2.5 py-1 rounded-lg bg-accent/10 text-primary text-xs font-semibold hover:bg-accent/20 transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openConfirmModal(doc.documentId, 'reject')}
                          className="px-2.5 py-1 rounded-lg bg-error-light text-error text-xs font-semibold hover:bg-error/20 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {onApprove && doc.verificationStatus !== 'SUBMITTED' && (
                      <span className="text-xs text-text-muted italic">Done</span>
                    )}

                    {/* Industry user: delete button */}
                    {onDelete && (
                      <button
                        onClick={() => openConfirmModal(doc.documentId, 'delete')}
                        disabled={doc.verificationStatus !== 'SUBMITTED'}
                        className="p-1.5 rounded-lg text-error/60 hover:bg-error-light hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title={doc.verificationStatus !== 'SUBMITTED' ? 'Cannot delete' : 'Delete'}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={isModalOpen}
        title={`${actionLabels[selectedAction] || 'Confirm'} Document`}
        message={actionMessages[selectedAction] || ''}
        confirmLabel={actionLabels[selectedAction]}
        confirmColor={selectedAction === 'reject' || selectedAction === 'delete' ? 'red' : 'green'}
        onConfirm={handleConfirm}
        onCancel={closeConfirmModal}
        loading={isActionLoading}
      />
    </>
  );
}
