from app.extensions import db
from app.models.favorite import Favorite
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.product import Product
from sqlalchemy.exc import IntegrityError

def create_favorite(data):
    user = db.session.get(User, data["user_id"])

    if not user:
        return None

    restaurant_id = data.get("restaurant_id")
    product_id = data.get("product_id")

    if (restaurant_id is None) == (product_id is None):
        return None

    if restaurant_id is not None:
        if not db.session.get(Restaurant, restaurant_id):
            return None

    if product_id is not None:
        if not db.session.get(Product, product_id):
            return None

    favorite = Favorite(
        user_id=data["user_id"],
        restaurant_id=restaurant_id,
        product_id=product_id
    )

    try:
        db.session.add(favorite)
        db.session.commit()
        return favorite
    except IntegrityError:
        db.session.rollback()
        return None

def get_favorites_by_user(user_id):
    return Favorite.query.filter_by(user_id=user_id).all()

def get_favorite_by_id(favorite_id):
    return db.session.get(Favorite, favorite_id)

def delete_favorite(favorite_id, user_id):
    favorite = Favorite.query.filter_by(
        id=favorite_id,
        user_id=user_id
    ).first()

    if not favorite:
        return False

    db.session.delete(favorite)
    db.session.commit()
    return True