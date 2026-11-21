import math

from app.models.address import Address
from app.models.restaurant import Restaurant


BASE_DELIVERY_FEE = 5.00
DELIVERY_FEE_PER_KM = 1.50


def calculate_distance(user_latitude, user_longitude, restaurant_latitude, restaurant_longitude):
    """Calcula a distância em linha reta entre o endereço e o restaurante, em km."""

    earth_radius = 6371

    lat1 = math.radians(user_latitude)
    lon1 = math.radians(user_longitude)
    lat2 = math.radians(restaurant_latitude)
    lon2 = math.radians(restaurant_longitude)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    )

    a = min(1, max(0, a))

    distance = 2 * earth_radius * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return round(distance, 2)


def calculate_delivery_fee(distance):
    """Calcula o frete com valor inicial e cobrança por quilômetro."""

    delivery_fee = BASE_DELIVERY_FEE + (distance * DELIVERY_FEE_PER_KM)

    return round(delivery_fee, 2)


def get_delivery_quote(address_id, restaurant_id, user_id):
    """Busca o endereço e o restaurante e retorna distância e frete."""

    address = Address.query.filter_by(
        id=address_id,
        user_id=user_id
    ).first()

    if not address:
        return None, "Endereço não encontrado."

    restaurant = Restaurant.query.get(restaurant_id)

    if not restaurant:
        return None, "Restaurante não encontrado."

    distance = calculate_distance(
        address.latitude,
        address.longitude,
        restaurant.latitude,
        restaurant.longitude
    )

    delivery_fee = calculate_delivery_fee(distance)

    return {
        "distance_km": distance,
        "delivery_fee": delivery_fee
    }, None