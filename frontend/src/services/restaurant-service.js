import api from './api';

export async function getRestaurants() {
  try {
    const response = await api.get('/restaurants/');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível carregar os restaurantes.'
    );
  }
}

export async function getRestaurantById(id) {
  try {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível carregar o restaurante.'
    );
  }
}

export async function getMyRestaurants() {
  try {
    const response = await api.get('/restaurants/me');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível carregar seus restaurantes.'
    );
  }
}

export async function createRestaurant(data) {
  try {
    const response = await api.post('/restaurants/', data);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível cadastrar o restaurante.'
    );
  }
}

export async function updateRestaurant(id, data) {
  try {
    const response = await api.put(
      `/restaurants/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível atualizar o restaurante.'
    );
  }
}

export async function deleteRestaurant(restaurantId) {
  try {
    const response = await api.delete(`/restaurants/${restaurantId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Não foi possível excluir o restaurante.');
  }
}

export async function getRestaurantProducts(restaurantId) {
  try {
    const response = await api.get(`/restaurants/${restaurantId}/products`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Não foi possível carregar o cardápio.');
  }
}

export async function saveRestaurantManagement(restaurantId, data) {
  try {
    const response = await api.put(`/restaurants/${restaurantId}/manage`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Não foi possível salvar as alterações.');
  }
}

export async function createDefaultRestaurant() {
  const defaultRestaurant = {
    name: 'Novo restaurante',
    food_type: 'Não definido',

    postal_code: '00000-000',
    street: 'Rua não informada',
    number: 'S/N',
    complement: '',
    neighborhood: 'Não informado',
    city: 'Não informada',
    state: 'SP',

    latitude: 0,
    longitude: 0,
  };

  try {
    const response = await api.post(
      '/restaurants/',
      defaultRestaurant
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível criar o restaurante.'
    );
  }
}