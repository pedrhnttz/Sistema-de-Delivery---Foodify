import api from './api';

export async function getDeliveryQuote(addressId, restaurantId) {
  const response = await api.post('/delivery/quote', {
    address_id: addressId,
    restaurant_id: restaurantId
  });

  return response.data;
}