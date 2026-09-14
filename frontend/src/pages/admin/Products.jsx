import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle, 
  Star,
  ChevronDown,
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productApi';
import { getCategories } from '../../services/categoryApi';

export default function Products() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formError, setFormError] = useState('');

  // Initial Product Form State
  const initialForm = {
    name: '',
    slug: '',
    description: '',
    price: '',
    salePrice: '',
    stock: '',
    categoryId: '',
    isFeatured: false,
    imageUrl: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // 1. Fetch Categories for Dropdown (exclude fake fallback IDs)
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: () => getCategories({ includeFallback: false }),
  });

  // 2. Fetch Products
  const { 
    data: productData, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['adminProducts', searchTerm, selectedCategory],
    queryFn: () => getProducts({ 
      search: searchTerm, 
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      limit: 100 
    }),
  });

  const products = productData?.products || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create product.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update product.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setDeleteConfirmId(null);
    },
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      ...initialForm,
      categoryId: categories[0]?.id || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name || '',
      slug: p.slug || '',
      description: p.description || '',
      price: p.price !== undefined ? String(p.price) : '',
      salePrice: p.salePrice !== undefined && p.salePrice !== null ? String(p.salePrice) : '',
      stock: p.stock !== undefined ? String(p.stock) : '',
      categoryId: p.categoryId || categories[0]?.id || '',
      isFeatured: Boolean(p.isFeatured),
      imageUrl: p.images?.[0]?.url || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData(initialForm);
    setFormError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.description || !formData.price || !formData.categoryId) {
      setFormError('Please fill in Name, Description, Category, and Price.');
      return;
    }

    const payload = {
      name: formData.name,
      slug: formData.slug || undefined,
      description: formData.description,
      price: parseFloat(formData.price),
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
      stock: parseInt(formData.stock, 10) || 0,
      categoryId: formData.categoryId,
      isFeatured: formData.isFeatured,
      images: formData.imageUrl ? [{ url: formData.imageUrl, isPrimary: true }] : undefined,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#6a9739]" />
            Products Catalog
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage inventory levels, pricing, sale promotions, and product descriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
          />
        </div>

        <div className="relative w-full sm:w-56 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold bg-gray-50 hover:bg-gray-100/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 text-gray-700 cursor-pointer transition-all shadow-2xs"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
            <p className="text-xs font-semibold text-gray-500">Loading catalog...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-xs text-red-700 bg-red-50">
            {error?.message || 'Error fetching products.'}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No products match your search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Badges</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const thumbnail = p.images?.[0]?.url || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=80&q=80';
                  const isSale = p.salePrice && p.salePrice < p.price;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumbnail}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-extrabold text-gray-900 block truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate">
                              /{p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold text-[10px]">
                          {p.category?.name || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {isSale ? (
                          <div>
                            <span className="font-extrabold text-[#6a9739] block">
                              ₨ {p.salePrice.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 line-through">
                              ₨ {p.price.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-gray-900">
                            ₨ {p.price.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          p.stock <= 5 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {p.stock} units
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {p.isFeatured && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                              Featured
                            </span>
                          )}
                          {isSale && (
                            <span className="px-2 py-0.5 rounded-full bg-[#8bc34a]/15 text-[#6a9739] text-[10px] font-bold">
                              Sale
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {deleteConfirmId === p.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(p.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] font-bold cursor-pointer hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-gray-400 hover:text-[#6a9739] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(p.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#6a9739]" />
              {editingProduct ? 'Edit Product' : 'Add New Organic Product'}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Configure product details, categorization, inventory and pricing.
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
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Farm Fresh Organic Broccoli"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      name="categoryId"
                      required
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 text-xs font-semibold text-gray-800 cursor-pointer transition-all"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
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
                    placeholder="e.g. organic-broccoli"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Regular Price (PKR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 250"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Sale Price (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    placeholder="e.g. 199"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Stock Inventory *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe taste, certified organic origin, health benefits..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                />
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-[#6a9739] focus:ring-[#6a9739] border-gray-300"
                  />
                  <span className="font-semibold text-gray-700">
                    Feature this product on homepage & recommendations
                  </span>
                </label>
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
