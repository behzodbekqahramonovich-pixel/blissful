import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import DeleteModal from '../../components/admin/DeleteModal'
import TransportForm, { TRANSPORT_MODES } from '../../components/admin/forms/TransportForm'
import { transportAdminApi } from '../../services/adminApi'
import { useToast } from '../../components/admin/Toast'

const modeIcon = Object.fromEntries(TRANSPORT_MODES.map((m) => [m.value, m.icon]))
const cityLabel = (name, code) => `${name} (${code || 'aeroportsiz'})`

function TransportPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['adminTransport', page, search, mode],
    queryFn: () => transportAdminApi.getAll({ page, search: search || undefined, mode: mode || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => transportAdminApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTransport'] })
      setDeletingItem(null)
      addToast("Transport o'chirildi", 'success')
    },
    onError: () => addToast('Xatolik yuz berdi', 'error'),
  })

  const columns = [
    {
      key: 'from_name',
      label: "Yo'nalish",
      render: (_, row) => (
        <span>
          {cityLabel(row.from_name, row.from_code)} {row.is_bidirectional ? '↔' : '→'} {cityLabel(row.to_name, row.to_code)}
        </span>
      ),
    },
    {
      key: 'mode',
      label: 'Transport',
      render: (value, row) => `${modeIcon[value] || ''} ${row.mode_display}`,
    },
    {
      key: 'price_usd',
      label: 'Narx',
      render: (value) => <span className="font-semibold text-green-600">${value}</span>,
    },
    {
      key: 'duration_min',
      label: 'Davomiylik',
      render: (value) => `${Math.floor(value / 60)}s ${value % 60}d`,
    },
    {
      key: 'headway_min',
      label: 'Oralig\'i',
      render: (value) => (value ? `har ${value} daq` : 'istalgan vaqt'),
    },
    {
      key: 'is_active',
      label: 'Holat',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {value ? 'Faol' : 'Nofaol'}
        </span>
      ),
    },
  ]

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingItem(null)
    queryClient.invalidateQueries({ queryKey: ['adminTransport'] })
    addToast(editingItem ? 'Transport yangilandi' : "Transport qo'shildi", 'success')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport</h1>
          <p className="text-gray-600">Poyezd, avtobus va taksi yo'nalishlari (aeroportsiz shaharlarga yo'l ham shu yerda)</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + Yangi yo'nalish
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Shahar yoki IATA bo'yicha qidirish..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Barcha turlar</option>
          {TRANSPORT_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.icon} {m.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.results || []}
        isLoading={isLoading}
        onEdit={(item) => {
          setEditingItem(item)
          setShowForm(true)
        }}
        onDelete={(item) => setDeletingItem(item)}
        pagination={{
          count: data?.count || 0,
          page,
          next: data?.next,
          previous: data?.previous,
        }}
        onPageChange={setPage}
      />

      {showForm && (
        <TransportForm
          item={editingItem}
          onClose={() => {
            setShowForm(false)
            setEditingItem(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      <DeleteModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => deleteMutation.mutate(deletingItem.id)}
        title="Transportni o'chirish"
        message={`${deletingItem?.from_name} → ${deletingItem?.to_name} (${deletingItem?.mode_display}) yo'nalishini o'chirishni tasdiqlaysizmi?`}
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  )
}

export default TransportPage
