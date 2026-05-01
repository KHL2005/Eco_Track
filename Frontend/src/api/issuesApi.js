import axiosInstance from './axiosInstance';

// Issues
export const getIssues = () => axiosInstance.get('/issues');
export const getIssueById = (id) => axiosInstance.get(`/issues/${id}`);
export const getIssuesByCitizen = (citizenId) => axiosInstance.get(`/issues/citizen/${citizenId}`);
export const getIssuesByStatus = (status) => axiosInstance.get(`/issues/status/${status}`);
export const getIssuesByType = (type) => axiosInstance.get(`/issues/type/${type}`);
export const createIssue = (data) => axiosInstance.post('/issues', data);
export const updateIssue = (id, data) => axiosInstance.patch(`/issues/${id}`, data);
export const updateIssueStatus = (id, status) =>
  axiosInstance.patch(`/issues/${id}/status`, { status });
export const deleteIssue = (id) => axiosInstance.delete(`/issues/${id}`);

// Media
export const uploadMedia = (issueId, file, onProgress) => {
  const fd = new FormData();
  fd.append('file', file);
  return axiosInstance.post(`/issues/${issueId}/media`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
};
export const deleteMedia = (issueId, fileName) =>
  axiosInstance.delete(`/issues/${issueId}/media/${fileName}`);
export const getMediaUrl = (issueId, fileName) => `/api/v1/issues/${issueId}/media/${fileName}`;

// Resolutions
export const addResolution = (issueId, data) =>
  axiosInstance.post(`/issues/${issueId}/resolutions`, data);
export const getResolutionByIssue = (issueId) =>
  axiosInstance.get(`/issues/${issueId}/resolutions`);
export const getAllResolutions = () => axiosInstance.get('/issues/resolutions');
export const getResolutionById = (id) => axiosInstance.get(`/issues/resolutions/${id}`);
export const getResolutionsByOfficer = (officerId) =>
  axiosInstance.get(`/issues/resolutions/officer/${officerId}`);
export const getResolutionsByStatus = (status) =>
  axiosInstance.get(`/issues/resolutions/status/${status}`);
export const updateResolution = (id, data) =>
  axiosInstance.patch(`/issues/resolutions/${id}`, data);
export const deleteResolution = (id) => axiosInstance.delete(`/issues/resolutions/${id}`);

