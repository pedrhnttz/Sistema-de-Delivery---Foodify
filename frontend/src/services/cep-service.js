export async function getAddressByCep(cep) {
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    throw new Error('Informe um CEP válido.');
  }

  let response;

  try {
    response = await fetch(
      `https://viacep.com.br/ws/${cleanCep}/json/`
    );
  } catch {
    throw new Error('Não foi possível consultar o CEP.');
  }

  if (!response.ok) {
    throw new Error('Não foi possível consultar o CEP.');
  }

  const data = await response.json();

  if (data.erro) {
    throw new Error('CEP não encontrado.');
  }

  return {
    postal_code: cleanCep,
    street: data.logradouro || '',
    neighborhood: data.bairro || '',
    city: data.localidade || '',
    state: data.uf || ''
  };
}