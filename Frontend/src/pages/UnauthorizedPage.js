import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h1 style={{ fontSize: 72, color: '#c00' }}>403</h1>
      <h2>Access Denied</h2>
      <p style={{ color: '#666', margin: '16px 0' }}>You don't have permission to access this page.</p>
      <Link to="/dashboard" style={{ color: '#0f9b0f', fontWeight: 600 }}>Go to Dashboard</Link>
    </div>
  );
}

