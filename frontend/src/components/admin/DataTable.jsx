function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  isLoading,
  pagination,
  onPageChange
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Yuklanmoqda...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  Ma'lumot topilmadi
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(row)}
                        className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition-colors"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => onDelete(row)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      >
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-600">
            Jami: <strong>{pagination.count}</strong> ta
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.previous}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Oldingi
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {pagination.page} / {Math.ceil(pagination.count / 20) || 1}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.next}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Keyingi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
