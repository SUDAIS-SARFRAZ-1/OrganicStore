import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Loader2, 
  ShoppingBag, 
  Phone, 
  Mail, 
} from 'lucide-react';
import { getAdminCustomers, updateCustomerRole } from '../../services/adminApi';
import { useAuthStore } from '../../store/authStore';
import ConfirmModal from '../../components/ConfirmModal';

export default function Customers() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dialogConfig, setDialogConfig] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminCustomers', searchTerm, page],
    queryFn: () => getAdminCustomers({ search: searchTerm, page, limit: 20 }),
  });

  const customers = data?.customers || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  const roleMutation = useMutation({
    mutationFn: updateCustomerRole,
    onSuccess: (res) => {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Role Updated',
        message: res.message || 'User role has been successfully updated.',
        variant: 'success',
        confirmText: 'Done',
      });
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
    },
    onError: (err) => {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Role Update Failed',
        message: err.response?.data?.message || 'Failed to update user role.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    },
  });

  const handleRoleToggle = (user) => {
    const newRole = user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    const isPromoting = newRole === 'ADMIN';
    setDialogConfig({
      isOpen: true,
      title: isPromoting ? `Promote ${user.name} to Admin?` : `Revoke Admin from ${user.name}?`,
      message: isPromoting
        ? `Granting ADMIN role gives ${user.name} full access to catalog, orders, and store configuration.`
        : `Changing role to CUSTOMER will remove administrative dashboard privileges for this account.`,
      confirmText: isPromoting ? 'Grant Admin Privileges' : 'Change to Customer',
      cancelText: 'Cancel',
      variant: isPromoting ? 'warning' : 'primary',
      onConfirm: () => {
        setDialogConfig(null);
        roleMutation.mutate({ id: user.id, role: newRole });
      },
    });
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#6a9739]" />
            Customer Accounts & Roles
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View registered shopper profiles, order engagement, lifetime customer spend, and permissions.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, email address, or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
            <p className="text-xs font-semibold text-gray-500">Loading customers...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-xs text-red-700 bg-red-50">
            {error?.message || 'Error fetching customers.'}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No customer accounts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Orders Placed</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => {
                  const isSelf = currentUser?.id === c.id;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#6a9739] text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <span className="font-extrabold text-gray-900 block">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              ID: {c.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1 text-gray-800">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {c.email}
                          </span>
                          {c.phone && (
                            <span className="flex items-center gap-1 text-gray-500 text-[10px]">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {c.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {new Date(c.joinedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-gray-800">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#6a9739]" />
                          {c.ordersCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-gray-900">
                        ₨ {c.totalSpent.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {c.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isSelf ? (
                          <span className="text-[10px] text-gray-400 italic">Current Session</span>
                        ) : (
                          <button
                            type="button"
                            disabled={roleMutation.isPending}
                            onClick={() => handleRoleToggle(c)}
                            className="text-[11px] font-bold text-[#6a9739] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {c.role === 'ADMIN' ? 'Demote to Customer' : 'Make Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
          isLoading={roleMutation.isPending}
          onClose={() => setDialogConfig(null)}
          onConfirm={dialogConfig.onConfirm}
        />
      )}
    </div>
  );
}
