import api from './api';

export async function createCart() {
  try {
    const response = await api.post('/orders/cart');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível acessar a sacola.'
    );
  }
}

export async function getCartItems(orderId) {
  try {
    const response = await api.get(`/orders/${orderId}/items`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível carregar a sacola.'
    );
  }
}

export async function addProductToCart(orderId, productId, quantity) {
  try {
    const response = await api.post(`/orders/${orderId}/items`, {
      product_id: productId,
      quantity
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível adicionar o produto.'
    );
  }
}

export async function updateCartItem(orderId, itemId, quantity) {
  try {
    const response = await api.put(
      `/orders/${orderId}/items/${itemId}`,
      { quantity }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível atualizar a quantidade.'
    );
  }
}

export async function removeCartItem(orderId, itemId) {
  try {
    const response = await api.delete(
      `/orders/${orderId}/items/${itemId}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Não foi possível remover o produto.'
    );
  }
}

export async function checkoutOrder(
  orderId,
  addressId,
  paymentMethod,
  deliveryMethod,
  paymentCode = null
) {
  try {
    const response = await api.post(
      `/orders/${orderId}/checkout`,
      {
        address_id: addressId,
        payment_method: paymentMethod,
        delivery_method: deliveryMethod,
        payment_code: paymentCode,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível validar o pagamento.'
    );
  }
}

export async function getMyOrders() {
  try {
    const response = await api.get('/orders/my-orders');

    return response.data;

  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível carregar seus pedidos.'
    );
  }
}

export async function getOrderInvoice(orderId) {
  try {
    const response = await api.get(
      `/orders/${orderId}/invoice`
    );

    return response.data;

  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
      'Não foi possível carregar os detalhes do pedido.'
    );
  }
}
