import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm');
  } catch {
    return dateStr;
  }
};

export const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'HH:mm');
  } catch {
    return '';
  }
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
};

export const formatNumber = (num) => {
  if (num == null) return '—';
  return new Intl.NumberFormat().format(num);
};

export const formatCurrency = (num, currency = 'USD') => {
  if (num == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
};

export const labelify = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

