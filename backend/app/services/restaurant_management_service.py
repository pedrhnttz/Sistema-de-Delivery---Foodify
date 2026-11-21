from decimal import Decimal, InvalidOperation

from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models.restaurant import Restaurant
from app.models.product import Product
from app.models.favorite import Favorite
from app.models.order import Order
from app.models.order_item import OrderItem

RESTAURANT_FIELDS = (
    'name', 'food_type', 'postal_code', 'street', 'number',
    'complement', 'neighborhood', 'city', 'state',
)
REQUIRED_FIELDS = set(RESTAURANT_FIELDS) - {'complement'}


class ManagementError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def _get_owned_restaurant(restaurant_id, user_id):
    restaurant = db.session.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise ManagementError('Restaurante não encontrado.', 404)
    if restaurant.user_id != user_id:
        raise ManagementError('Você não tem permissão para alterar este restaurante.', 403)
    return restaurant


def _parse_price(raw):
    if isinstance(raw, bool):
        raise ManagementError('Preço inválido.')
    try:
        price = Decimal(str(raw))
        if not price.is_finite() or price < 0 or price.as_tuple().exponent < -2:
            raise ManagementError('Preço deve ser maior ou igual a zero e ter até duas casas decimais.')
        if price > Decimal('99999999.99'):
            raise ManagementError('Preço excede o limite permitido.')
        return price.quantize(Decimal('0.01'))
    except (InvalidOperation, ValueError, TypeError):
        raise ManagementError('Preço inválido.')


def _remove_products(product_ids):
    if not product_ids:
        return
    affected_orders = {
        row[0] for row in db.session.query(OrderItem.order_id)
        .filter(OrderItem.product_id.in_(product_ids)).all()
    }
    OrderItem.query.filter(OrderItem.product_id.in_(product_ids)).delete(synchronize_session=False)
    Favorite.query.filter(Favorite.product_id.in_(product_ids)).delete(synchronize_session=False)
    Product.query.filter(Product.id.in_(product_ids)).delete(synchronize_session=False)
    db.session.flush()
    for order_id in affected_orders:
        order = db.session.get(Order, order_id)
        if order is None:
            continue
        items = OrderItem.query.filter_by(order_id=order_id).all()
        subtotal = sum(
            (Decimal(str(item.unit_price)) * item.quantity for item in items),
            Decimal('0.00'),
        )
        order.total = subtotal if order.status == 'cart' else subtotal + Decimal(str(order.delivery_cost or 0))


def save_restaurant_and_products(restaurant_id, user_id, payload):
    restaurant = _get_owned_restaurant(restaurant_id, user_id)
    if not isinstance(payload, dict) or not isinstance(payload.get('products'), list):
        raise ManagementError('Envie os dados do restaurante e a lista de produtos.')
    if any(field not in payload or not isinstance(payload[field], str) or
           (field in REQUIRED_FIELDS and not payload[field].strip())
           for field in RESTAURANT_FIELDS):
        raise ManagementError('Preencha os campos obrigatórios do restaurante.')
    if len(payload['state'].strip()) != 2:
        raise ManagementError('UF inválida.')
    max_lengths = {'name':150, 'food_type':100, 'postal_code':9, 'street':150,
                   'number':20, 'complement':100, 'neighborhood':100, 'city':100, 'state':2}
    if any(len(payload[key].strip()) > max_lengths[key] for key in RESTAURANT_FIELDS):
        raise ManagementError('Um dos campos excede o tamanho permitido.')

    existing = {p.id: p for p in Product.query.filter_by(restaurant_id=restaurant_id).all()}
    seen_ids = set()
    normalized = []
    for item in payload['products']:
        if not isinstance(item, dict) or not isinstance(item.get('name'), str):
            raise ManagementError('Produto inválido.')
        name = item['name'].strip()
        if not name or len(name) > 150:
            raise ManagementError('Nome do produto inválido.')
        if 'price' not in item:
            raise ManagementError('Informe o preço do produto.')
        price = _parse_price(item['price'])
        product_id = item.get('id')
        if product_id is not None:
            if type(product_id) is not int or product_id not in existing or product_id in seen_ids:
                raise ManagementError('Produto inválido ou não pertence ao restaurante.', 400)
            seen_ids.add(product_id)
        normalized.append((product_id, name, price))

    try:
        for field in RESTAURANT_FIELDS:
            value = payload[field].strip()
            setattr(restaurant, field, value.upper() if field == 'state' else value)
        to_delete = list(set(existing) - seen_ids)
        _remove_products(to_delete)
        for product_id, name, price in normalized:
            if product_id is None:
                db.session.add(Product(
                    restaurant_id=restaurant.id, name=name,
                    food_type=restaurant.food_type, price=price,
                ))
            else:
                product = existing[product_id]
                product.name = name
                product.food_type = restaurant.food_type
                product.price = price
        db.session.commit()
        return restaurant
    except SQLAlchemyError:
        db.session.rollback()
        raise ManagementError('Erro ao salvar alterações no banco de dados.', 500)


def delete_restaurant_with_related(restaurant_id, user_id):
    restaurant = _get_owned_restaurant(restaurant_id, user_id)
    try:
        product_ids = [p.id for p in Product.query.filter_by(restaurant_id=restaurant.id).all()]
        _remove_products(product_ids)
        Favorite.query.filter_by(restaurant_id=restaurant.id).delete(synchronize_session=False)
        db.session.delete(restaurant)
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        raise ManagementError('Não foi possível excluir o restaurante.', 500)
