import api from './api';

/**
 * Product API Service (Rule 19: Named resource + action)
 */
export async function getProducts(params = {}) {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);
  if (params.minPrice) queryParams.append('minPrice', params.minPrice);
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.featured) queryParams.append('featured', 'true');

  const queryString = queryParams.toString();
  const url = queryString ? `/products?${queryString}` : '/products';
  return api.get(url);
}

export async function getProduct(identifier) {
  return api.get(`/products/${identifier}`);
}

export async function createProduct(productData) {
  return api.post('/products', productData);
}

export async function updateProduct(id, productData) {
  return api.put(`/products/${id}`, productData);
}

export async function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}
