from app.extensions import db
from sqlalchemy import UniqueConstraint

class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    quantity = db.Column(db.Integer, nullable=False)

    unit_price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "order_id",
            "product_id",
            name="unique_product_per_order"
        ),
    )

    def __repr__(self):
        return f"<OrderItem {self.id}>"