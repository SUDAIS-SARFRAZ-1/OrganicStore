import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle, 
  Package, 
  ExternalLink 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../../services/categoryApi';
import ConfirmModal from '../../components/ConfirmModal';

export default function Categories() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formError, setFormError] = useState('');
  const [dialogConfig, setDialogConfig] = useState(null);

  const initialForm = {
    name: '',
    slug: '',
    description: '',
    image: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const { data: categories = [], isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create category.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update category.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setDeleteConfirmId(null);
    },
    onError: (err) => {
      setDeleteConfirmId(null);
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Cannot Delete Category',
        message: err.response?.data?.message || 'This category has associated products in the store and cannot be deleted.',
        variant: 'danger',
        confirmText: 'Understood',
      });
    },
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData(initialForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCategory(c);
    setFormData({
      name: c.name || '',
      slug: c.slug || '',
      description: c.description || '',
      image: c.image || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormData(initialForm);
    setFormError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name) {
      setFormError('Category name is required.');
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#6a9739]" />
            Category Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Categories dynamically populate the customer navigation bar and catalog taxonomy.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 shadow-xs border border-gray-100 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
          <p className="text-xs font-semibold text-gray-500">Loading categories...</p>
        </div>
      ) : isError ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
          {error?.message || 'Failed to load categories.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id || cat.slug}
              className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 hover:border-gray-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80'}
                      alt={cat.name}
                      className="w-12 h-12 rounded-xl object-cover bg-gray-50 shrink-0"
                    />
                    <div>
                      <h3 className="font-black text-sm text-gray-900 leading-tight">
                        {cat.name}
                      </h3>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        /category/{cat.slug}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/category/${cat.slug}`}
                    target="_blank"
                    className="p-1.5 text-gray-400 hover:text-[#6a9739] hover:bg-gray-50 rounded-lg transition-colors"
                    title="View on store"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                  {cat.description || 'Organic agricultural products.'}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600">
                  <Package className="w-3.5 h-3.5 text-[#6a9739]" />
                  <span>{cat.productCount !== undefined ? `${cat.productCount} Products` : 'Active'}</span>
                </span>

                {deleteConfirmId === cat.id ? (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(cat.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] font-bold cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-gray-400 hover:text-[#6a9739] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#6a9739]" />
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Changes will instantly reflect in the customer navigation bar.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Exotic Fruits"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Slug (Auto-generated if empty)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g. exotic-fruits"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description displayed on category shop headers..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Confirmation / Alert Dialog */}
      {dialogConfig && (
        <ConfirmModal
          isOpen={dialogConfig.isOpen}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          cancelText={dialogConfig.cancelText}
          variant={dialogConfig.variant}
          isAlertOnly={dialogConfig.isAlertOnly}
          isLoading={deleteMutation.isPending}
          onClose={() => setDialogConfig(null)}
          onConfirm={dialogConfig.onConfirm}
        />
      )}
    </div>
  );
}
