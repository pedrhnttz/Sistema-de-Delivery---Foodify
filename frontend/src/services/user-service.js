import api from './api';

export async function getCurrentUser() {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível carregar os dados do usuário.'
    );
  }
}

export async function updateCurrentUser(userData) {
  try {
    const response = await api.put('/users/me', userData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível atualizar os dados.'
    );
  }
}