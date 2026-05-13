import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import * as usersApi from '../../api/usersApi';
import { ROLE_LABELS } from '../../utils/constants';
import { toast } from 'sonner';
import { User, Mail, Phone, Shield, Lock, Pencil } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { role } = useRole();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setPwForm(f => ({ ...f, [k]: e.target.value }));

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleProfileChange = (k) => (e) => setProfileForm(f => ({ ...f, [k]: e.target.value }));

  const updateProfileMutation = useMutation({
    mutationFn: (data) => usersApi.updateOwnProfile({
      name: data.name,
      phoneNumber: data.phone
    }),
    onSuccess: (res) => {
      setUser({ ...user, ...res.data.data });
      setEditing(false);
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update profile.'),
  });

  const handleEditProfile = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  };

  const changePw = useMutation({
    mutationFn: () => usersApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    onSuccess: () => { toast.success('Password changed successfully'); setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to change password'),
  });

  const handleChangePw = () => {
    const e = {};
    if (!pwForm.currentPassword) e.currentPassword = 'Required';
    if (!pwForm.newPassword || pwForm.newPassword.length < 8) e.newPassword = 'Min 8 characters';
    if (pwForm.newPassword !== pwForm.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length === 0) changePw.mutate();
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <PageHeader emoji="👤" title="My Profile" description="Account information and settings" />

        <Card className="mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-forest-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-bark-800">{user?.name}</h2>
              <span className="text-sm text-forest-600">{ROLE_LABELS[role] || role}</span>
            </div>
            {!editing && (
              <button
                className="ml-auto text-bark-400 hover:text-forest-600 p-2 rounded-full"
                title="Edit Profile"
                onClick={handleEditProfile}
              >
                <Pencil size={18} />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {editing ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-earth-100 rounded-xl">
                  <User size={16} className="text-bark-400" />
                  <div className="flex flex-col w-full">
                    <label className="text-xs text-bark-400">Full Name</label>
                    <input
                      className="border rounded px-2 py-1 text-sm mt-1"
                      value={profileForm.name}
                      onChange={handleProfileChange('name')}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-earth-100 rounded-xl">
                  <Mail size={16} className="text-bark-400" />
                  <div className="flex flex-col w-full">
                    <label className="text-xs text-bark-400">Email</label>
                    <input
                      className="border rounded px-2 py-1 text-sm mt-1"
                      value={profileForm.email}
                      disabled
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-earth-100 rounded-xl">
                  <Phone size={16} className="text-bark-400" />
                  <div className="flex flex-col w-full">
                    <label className="text-xs text-bark-400">Phone</label>
                    <input
                      className="border rounded px-2 py-1 text-sm mt-1"
                      value={profileForm.phone}
                      onChange={handleProfileChange('phone')}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={handleSaveProfile} loading={updateProfileMutation.isLoading}>
                    Save
                  </Button>
                  <Button variant="secondary" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              [
                { icon: User, label: 'Full Name', value: user?.name },
                { icon: Mail, label: 'Email', value: user?.email },
                { icon: Phone, label: 'Phone', value: user?.phone },
                { icon: Shield, label: 'Role', value: ROLE_LABELS[role] || role },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-earth-100 rounded-xl">
                  <Icon size={16} className="text-bark-400" />
                  <div>
                    <p className="text-xs text-bark-400">{label}</p>
                    <p className="text-sm font-medium text-bark-800">{value || '—'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-bark-400" />
            <h3 className="font-semibold text-bark-800">Change Password</h3>
          </div>
          <div className="space-y-4">
            {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirm', 'Confirm New Password']].map(([k, label]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
                <input type="password"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 ${errors[k] ? 'border-danger' : 'border-bark-400/20'}`}
                  value={pwForm[k]} onChange={set(k)} />
                {errors[k] && <p className="text-xs text-danger mt-1">{errors[k]}</p>}
              </div>
            ))}
            <Button onClick={handleChangePw} loading={changePw.isPending}>Update Password</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
