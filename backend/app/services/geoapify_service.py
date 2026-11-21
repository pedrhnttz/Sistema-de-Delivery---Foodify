import requests
import os

def get_coordinates(address):
    api_key = os.getenv("GEOAPIFY_API_KEY")

    if not api_key:
        return None, "Chave da API Geoapify não configurada."

    try:
        response = requests.get(
            "https://api.geoapify.com/v1/geocode/search",
            params={
                "street": f'{address["street"]}, {address["number"]}',
                "postcode": address["postal_code"],
                "city": address["city"],
                "state": address["state"],
                "country": "Brazil",
                "format": "json",
                "apiKey": api_key
            },
            timeout=10
        )

        response.raise_for_status()
        data = response.json()

        results = data.get("results", [])

        if not results:
            return None, "Não foi possível localizar esse endereço."

        location = results[0]

        return {
            "latitude": location["lat"],
            "longitude": location["lon"]
        }, None

    except requests.RequestException:
        return None, "Erro ao consultar a localização do endereço."