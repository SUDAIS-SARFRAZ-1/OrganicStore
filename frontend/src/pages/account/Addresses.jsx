import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  Phone,
  User as UserIcon,
  Home
} from 'lucide-react';
import { 
  getAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '../../services/userApi';

export default function Addresses() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formError, setFormError] = useState('');

  // Initial Form State
  const initialForm = {
    recipientName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    isDefault: false,
  };
  const [formData, setFormData] = useState(initialForm);

  // Fetch Addresses
  const { 
    data: addresses = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['userAddresses'],
    queryFn: getAddresses,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAddresses'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to save address.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAddresses'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to update address.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAddresses'] });
      setDeleteConfirmId(null);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAddresses'] });
    },
  });

  // Modal handlers
  const openAddModal = () => {
    setEditingAddress(null);
    setFormData(initialForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setFormData({
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'Pakistan',
      isDefault: Boolean(addr.isDefault),
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAddress(null);
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

    if (!formData.recipientName || !formData.phone || !formData.street || !formData.city || !formData.postalCode) {
      setFormError('Please complete all required fields (Name, Phone, Street, City, Postal Code).');
      return;
    }

    if (editingAddress) {
      updateMutation.mutate({ id: editingAddress.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-[#6a9739]" />
            Saved Shipping Addresses
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your delivery locations for faster, single-click checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 shadow-xs border border-gray-100 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
          <p className="text-xs font-semibold text-gray-600">Loading your addresses...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-red-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error?.message || 'Failed to load addresses. Please try again.'}</span>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-xs border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Home className="w-8 h-8" />
          </div>
          <h2 className="text-sm font-bold text-gray-800">No saved addresses found</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
            You have not added any delivery addresses yet. Add one now to use during checkout.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl p-6 shadow-xs border transition-all flex flex-col justify-between relative ${
                addr.isDefault 
                  ? 'border-[#6a9739] ring-2 ring-[#6a9739]/15' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Badge for default */}
              <div className="flex items-center justify-between gap-2 mb-3">
                {addr.isDefault ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6a9739]/10 text-[#6a9739] text-[10px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Default Delivery Address
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    Secondary Address
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="p-1.5 text-gray-400 hover:text-[#6a9739] hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit address"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(addr.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Address details */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>{addr.recipientName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{addr.phone}</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed pt-1">
                  {addr.street}<br />
                  {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}<br />
                  <span className="text-gray-400 font-medium">{addr.country || 'Pakistan'}</span>
                </p>
              </div>

              {/* Delete confirmation inline bar */}
              {deleteConfirmId === addr.id && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-red-700 font-medium">Delete this address?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(addr.id)}
                      className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold text-[11px] hover:bg-red-700 cursor-pointer disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Yes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-lg font-bold text-[11px] hover:bg-gray-300 cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom default toggle */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                {!addr.isDefault ? (
                  <button
                    type="button"
                    disabled={setDefaultMutation.isPending}
                    onClick={() => setDefaultMutation.mutate(addr.id)}
                    className="text-[11px] font-bold text-[#6a9739] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Set as Default Address
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium">
                    Active checkout default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#6a9739]" />
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Enter your shipping information accurately to avoid delivery issues.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    required
                    value={formData.recipientName}
                    onChange={handleInputChange}
                    placeholder="e.g. Sara Khan"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Street Address & House / Flat # *
                </label>
                <input
                  type="text"
                  name="street"
                  required
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="e.g. House 14, Street 7, Block B, DHA Phase 5"
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Lahore"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Punjab"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="e.g. 54000"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all"
                />
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-[#6a9739] focus:ring-[#6a9739] border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    Set as default shipping address for future orders
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editingAddress ? 'Save Changes' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
