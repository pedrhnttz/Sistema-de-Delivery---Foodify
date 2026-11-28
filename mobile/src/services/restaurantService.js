
import { apiRequest } from "./api";

export const restaurantService = {
  listar: async () => {
    return apiRequest("/");
  },

  consultar: async (id) => {
    return apiRequest(`/${id}`);
  },

  cadastrar: async (dados) => {
    return apiRequest("/", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  },

  atualizar: async (id, dados) => {
    return apiRequest(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    });
  },

  excluir: async (id) => {
    return apiRequest(`/${id}`, {
      method: "DELETE",
    });
  },
};