from flask import Blueprint, request, jsonify
from app.services import user_service
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    create_access_token
)

users_bp = Blueprint("users", __name__)

def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone
    }

@users_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Dados inválidos."}), 400

    required_fields = ["name", "email"]

    for field in required_fields:
        if not data.get(field):
            return jsonify({
                "error": f"O campo {field} é obrigatório."
            }), 400

    user, error = user_service.create_user(data)

    if error:
        return jsonify({"error": error}), 409

    return jsonify({
        "message": "Usuário cadastrado com sucesso.",
        "user": user_to_dict(user)
    }), 201

@users_bp.route("/", methods=["GET"])
@jwt_required()
def list_users():
    users = user_service.get_users()

    return jsonify([
        user_to_dict(user) for user in users
    ]), 200

@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    email = get_jwt_identity()

    user = user_service.get_user_by_email(email)

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    return jsonify(user_to_dict(user)), 200

@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    user = user_service.get_user_by_id(user_id)

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    return jsonify(user_to_dict(user)), 200

@users_bp.route("/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Dados inválidos."}), 400

    user, error = user_service.update_user(user_id, data)

    if error:
        status = 404 if error == "Usuário não encontrado." else 409

        return jsonify({"error": error}), status

    return jsonify({
        "message": "Usuário atualizado com sucesso.",
        "user": user_to_dict(user)
    }), 200


@users_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_current_user():
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Dados inválidos."}), 400

    allowed_fields = ["name", "email", "phone"]

    if any(field not in allowed_fields for field in data):
        return jsonify({"error": "Campo não permitido."}), 400

    email = get_jwt_identity()

    user, error = user_service.update_current_user(email, data)

    if error:
        status = 404 if error == "Usuário não encontrado." else 409
        return jsonify({"error": error}), status

    access_token = create_access_token(identity=str(user.email))

    return jsonify({
        "message": "Dados atualizados com sucesso.",
        "user": user_to_dict(user),
        "access_token": access_token,
        "token_type": "Bearer"
    }), 200

@users_bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    deleted = user_service.delete_user(user_id)

    if not deleted:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    return jsonify({
        "message": "Usuário excluído com sucesso."
    }), 200


@users_bp.route("/me", methods=["DELETE"])
@jwt_required()
def delete_current_user():
    email = get_jwt_identity()

    user = user_service.get_user_by_email(email)

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    try:
        deleted = user_service.delete_user(user.id)

        if not deleted:
            return jsonify({
                "error": "Não foi possível excluir a conta."
            }), 400

        return jsonify({
            "message": "Conta excluída com sucesso."
        }), 200

    except Exception:
        from app.extensions import db
        db.session.rollback()

        return jsonify({
            "error": "Não foi possível excluir a conta. "
                     "Verifique se existem registros vinculados."
        }), 409
