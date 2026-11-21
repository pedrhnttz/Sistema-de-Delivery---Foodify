import hashlib
import secrets
from datetime import datetime, timedelta

from app.extensions import db
from app.models.user import User
from app.models.verification_code import VerificationCode
from app.services.email_service import send_verification_email

def generate_verification_code(email):
    user = User.query.filter_by(email=email).first()

    if not user:
        return False, "Não foi possível solicitar o código."

    code = f"{secrets.randbelow(1000000):06d}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()

    VerificationCode.query.filter_by(
        user_id=user.id,
        used=False
    ).update({"used": True})

    verification = VerificationCode(
        user_id=user.id,
        code_hash=code_hash,
        expires_at=datetime.now() + timedelta(minutes=5),
        used=False
    )

    db.session.add(verification)
    db.session.commit()

    if not send_verification_email(user.email, code):
        verification.used = True
        db.session.commit()
        return False, "Não foi possível enviar o código."

    return True, "Código enviado para o e-mail cadastrado."

def validate_verification_code(email, code):
    user = User.query.filter_by(email=email).first()

    if not user:
        return False, "Código inválido ou expirado."

    verification = VerificationCode.query.filter_by(
        user_id=user.id,
        used=False
    ).order_by(VerificationCode.id.desc()).first()

    if not verification:
        return False, "Código inválido ou expirado."

    if verification.expires_at < datetime.now():
        verification.used = True
        db.session.commit()
        return False, "Código inválido ou expirado."

    if not isinstance(code, str) or len(code) != 6 or not code.isdigit():
        return False, "Código inválido ou expirado."

    code_hash = hashlib.sha256(code.encode()).hexdigest()

    if not secrets.compare_digest(
        verification.code_hash,
        code_hash
    ):
        return False, "Código inválido ou expirado."

    verification.used = True
    db.session.commit()

    return True, "Código validado com sucesso."