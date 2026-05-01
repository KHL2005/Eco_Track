import { useState } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';
import LoadingSkeleton from './LoadingSkeleton';
import PropTypes from 'prop-types';

export default function DataTable({ columns, data, loading, searchable = true, searchPlaceholder = 'Search…', currentPage = 1, recordsPerPage = null, onPageChange = null }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = (data || []).filter((row) => {
    if (!search) return true;
    return Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(search.toLowerCase()));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const va = a[sortKey] ?? '';
    const vb = b[sortKey] ?? '';
    const cmp = String(va).localeCompare(String(vb));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Pagination logic
  let displayedData = sorted;
  let totalPages = 1;
  if (recordsPerPage && recordsPerPage > 0) {
    totalPages = Math.ceil(sorted.length / recordsPerPage);
    const startIdx = (currentPage - 1) * recordsPerPage;
    const endIdx = startIdx + recordsPerPage;
    displayedData = sorted.slice(startIdx, endIdx);
  }

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && onPageChange) onPageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && onPageChange) onPageChange(currentPage + 1);
  };

  return (
    <div>
      {searchable && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-bark-400/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}
      {loading ? (
        <LoadingSkeleton rows={5} cols={columns.length} />
      ) : sorted.length === 0 ? (
        <EmptyState title="No results" description={search ? 'Try a different search term.' : 'Nothing here yet.'} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-bark-400/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-earth-100 border-b border-bark-400/10">
                  {columns.map((col) => (
                    <th
                      key={col.key || col.label}
                      className={`px-4 py-3 text-left text-xs font-semibold text-bark-600 uppercase tracking-wider whitespace-nowrap
                        ${col.sortable ? 'cursor-pointer select-none hover:text-bark-800' : ''}`}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {col.sortable && sortKey === col.key && (
                          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bark-400/10 bg-white">
                {displayedData.map((row, i) => (
                  <tr key={i} className="hover:bg-earth-100/60 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key || col.label} className="px-4 py-3 text-bark-800">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recordsPerPage && recordsPerPage > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-bark-600">
                Page {currentPage} of {totalPages} • Showing {displayedData.length} of {sorted.length} results
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-bark-400/20 hover:bg-earth-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-bark-400/20 hover:bg-earth-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string.isRequired,
    sortable: PropTypes.bool,
    render: PropTypes.func,
  })).isRequired,
  data: PropTypes.array,
  loading: PropTypes.bool,
  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  currentPage: PropTypes.number,
  recordsPerPage: PropTypes.number,
  onPageChange: PropTypes.func,
};

