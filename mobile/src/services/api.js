const BASE_URL =
  "http://10.0.2.2:5000/api/mobile/restaurants";

export async function apiRequest(path = "/", options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const contentType =
      response.headers.get("content-type") || "";

    let data = null;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null
          ? data.error || data.message
          : null;

      throw new Error(
        message ||
          `Erro na requisição. Código HTTP: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Não foi possível conectar ao servidor Foodify. " +
        "Verifique se o Flask está em execução na porta 5000."
      );
    }

    throw error;
  }
}