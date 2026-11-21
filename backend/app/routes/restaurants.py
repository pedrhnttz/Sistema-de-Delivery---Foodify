from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services import (
  restaurant_service,
  user_service,
  restaurant_management_service
)
from app.models.product import Product

restaurants_bp = Blueprint("restaurants", __name__)

def restaurant_to_dict(restaurant):
    return {
        "id": restaurant.id,
        "user_id": restaurant.user_id,
        "name": restaurant.name,
        "food_type": restaurant.food_type,
        "postal_code": restaurant.postal_code,
        "street": restaurant.street,
        "number": restaurant.number,
        "complement": restaurant.complement,
        "neighborhood": restaurant.neighborhood,
        "city": restaurant.city,
        "state": restaurant.state,
        "latitude": restaurant.latitude,
        "longitude": restaurant.longitude
    }


def get_authenticated_user():
    email = get_jwt_identity()
    return user_service.get_user_by_email(email)

@restaurants_bp.route("/", methods=["POST"])
@jwt_required()
def create_restaurant():
    data = request.get_json() or {}

    required_fields = [
        "name",
        "food_type",
        "postal_code",
        "street",
        "number",
        "neighborhood",
        "city",
        "state",
        "latitude",
        "longitude"
    ]

    if any(
        field not in data or data[field] in (None, "")
        for field in required_fields
    ):
        return jsonify({
            "error": "Todos os campos obrigatórios devem ser preenchidos."
        }), 400

    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data["user_id"] = user.id

    restaurant = restaurant_service.create_restaurant(data)

    if not restaurant:
        return jsonify({"error": "Não foi possível cadastrar o restaurante."}), 400

    return jsonify(restaurant_to_dict(restaurant)), 201

@restaurants_bp.route("/", methods=["GET"])
def get_restaurants():
    restaurants = restaurant_service.get_restaurants()

    return jsonify([
        restaurant_to_dict(restaurant)
        for restaurant in restaurants
    ]), 200

@restaurants_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_restaurants_by_user(user_id):
    restaurants = restaurant_service.get_restaurants_by_user_id(user_id)

    return jsonify([
        restaurant_to_dict(restaurant)
        for restaurant in restaurants
    ]), 200

@restaurants_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_restaurants():
    user = get_authenticated_user()

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    restaurants = (
        restaurant_service.get_restaurants_by_user_id(
            user.id
        )
    )

    return jsonify([
        restaurant_to_dict(restaurant)
        for restaurant in restaurants
    ]), 200

@restaurants_bp.route("/<int:restaurant_id>", methods=["GET"])
def get_restaurant(restaurant_id):
    restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)

    if not restaurant:
        return jsonify({"error": "Restaurante não encontrado."}), 404

    return jsonify(restaurant_to_dict(restaurant)), 200


@restaurants_bp.route("/<int:restaurant_id>", methods=["PUT"])
@jwt_required()
def update_restaurant(restaurant_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    restaurant = restaurant_service.get_restaurant_by_id(
        restaurant_id
    )

    if not restaurant:
        return jsonify({
            "error": "Restaurante não encontrado."
        }), 404

    if restaurant.user_id != user.id:
        return jsonify({
            "error": "Você não tem permissão para editar este restaurante."
        }), 403

    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({
            "error": "Nenhum dado válido enviado."
        }), 400

    allowed_fields = {
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
    }

    if any(field not in allowed_fields for field in data):
        return jsonify({
            "error": "Campo não permitido."
        }), 400

    updated_restaurant = restaurant_service.update_restaurant(
        restaurant_id,
        data
    )

    if not updated_restaurant:
        return jsonify({
            "error": "Não foi possível atualizar o restaurante."
        }), 400

    return jsonify(
        restaurant_to_dict(updated_restaurant)
    ), 200


@restaurants_bp.route(
    "/<int:restaurant_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_restaurant(restaurant_id):

    user = get_authenticated_user()

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    try:
        restaurant_management_service.delete_restaurant_with_related(
            restaurant_id,
            user.id
        )

        return jsonify({
            "message": "Restaurante excluído com sucesso."
        }), 200

    except restaurant_management_service.ManagementError as exc:
        return jsonify({
            "error": str(exc)
        }), 400

@restaurants_bp.route("/search", methods=["GET"])
@jwt_required()
def search_restaurants():
    food_type = request.args.get("food_type")
    favorite = request.args.get("favorite", "false").lower()
    user_id = request.args.get("user_id")

    latitude = request.args.get("latitude")
    longitude = request.args.get("longitude")

    if favorite not in ("true", "false"):
        return jsonify({"error": "Filtro favorite inválido."}), 400

    favorite_user_id = None

    if favorite == "true":
        if not user_id:
            return jsonify({
                "error": "Informe o user_id para consultar favoritos."
            }), 400

        try:
            favorite_user_id = int(user_id)
        except ValueError:
            return jsonify({"error": "user_id inválido."}), 400

    if (latitude is None) != (longitude is None):
        return jsonify({
            "error": "Informe latitude e longitude juntas."
        }), 400

    try:
        if latitude is not None:
            latitude = float(latitude)
            longitude = float(longitude)

            if not (-90 <= latitude <= 90):
                raise ValueError

            if not (-180 <= longitude <= 180):
                raise ValueError

    except ValueError:
        return jsonify({"error": "Coordenadas inválidas."}), 400

    restaurants = restaurant_service.get_restaurants_filtered(
        food_type=food_type,
        favorite_user_id=favorite_user_id,
        latitude=latitude,
        longitude=longitude
    )

    return jsonify([
        restaurant_to_dict(restaurant)
        for restaurant in restaurants
    ]), 200

@restaurants_bp.route('/<int:restaurant_id>/products', methods=['GET'])
@jwt_required()
def get_restaurant_products_for_management(restaurant_id):
    user = get_authenticated_user()
    if not user:
        return jsonify({'error': 'Usuário não encontrado.'}), 404
    restaurant = restaurant_service.get_restaurant_by_id(restaurant_id)
    if not restaurant:
        return jsonify({'error': 'Restaurante não encontrado.'}), 404
    if restaurant.user_id != user.id:
        return jsonify({'error': 'Acesso não autorizado.'}), 403
    products = Product.query.filter_by(restaurant_id=restaurant_id).order_by(Product.id).all()
    return jsonify([
        {'id': p.id, 'name': p.name, 'price': float(p.price)} for p in products
    ]), 200


@restaurants_bp.route(
    '/<int:restaurant_id>/manage',
    methods=['PUT']
)
@jwt_required()
def manage_restaurant(restaurant_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({
            'error': 'Usuário não encontrado.'
        }), 404

    try:
        restaurant = (
            restaurant_management_service.save_restaurant_and_products(
                restaurant_id,
                user.id,
                request.get_json(silent=True)
            )
        )

        return jsonify({
            'restaurant': restaurant_to_dict(restaurant)
        }), 200

    except restaurant_management_service.ManagementError as exc:
        return jsonify({
            'error': str(exc)
        }), exc.status