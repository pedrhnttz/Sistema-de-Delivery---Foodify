import api from './api';

export async function sendLoginCode(email) {
  try {
    const response = await api.post('/auth/send-code', { email });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível enviar o código.'
    );
  }
}

export async function verifyLoginCode(email, code) {
  try {
    const response = await api.post('/auth/verify-code', { email, code });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Código inválido.'
    );
  }
}