import { useEffect, useState } from 'react';

import {
  createAddress,
  updateAddress
} from '../../services/address-service';

import { getAddressByCep } from '../../services/cep-service';

import './address-form-popup.css';

const initialForm = {
  postal_code: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: ''
};

function formatCep(value) {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 8);

  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

function AddressFormPopup({ address = null, onClose, onSaved }) {
  const isEditing = Boolean(address?.id);

  const [form, setForm] = useState(() =>
    address
      ? {
          postal_code: formatCep(address.postal_code),
          street: address.street || '',
          number: String(address.number || ''),
          complement: address.complement || '',
          neighborhood: address.neighborhood || '',
          city: address.city || '',
          state: address.state || ''
        }
      : { ...initialForm }
  );

  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Consulta o CEP somente quando ele for alterado.
  const [cepToSearch, setCepToSearch] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === 'postal_code') {
      const formatted = formatCep(value);

      setForm((current) => ({
        ...current,
        postal_code: formatted,
        street: '',
        neighborhood: '',
        city: '',
        state: ''
      }));

      setCepToSearch(formatted.replace(/\D/g, ''));
    } else {
      setForm((current) => ({
        ...current,
        [name]:
          name === 'state'
            ? value.toUpperCase().slice(0, 2)
            : value
      }));
    }

    setError('');
  }

  useEffect(() => {
    if (cepToSearch.length !== 8) {
      setLoadingCep(false);
      return;
    }

    let cancelled = false;

    async function loadCep() {
      setLoadingCep(true);
      setError('');

      try {
        const result = await getAddressByCep(cepToSearch);

        if (!cancelled) {
          setForm((current) => ({
            ...current,
            street: result.street || '',
            neighborhood: result.neighborhood || '',
            city: result.city || '',
            state: result.state || ''
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingCep(false);
        }
      }
    }

    loadCep();

    return () => {
      cancelled = true;
    };
  }, [cepToSearch]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || loadingCep) return;

    const cep = form.postal_code.replace(/\D/g, '');

    if (cep.length !== 8) {
      setError('Informe um CEP válido.');
      return;
    }

    if (
      !form.street.trim() ||
      !form.number.trim() ||
      !form.neighborhood.trim() ||
      !form.city.trim() ||
      !/^[A-Z]{2}$/.test(form.state.trim())
    ) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    const addressData = {
      postal_code: cep,
      street: form.street.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim()
    };

    try {
      setSaving(true);
      setError('');

      const savedAddress = isEditing
        ? await updateAddress(address.id, addressData)
        : await createAddress(addressData);

      await onSaved?.(savedAddress);
    } catch (err) {
      setError(err.message || 'Erro ao salvar endereço.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="address-form-overlay">
      <section
        className="address-form-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-form-title"
      >
        <button
          type="button"
          className="address-form-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        <h2 id="address-form-title">
          {isEditing ? 'Editar endereço' : 'Adicionar endereço'}
        </h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="address-cep">CEP</label>
          <input
            id="address-cep"
            name="postal_code"
            value={form.postal_code}
            onChange={handleChange}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
            required
          />

          {loadingCep && (
            <span className="address-form-hint">
              Buscando endereço...
            </span>
          )}

          <label htmlFor="address-street">Rua</label>
          <input
            id="address-street"
            name="street"
            value={form.street}
            onChange={handleChange}
            placeholder="Rua ou avenida"
            required
          />

          <label htmlFor="address-number">Número</label>
          <input
            id="address-number"
            name="number"
            value={form.number}
            onChange={handleChange}
            placeholder="Número"
            required
          />

          <label htmlFor="address-complement">
            Complemento (opcional)
          </label>
          <input
            id="address-complement"
            name="complement"
            value={form.complement}
            onChange={handleChange}
            placeholder="Apartamento, bloco, casa..."
          />

          <label htmlFor="address-neighborhood">Bairro</label>
          <input
            id="address-neighborhood"
            name="neighborhood"
            value={form.neighborhood}
            onChange={handleChange}
            required
          />

          <label htmlFor="address-city">Cidade</label>
          <input
            id="address-city"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
          />

          <label htmlFor="address-state">Estado (UF)</label>
          <input
            id="address-state"
            name="state"
            value={form.state}
            onChange={handleChange}
            maxLength={2}
            placeholder="SP"
            required
          />

          {error && (
            <p className="address-form-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="address-form-submit"
            disabled={saving || loadingCep}
          >
            {saving
              ? 'Salvando...'
              : isEditing
                ? 'Salvar alterações'
                : 'Salvar endereço'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AddressFormPopup;