import api from './api';

export async function getProducts() {
  try {
    const response = await api.get('/products/');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível carregar os produtos.'
    );
  }
}