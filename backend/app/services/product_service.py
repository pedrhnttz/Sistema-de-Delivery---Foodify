import math

from app.extensions import db
from app.models.product import Product
from sqlalchemy.exc import IntegrityError

from app.models.favorite import Favorite
from app.models.restaurant import Restaurant

def create_product(data):
    product = Product(
        restaurant_id=data["restaurant_id"],
        name=data["name"],
        food_type=data["food_type"],
        price=data["price"]
    )

    try:
        db.session.add(product)
        db.session.commit()
        return product
    except IntegrityError:
        db.session.rollback()
        return None

def get_products():
    return Product.query.all()

def get_product_by_id(product_id):
    return db.session.get(Product, product_id)

def update_product(product_id, data):
    product = get_product_by_id(product_id)

    if not product:
        return None

    product.restaurant_id = data.get(
        "restaurant_id", product.restaurant_id
    )
    product.name = data.get("name", product.name)
    product.food_type = data.get("food_type", product.food_type)
    product.price = data.get("price", product.price)

    try:
        db.session.commit()
        return product
    except IntegrityError:
        db.session.rollback()
        return None

def delete_product(product_id):
    product = get_product_by_id(product_id)

    if not product:
        return False

    db.session.delete(product)
    db.session.commit()
    return True

def get_products_filtered(
    food_type=None,
    favorite_user_id=None,
    latitude=None,
    longitude=None
):
    query = Product.query.join(
        Restaurant,
        Product.restaurant_id == Restaurant.id
    )

    if food_type:
        query = query.filter(
            Product.food_type.ilike(f"%{food_type}%")
        )

    if favorite_user_id is not None:
        favorite_product_ids = db.session.query(
            Favorite.product_id
        ).filter(
            Favorite.user_id == favorite_user_id,
            Favorite.product_id.isnot(None)
        )

        query = query.filter(
            Product.id.in_(favorite_product_ids)
        )

    products = query.all()

    if latitude is not None and longitude is not None:

        def calculate_distance(product):
            restaurant = db.session.get(
                Restaurant,
                product.restaurant_id
            )

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

        products.sort(key=calculate_distance)

    return products