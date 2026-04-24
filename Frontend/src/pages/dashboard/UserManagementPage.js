import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiTrash2, FiUserPlus, FiArrowLeft, FiLock } from 'react-icons/fi';
import userApi from '../../api/userApi';
import ChangePasswordModal from '../../components/ChangePasswordModal';

const ROLES = ['SUPER_ADMIN', 'ADMINISTRATOR', 'OFFICER', 'SCIENTIST', 'INDUSTRY', 'CITIZEN'];

export default function UserManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'CITIZEN',
  });
  const [showChangePassword, setShowChangePassword] = useState(false);

  const assignableRoles = user?.role === 'SUPER_ADMIN'
    ? ROLES
    : ['OFFICER', 'SCIENTIST', 'INDUSTRY', 'CITIZEN'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAllUsers();
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);
    try {
      await userApi.createUser(form);
      setSuccess(`User "${form.name}" created successfully!`);
      setForm({ name: '', email: '', password: '', phone: '', role: 'CITIZEN' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await userApi.deleteUser(id);
      setSuccess(`User "${name}" deleted.`);
      setUsers(users.filter((u) => u.userId !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h3>🌿 User Management</h3>
        <div className="user-info">
          <span>{user?.name}</span>
          <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          <button className="btn-logout" onClick={() => setShowChangePassword(true)}>
            <FiLock style={{ marginRight: 4 }} /> Change Password
          </button>
          <button className="btn-logout" onClick={() => navigate('/dashboard')}>
            <FiArrowLeft style={{ marginRight: 4 }} /> Back
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>All Users</h2>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}
            onClick={() => setShowForm(!showForm)}>
            <FiUserPlus style={{ marginRight: 6 }} />
            {showForm ? 'Cancel' : 'Create User'}
          </button>
        </div>

        {showForm && (
          <div className="create-user-card">
            <h3 style={{ marginBottom: 16, color: '#1a5e1a' }}>Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="Enter full name" required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="Enter email" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input name="password" type={showPassword ? 'text' : 'password'}
                      value={form.password} onChange={handleChange}
                      placeholder="Enter password" required />
                    <span onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '10px', top: '50%',
                        transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '18px',
                      }}>
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone (optional)</label>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="Enter phone number" />
                </div>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handleChange} required>
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={formLoading}
                style={{ marginTop: 8 }}>
                {formLoading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                    <td><span className={`status-badge ${u.status?.toLowerCase()}`}>{u.status}</span></td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <button className="btn-icon-delete" title="Delete user"
                        onClick={() => handleDeleteUser(u.userId, u.name)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}

