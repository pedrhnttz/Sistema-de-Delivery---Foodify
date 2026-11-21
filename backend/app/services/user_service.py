from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.user import User

def create_user(data):
    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=None,
        phone=data.get("phone")
    )

    try:
        db.session.add(user)
        db.session.commit()

        return user, None

    except IntegrityError:
        db.session.rollback()
        return None, "E-mail ou telefone já cadastrado."

def get_users():
    return User.query.all()


def get_user_by_id(user_id):
    return db.session.get(User, user_id)

def get_user_by_email(email):
    return User.query.filter_by(email=email).first()

def update_user(user_id, data):
    user = get_user_by_id(user_id)

    if not user:
        return None, "Usuário não encontrado."

    if "name" in data:
        user.name = data["name"]

    if "email" in data:
        user.email = data["email"]

    if "phone" in data:
        user.phone = data["phone"]

    try:
        db.session.commit()
        return user, None

    except IntegrityError:
        db.session.rollback()
        return None, "E-mail ou telefone já cadastrado."

def update_current_user(email, data):
    user = get_user_by_email(email)

    if not user:
        return None, "Usuário não encontrado."

    return update_user(user.id, data)

def delete_user(user_id):
    user = get_user_by_id(user_id)

    if not user:
        return False

    db.session.delete(user)
    db.session.commit()

    return True

def create_google_user(name, email):
    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return existing_user, None

    user = User(
        name=name,
        email=email,
        password_hash=None,
        phone=None
    )

    try:
        db.session.add(user)
        db.session.commit()

        return user, None

    except IntegrityError:
        db.session.rollback()
        return None, "Não foi possível cadastrar a conta Google."