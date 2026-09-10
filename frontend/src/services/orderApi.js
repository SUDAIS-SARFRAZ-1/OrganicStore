import api from './api';

/**
 * Order API Service (Rule 19: Named resource + action)
 */
export async function createOrder(orderData) {
  const response = await api.post('/orders', orderData);
  return response.order;
}

export async function getMyOrders() {
  const response = await api.get('/orders/my-orders');
  return response.orders || [];
}

export async function getOrderById(id) {
  const response = await api.get(`/orders/${id}`);
  return response.order;
}
