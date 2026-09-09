import api from './api';

/**
 * Category API Service (Rule 19: Named resource + action)
 */
export async function getCategories() {
  const response = await api.get('/categories');
  return response.categories;
}

export async function getCategoryBySlug(slug) {
  const response = await api.get(`/categories/${slug}`);
  return response.category;
}

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
