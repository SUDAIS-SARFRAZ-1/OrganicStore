import api from './api';

/**
 * User API Service (Rule 19: Named resource + action)
 */

export async function getProfile() {
  const response = await api.get('/users/profile');
  return response.profile;
}

export async function updateProfile(profileData) {
  const response = await api.put('/users/profile', profileData);
  return response.user;
}

export async function changePassword({ currentPassword, newPassword }) {
  return api.put('/users/change-password', {
    currentPassword,
    newPassword,
  });
}

export async function getAddresses() {
  const response = await api.get('/users/addresses');
  return response.addresses || [];
}

export async function createAddress(addressData) {
  const response = await api.post('/users/addresses', addressData);
  return response.address;
}

export async function updateAddress(id, addressData) {
  const response = await api.put(`/users/addresses/${id}`, addressData);
  return response.address;
}

export async function deleteAddress(id) {
  return api.delete(`/users/addresses/${id}`);
}

export async function setDefaultAddress(id) {
  return api.put(`/users/addresses/${id}/default`);
}

export async function getWishlist() {
  const response = await api.get('/users/wishlist');
  return response.wishlist || [];
}

export async function toggleWishlist(productId) {
  const response = await api.post(`/users/wishlist/${productId}`);
  return response;
}

export async function removeFromWishlist(productId) {
  return api.delete(`/users/wishlist/${productId}`);
}
