import os
import smtplib
from email.message import EmailMessage

def send_verification_email(recipient, code):
    message = EmailMessage()
    message["Subject"] = "Código de acesso - Foodify"
    message["From"] = os.getenv("SMTP_USER")
    message["To"] = recipient

    message.set_content(
        f"Seu código de acesso ao Foodify é: {code}\n\n"
        "Esse código é válido por 5 minutos.\n"
        "Se você não solicitou esse código, ignore este e-mail."
    )

    try:
        with smtplib.SMTP(
            os.getenv("SMTP_HOST"),
            int(os.getenv("SMTP_PORT", 587))
        ) as smtp:
            smtp.starttls()
            smtp.login(
                os.getenv("SMTP_USER"),
                os.getenv("SMTP_PASSWORD")
            )
            smtp.send_message(message)

        return True

    except Exception as error:
        print(f"Erro ao enviar e-mail: {error}")
        return False