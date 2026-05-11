import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getAllEmissions = (token) =>
  api.get('/emissions', auth(token));

export const updateEmissionStatus = (id, status, token) =>
  api.patch(`/emissions/${id}/status?status=${status}`, null, auth(token));

export const getAllDocuments = (token) =>
  api.get('/industry-documents', auth(token));

export const updateDocumentStatus = (docId, status, token) =>
  api.patch(`/industry-documents/${docId}/verify?status=${status}`, null, auth(token));

export const viewDocumentUrl = (docId) => `/api/v1/industry-documents/${docId}?view=true`;
export const downloadDocumentUrl = (docId) => `/api/v1/industry-documents/${docId}?download=true`;

// Fetch all reports for officer dashboard
export const getAllReports = (token) =>
  api.get('/reports', auth(token));
