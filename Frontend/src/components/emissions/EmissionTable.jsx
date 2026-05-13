import { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import ConfirmModal from '../common/ConfirmModal';
import { EmptyState } from '../common/Feedback';

export default function EmissionTable({ emissions, loading: tableLoading, onDelete, onApprove, onReject, showCompany = false }) {
  const [modal, setModal] = useState({ open: false, id: null, action: '', loading: false });

  const openModal = (id, action) => setModal({ open: true, id, action, loading: false });

  const handleConfirm = async () => {
    setModal(m => ({ ...m, loading: true }));
    try {
      if (modal.action === 'delete') await onDelete(modal.id);
      else if (modal.action === 'approve') await onApprove(modal.id);
      else if (modal.action === 'reject') await onReject(modal.id);
    } finally {
      setModal({ open: false, id: null, action: '', loading: false });
    }
  };

  const actionLabels = { delete: 'Delete', approve: 'Approve', reject: 'Reject' };
  const actionMessages = {
    delete: 'Are you sure you want to delete this emission log? This action cannot be undone.',
    approve: 'Are you sure you want to approve this emission? This action cannot be undone.',
    reject: 'Are you sure you want to reject this emission? This action cannot be undone.',
  };

  if (!tableLoading && (!emissions || emissions.length === 0)) {
    return <EmptyState message="No emissions logged yet." />;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg text-text-muted text-left">
              <th className="px-4 py-3 font-medium">#</th>
              {showCompany && <th className="px-4 py-3 font-medium">Company</th>}
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {emissions.map((e, i) => (
              <tr key={e.logId} className="border-t border-gray-50 hover:bg-bg/50 transition-colors">
                <td className="px-4 py-3 text-text-muted">{i + 1}</td>
                {showCompany && <td className="px-4 py-3 font-medium text-text">{e.industryName}</td>}
                <td className="px-4 py-3 text-text">{e.type}</td>
                <td className="px-4 py-3 text-text">{Number(e.quantity).toLocaleString()}</td>
                <td className="px-4 py-3 text-text-muted">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Officer: approve/reject */}
                    {onApprove && e.status === 'SUBMITTED' && (
                      <>
                        <button onClick={() => openModal(e.logId, 'approve')} className="px-3 py-1.5 rounded-lg bg-accent/10 text-primary text-xs font-semibold hover:bg-accent/20 transition-colors cursor-pointer">Approve</button>
                        <button onClick={() => openModal(e.logId, 'reject')} className="px-3 py-1.5 rounded-lg bg-error-light text-error text-xs font-semibold hover:bg-error/20 transition-colors cursor-pointer">Reject</button>
                      </>
                    )}
                    {onApprove && e.status !== 'SUBMITTED' && (
                      <span className="text-xs text-text-muted italic">Done</span>
                    )}
                    {/* Industry: delete */}
                    {onDelete && (
                      <button
                        onClick={() => openModal(e.logId, 'delete')}
                        disabled={e.status !== 'SUBMITTED'}
                        className="p-1.5 rounded-lg text-error/60 hover:bg-error-light hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title={e.status !== 'SUBMITTED' ? 'Cannot delete' : 'Delete'}
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
        open={modal.open}
        title={`${actionLabels[modal.action] || 'Confirm'} Emission`}
        message={actionMessages[modal.action] || ''}
        confirmLabel={actionLabels[modal.action]}
        confirmColor={modal.action === 'reject' || modal.action === 'delete' ? 'red' : 'green'}
        onConfirm={handleConfirm}
        onCancel={() => setModal({ open: false, id: null, action: '', loading: false })}
        loading={modal.loading}
      />
    </>
  );
}

