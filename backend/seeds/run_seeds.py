from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.product import Product
from app.models.address import Address
from seeds import seed_database

app = create_app()

with app.app_context():
    db.create_all()

    seed_database(db, User, Restaurant, Product, Address)

    print("Seeds executados com sucesso!")