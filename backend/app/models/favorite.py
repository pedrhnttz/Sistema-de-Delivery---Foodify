from sqlalchemy import CheckConstraint, UniqueConstraint

from app.extensions import db

class Favorite(db.Model):
    __tablename__ = "favorites"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    restaurant_id = db.Column(
        db.Integer,
        db.ForeignKey("restaurants.id"),
        nullable=True
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=True
    )

    __table_args__ = (
        CheckConstraint(
            "(restaurant_id IS NOT NULL AND product_id IS NULL) "
            "OR (restaurant_id IS NULL AND product_id IS NOT NULL)",
            name="check_favorite_target"
        ),
        UniqueConstraint(
            "user_id", "restaurant_id",
            name="unique_user_restaurant_favorite"
        ),
        UniqueConstraint(
            "user_id", "product_id",
            name="unique_user_product_favorite"
        )
    )

    def __repr__(self):
        return f"<Favorite {self.id}>"