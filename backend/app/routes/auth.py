import os

from flask import Blueprint, request, jsonify, url_for, redirect
from flask_jwt_extended import create_access_token
from app.extensions import oauth
from app.services.user_service import create_google_user

from app.services.auth_service import (
    generate_verification_code,
    validate_verification_code
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/send-code", methods=["POST"])
def send_code():
    data = request.get_json() or {}

    email = data.get("email")

    if not email:
        return jsonify({"error": "E-mail é obrigatório."}), 400

    success, message = generate_verification_code(email)

    if not success:
        return jsonify({"error": message}), 400

    return jsonify({"message": message}), 200

@auth_bp.route("/verify-code", methods=["POST"])
def verify_code():
    data = request.get_json() or {}

    email = data.get("email")
    code = data.get("code")

    if not email or code is None:
        return jsonify({
            "error": "E-mail e código são obrigatórios."
        }), 400

    success, message = validate_verification_code(email, code)

    if not success:
        return jsonify({"error": message}), 400

    access_token = create_access_token(
        identity=str(email)
    )

    return jsonify({
        "message": message,
        "access_token": access_token,
        "token_type": "Bearer"
    }), 200

@auth_bp.route("/google/login", methods=["GET"])
def google_login():
    redirect_uri = url_for(
        "auth.google_callback",
        _external=True
    )
    print("URL de callback:", redirect_uri)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    token = oauth.google.authorize_access_token()

    user_info = token.get("userinfo")

    if not user_info:
        return jsonify({
            "error": "Não foi possível obter os dados do Google."
        }), 400

    email = user_info.get("email")
    name = user_info.get("name")
    email_verified = user_info.get("email_verified", False)

    if not email or not name or not email_verified:
        return jsonify({
            "error": "A conta Google não possui dados válidos."
        }), 400

    user, error = create_google_user(name, email)

    if error:
        return jsonify({"error": error}), 400

    access_token = create_access_token(
        identity=str(user.email)
    )

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    return redirect(
        f"{frontend_url}/login/google/callback#access_token={access_token}"
    )