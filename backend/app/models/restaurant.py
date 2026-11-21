from app.extensions import db

class Restaurant(db.Model):
    __tablename__ = "restaurants"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    name = db.Column(db.String(150), nullable=False)
    food_type = db.Column(db.String(100), nullable=False)

    postal_code = db.Column(db.String(9), nullable=False)
    street = db.Column(db.String(150), nullable=False)
    number = db.Column(db.String(20), nullable=False)
    complement = db.Column(db.String(100), nullable=True)
    neighborhood = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(2), nullable=False)

    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    owner = db.relationship("User", backref="restaurants")

    def __repr__(self):
        return f"<Restaurant {self.name}>"