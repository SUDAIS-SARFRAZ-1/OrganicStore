import api from './api';

export async function getHomeSections() {
  const data = await api.get('/home/sections');
  return data.sections;
}

export async function getTestimonials() {
  const data = await api.get('/home/testimonials');
  return data.testimonials;
}

export async function getBrandLogos() {
  const data = await api.get('/home/brands');
  return data.brands;
}
