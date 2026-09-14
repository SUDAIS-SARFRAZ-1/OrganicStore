import api from './api';

/**
 * SECURITY (Item 10): Cart sessions are managed strictly via server-side signed HTTP-only cookies.
 * The frontend never supplies or stores a guest cart UUID in localStorage or request headers,
 * completely preventing guest cart takeover and cart enumeration.
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
  return response.cart;
}

export async function removeCartItem(arg) {
  const itemId = typeof arg === 'object' && arg !== null ? arg.itemId : arg;
  const response = await api.delete(`/cart/items/${itemId}`);
  return response.cart;
}

export async function clearCart() {
  const response = await api.delete('/cart/clear');
  return response.cart;
}
