import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import DeleteModal from '../../components/admin/DeleteModal'
import CityForm from '../../components/admin/forms/CityForm'
import { citiesAdminApi } from '../../services/adminApi'
import { useToast } from '../../components/admin/Toast'

function CitiesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['adminCities', page, search],
    queryFn: () => citiesAdminApi.getAll({ page, search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => citiesAdminApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCities'] })
      setDeletingItem(null)
      addToast("Shahar o'chirildi", 'success')
    },
    onError: () => {
      addToast("Xatolik yuz berdi", 'error')
    },
  })

  const columns = [
    { key: 'name_uz', label: "Nomi (O'zbekcha)" },
    { key: 'name', label: 'Nomi (English)' },
    { key: 'iata_code', label: 'IATA' },
    { key: 'country_name', label: 'Mamlakat' },
    {
      key: 'is_hub',
      label: 'Hub',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
          {value ? 'Ha' : 'Yo\'q'}
        </span>
      ),
    },
    {
      key: 'avg_hotel_price_usd',
      label: "O'rtacha narx",
      render: (value) => `$${value}`,
    },
  ]

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingItem(null)
    queryClient.invalidateQueries({ queryKey: ['adminCities'] })
    addToast(editingItem ? 'Shahar yangilandi' : "Shahar qo'shildi", 'success')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shaharlar</h1>
          <p className="text-gray-600">Shaharlarni boshqarish</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + Yangi shahar
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Qidirish..."
          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
        <CityForm
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
        title="Shaharni o'chirish"
        message={`"${deletingItem?.name_uz}" shaharini o'chirishni tasdiqlaysizmi?`}
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  )
}

export default CitiesPage
