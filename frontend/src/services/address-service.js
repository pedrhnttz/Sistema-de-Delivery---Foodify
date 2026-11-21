import api from './api';

export async function getAddresses() {
  try {
    const response = await api.get('/addresses/');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível carregar os endereços.'
    );
  }
}

export async function createAddress(addressData) {
  try {
    const response = await api.post('/addresses/', addressData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível cadastrar o endereço.'
    );
  }
}

export async function updateAddress(id, addressData) {
  try {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível atualizar o endereço.'
    );
  }
}

export async function deleteAddress(id) {
  try {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível excluir o endereço.'
    );
  }
}