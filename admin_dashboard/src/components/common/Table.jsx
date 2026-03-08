import React from 'react';

function TableSkeleton({ cols = 5, rows = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="skeleton h-4 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function Table({ columns, data, loading, emptyMessage = 'No data found', rowKey = 'id', onRowClick }) {
  return (
    <div className="table-wrapper bg-white">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={col.headerClassName || ''}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {loading ? (
          <TableSkeleton cols={columns.length} rows={5} />
        ) : data.length === 0 ? (
          <tbody>
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                <div className="empty-state">
                  <svg
                    className="empty-state-icon w-12 h-12 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-sm font-medium mt-2">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row[rowKey] || idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key} className={col.className || ''}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

export default Table;
