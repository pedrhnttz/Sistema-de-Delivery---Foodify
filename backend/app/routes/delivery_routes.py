from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services import delivery_service, user_service

delivery_bp = Blueprint(
    "delivery",
    __name__,
    url_prefix="/api/delivery"
)


@delivery_bp.route("/quote", methods=["POST"])
@jwt_required()
def get_delivery_quote():
    data = request.get_json() or {}

    address_id = data.get("address_id")
    restaurant_id = data.get("restaurant_id")

    if not address_id or not restaurant_id:
        return jsonify({
            "error": "Endereço e restaurante são obrigatórios."
        }), 400

    user = user_service.get_user_by_email(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    quote, error = delivery_service.get_delivery_quote(
        address_id=address_id,
        restaurant_id=restaurant_id,
        user_id=user.id
    )

    if error:
        return jsonify({"error": error}), 404

    return jsonify(quote), 200