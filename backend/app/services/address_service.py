from app.extensions import db
from app.models.address import Address
from app.models.user import User
from app.services.viacep_service import get_address_by_postal_code
from app.services.geoapify_service import get_coordinates

from sqlalchemy.exc import IntegrityError

def create_address(user_id, data):
    user = db.session.get(User, user_id)

    if not user:
        return None, "Usuário não encontrado."

    viacep_data, error = get_address_by_postal_code(data["postal_code"])

    if error:
        return None, error

    address_data = {
        "postal_code": viacep_data["postal_code"],
        "street": data.get("street") or viacep_data["street"],
        "number": data["number"],
        "complement": data.get("complement"),
        "neighborhood": data.get("neighborhood") or viacep_data["neighborhood"],
        "city": data.get("city") or viacep_data["city"],
        "state": (data.get("state") or viacep_data["state"]).upper()
    }

    required_fields = [
        "street",
        "number",
        "neighborhood",
        "city",
        "state"
    ]

    for field in required_fields:
        if not address_data[field]:
            return None, f"O campo {field} é obrigatório."

    coordinates, error = get_coordinates(address_data)

    if error:
        return None, error

    address = Address(
        user_id=user_id,
        postal_code=address_data["postal_code"],
        street=address_data["street"],
        number=address_data["number"],
        complement=address_data["complement"],
        neighborhood=address_data["neighborhood"],
        city=address_data["city"],
        state=address_data["state"],
        latitude=coordinates["latitude"],
        longitude=coordinates["longitude"]
    )

    try:
        db.session.add(address)
        db.session.commit()
        return address, None

    except IntegrityError:
        db.session.rollback()
        return None, "Não foi possível cadastrar o endereço."

def get_addresses(user_id):
    return Address.query.filter_by(user_id=user_id).all()

def get_address_by_id(address_id, user_id):
    return Address.query.filter_by(
        id=address_id,
        user_id=user_id
    ).first()

def update_address(address_id, user_id, data):
    address = get_address_by_id(address_id, user_id)

    if not address:
        return None, None

    address_data = {
        "postal_code": address.postal_code,
        "street": address.street,
        "number": address.number,
        "complement": address.complement,
        "neighborhood": address.neighborhood,
        "city": address.city,
        "state": address.state
    }

    allowed_fields = [
        "postal_code",
        "street",
        "number",
        "complement",
        "neighborhood",
        "city",
        "state"
    ]

    for field in allowed_fields:
        if field in data:
            address_data[field] = data[field]

    if "postal_code" in data:
        viacep_data, error = get_address_by_postal_code(
            address_data["postal_code"]
        )

        if error:
            return None, error

        for field in ["street", "neighborhood", "city", "state"]:
            if field not in data:
                address_data[field] = viacep_data[field]

        address_data["postal_code"] = viacep_data["postal_code"]

    address_data["state"] = address_data["state"].upper()

    required_fields = [
        "postal_code",
        "street",
        "number",
        "neighborhood",
        "city",
        "state"
    ]

    for field in required_fields:
        if not address_data[field]:
            return None, f"O campo {field} é obrigatório."

    coordinates, error = get_coordinates(address_data)

    if error:
        return None, error

    address.postal_code = address_data["postal_code"]
    address.street = address_data["street"]
    address.number = address_data["number"]
    address.complement = address_data["complement"]
    address.neighborhood = address_data["neighborhood"]
    address.city = address_data["city"]
    address.state = address_data["state"]
    address.latitude = coordinates["latitude"]
    address.longitude = coordinates["longitude"]

    try:
        db.session.commit()
        return address, None

    except IntegrityError:
        db.session.rollback()
        return None, "Não foi possível atualizar o endereço."


def delete_address(address_id, user_id):
    address = get_address_by_id(address_id, user_id)

    if not address:
        return False

    db.session.delete(address)
    db.session.commit()
    return True