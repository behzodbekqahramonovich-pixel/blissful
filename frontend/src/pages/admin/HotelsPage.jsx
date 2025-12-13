import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import DeleteModal from '../../components/admin/DeleteModal'
import HotelForm from '../../components/admin/forms/HotelForm'
import { hotelsAdminApi } from '../../services/adminApi'
import { useToast } from '../../components/admin/Toast'

function HotelsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['adminHotels', page, search],
    queryFn: () => hotelsAdminApi.getAll({ page, search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => hotelsAdminApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHotels'] })
      setDeletingItem(null)
      addToast("Mehmonxona o'chirildi", 'success')
    },
    onError: () => {
      addToast("Xatolik yuz berdi", 'error')
    },
  })

  const columns = [
    { key: 'hotel_name', label: 'Nomi' },
    {
      key: 'city_name',
      label: 'Shahar',
      render: (value, row) => `${value} (${row.city_code})`,
    },
    {
      key: 'stars',
      label: 'Yulduzlar',
      render: (value) => '⭐'.repeat(value),
    },
    {
      key: 'price_per_night_usd',
      label: 'Narx/kecha',
      render: (value) => <span className="font-semibold text-green-600">${value}</span>,
    },
    {
      key: 'rating',
      label: 'Reyting',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
          {value}/10
        </span>
      ),
    },
    { key: 'checkin_date', label: 'Kirish sanasi' },
  ]

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingItem(null)
    queryClient.invalidateQueries({ queryKey: ['adminHotels'] })
    addToast(editingItem ? 'Mehmonxona yangilandi' : "Mehmonxona qo'shildi", 'success')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mehmonxonalar</h1>
          <p className="text-gray-600">Mehmonxona narxlarini boshqarish</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + Yangi mehmonxona
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Mehmonxona nomi yoki shahar bo'yicha qidirish..."
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
        <HotelForm
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
        title="Mehmonxonani o'chirish"
        message={`"${deletingItem?.hotel_name}" mehmonxonasini o'chirishni tasdiqlaysizmi?`}
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  )
}

export default HotelsPage
