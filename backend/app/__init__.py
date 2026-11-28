import os

from flask import Flask

from app.config import Config
from app.extensions import db, migrate, cors, jwt, oauth
from app.routes import (
    users_bp,
    restaurants_bp,
    products_bp,
    addresses_bp,
    favorites_bp,
    orders_bp,
    auth_bp,
    health_bp,
    delivery_bp,
    mobile_restaurants_bp
)


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    oauth.init_app(app)
    oauth.register(
        name="google",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        server_metadata_url=(
            "https://accounts.google.com/.well-known/openid-configuration"
        ),
        client_kwargs={
            "scope": "openid email profile"
        }
    )

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(restaurants_bp, url_prefix="/api/restaurants")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(addresses_bp, url_prefix="/api/addresses")
    app.register_blueprint(favorites_bp, url_prefix="/api/favorites")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(health_bp, url_prefix="/api/health")
    app.register_blueprint(delivery_bp, url_prefix="/api/delivery")
    app.register_blueprint(mobile_restaurants_bp, url_prefix="/api/mobile/restaurants")

    with app.app_context():
        db.create_all()

    @app.route("/")
    def home():
        return {
            "message": "Foodify API funcionando!",
            "status": "success"
        }

    return app