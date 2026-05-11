import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getReports } from '../api/reportsApi';
import DataTable from './DataTable';

export default function ReportTable({ token }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getReports()
      .then((res) => setReports(res.data))
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, [token]);

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'scope', label: 'Scope', sortable: true },
    { key: 'createdBy', label: 'Created By', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true, render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: 'status', label: 'Status', sortable: true },
  ];

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <DataTable columns={columns} data={reports} loading={loading} searchPlaceholder="Search reports..." />
  );
}

ReportTable.propTypes = {
  token: PropTypes.string,
};

