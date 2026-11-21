const API_BASE_URL = (
  import.meta.env.VITE_API_URL || '/api'
).replace(/\/$/, '');

function getHeaders() {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      'Erro ao processar favorito.'
    );
  }

  return data;
}

export async function getFavorites(userId) {
  const response = await fetch(
    `${API_BASE_URL}/favorites/user/${userId}`,
    { headers: getHeaders() }
  );

  return handleResponse(response);
}

export async function createFavorite({
  userId,
  restaurantId,
  productId
}) {
  const body = { user_id: userId };

  if (restaurantId != null) {
    body.restaurant_id = restaurantId;
  } else if (productId != null) {
    body.product_id = productId;
  } else {
    throw new Error('Informe um restaurante ou produto.');
  }

  const response = await fetch(
    `${API_BASE_URL}/favorites/`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    }
  );

  return handleResponse(response);
}

export async function deleteFavorite(favoriteId, userId) {
  const response = await fetch(
    `${API_BASE_URL}/favorites/${favoriteId}?user_id=${userId}`,
    {
      method: 'DELETE',
      headers: getHeaders()
    }
  );

  return handleResponse(response);
}