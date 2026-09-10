import api from './api';

/**
 * Admin API Service (Rule 19: Named resource + action)
 * All endpoints gated by authenticate and authorize('ADMIN')
 */

// 1. Dashboard Metrics
export async function getDashboardStats() {
  const response = await api.get('/admin/dashboard/stats');
  return response;
}

// 2. Orders Management
export async function getAdminOrders({ status = 'ALL', search = '', page = 1, limit = 15 } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search) params.append('search', search);
  params.append('page', page);
  params.append('limit', limit);

  const response = await api.get(`/orders/admin/all?${params.toString()}`);
  return response;
}

export async function updateOrderStatus({ id, status }) {
  const response = await api.put(`/orders/admin/${id}/status`, { status });
  return response;
}

export async function exportAdminOrders({ status = 'ALL', search = '' } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (search) params.append('search', search);

  const response = await api.get(`/orders/admin/export?${params.toString()}`);
  return response;
}

// 3. Customers Management
export async function getAdminCustomers({ search = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('page', page);
  params.append('limit', limit);

  const response = await api.get(`/admin/customers?${params.toString()}`);
  return response;
}

export async function updateCustomerRole({ id, role }) {
  const response = await api.put(`/admin/customers/${id}/role`, { role });
  return response;
}

// 4. Products Management
export async function createProduct(productData) {
  const response = await api.post('/products', productData);
  return response.product;
}

export async function updateProduct(id, productData) {
  const response = await api.put(`/products/${id}`, productData);
  return response.product;
}

export async function deleteProduct(id) {
  const response = await api.delete(`/products/${id}`);
  return response;
}

// 5. Categories Management
export async function createCategory(categoryData) {
  const response = await api.post('/categories', categoryData);
  return response.category;
}

export async function updateCategory(id, categoryData) {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.category;
}

export async function deleteCategory(id) {
  const response = await api.delete(`/categories/${id}`);
  return response;
}

// 6. Coupons Management
export async function getAdminCoupons() {
  const response = await api.get('/coupons');
  return response.coupons || [];
}

export async function createCoupon(couponData) {
  const response = await api.post('/coupons', couponData);
  return response.coupon;
}

export async function deleteCoupon(id) {
  const response = await api.delete(`/coupons/${id}`);
  return response;
}

// 7. Reviews Moderation
export async function getAdminReviews({ status = 'all', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  params.append('page', page);
  params.append('limit', limit);

  const response = await api.get(`/reviews/admin/all?${params.toString()}`);
  return response;
}

export async function toggleReviewStatus({ id, isApproved }) {
  const response = await api.put(`/reviews/admin/${id}/status`, { isApproved });
  return response;
}

export async function featureReviewAsTestimonial({ id, remove = false, authorRole, sortOrder }) {
  const response = await api.post(`/reviews/admin/${id}/feature-testimonial`, {
    remove,
    authorRole,
    sortOrder,
  });
  return response;
}

// 8. Home Marketing Content Management
export async function getAdminHomeSections() {
  const response = await api.get('/home/sections');
  return response.sections || [];
}

export async function updateHomeSection({ id, data }) {
  const response = await api.put(`/admin/home/sections/${id}`, data);
  return response;
}

export async function getAdminTestimonials() {
  const response = await api.get('/admin/home/testimonials');
  return response.testimonials || [];
}

export async function createAdminTestimonial(testimonialData) {
  const response = await api.post('/admin/home/testimonials', testimonialData);
  return response.testimonial;
}

export async function updateHomeTestimonials(testimonials) {
  const response = await api.put('/admin/home/testimonials', { testimonials });
  return response;
}

export async function deleteAdminTestimonial(id) {
  const response = await api.delete(`/admin/home/testimonials/${id}`);
  return response;
}

export async function getAdminBrands() {
  const response = await api.get('/home/brands');
  return response.brands || [];
}

export async function updateHomeBrands(brands) {
  const response = await api.put('/admin/home/brands', { brands });
  return response;
}
