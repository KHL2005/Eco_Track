import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { ArrowLeft, Calendar, DollarSign, User, TreePine, Droplets, Wind, Plus, Edit, Trash2, AlertCircle, CheckCircle, Clock, Zap, Users, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as projectsApi from '../../api/projectsApi';
import { formatDate, formatCurrency, formatNumber } from '../../utils/formatters';
import { MILESTONE_STATUSES, IMPACT_STATUSES } from '../../utils/constants';
import { useRole } from '../../hooks/useRole';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const MILESTONE_COLOR = {
  PENDING: 'border-l-slate-400 bg-slate-50 hover:bg-slate-100',
  IN_PROGRESS: 'border-l-yellow-400 bg-yellow-50 hover:bg-yellow-100',
  COMPLETED: 'border-l-green-400 bg-green-50 hover:bg-green-100',
  DELAYED: 'border-l-red-400 bg-red-50 hover:bg-red-100',
};

const MILESTONE_BADGE_COLOR = {
  PENDING: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DELAYED: 'bg-red-100 text-red-700',
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canManageProjects } = useRole();

  // Milestones State
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [editMilestoneOpen, setEditMilestoneOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [deleteMilestoneId, setDeleteMilestoneId] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', date: '', status: 'PENDING' });

  // Impact State
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [impactForm, setImpactForm] = useState({
    metrics: {
      treesPlanted: null,
      areaRestoredHectares: null,
      co2ReducedTons: null,
      renewableEnergyKwh: null,
      wasteCollectedKg: null,
      waterBodiesCleaned: null,
      pollutionIncidentsResolved: null,
      peopleBenefited: null,
      awarenessSessionsConducted: null,
      volunteerEngagements: null,
      customMetrics: {},
      notes: '',
    },
    status: 'DRAFT',
  });

  // Data State
  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [impact, setImpact] = useState(null);
  const [impactLoading, setImpactLoading] = useState(true);

  // Loading states for mutations
  const [milestoneLoading, setMilestoneLoading] = useState(false);
  const [impactSaveLoading, setImpactSaveLoading] = useState(false);
  const [deleteImpactLoading, setDeleteImpactLoading] = useState(false);
  const [deleteMilestoneLoading, setDeleteMilestoneLoading] = useState(false);

  async function loadProject() {
    setProjectLoading(true);
    try {
      const r = await projectsApi.getProjectById(id);
      setProject(r.data);
    } catch {
      setProject(null);
    } finally {
      setProjectLoading(false);
    }
  }

  async function loadMilestones() {
    setMilestonesLoading(true);
    try {
      const r = await projectsApi.getMilestonesByProject(id);
      setMilestones(r.data);
    } catch {
      setMilestones([]);
    } finally {
      setMilestonesLoading(false);
    }
  }

  async function loadImpact() {
    setImpactLoading(true);
    try {
      const r = await projectsApi.getImpactByProject(id);
      setImpact(r.data);
    } catch {
      setImpact(null);
    } finally {
      setImpactLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
    loadMilestones();
    loadImpact();
  }, [id]);

  // Calculate progress based on milestones
  const progress = useMemo(() => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'COMPLETED').length;
    return Math.round((completed / milestones.length) * 100);
  }, [milestones]);

  // Prepare impact chart data
  const impactChartData = useMemo(() => {
    if (!impact?.metrics) return [];
    return [
      { name: 'Trees', value: impact.metrics.treesPlanted || 0, color: '#16a34a' },
      { name: 'Area (ha)', value: impact.metrics.areaRestoredHectares || 0, color: '#22c55e' },
      { name: 'CO₂ (t)', value: impact.metrics.co2ReducedTons || 0, color: '#0ea5e9' },
      { name: 'Energy (kWh)', value: impact.metrics.renewableEnergyKwh || 0, color: '#f59e0b' },
      { name: 'Waste (kg)', value: impact.metrics.wasteCollectedKg ? Math.round(impact.metrics.wasteCollectedKg / 100) : 0, color: '#8b5cf6' },
      { name: 'People', value: impact.metrics.peopleBenefited || 0, color: '#ec4899' },
    ].filter(d => d.value > 0);
  }, [impact]);

  async function handleAddMilestone(data) {
    setMilestoneLoading(true);
    try {
      await projectsApi.addMilestone(id, data);
      toast.success('Milestone created successfully');
      setMilestoneModalOpen(false);
      setMilestoneForm({ title: '', date: '', status: 'PENDING' });
      loadMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create milestone');
    } finally {
      setMilestoneLoading(false);
    }
  }

  async function handleUpdateMilestone(data) {
    setMilestoneLoading(true);
    try {
      await projectsApi.updateMilestone(editingMilestone.milestoneId, data);
      toast.success('Milestone updated successfully');
      setEditMilestoneOpen(false);
      setEditingMilestone(null);
      loadMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update milestone');
    } finally {
      setMilestoneLoading(false);
    }
  }

  async function handleDeleteMilestone(milestoneId) {
    setDeleteMilestoneLoading(true);
    try {
      await projectsApi.deleteMilestone(milestoneId);
      toast.success('Milestone deleted successfully');
      setDeleteMilestoneId(null);
      loadMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete milestone');
    } finally {
      setDeleteMilestoneLoading(false);
    }
  }

  async function handleAddOrUpdateImpact(data) {
    setImpactSaveLoading(true);
    try {
      await projectsApi.addOrUpdateImpact(id, data);
      toast.success('Impact metrics updated successfully');
      setImpactModalOpen(false);
      setImpactForm({
        metrics: {
          treesPlanted: null,
          areaRestoredHectares: null,
          co2ReducedTons: null,
          renewableEnergyKwh: null,
          wasteCollectedKg: null,
          waterBodiesCleaned: null,
          pollutionIncidentsResolved: null,
          peopleBenefited: null,
          awarenessSessionsConducted: null,
          volunteerEngagements: null,
          customMetrics: {},
          notes: '',
        },
        status: 'DRAFT',
      });
      loadImpact();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update impact');
    } finally {
      setImpactSaveLoading(false);
    }
  }

  async function handleDeleteImpact() {
    setDeleteImpactLoading(true);
    try {
      await projectsApi.deleteImpact(id);
      toast.success('Impact metrics deleted successfully');
      loadImpact();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete impact');
    } finally {
      setDeleteImpactLoading(false);
    }
  }

  // Handle edit milestone
  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      title: milestone.title,
      date: milestone.date,
      status: milestone.status,
    });
    setEditMilestoneOpen(true);
  };

  // Handle edit impact
  const handleEditImpact = () => {
    if (impact) {
      setImpactForm({
        metrics: impact.metrics || {},
        status: impact.status || 'DRAFT',
      });
    }
    setImpactModalOpen(true);
  };

  // Form handlers
  const handleMilestoneSubmit = () => {
    if (!milestoneForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!milestoneForm.date) {
      toast.error('Date is required');
      return;
    }

    if (editingMilestone) {
      handleUpdateMilestone(milestoneForm);
    } else {
      handleAddMilestone(milestoneForm);
    }
  };

  const handleImpactSubmit = () => {
    if (!impactForm.metrics || Object.keys(impactForm.metrics).length === 0) {
      toast.error('Please fill in at least one metric');
      return;
    }

    handleAddOrUpdateImpact({
      metrics: impactForm.metrics,
      status: impactForm.status,
    });
  };

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <div className="space-y-4">
            <div className="h-64 bg-earth-100 rounded-2xl animate-pulse" />
            <div className="h-40 bg-earth-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <p className="text-bark-600">Project not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft size={16} /> Back
        </Button>

        {/* Project Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-bark-800 mb-2 flex items-center gap-2"><span aria-hidden="true">🌳</span> <span>{project.title}</span></h1>
                <p className="text-sm text-bark-600 leading-relaxed max-w-2xl">{project.description}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <div className="grid sm:grid-cols-4 gap-4 text-sm text-bark-600 border-t border-bark-400/10 pt-4">
              {project.managerName && (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-forest-600" />
                  <span>{project.managerName}</span>
                </div>
              )}
              {project.startDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-forest-600" />
                  <span>{formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : 'Ongoing'}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-forest-600" />
                  <span>{formatCurrency(project.budget)}</span>
                </div>
              )}
              {milestones.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-forest-600" />
                  <span>{progress}% Complete</span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Progress Bar */}
        {milestones.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-bark-800">Project Progress</h3>
                <span className="text-sm font-bold text-forest-600">{progress}%</span>
              </div>
              <div className="w-full bg-bark-400/10 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-forest-600 to-leaf-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-bark-800">{milestones.filter(m => m.status === 'COMPLETED').length}</div>
                  <div className="text-bark-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-bark-800">{milestones.filter(m => m.status === 'IN_PROGRESS').length}</div>
                  <div className="text-bark-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-bark-800">{milestones.filter(m => m.status === 'PENDING').length}</div>
                  <div className="text-bark-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-bark-800">{milestones.filter(m => m.status === 'DELAYED').length}</div>
                  <div className="text-bark-600">Delayed</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Milestones Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-bark-800">Project Milestones</h2>
                <p className="text-xs text-bark-600 mt-1">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''} tracked</p>
              </div>
              {canManageProjects && (
                <Button size="sm" onClick={() => {
                  setEditingMilestone(null);
                  setMilestoneForm({ title: '', date: '', status: 'PENDING' });
                  setMilestoneModalOpen(true);
                }}>
                  <Plus size={16} className="mr-1" /> Add Milestone
                </Button>
              )}
            </div>

            {milestonesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-16 bg-earth-100 rounded-xl animate-pulse" />)}
              </div>
            ) : milestones.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={32} className="mx-auto text-bark-400 mb-2 opacity-50" />
                <p className="text-sm text-bark-600">No milestones yet. Add one to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <motion.div
                    key={m.milestoneId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center justify-between gap-4 p-4 rounded-xl border-l-4 transition-all ${MILESTONE_COLOR[m.status]}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-bark-800">{m.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${MILESTONE_BADGE_COLOR[m.status]}`}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-bark-600">Due: {formatDate(m.date)}</p>
                    </div>
                    {canManageProjects && (
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditMilestone(m)}
                          className="h-8 w-8"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteMilestoneId(m.milestoneId)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Impact Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {impactLoading ? (
            <Card>
              <div className="h-64 bg-earth-100 rounded-xl animate-pulse" />
            </Card>
          ) : impact ? (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-bark-800">Environmental Impact</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      impact.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                        impact.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' :
                          'bg-purple-100 text-purple-700'
                    }`}>
                      {impact.status}
                    </span>
                    <p className="text-xs text-bark-600">Updated: {formatDate(impact.updatedAt)}</p>
                  </div>
                </div>
                {canManageProjects && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleEditImpact}>
                      <Edit size={14} className="mr-1" /> Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* Impact Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {[
                  { icon: TreePine, label: 'Trees Planted', value: impact.metrics?.treesPlanted, unit: '' },
                  { icon: Leaf, label: 'Area Restored', value: impact.metrics?.areaRestoredHectares, unit: 'ha' },
                  { icon: Wind, label: 'CO₂ Reduced', value: impact.metrics?.co2ReducedTons, unit: 't' },
                  { icon: Zap, label: 'Renewable Energy', value: impact.metrics?.renewableEnergyKwh, unit: 'kWh' },
                  { icon: Users, label: 'People Benefited', value: impact.metrics?.peopleBenefited, unit: '' },
                  { icon: Droplets, label: 'Waste Collected', value: impact.metrics?.wasteCollectedKg, unit: 'kg' },
                ].map(({ icon: Icon, label, value, unit }) => (
                  value !== null && value !== undefined && value > 0 && (
                    <div key={label} className="bg-gradient-to-br from-earth-100 to-earth-50 rounded-xl p-3 text-center border border-bark-400/10 hover:border-forest-600/30 transition-colors">
                      <Icon size={20} className="text-forest-600 mx-auto mb-1.5" />
                      <div className="font-bold text-bark-800 text-sm">{formatNumber(value)}</div>
                      <div className="text-xs text-bark-600 leading-tight">{label} {unit ? `(${unit})` : ''}</div>
                    </div>
                  )
                ))}
              </div>

              {/* Impact Chart */}
              {impactChartData.length > 0 && (
                <div className="bg-earth-100 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-bark-800 mb-4">Impact Visualization</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={impactChartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {impactChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Notes */}
              {impact.metrics?.notes && (
                <div className="mt-6 p-4 bg-blue-50 border border-sky-200 rounded-xl">
                  <p className="text-xs font-semibold text-sky-700 mb-1">Notes</p>
                  <p className="text-sm text-sky-600">{impact.metrics.notes}</p>
                </div>
              )}
            </Card>
          ) : canManageProjects ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-bark-800">Environmental Impact</h2>
                  <p className="text-sm text-bark-600 mt-1">No impact data recorded yet</p>
                </div>
                <Button size="sm" onClick={() => {
                  setImpactForm({
                    metrics: {
                      treesPlanted: null,
                      areaRestoredHectares: null,
                      co2ReducedTons: null,
                      renewableEnergyKwh: null,
                      wasteCollectedKg: null,
                      waterBodiesCleaned: null,
                      pollutionIncidentsResolved: null,
                      peopleBenefited: null,
                      awarenessSessionsConducted: null,
                      volunteerEngagements: null,
                      customMetrics: {},
                      notes: '',
                    },
                    status: 'DRAFT',
                  });
                  setImpactModalOpen(true);
                }}>
                  <Plus size={16} className="mr-1" /> Add Impact
                </Button>
              </div>
              <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-xl border border-sky-200">
                <AlertCircle size={20} className="text-sky-600 flex-shrink-0" />
                <p className="text-sm text-sky-700">Track environmental achievements by adding metrics like trees planted, CO₂ reduced, and people benefited.</p>
              </div>
            </Card>
          ) : null}
        </motion.div>
      </div>

      {/* Add/Edit Milestone Modal */}
      <Modal
        open={milestoneModalOpen}
        onClose={() => {
          setMilestoneModalOpen(false);
          setEditingMilestone(null);
        }}
        title={editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
        size="md"
      >
        <div className="space-y-4">
          {project && (
            <div className="bg-earth-100 rounded-lg p-3 border border-earth-300 text-sm text-bark-700 mb-4">
              <p className="font-medium mb-1">Project Duration:</p>
              <p>{formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : 'Ongoing'}</p>
              {milestones.length > 0 && (
                <p className="mt-2 text-xs text-bark-600">
                  Latest Milestone: {milestones.reduce((max, m) => new Date(m.date) > new Date(max.date) ? m : max).date}
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-2">Title *</label>
            <input
              type="text"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              placeholder="e.g., Site Assessment Phase"
              className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-2">Due Date *</label>
              <input
                type="date"
                value={milestoneForm.date}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, date: e.target.value })}
                className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              />
              {milestoneForm.date && project && (
                <p className="text-xs text-bark-500 mt-1">
                  {new Date(milestoneForm.date) < new Date(project.startDate) && (
                    <span className="text-red-600">⚠️ Must be on or after: {formatDate(project.startDate)}</span>
                  )}
                  {project.endDate && new Date(milestoneForm.date) > new Date(project.endDate) && (
                    <span className="text-red-600">⚠️ Must be on or before: {formatDate(project.endDate)}</span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-2">Status</label>
              <select
                value={milestoneForm.status}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              >
                {MILESTONE_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setMilestoneModalOpen(false);
                setEditingMilestone(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMilestoneSubmit}
              loading={milestoneLoading}
            >
              {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Milestone Modal */}
      <Modal
        open={editMilestoneOpen}
        onClose={() => setEditMilestoneOpen(false)}
        title="Edit Milestone"
        size="md"
      >
        <div className="space-y-4">
          {project && (
            <div className="bg-earth-100 rounded-lg p-3 border border-earth-300 text-sm text-bark-700 mb-4">
              <p className="font-medium mb-1">Project Duration:</p>
              <p>{formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : 'Ongoing'}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-2">Title *</label>
            <input
              type="text"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-2">Due Date *</label>
              <input
                type="date"
                value={milestoneForm.date}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, date: e.target.value })}
                className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              />
              {milestoneForm.date && project && (
                <p className="text-xs text-bark-500 mt-1">
                  {new Date(milestoneForm.date) < new Date(project.startDate) && (
                    <span className="text-red-600">⚠️ Must be on or after: {formatDate(project.startDate)}</span>
                  )}
                  {project.endDate && new Date(milestoneForm.date) > new Date(project.endDate) && (
                    <span className="text-red-600">⚠️ Must be on or before: {formatDate(project.endDate)}</span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-2">Status</label>
              <select
                value={milestoneForm.status}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
                className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              >
                {MILESTONE_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setEditMilestoneOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMilestoneSubmit}
              loading={milestoneLoading}
            >
              Update Milestone
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Milestone Confirmation */}
      <Modal
        open={!!deleteMilestoneId}
        onClose={() => setDeleteMilestoneId(null)}
        title="Delete Milestone"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-bark-600">Are you sure you want to delete this milestone? This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteMilestoneId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleDeleteMilestone(deleteMilestoneId)}
              loading={deleteMilestoneLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Impact Metrics Modal */}
      <Modal
        open={impactModalOpen}
        onClose={() => setImpactModalOpen(false)}
        title={impact ? 'Update Impact Metrics' : 'Add Impact Metrics'}
        size="lg"
      >
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Predefined Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-bark-800 mb-3">Environmental Metrics</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { key: 'treesPlanted', label: 'Trees Planted', type: 'number' },
                { key: 'areaRestoredHectares', label: 'Area Restored (hectares)', type: 'number', step: '0.01' },
                { key: 'co2ReducedTons', label: 'CO₂ Reduced (tons)', type: 'number', step: '0.01' },
                { key: 'renewableEnergyKwh', label: 'Renewable Energy (kWh)', type: 'number', step: '0.01' },
                { key: 'wasteCollectedKg', label: 'Waste Collected (kg)', type: 'number', step: '0.01' },
                { key: 'waterBodiesCleaned', label: 'Water Bodies Cleaned', type: 'number' },
                { key: 'pollutionIncidentsResolved', label: 'Pollution Incidents Resolved', type: 'number' },
                { key: 'peopleBenefited', label: 'People Benefited', type: 'number' },
                { key: 'awarenessSessionsConducted', label: 'Awareness Sessions', type: 'number' },
                { key: 'volunteerEngagements', label: 'Volunteer Engagements', type: 'number' },
              ].map(({ key, label, type, step }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-bark-600 mb-1">{label}</label>
                  <input
                    type={type}
                    step={step}
                    value={impactForm.metrics[key] || ''}
                    onChange={(e) => setImpactForm({
                      ...impactForm,
                      metrics: {
                        ...impactForm.metrics,
                        [key]: e.target.value ? (type === 'number' && step ? parseFloat(e.target.value) : parseInt(e.target.value)) : null,
                      },
                    })}
                    className="w-full border border-bark-400/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-2">Notes</label>
            <textarea
              value={impactForm.metrics.notes || ''}
              onChange={(e) => setImpactForm({
                ...impactForm,
                metrics: { ...impactForm.metrics, notes: e.target.value },
              })}
              placeholder="Any additional observations or achievements..."
              rows={3}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-2">Status</label>
            <select
              value={impactForm.status}
              onChange={(e) => setImpactForm({ ...impactForm, status: e.target.value })}
              className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            >
              {IMPACT_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-bark-400/10">
            <Button variant="secondary" onClick={() => setImpactModalOpen(false)}>
              Cancel
            </Button>
            {impact && canManageProjects && (
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => {
                  handleDeleteImpact();
                  setImpactModalOpen(false);
                }}
                loading={deleteImpactLoading}
              >
                Delete Impact
              </Button>
            )}
            <Button
              onClick={handleImpactSubmit}
              loading={impactSaveLoading}
            >
              {impact ? 'Update Impact' : 'Create Impact'}
            </Button>
          </div>
        </div>
      </Modal>

    </DashboardLayout>
  );
}
