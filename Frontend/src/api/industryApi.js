import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const logEmission = (data, token) =>
  api.post('/emissions', data, auth(token));

export const getMyEmissions = (industryName, token) =>
  api.get(`/emissions/industry?industryName=${encodeURIComponent(industryName)}`, auth(token));

export const deleteEmission = (id, token) =>
  api.delete(`/emissions/${id}`, auth(token));

export const uploadDocument = (formData, token) =>
  api.post('/industry-documents', formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });

export const getMyDocuments = (industryName, token) =>
  api.get(`/industry-documents/industry?industryName=${encodeURIComponent(industryName)}`, auth(token));

export const deleteDocument = (docId, token) =>
  api.delete(`/industry-documents/${docId}`, auth(token));

export const viewDocumentUrl = (docId) => `/api/v1/industry-documents/${docId}?view=true`;
export const downloadDocumentUrl = (docId) => `/api/v1/industry-documents/${docId}?download=true`;

