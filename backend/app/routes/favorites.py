from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.services import favorite_service
from app.models.user import User

favorites_bp = Blueprint("favorites", __name__)

def favorite_to_dict(favorite):
    return {
        "id": favorite.id,
        "user_id": favorite.user_id,
        "restaurant_id": favorite.restaurant_id,
        "product_id": favorite.product_id
    }

@favorites_bp.route("/", methods=["POST"])
@jwt_required()
def create_favorite():
    data = request.get_json()

    if not data or "user_id" not in data:
        return jsonify({"error": "Informe o usuário"}), 400

    try:
        data["user_id"] = int(data["user_id"])

        if data.get("restaurant_id") is not None:
            data["restaurant_id"] = int(data["restaurant_id"])

        if data.get("product_id") is not None:
            data["product_id"] = int(data["product_id"])

    except (ValueError, TypeError):
        return jsonify({"error": "Identificadores inválidos"}), 400

    has_restaurant = data.get("restaurant_id") is not None
    has_product = data.get("product_id") is not None

    if has_restaurant == has_product:
        return jsonify({
            "error": "Informe um restaurante ou um produto, não os dois"
        }), 400

    favorite = favorite_service.create_favorite(data)

    if not favorite:
        return jsonify({
            "error": "Usuário, restaurante ou produto inválido, ou favorito já cadastrado"
        }), 400

    return jsonify(favorite_to_dict(favorite)), 201

@favorites_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_favorites(user_id):
    if not User.query.get(user_id):
        return jsonify({"error": "Usuário não encontrado"}), 404

    favorites = favorite_service.get_favorites_by_user(user_id)

    return jsonify([
        favorite_to_dict(favorite)
        for favorite in favorites
    ]), 200

@favorites_bp.route("/<int:favorite_id>", methods=["DELETE"])
@jwt_required()
def delete_favorite(favorite_id):
    user_id = request.args.get("user_id", type=int)

    if user_id is None:
        return jsonify({"error": "Informe o user_id"}), 400

    deleted = favorite_service.delete_favorite(favorite_id, user_id)

    if not deleted:
        return jsonify({"error": "Favorito não encontrado para esse usuário"}), 404

    return jsonify({"message": "Favorito removido com sucesso"}), 200