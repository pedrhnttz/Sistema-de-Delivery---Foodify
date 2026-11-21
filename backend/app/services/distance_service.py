import math

def calculate_distance(
    user_latitude,
    user_longitude,
    restaurant_latitude,
    restaurant_longitude
):
    earth_radius = 6371

    lat1 = math.radians(user_latitude)
    lon1 = math.radians(user_longitude)
    lat2 = math.radians(restaurant_latitude)
    lon2 = math.radians(restaurant_longitude)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    distance = 2 * earth_radius * math.asin(math.sqrt(a))

    return round(distance, 2)