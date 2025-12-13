import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import DeleteModal from '../../components/admin/DeleteModal'
import FlightForm from '../../components/admin/forms/FlightForm'
import { flightsAdminApi } from '../../services/adminApi'
import { useToast } from '../../components/admin/Toast'

function FlightsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['adminFlights', page, search],
    queryFn: () => flightsAdminApi.getAll({ page, search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => flightsAdminApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFlights'] })
      setDeletingItem(null)
      addToast("Parvoz o'chirildi", 'success')
    },
    onError: () => {
      addToast("Xatolik yuz berdi", 'error')
    },
  })

  const columns = [
    {
      key: 'origin_code',
      label: 'Qayerdan',
      render: (value, row) => `${row.origin_name} (${value})`,
    },
    {
      key: 'destination_code',
      label: 'Qayerga',
      render: (value, row) => `${row.destination_name} (${value})`,
    },
    {
      key: 'price_usd',
      label: 'Narx',
      render: (value) => <span className="font-semibold text-green-600">${value}</span>,
    },
    { key: 'airline', label: 'Aviakompaniya' },
    {
      key: 'flight_duration_minutes',
      label: 'Davomiylik',
      render: (value) => {
        const hours = Math.floor(value / 60)
        const mins = value % 60
        return `${hours}s ${mins}d`
      },
    },
    { key: 'departure_date', label: 'Sana' },
    {
      key: 'is_roundtrip',
      label: 'Turi',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {value ? 'Borib-qaytish' : 'Bir tomonga'}
        </span>
      ),
    },
  ]

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingItem(null)
    queryClient.invalidateQueries({ queryKey: ['adminFlights'] })
    addToast(editingItem ? 'Parvoz yangilandi' : "Parvoz qo'shildi", 'success')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parvozlar</h1>
          <p className="text-gray-600">Parvoz narxlarini boshqarish</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + Yangi parvoz
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Aviakompaniya yoki shahar bo'yicha qidirish..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
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

      {/* Form Modal */}
      {showForm && (
        <FlightForm
          item={editingItem}
          onClose={() => {
            setShowForm(false)
            setEditingItem(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => deleteMutation.mutate(deletingItem.id)}
        title="Parvozni o'chirish"
        message={`${deletingItem?.origin_code} -> ${deletingItem?.destination_code} parvozini o'chirishni tasdiqlaysizmi?`}
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  )
}

export default FlightsPage
