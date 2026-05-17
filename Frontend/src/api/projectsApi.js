import axiosInstance from './axiosInstance';

// Projects
export const getProjects = () => axiosInstance.get('/projects');
export const getProjectById = (id) => axiosInstance.get(`/projects/${id}`);
export const getProjectsByStatus = (status) => axiosInstance.get(`/projects/status/${status}`);
export const createProject = (data) => axiosInstance.post('/projects', data);
export const updateProject = (id, data) => axiosInstance.patch(`/projects/${id}`, data);
export const deleteProject = (id) => axiosInstance.delete(`/projects/${id}`);
export const getProjectProgress = (id) => axiosInstance.get(`/projects/${id}/progress`);

// Milestones
export const getMilestonesByProject = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/milestones`);
export const getMilestoneById = (milestoneId) =>
  axiosInstance.get(`/projects/milestones/${milestoneId}`);
export const getMilestonesByStatus = (status) =>
  axiosInstance.get(`/projects/milestones/status/${status}`);
export const addMilestone = (projectId, data) =>
  axiosInstance.post(`/projects/${projectId}/milestones`, data);
export const updateMilestone = (milestoneId, data) =>
  axiosInstance.patch(`/projects/milestones/${milestoneId}`, data);
export const deleteMilestone = (milestoneId) =>
  axiosInstance.delete(`/projects/milestones/${milestoneId}`);

// Impact
export const getImpactByProject = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/impact`);
export const addOrUpdateImpact = (projectId, data) =>
  axiosInstance.post(`/projects/${projectId}/impact`, data);
export const updateImpactStatus = (projectId, status) =>
  axiosInstance.patch(`/projects/${projectId}/impact/status`, null, { params: { status } });
export const patchImpactMetrics = (projectId, metrics) =>
  axiosInstance.patch(`/projects/${projectId}/impact/metrics`, metrics);
export const addCustomMetrics = (projectId, customEntries) =>
  axiosInstance.patch(`/projects/${projectId}/impact/metrics/custom`, customEntries);
export const deleteCustomMetric = (projectId, key) =>
  axiosInstance.delete(`/projects/${projectId}/impact/metrics/custom/${key}`);
export const deleteImpact = (projectId) =>
  axiosInstance.delete(`/projects/${projectId}/impact`);

