from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services import user_service

from app.services.order_service import (
    create_cart,
    add_product,
    get_cart_items,
    update_product_quantity,
    remove_product,
    checkout_order,
    get_order_invoice,
    update_order_status,
    get_order_tracking,
    get_user_orders
)


orders_bp = Blueprint(
    "orders",
    __name__,
    url_prefix="/api/orders"
)

def get_authenticated_user():
    email = get_jwt_identity()
    return user_service.get_user_by_email(email)

@orders_bp.route("/cart", methods=["POST"])
@jwt_required()
def create_cart_route():
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    order, error = create_cart(user.id)

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Cesta criada ou recuperada com sucesso.",
        "order_id": order.id
    }), 200

@orders_bp.route("/my-orders", methods=["GET"])
@jwt_required()
def get_my_orders_route():
    user = get_authenticated_user()

    if not user:
        return jsonify({
            "error": "Usuário não encontrado."
        }), 404

    orders = get_user_orders(user.id)

    return jsonify({
        "orders": orders
    }), 200

@orders_bp.route("/<int:order_id>/items", methods=["POST"])
@jwt_required()
def add_product_route(order_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data = request.get_json() or {}

    if "product_id" not in data or "quantity" not in data:
        return jsonify({
            "error": "product_id e quantity são obrigatórios."
        }), 400

    item, error = add_product(
        order_id,
        data["product_id"],
        data["quantity"],
        user.id
    )

    if error:
        status_code = 409 if "outro restaurante" in error else 400
        return jsonify({"error": error}), status_code

    return jsonify({
        "message": "Produto adicionado à cesta.",
        "item_id": item.id
    }), 201

@orders_bp.route("/<int:order_id>/items", methods=["GET"])
@jwt_required()
def get_cart_route(order_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    cart, error = get_cart_items(order_id, user.id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify(cart), 200

@orders_bp.route(
    "/<int:order_id>/items/<int:item_id>",
    methods=["PUT"]
)
@jwt_required()
def update_product_route(order_id, item_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data = request.get_json() or {}

    if "quantity" not in data:
        return jsonify({"error": "quantity é obrigatório."}), 400

    success, error = update_product_quantity(
        order_id,
        item_id,
        data["quantity"],
        user.id
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Quantidade atualizada."
    }), 200

@orders_bp.route(
    "/<int:order_id>/items/<int:item_id>",
    methods=["DELETE"]
)
@jwt_required()
def remove_product_route(order_id, item_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    success, error = remove_product(
        order_id,
        item_id,
        user.id
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Produto removido da cesta."
    }), 200

@orders_bp.route("/<int:order_id>/checkout", methods=["POST"])
@jwt_required()
def checkout_order_route(order_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data = request.get_json() or {}

    required_fields = [
        "address_id",
        "payment_method",
        "delivery_method"
    ]

    for field in required_fields:
        if field not in data or data[field] in (None, ""):
            return jsonify({
                "error": f"O campo {field} é obrigatório."
            }), 400

    order, error = checkout_order(
        order_id=order_id,
        address_id=data["address_id"],
        payment_method=data["payment_method"],
        delivery_method=data["delivery_method"],
        user_id=user.id,
        payment_code=data.get("payment_code")
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Pedido fechado com sucesso.",
        "order": {
            "id": order.id,
            "user_id": order.user_id,
            "address_id": order.address_id,
            "payment_method": order.payment_method,
            "delivery_method": order.delivery_method,
            "delivery_cost": float(order.delivery_cost),
            "total": float(order.total),
            "status": order.status
        }
    }), 200

@orders_bp.route("/<int:order_id>/invoice", methods=["GET"])
@jwt_required()
def get_order_invoice_route(order_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    invoice, error = get_order_invoice(order_id, user.id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify(invoice), 200

@orders_bp.route("/<int:order_id>/tracking", methods=["GET"])
@jwt_required()
def get_order_tracking_route(order_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    tracking, error = get_order_tracking(order_id, user.id)

    if error:
        return jsonify({"error": error}), 404

    return jsonify(tracking), 200

@orders_bp.route("/<int:order_id>/status", methods=["PUT"])
@jwt_required()
def update_order_status_route(order_id):
    user = get_authenticated_user()

    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data = request.get_json() or {}

    if "status" not in data:
        return jsonify({
            "error": "O campo status é obrigatório."
        }), 400

    order, error = update_order_status(
        order_id,
        data["status"],
        user.id
    )

    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Status do pedido atualizado.",
        "order_id": order.id,
        "status": order.status
    }), 200