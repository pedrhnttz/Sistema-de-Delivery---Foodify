from decimal import Decimal

from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.restaurant import Restaurant
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.address import Address
from app.services.delivery_service import get_delivery_quote
from app.services.payment_service import validate_payment

def create_cart(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return None, "Usuário não encontrado."

    existing_cart = Order.query.filter_by(
        user_id=user_id,
        status="cart"
    ).first()

    if existing_cart:
        return existing_cart, None

    order = Order(
        user_id=user_id,
        status="cart",
        total=Decimal("0.00")
    )

    db.session.add(order)
    db.session.commit()

    return order, None

def get_cart(order_id, user_id):
    return Order.query.filter_by(
        id=order_id,
        user_id=user_id,
        status="cart"
    ).first()

def update_cart_total(order):
    items = OrderItem.query.filter_by(
        order_id=order.id
    ).all()

    subtotal = sum(
        (
            Decimal(str(item.unit_price)) * item.quantity
            for item in items
        ),
        Decimal("0.00")
    )

    order.total = subtotal

    return subtotal

def get_cart_restaurant_id(order_id):
    first_item = OrderItem.query.filter_by(
        order_id=order_id
    ).first()

    if not first_item:
        return None

    product = db.session.get(Product, first_item.product_id)

    if not product:
        return None

    return product.restaurant_id

def add_product(order_id, product_id, quantity, user_id):
    order = get_cart(order_id, user_id)

    if not order:
        return None, "Cesta não encontrada ou já finalizada."

    if (
        not isinstance(quantity, int)
        or isinstance(quantity, bool)
        or quantity <= 0
    ):
        return None, "A quantidade deve ser um número inteiro maior que zero."

    product = db.session.get(Product, product_id)

    if not product:
        return None, "Produto não encontrado."

    if product.restaurant_id is None:
        return None, "O produto não está vinculado a um restaurante."

    cart_restaurant_id = get_cart_restaurant_id(order_id)

    if (
        cart_restaurant_id is not None
        and cart_restaurant_id != product.restaurant_id
    ):
        return None, (
            "Sua cesta já possui produtos de outro restaurante. "
            "Remova os produtos atuais antes de adicionar este item."
        )

    item = OrderItem.query.filter_by(
        order_id=order_id,
        product_id=product_id
    ).first()

    if item:
        item.quantity += quantity
    else:
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=Decimal(str(product.price))
        )

        db.session.add(item)

    update_cart_total(order)
    db.session.commit()

    return item, None

def get_cart_items(order_id, user_id):
    order = get_cart(order_id, user_id)

    if not order:
        return None, "Cesta não encontrada ou já finalizada."

    items = OrderItem.query.filter_by(
        order_id=order_id
    ).all()

    restaurant_id = get_cart_restaurant_id(order_id)
    restaurant = db.session.get(Restaurant, restaurant_id) if restaurant_id else None

    cart_items = []

    for item in items:
        product = db.session.get(Product, item.product_id)

        if not product:
            continue

        cart_items.append({
            "id": item.id,
            "product_id": product.id,
            "product_name": product.name,
            "food_type": product.food_type,
            "restaurant_id": product.restaurant_id,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "subtotal": float(
                Decimal(str(item.unit_price)) * item.quantity
            )
        })

    return {
        "order_id": order.id,
        "restaurant": (
            {
                "id": restaurant.id,
                "name": restaurant.name
            }
            if restaurant else None
        ),
        "items": cart_items,
        "total": float(order.total)
    }, None

def update_product_quantity(order_id, item_id, quantity, user_id):
    order = get_cart(order_id, user_id)

    if not order:
        return False, "Cesta não encontrada ou já finalizada."

    if (
        not isinstance(quantity, int)
        or isinstance(quantity, bool)
        or quantity <= 0
    ):
        return False, "A quantidade deve ser um número inteiro maior que zero."

    item = OrderItem.query.filter_by(
        id=item_id,
        order_id=order_id
    ).first()

    if not item:
        return False, "Produto não encontrado na cesta."

    item.quantity = quantity

    update_cart_total(order)
    db.session.commit()

    return True, None


def remove_product(order_id, item_id, user_id):
    order = get_cart(order_id, user_id)

    if not order:
        return False, "Cesta não encontrada ou já finalizada."

    item = OrderItem.query.filter_by(
        id=item_id,
        order_id=order_id
    ).first()

    if not item:
        return False, "Produto não encontrado na cesta."

    db.session.delete(item)

    update_cart_total(order)
    db.session.commit()

    return True, None

