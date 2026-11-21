PAYMENT_METHODS = {
    "pix",
    "credit_card",
    "debit_card",
    "cash",
}


def validate_payment(payment_method, payment_code=None):
    if not isinstance(payment_method, str):
        return False, "Forma de pagamento inválida."

    method = payment_method.strip().lower()

    if method not in PAYMENT_METHODS:
        return False, "Forma de pagamento não aceita."

    if method == "cash":
        return True, None

    if not isinstance(payment_code, str):
        return False, "Informe o código de validação."

    code = payment_code.strip()

    if method == "pix":
        if code == "123456":
            return True, None

        return False, "Pagamento Pix não autorizado."

    if method in {"credit_card", "debit_card"}:
        if code == "APROVADO":
            return True, None

        return False, "Pagamento com cartão recusado."

    return False, "Pagamento inválido."