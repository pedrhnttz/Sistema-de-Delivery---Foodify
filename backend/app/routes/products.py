from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.services import product_service

products_bp = Blueprint("products", __name__)

def product_to_dict(product):
    return {
        "id": product.id,
        "restaurant_id": product.restaurant_id,
        "name": product.name,
        "food_type": product.food_type,
        "price": float(product.price)
    }

@products_bp.route("/", methods=["POST"])
@jwt_required()
def create_product():
    data = request.get_json()

    required_fields = [
        "restaurant_id",
        "name",
        "food_type",
        "price"
    ]

    if not data or any(
        field not in data or data[field] in (None, "")
        for field in required_fields
    ):
        return jsonify({"error": "Todos os campos são obrigatórios"}), 400

    try:
        data["restaurant_id"] = int(data["restaurant_id"])
        data["price"] = float(data["price"])

        if data["price"] < 0:
            raise ValueError

    except (ValueError, TypeError):
        return jsonify({"error": "Restaurante ou preço inválido"}), 400

    product = product_service.create_product(data)

    if not product:
        return jsonify({"error": "Não foi possível cadastrar o produto. Verifique o restaurante informado."}), 400

    return jsonify(product_to_dict(product)), 201

@products_bp.route("/", methods=["GET"])
def get_products():
    products = product_service.get_products()

    return jsonify([
        product_to_dict(product)
        for product in products
    ]), 200

@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = product_service.get_product_by_id(product_id)

    if not product:
        return jsonify({"error": "Produto não encontrado"}), 404

    return jsonify(product_to_dict(product)), 200

@products_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "Nenhum dado enviado"}), 400

    try:
        if "restaurant_id" in data:
            data["restaurant_id"] = int(data["restaurant_id"])

        if "price" in data:
            data["price"] = float(data["price"])
            if data["price"] < 0:
                raise ValueError

    except (ValueError, TypeError):
        return jsonify({"error": "Restaurante ou preço inválido"}), 400

    product = product_service.update_product(product_id, data)

    if not product:
        return jsonify({"error": "Produto não encontrado ou restaurante inválido"}), 404

    return jsonify(product_to_dict(product)), 200

@products_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    deleted = product_service.delete_product(product_id)

    if not deleted:
        return jsonify({"error": "Produto não encontrado"}), 404

    return jsonify({"message": "Produto excluído com sucesso"}), 200

@products_bp.route("/search", methods=["GET"])
@jwt_required()
def search_products():
    food_type = request.args.get("food_type")
    favorite = request.args.get("favorite", "false").lower()
    user_id = request.args.get("user_id")

    latitude = request.args.get("latitude")
    longitude = request.args.get("longitude")

    if favorite not in ("true", "false"):
        return jsonify({"error": "Filtro favorite inválido"}), 400

    favorite_user_id = None

    if favorite == "true":
        if not user_id:
            return jsonify({
                "error": "Informe o user_id para consultar favoritos"
            }), 400

        try:
            favorite_user_id = int(user_id)
        except ValueError:
            return jsonify({"error": "user_id inválido"}), 400

    if (latitude is None) != (longitude is None):
        return jsonify({
            "error": "Informe latitude e longitude juntas"
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
        return jsonify({"error": "Coordenadas inválidas"}), 400

    products = product_service.get_products_filtered(
        food_type=food_type,
        favorite_user_id=favorite_user_id,
        latitude=latitude,
        longitude=longitude
    )

    return jsonify([
        product_to_dict(product)
        for product in products
    ]), 200