def checkout_order(
    order_id,
    address_id,
    payment_method,
    delivery_method,
    user_id,
    payment_code=None
):
    order = get_cart(order_id, user_id)

    if not order:
        return None, "Cesta não encontrada ou já finalizada."

    items = OrderItem.query.filter_by(
        order_id=order_id
    ).all()

    if not items:
        return None, "Não é possível fechar uma cesta vazia."

    if not isinstance(payment_method, str) or not payment_method.strip():
        return None, "A forma de pagamento é obrigatória."

    if not isinstance(delivery_method, str) or not delivery_method.strip():
        return None, "A forma de entrega é obrigatória."

    address = Address.query.filter_by(
        id=address_id,
        user_id=user_id
    ).first()

    if not address:
        return None, "Endereço não encontrado para este usuário."

    restaurant_id = get_cart_restaurant_id(order_id)

    if restaurant_id is None:
        return None, "Não foi possível identificar o restaurante do pedido."

    quote, error = get_delivery_quote(
        address_id=address_id,
        restaurant_id=restaurant_id,
        user_id=user_id
    )

    if error:
        return None, error

    subtotal = sum(
        (
            Decimal(str(item.unit_price)) * item.quantity
            for item in items
        ),
        Decimal("0.00")
    )

    delivery_cost = Decimal(str(quote["delivery_fee"]))

    payment_valid, payment_error = validate_payment(
        payment_method,
        payment_code
    )

    if not payment_valid:
        return None, payment_error

    order.address_id = address_id
    order.payment_method = payment_method.strip()
    order.delivery_method = delivery_method.strip()
    order.delivery_cost = delivery_cost
    order.total = subtotal + delivery_cost
    order.status = "confirmed"

    db.session.commit()

    return order, None


def get_order_invoice(order_id, user_id):
    order = Order.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order or order.status == "cart":
        return None, "Pedido não encontrado ou ainda não foi fechado."

    address = db.session.get(Address, order.address_id)

    if not address:
        return None, "Endereço do pedido não encontrado."

    items = OrderItem.query.filter_by(
        order_id=order_id
    ).all()

    restaurant = None
    invoice_items = []
    subtotal = Decimal("0.00")

    for item in items:
        product = db.session.get(
            Product,
            item.product_id
        )

        if not product:
            continue

        # Identifica o restaurante do pedido
        if restaurant is None:
            restaurant = db.session.get(
                Restaurant,
                product.restaurant_id
            )

        item_subtotal = (
            Decimal(str(item.unit_price))
            * item.quantity
        )

        subtotal += item_subtotal

        invoice_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "subtotal": float(item_subtotal)
        })

    return {
        "invoice": {
            "order_id": order.id,
            "status": order.status,
            "user_id": order.user_id,

            # Restaurante
            "restaurant": (
                {
                    "id": restaurant.id,
                    "name": restaurant.name
                }
                if restaurant else None
            ),

            # Endereço
            "delivery_address": {
                "postal_code": address.postal_code,
                "street": address.street,
                "number": address.number,
                "complement": address.complement,
                "neighborhood": address.neighborhood,
                "city": address.city,
                "state": address.state
            },

            # Produtos
            "items": invoice_items,

            # Pagamento e entrega
            "payment_method": order.payment_method,
            "delivery_method": order.delivery_method,

            # Valores
            "subtotal": float(subtotal),
            "delivery_cost": float(
                order.delivery_cost or 0
            ),
            "total": float(order.total)
        }
    }, None

def update_order_status(order_id, new_status, user_id):
    allowed_statuses = [
        "confirmed",
        "preparing",
        "on_the_way",
        "delivered"
    ]

    if new_status not in allowed_statuses:
        return None, "Status inválido."

    order = Order.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order or order.status == "cart":
        return None, "Pedido não encontrado ou ainda não fechado."

    order.status = new_status
    db.session.commit()

    return order, None

def get_order_tracking(order_id, user_id):
    order = Order.query.filter_by(
        id=order_id,
        user_id=user_id
    ).first()

    if not order or order.status == "cart":
        return None, "Pedido não encontrado ou ainda não fechado."

    address = db.session.get(Address, order.address_id)

    if not address:
        return None, "Endereço do pedido não encontrado."

    return {
        "order_id": order.id,
        "status": order.status,
        "delivery_address": {
            "street": address.street,
            "number": address.number,
            "neighborhood": address.neighborhood,
            "city": address.city,
            "state": address.state
        }
    }, None

def get_user_orders(user_id):
    orders = (
        Order.query
        .filter(
            Order.user_id == user_id,
            Order.status != "cart"
        )
        .order_by(Order.id.desc())
        .all()
    )

    result = []

    for order in orders:
        order_items = (
            OrderItem.query
            .filter_by(order_id=order.id)
            .all()
        )

        items = []
        restaurant = None

        for item in order_items:
            product = db.session.get(
                Product,
                item.product_id
            )

            if not product:
                continue

            if restaurant is None:
                restaurant = db.session.get(
                    Restaurant,
                    product.restaurant_id
                )

            items.append({
                "id": item.id,
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "subtotal": float(
                    Decimal(str(item.unit_price))
                    * item.quantity
                )
            })

        result.append({
            "id": order.id,
            "status": order.status,
            "restaurant_id": (
                restaurant.id if restaurant else None
            ),
            "restaurant_name": (
                restaurant.name
                if restaurant
                else "Restaurante indisponível"
            ),
            "items": items,
            "payment_method": order.payment_method,
            "delivery_method": order.delivery_method,
            "delivery_cost": float(
                order.delivery_cost or 0
            ),
            "total": float(order.total or 0)
        })

    return result