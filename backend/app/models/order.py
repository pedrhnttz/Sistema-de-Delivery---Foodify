from app.extensions import db

class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    address_id = db.Column(
        db.Integer,
        db.ForeignKey("addresses.id"),
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="cart"
    )

    payment_method = db.Column(db.String(50), nullable=True)
    delivery_method = db.Column(db.String(50), nullable=True)

    delivery_cost = db.Column(
        db.Numeric(10, 2),
        nullable=True
    )

    total = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        default=0
    )

    def __repr__(self):
        return f"<Order {self.id}>"