import api from './api';

const GUEST_CART_KEY = 'organic_store_guest_cart_id';

export function getGuestCartId() {
  return localStorage.getItem(GUEST_CART_KEY);
}

export function setGuestCartId(id) {
  if (id) {
    localStorage.setItem(GUEST_CART_KEY, id);
  }
}

export function clearGuestCartId() {
  localStorage.removeItem(GUEST_CART_KEY);
}

function getCartHeaders() {
  const guestCartId = getGuestCartId();
  return guestCartId ? { 'x-cart-id': guestCartId } : {};
}

/**
 * Cart API Service (Rule 19: Named resource + action)
 */
export async function getCart() {
  try {
    const response = await api.get('/cart', { headers: getCartHeaders() });
    if (response?.cart?.id) {
      setGuestCartId(response.cart.id);
    }
    return response.cart;
  } catch (error) {
    // If backend is unavailable, return safe empty cart fallback
    return {
      id: getGuestCartId() || 'offline-cart',
      items: [],
      totalItems: 0,
      subtotal: 0,
    };
  }
}

export async function addToCart({ productId, quantity = 1 }) {
  const response = await api.post(
    '/cart/items',
    { productId, quantity },
    { headers: getCartHeaders() }
  );
  if (response?.cart?.id) {
    setGuestCartId(response.cart.id);
  }
  return response.cart;
}

export async function updateCartItem({ itemId, quantity }) {
  const response = await api.put(
    `/cart/items/${itemId}`,
    { quantity },
    { headers: getCartHeaders() }
  );
  if (response?.cart?.id) {
    setGuestCartId(response.cart.id);
  }
  return response.cart;
}

export async function removeCartItem(itemId) {
  const response = await api.delete(`/cart/items/${itemId}`, {
    headers: getCartHeaders(),
  });
  if (response?.cart?.id) {
    setGuestCartId(response.cart.id);
  }
  return response.cart;
}

export async function clearCart() {
  const response = await api.delete('/cart', {
    headers: getCartHeaders(),
  });
  if (response?.cart?.id) {
    setGuestCartId(response.cart.id);
  }
  return response.cart;
}
