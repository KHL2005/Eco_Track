import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import * as usersApi from '../api/usersApi';
import { useRole } from '../hooks/useRole';
import { formatDateTime, labelify } from '../utils/formatters';
import { ROLES } from '../utils/constants';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const { role } = useRole();
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'AGENCY_OFFICER' });
  const [showCreatePw, setShowCreatePw] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', status: 'ACTIVE' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setE = (k) => (e) => setEditForm(f => ({ ...f, [k]: e.target.value }));

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers().then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: (d) => usersApi.createUser(d, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); setCreateModal(false); setShowCreatePw(false); setPwFocused(false); setForm({ name: '', email: '', password: '', phone: '', role: 'AGENCY_OFFICER' }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => usersApi.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); setEditTarget(null); },
    onError: () => toast.error('Failed to update user'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => usersApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete user'),
  });

  const columns = [
    { key: 'userId', label: 'ID', sortable: true, render: r => <span className="text-xs text-bark-400">{r.userId}</span> },
    { key: 'name', label: 'Name', sortable: true, render: r => <span className="font-medium">{r.name}</span> },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', render: r => <span className="text-xs px-2 py-0.5 rounded-full bg-forest-600/10 text-forest-700">{labelify(r.role)}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Joined', render: r => <span className="text-xs text-bark-400">{formatDateTime(r.createdAt)}</span> },
    {
      label: 'Actions', render: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => { setEditTarget(r); setEditForm({ name: r.name, phone: r.phone || '', status: r.status }); }}>
            <Edit size={13} />
          </Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteTarget(r)}>
            <Trash2 size={13} />
          </Button>
        </div>
      )
    },
  ];

  // Citizens self-register publicly; admins create all other roles
  const adminCreatableRoles = Object.values(ROLES).filter(r => r !== 'CITIZEN');

  return (
    <DashboardLayout>
      <PageHeader emoji="👥" title="User Management" description="Create and manage staff accounts"
        action={<Button onClick={() => setCreateModal(true)}><Plus size={16} /> Create User</Button>}
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={users} loading={isLoading} searchPlaceholder="Search users…" />
      </div>

      <Modal open={createModal} onClose={() => { setCreateModal(false); setShowCreatePw(false); setPwFocused(false); }} title="Create User" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Full Name</label>
              <input type="text" className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={form.name} onChange={set('name')} autoComplete="off" />
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Email</label>
              <input type="email" className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={form.email} onChange={set('email')} autoComplete="off" />
            </div>
            {/* Password — custom toggle, suppresses browser native reveal */}
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showCreatePw ? 'text' : 'password'}
                  className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                />
                {/* Only render toggle while password field is focused.
                    onMouseDown preventDefault stops the input from losing focus when clicking the button. */}
                {pwFocused && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-700 transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowCreatePw(v => !v)}
                    tabIndex={-1}
                  >
                    {showCreatePw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Phone</label>
              <input type="tel" className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={form.phone} onChange={set('phone')} autoComplete="off" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Role</label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.role} onChange={set('role')}>
              {adminCreatableRoles.map(r => <option key={r} value={r}>{labelify(r)}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => { setCreateModal(false); setShowCreatePw(false); setPwFocused(false); }}>Cancel</Button>
            <Button onClick={() => createMut.mutate(form)} loading={createMut.isPending}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User" size="sm">
        <div className="space-y-4">
          {[['name', 'Name'], ['phone', 'Phone']].map(([k, label]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
              <input className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={editForm[k]} onChange={setE(k)} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Status</label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={editForm.status} onChange={setE('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={() => updateMut.mutate({ id: editTarget?.userId, data: editForm })} loading={updateMut.isPending}>Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget?.userId)}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This cannot be undone.`}
        loading={deleteMut.isPending}
      />
    </DashboardLayout>
  );
}
