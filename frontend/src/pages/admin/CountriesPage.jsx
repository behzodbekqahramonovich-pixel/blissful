import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import DataTable from '../../components/admin/DataTable'
import DeleteModal from '../../components/admin/DeleteModal'
import CountryForm from '../../components/admin/forms/CountryForm'
import { countriesAdminApi } from '../../services/adminApi'
import { useToast } from '../../components/admin/Toast'

function CountriesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['adminCountries', page, search],
    queryFn: () => countriesAdminApi.getAll({ page, search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => countriesAdminApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCountries'] })
      setDeletingItem(null)
      addToast("Mamlakat o'chirildi", 'success')
    },
    onError: () => {
      addToast("Xatolik yuz berdi", 'error')
    },
  })

  const columns = [
    { key: 'flag_emoji', label: 'Bayroq' },
    { key: 'name_uz', label: "Nomi (O'zbekcha)" },
    { key: 'name', label: 'Nomi (English)' },
    { key: 'code', label: 'ISO kod' },
    { key: 'currency', label: 'Valyuta' },
    {
      key: 'visa_required_for_uz',
      label: 'Viza',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {value ? 'Kerak' : 'Kerak emas'}
        </span>
      ),
    },
    { key: 'cities_count', label: 'Shaharlar' },
  ]

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingItem(null)
    queryClient.invalidateQueries({ queryKey: ['adminCountries'] })
    addToast(editingItem ? 'Mamlakat yangilandi' : "Mamlakat qo'shildi", 'success')
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mamlakatlar</h1>
          <p className="text-gray-600">Mamlakatlarni boshqarish</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + Yangi mamlakat
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
        <CountryForm
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
        title="Mamlakatni o'chirish"
        message={`"${deletingItem?.name_uz}" mamlakatini o'chirishni tasdiqlaysizmi? Bu mamlakat bilan bog'liq barcha shaharlar ham o'chiriladi.`}
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  )
}

export default CountriesPage
