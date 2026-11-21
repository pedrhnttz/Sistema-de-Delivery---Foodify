from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services import address_service, user_service

addresses_bp = Blueprint("addresses", __name__)

def address_to_dict(address):
    return {
        "id": address.id,
        "user_id": address.user_id,
        "postal_code": address.postal_code,
        "street": address.street,
        "number": address.number,
        "complement": address.complement,
        "neighborhood": address.neighborhood,
        "city": address.city,
        "state": address.state,
        "latitude": address.latitude,
        "longitude": address.longitude
    }

def get_authenticated_user():
    email = get_jwt_identity()
    return user_service.get_user_by_email(email)

@addresses_bp.route("/", methods=["POST"])
@jwt_required()
def create_address():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Dados inválidos."}), 400

    required_fields = ["postal_code", "number"]

    for field in required_fields:
        if not data.get(field):
            return jsonify({
                "error": f"O campo {field} é obrigatório."
            }), 400

    email = get_jwt_identity()
    user = user_service.get_user_by_email(email)

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    address, error = address_service.create_address(
        user.id,
        data
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify(address_to_dict(address)), 201

@addresses_bp.route("/", methods=["GET"])
@jwt_required()
def get_addresses():
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    addresses = address_service.get_addresses(user.id)

    return jsonify([
        address_to_dict(address)
        for address in addresses
    ]), 200

@addresses_bp.route("/<int:address_id>", methods=["GET"])
@jwt_required()
def get_address(address_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    address = address_service.get_address_by_id(
        address_id,
        user.id
    )

    if not address:
        return jsonify({"error": "Endereço não encontrado."}), 404

    return jsonify(address_to_dict(address)), 200

@addresses_bp.route("/<int:address_id>", methods=["PUT"])
@jwt_required()
def update_address(address_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Nenhum dado válido foi enviado."}), 400

    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    address, error = address_service.update_address(
        address_id,
        user.id,
        data
    )

    if error:
        return jsonify({"error": error}), 400

    if not address:
        return jsonify({"error": "Endereço não encontrado."}), 404

    return jsonify(address_to_dict(address)), 200

@addresses_bp.route("/<int:address_id>", methods=["DELETE"])
@jwt_required()
def delete_address(address_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    deleted = address_service.delete_address(
        address_id,
        user.id
    )

    if not deleted:
        return jsonify({"error": "Endereço não encontrado."}), 404

    return jsonify({"message": "Endereço excluído com sucesso."}), 200