import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';
import ChangePasswordModal from '../../components/ChangePasswordModal';

const ROLE_FEATURES = {
  SUPER_ADMIN: [
    'User Management', 'All Issues', 'All Sensors & Analysis',
    'All Projects', 'Compliance & Audits', 'System Configuration',
  ],
  ADMINISTRATOR: [
    'User Management', 'All Issues', 'All Sensors & Analysis',
    'All Projects', 'Compliance & Audits',
  ],
  OFFICER: [
    'Assigned Issues', 'Resolve Issues', 'Compliance Reviews', 'Audits',
  ],
  SCIENTIST: [
    'Sensors', 'Sensor Data', 'Analysis Reports', 'Environmental Monitoring',
  ],
  INDUSTRY: [
    'Emission Logs', 'Industry Documents', 'Compliance Status',
  ],
  CITIZEN: [
    'Report Issues', 'My Issues', 'Track Resolutions',
  ],
};

const FEATURE_ROUTES = {
  'User Management': '/user-management',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const features = ROLE_FEATURES[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFeatureClick = (feature) => {
    const route = FEATURE_ROUTES[feature];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h3>🌿 EcoTrack Dashboard</h3>
        <div className="user-info">
          <span>{user?.name}</span>
          <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          <button className="btn-logout" onClick={() => setShowChangePassword(true)}>
            <FiLock style={{ marginRight: 4 }} /> Change Password
          </button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-body">
        <h2>Welcome, {user?.name}!</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>
          You are logged in as <strong>{user?.role}</strong>. Here's what you can do:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {features.map((feature) => (
            <div key={feature} onClick={() => handleFeatureClick(feature)} style={{
              background: '#fff', padding: 24, borderRadius: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
              border: '1px solid #e8e8e8', transition: 'transform 0.2s',
            }}>
              <h4 style={{ color: '#1a5e1a', marginBottom: 8 }}>{feature}</h4>
              <p style={{ color: '#999', fontSize: 13 }}>
                {FEATURE_ROUTES[feature] ? 'Click to open' : 'Coming soon'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
