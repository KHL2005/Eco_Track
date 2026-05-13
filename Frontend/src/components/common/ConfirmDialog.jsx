import Modal from './Modal';
import Button from './Button';
import PropTypes from 'prop-types';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading, confirmLabel = 'Delete', variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-bark-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  confirmLabel: PropTypes.string,
  variant: PropTypes.string,
};

