import api from './api';

/**
 * Default fallback categories matching initial organic catalog.
 * Ensures navigation bar, footer, and category pages never lose primary links if the backend is down or restarting.
 */
export const DEFAULT_CATEGORIES = [
  {
    id: 'fallback-groceries',
    name: 'Groceries',
    slug: 'groceries',
    description: 'Fresh organic pantry essentials, grains, dairy, and farm staples.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    productCount: 0,
  },
  {
    id: 'fallback-juice',
    name: 'Juice',
    slug: 'juice',
    description: 'Cold-pressed 100% organic raw juices and natural fruit nectars.',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    productCount: 0,
  },
  {
    id: 'fallback-fresh-fruits',
    name: 'Fresh Fruits',
    slug: 'fresh-fruits',
    description: 'Directly sourced seasonal fruits ripened naturally under the sun.',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
    productCount: 0,
  },
  {
    id: 'fallback-fresh-vegetables',
    name: 'Fresh Vegetables',
    slug: 'fresh-vegetables',
    description: 'Crisp pesticide-free greens, roots, and farm-fresh garden vegetables.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    productCount: 0,
  },
  {
    id: 'fallback-organic-teas',
    name: 'Organic Teas',
    slug: 'organic-teas',
    description: 'Hand-plucked herbal infusions, green teas, and calming botanicals.',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    productCount: 0,
  },
];

/**
 * Category API Service (Rule 19: Named resource + action)
 */
export async function getCategories({ includeFallback = false } = {}) {
  try {
    const response = await api.get('/categories');
    if (response?.categories && response.categories.length > 0) {
      return response.categories;
    }
    return includeFallback ? DEFAULT_CATEGORIES : [];
  } catch (err) {
    if (includeFallback) {
      return DEFAULT_CATEGORIES;
    }
    throw err;
  }
}

export async function getCategoryBySlug(slug) {
  try {
    const response = await api.get(`/categories/${slug}`);
    if (response?.category) {
      return response.category;
    }
    return DEFAULT_CATEGORIES.find((c) => c.slug === slug) || null;
  } catch {
    return DEFAULT_CATEGORIES.find((c) => c.slug === slug) || null;
  }
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
