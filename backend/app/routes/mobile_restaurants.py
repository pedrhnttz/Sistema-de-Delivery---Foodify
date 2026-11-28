import os
import math
from functools import wraps

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models.user import User
from app.services import (
    restaurant_service,
    restaurant_management_service
)
from app.routes.restaurants import restaurant_to_dict

mobile_restaurants_bp = Blueprint(
    "mobile_restaurants",
    __name__
)

DEFAULT_USER_ID = 1

ALLOWED_FIELDS = {
    "name": 150,
    "food_type": 100,
    "postal_code": 9,
    "street": 150,
    "number": 20,
    "complement": 100,
    "neighborhood": 100,
    "city": 100,
    "state": 2,
}

REQUIRED_FIELDS = set(ALLOWED_FIELDS) - {"complement"}

def mobile_demo_only(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        enabled = (
            os.getenv("MOBILE_DEMO_ENABLED") == "1"
        )

        if not enabled or not current_app.debug:
            return jsonify({
                "error": "API Mobile desativada."
            }), 403

        return function(*args, **kwargs)

    return wrapper

def admin_exists():
    return db.session.get(User, DEFAULT_USER_ID) is not None


def get_owned_restaurant(restaurant_id):
    restaurant = restaurant_service.get_restaurant_by_id(
        restaurant_id
    )

    if restaurant is None:
        return None

    if restaurant.user_id != DEFAULT_USER_ID:
        return None

    return restaurant

def validate_restaurant(data):
    if not isinstance(data, dict):
        return None, "Envie um objeto JSON válido."

    permitted = set(ALLOWED_FIELDS) | {
        "latitude",
        "longitude"
    }

    if any(key not in permitted for key in data):
        return None, "Campo não permitido."

    result = {}

    for field, max_length in ALLOWED_FIELDS.items():
        value = data.get(field)

        if value is None and field == "complement":
            value = ""

        if not isinstance(value, str):
            return None, f"Campo {field} inválido."

        value = value.strip()

        if field in REQUIRED_FIELDS and not value:
            return None, f"Campo {field} obrigatório."

        if len(value) > max_length:
            return None, f"Campo {field} excede o limite."

        result[field] = value

    if len(result["state"]) != 2:
        return None, "A UF deve conter duas letras."

    result["state"] = result["state"].upper()

    for field, limit in (
        ("latitude", 90),
        ("longitude", 180)
    ):
        value = data.get(field)

        if isinstance(value, bool):
            return None, f"{field} inválida."

        try:
            value = float(value)
        except (TypeError, ValueError):
            return None, f"{field} inválida."

        if not math.isfinite(value):
            return None, f"{field} inválida."

        if not -limit <= value <= limit:
            return None, f"{field} fora do intervalo."

        result[field] = value

    return result, None

@mobile_restaurants_bp.route("/", methods=["GET"])
@mobile_demo_only
def list_restaurants():
    restaurants = (
        restaurant_service.get_restaurants_by_user_id(
            DEFAULT_USER_ID
        )
    )

    return jsonify([
        restaurant_to_dict(restaurant)
        for restaurant in restaurants
    ]), 200

@mobile_restaurants_bp.route(
    "/<int:restaurant_id>",
    methods=["GET"]
)
@mobile_demo_only
def get_restaurant(restaurant_id):
    restaurant = get_owned_restaurant(restaurant_id)

    if restaurant is None:
        return jsonify({
            "error": "Restaurante não encontrado."
        }), 404

    return jsonify(
        restaurant_to_dict(restaurant)
    ), 200

@mobile_restaurants_bp.route("/", methods=["POST"])
@mobile_demo_only
def create_restaurant():
    if not admin_exists():
        return jsonify({
            "error": "Usuário administrador ID 1 não encontrado."
        }), 404

    data, error = validate_restaurant(
        request.get_json(silent=True)
    )

    if error:
        return jsonify({"error": error}), 400

    data["user_id"] = DEFAULT_USER_ID

    try:
        restaurant = (
            restaurant_service.create_restaurant(data)
        )
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception(
            "Erro ao cadastrar restaurante"
        )
        return jsonify({
            "error": "Erro interno ao cadastrar restaurante."
        }), 500

    if restaurant is None:
        return jsonify({
            "error": "Não foi possível cadastrar o restaurante."
        }), 400

    return jsonify(
        restaurant_to_dict(restaurant)
    ), 201

@mobile_restaurants_bp.route(
    "/<int:restaurant_id>",
    methods=["PUT"]
)
@mobile_demo_only
def update_restaurant(restaurant_id):
    restaurant = get_owned_restaurant(restaurant_id)

    if restaurant is None:
        return jsonify({
            "error": "Restaurante não encontrado."
        }), 404

    data, error = validate_restaurant(
        request.get_json(silent=True)
    )

    if error:
        return jsonify({"error": error}), 400

    try:
        updated = restaurant_service.update_restaurant(
            restaurant_id,
            data
        )
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception(
            "Erro ao atualizar restaurante"
        )
        return jsonify({
            "error": "Erro interno ao atualizar restaurante."
        }), 500

    if updated is None:
        return jsonify({
            "error": "Não foi possível atualizar o restaurante."
        }), 400

    return jsonify(
        restaurant_to_dict(updated)
    ), 200

@mobile_restaurants_bp.route(
    "/<int:restaurant_id>",
    methods=["DELETE"]
)
@mobile_demo_only
def delete_restaurant(restaurant_id):
    if get_owned_restaurant(restaurant_id) is None:
        return jsonify({
            "error": "Restaurante não encontrado."
        }), 404

    try:
        restaurant_management_service.delete_restaurant_with_related(
            restaurant_id,
            DEFAULT_USER_ID
        )

        return jsonify({
            "message": "Restaurante excluído com sucesso."
        }), 200

    except restaurant_management_service.ManagementError as exc:
        return jsonify({
            "error": str(exc)
        }), exc.status