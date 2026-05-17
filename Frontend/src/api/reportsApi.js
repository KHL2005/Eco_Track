import axiosInstance from './axiosInstance';

export const getReports = () => axiosInstance.get('/reports');
export const getReportById = (id) => axiosInstance.get(`/reports/${id}`);
export const getReportsByScope = (scope) => axiosInstance.get(`/reports/scope/${scope}`);
export const getReportsByProjectId = (projectId) => axiosInstance.get(`/reports/project/${projectId}`);
export const getReportsByIssueId = (issueId) => axiosInstance.get(`/reports/issue/${issueId}`);
export const createReport = (data) => axiosInstance.post('/reports', data);
export const deleteReport = (id) => axiosInstance.delete(`/reports/${id}`);

