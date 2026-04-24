import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import userApi from '../api/userApi';

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await userApi.changePassword(form.currentPassword, form.newPassword);
      setSuccess('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const eyeToggle = (show, setShow) => (
    <span onClick={() => setShow(!show)}
      style={{
        position: 'absolute', right: '10px', top: '50%',
        transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '18px',
      }}>
      {show ? <FiEyeOff /> : <FiEye />}
    </span>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16, color: '#1a5e1a' }}>Change Password</h3>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showCurrentPw ? 'text' : 'password'} value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Enter current password" required />
              {eyeToggle(showCurrentPw, setShowCurrentPw)}
            </div>
          </div>
          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNewPw ? 'text' : 'password'} value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Enter new password" required />
              {eyeToggle(showNewPw, setShowNewPw)}
            </div>
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirmPw ? 'text' : 'password'} value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm new password" required />
              {eyeToggle(showConfirmPw, setShowConfirmPw)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button type="button" className="btn-primary" style={{ background: '#999' }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

