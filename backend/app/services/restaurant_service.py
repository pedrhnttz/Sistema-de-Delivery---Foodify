import math

from app.extensions import db
from app.models.restaurant import Restaurant
from app.models.favorite import Favorite
from sqlalchemy.exc import IntegrityError


def create_restaurant(data):
    restaurant = Restaurant(
        user_id=data["user_id"],
        name=data["name"],
        food_type=data["food_type"],
        postal_code=data["postal_code"],
        street=data["street"],
        number=data["number"],
        complement=data.get("complement"),
        neighborhood=data["neighborhood"],
        city=data["city"],
        state=data["state"],
        latitude=data["latitude"],
        longitude=data["longitude"]
    )

    try:
        db.session.add(restaurant)
        db.session.commit()
        return restaurant

    except IntegrityError:
        db.session.rollback()
        return None


def get_restaurants():
    return Restaurant.query.all()


def get_restaurants_by_user_id(user_id):
    return Restaurant.query.filter_by(user_id=user_id).all()


def get_restaurant_by_id(restaurant_id):
    return Restaurant.query.get(restaurant_id)


def update_restaurant(restaurant_id, data):
    restaurant = get_restaurant_by_id(restaurant_id)

    if not restaurant:
        return None

    fields = [
        "name",
        "food_type",
        "postal_code",
        "street",
        "number",
        "complement",
        "neighborhood",
        "city",
        "state",
        "latitude",
        "longitude"
    ]

    for field in fields:
        if field in data:
            setattr(restaurant, field, data[field])

    try:
        db.session.commit()
        return restaurant

    except IntegrityError:
        db.session.rollback()
        return None


def delete_restaurant(restaurant_id):
    restaurant = get_restaurant_by_id(restaurant_id)

    if not restaurant:
        return False

    db.session.delete(restaurant)
    db.session.commit()
    return True


def get_restaurants_filtered(
    food_type=None,
    favorite_user_id=None,
    latitude=None,
    longitude=None
):
    query = Restaurant.query

    if food_type:
        query = query.filter(
            Restaurant.food_type.ilike(f"%{food_type}%")
        )

    if favorite_user_id is not None:
        favorite_restaurant_ids = db.session.query(
            Favorite.restaurant_id
        ).filter(
            Favorite.user_id == favorite_user_id,
            Favorite.restaurant_id.isnot(None)
        )

        query = query.filter(
            Restaurant.id.in_(favorite_restaurant_ids)
        )

    restaurants = query.all()

    if latitude is not None and longitude is not None:

        def calculate_distance(restaurant):
            lat1 = math.radians(latitude)
            lon1 = math.radians(longitude)
            lat2 = math.radians(restaurant.latitude)
            lon2 = math.radians(restaurant.longitude)

            delta_lat = lat2 - lat1
            delta_lon = lon2 - lon1

            a = (
                math.sin(delta_lat / 2) ** 2
                + math.cos(lat1)
                * math.cos(lat2)
                * math.sin(delta_lon / 2) ** 2
            )

            return 6371 * 2 * math.asin(math.sqrt(a))

        restaurants.sort(key=calculate_distance)

    return restaurants