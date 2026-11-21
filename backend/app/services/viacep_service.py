import requests

def get_address_by_postal_code(postal_code):
    postal_code = "".join(
        character for character in str(postal_code)
        if character.isdigit()
    )

    if len(postal_code) != 8:
        return None, "CEP inválido."

    try:
        response = requests.get(
            f"https://viacep.com.br/ws/{postal_code}/json/",
            timeout=10
        )

        response.raise_for_status()
        data = response.json()

        if data.get("erro"):
            return None, "CEP não encontrado."

        return {
            "postal_code": postal_code,
            "street": data.get("logradouro", ""),
            "neighborhood": data.get("bairro", ""),
            "city": data.get("localidade", ""),
            "state": data.get("uf", "")
        }, None

    except requests.RequestException:
        return None, "Não foi possível consultar o CEP."