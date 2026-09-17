import api from './api';

/**
 * Helper to persist or clean guest cart ID in localStorage
 */
function syncGuestCartId(guestCartId) {
  try {
    if (guestCartId && typeof guestCartId === 'string' && guestCartId.trim().length > 0) {
      localStorage.setItem('organic_store_guest_cart_id', guestCartId.trim());
    } else if (guestCartId === null) {
      localStorage.removeItem('organic_store_guest_cart_id');
    }
  } catch {
    // Ignore storage errors in restricted browser modes
  }
}

/**
 * Explicitly removes the guest cart pointer upon logout or cart transfer
 */
export function clearGuestCartId() {
  try {
    localStorage.removeItem('organic_store_guest_cart_id');
  } catch {
    // Ignore
  }
}

/**
 * Cart API Service (Rule 19: Named resource + action)
 */
export async function getCart() {
  try {
    const response = await api.get('/cart');
    if (response?.guestCartId !== undefined) {
      syncGuestCartId(response.guestCartId);
    }
    return response.cart;
  } catch (err) {
    // Only return empty cart structure if cart does not exist (404)
    if (err.response?.status === 404) {
      return {
        items: [],
        totalItems: 0,
        subtotal: 0,
      };
    }
    throw err;
  }
}

export async function addToCart({ productId, quantity = 1 }) {
  const response = await api.post('/cart/items', { productId, quantity });
  if (response?.guestCartId !== undefined) {
    syncGuestCartId(response.guestCartId);
  }
  return response.cart;
}

export async function updateCartItem(arg1, arg2) {
  let itemId;
  let quantity;
  if (typeof arg1 === 'object' && arg1 !== null) {
    itemId = arg1.itemId;
    quantity = arg1.quantity;
  } else {
    itemId = arg1;
    quantity = arg2;
  }
  const response = await api.put(`/cart/items/${itemId}`, { quantity });
  if (response?.guestCartId !== undefined) {
    syncGuestCartId(response.guestCartId);
  }
  return response.cart;
}

export async function removeCartItem(arg) {
  const itemId = typeof arg === 'object' && arg !== null ? arg.itemId : arg;
  const response = await api.delete(`/cart/items/${itemId}`);
  if (response?.guestCartId !== undefined) {
    syncGuestCartId(response.guestCartId);
  }
  return response.cart;
}

export async function clearCart() {
  const response = await api.delete('/cart/clear');
  if (response?.guestCartId !== undefined) {
    syncGuestCartId(response.guestCartId);
  }
  return response.cart;
}
