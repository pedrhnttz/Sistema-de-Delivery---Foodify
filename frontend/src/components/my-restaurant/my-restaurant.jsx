import { useEffect, useId, useState } from 'react';

import {
  getRestaurantProducts,
  saveRestaurantManagement,
  deleteRestaurant,
} from '../../services/restaurant-service';

import './my-restaurant.css';

// CAMPOS DO FORMULÁRIO

const RESTAURANT_FIELDS = [
  ['name', 'Nome do restaurante'],
  ['food_type', 'Tipo de comida'],
];

const ADDRESS_FIELDS = [
  ['postal_code', 'CEP'],
  ['street', 'Rua'],
  ['number', 'Número'],
  ['complement', 'Complemento'],
  ['neighborhood', 'Bairro'],
  ['city', 'Cidade'],
  ['state', 'Estado (UF)'],
];

const ALL_FIELDS = [
  ...RESTAURANT_FIELDS,
  ...ADDRESS_FIELDS,
];

// FORMATAÇÃO DO PREÇO

function normalizePrice(value) {
  const text = String(value ?? '').trim();

  if (!text) {
    return NaN;
  }

  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text;

  const number = Number(normalized);

  return Number.isFinite(number) ? number : NaN;
}

// COMPONENTE PRINCIPAL

function MyRestaurant({
  restaurant,
  onClose,
  onSaved,
  onDeleted,
}) {
  const titleId = useId();

  // ESTADOS

  const [form, setForm] = useState({});
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const busy = saving || deleting;

  // CARREGAR RESTAURANTE E CARDÁPIO

  useEffect(() => {
    if (!restaurant) return;

    setForm(
      Object.fromEntries(
        ALL_FIELDS.map(([key]) => [
          key,
          restaurant[key] ?? '',
        ])
      )
    );

    setProducts([]);
    setError('');
    setConfirmDelete(false);
    setLoading(true);

    let active = true;

    getRestaurantProducts(restaurant.id)
      .then((data) => {
        if (!active) return;

        setProducts(
          data.map((product) => ({
            id: product.id,
            key: `saved-${product.id}`,
            name: product.name,
            price: Number(product.price)
              .toFixed(2)
              .replace('.', ','),
          }))
        );
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [restaurant]);

  // FECHAR POPUP COM ESC

  useEffect(() => {
    if (!restaurant) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !busy) {
        if (confirmDelete) {
          setConfirmDelete(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [restaurant, busy, confirmDelete, onClose]);

  // ALTERAR CAMPOS DO RESTAURANTE

  function changeField(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // ALTERAR PRODUTO

  function changeProduct(key, field, value) {
    setProducts((previous) =>
      previous.map((product) =>
        product.key === key
          ? { ...product, [field]: value }
          : product
      )
    );
  }

  // ADICIONAR PRODUTO

  function addProduct() {
    setProducts((previous) => [
      ...previous,
      {
        key: `new-${crypto.randomUUID()}`,
        name: 'Novo item',
        price: '0,00',
      },
    ]);
  }

  // REMOVER PRODUTO

  function removeProduct(key) {
    setProducts((previous) =>
      previous.filter((product) => product.key !== key)
    );
  }

  // SALVAR ALTERAÇÕES

  async function handleSave(event) {
    event.preventDefault();

    if (loading || busy) return;

    setError('');

    const data = Object.fromEntries(
      ALL_FIELDS.map(([key]) => [
        key,
        String(form[key] ?? '').trim(),
      ])
    );

    // Validar campos obrigatórios

    const required = ALL_FIELDS.filter(
      ([key]) => key !== 'complement'
    );

    if (required.some(([key]) => !data[key])) {
      setError(
        'Preencha todos os campos obrigatórios do restaurante e endereço.'
      );
      return;
    }

    // Validar estado

    if (data.state.length !== 2) {
      setError('Informe a UF com duas letras.');
      return;
    }

    // Preparar produtos

    const payloadProducts = products.map((product) => ({
      ...(product.id ? { id: product.id } : {}),

      name: product.name.trim(),
      price: normalizePrice(product.price),
    }));

    // Validar produtos

    const invalidProducts = payloadProducts.some(
      (product) =>
        !product.name ||
        !Number.isFinite(product.price) ||
        product.price < 0
    );

    if (invalidProducts) {
      setError(
        'Todos os produtos devem ter nome e preço válido (zero ou maior).'
      );
      return;
    }

    setSaving(true);

    try {
      const updated = await saveRestaurantManagement(
        restaurant.id,
        {
          ...data,
          state: data.state.toUpperCase(),
          products: payloadProducts,
        }
      );

      onSaved?.(updated.restaurant);
      onClose();

    } catch (err) {
      setError(
        err.message || 'Não foi possível salvar as alterações.'
      );

    } finally {
      setSaving(false);
    }
  }

  // EXCLUIR RESTAURANTE

  async function handleDelete() {
    if (busy) return;

    setDeleting(true);
    setError('');

    try {
      await deleteRestaurant(restaurant.id);

      onDeleted?.(restaurant.id);
      onClose();

    } catch (err) {
      setError(
        err.message || 'Não foi possível excluir o restaurante.'
      );

      setConfirmDelete(false);

    } finally {
      setDeleting(false);
    }
  }

  // RENDERIZAR CAMPO DO FORMULÁRIO

  function renderField([key, label]) {
    return (
      <label
        key={key}
        className="my-restaurant-field"
      >
        <span>{label}</span>

        <input
          type="text"
          value={form[key] ?? ''}
          onChange={(event) =>
            changeField(key, event.target.value)
          }
          disabled={busy || loading}
          maxLength={
            key === 'state'
              ? 2
              : key === 'postal_code'
                ? 9
                : 150
          }
        />
      </label>
    );
  }

  // VERIFICAR RESTAURANTE

  if (!restaurant) {
    return null;
  }

  // JSX

  return (
    <div
      className="my-restaurant-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <section
        className="my-restaurant-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >

        {/* CABEÇALHO */}

        <header className="my-restaurant-header">

          <h2 id={titleId}>
            {form.name || restaurant.name}
          </h2>

          <button
            type="button"
            className="my-restaurant-close"
            onClick={onClose}
            disabled={busy}
            aria-label="Fechar popup"
          >
            ×
          </button>

        </header>

        {/* FORMULÁRIO */}

        <form
          id="my-restaurant-form"
          className="my-restaurant-body"
          onSubmit={handleSave}
        >

          {/* MENSAGEM DE ERRO */}

          {error && (
            <p
              role="alert"
              className="my-restaurant-error"
            >
              {error}
            </p>
          )}

          {/* CARREGAMENTO */}

          {loading ? (
            <p>Carregando cardápio...</p>
          ) : (
            <>

              {/* INFORMAÇÕES DO RESTAURANTE */}

              <section className="my-restaurant-section">

                <h3>Informações do restaurante</h3>

                <div className="my-restaurant-fields">
                  {RESTAURANT_FIELDS.map(renderField)}
                </div>

              </section>

              {/* INFORMAÇÕES DO ENDEREÇO */}

              <section className="my-restaurant-section">

                <h3>Informações do endereço</h3>

                <div className="my-restaurant-fields">
                  {ADDRESS_FIELDS.map(renderField)}
                </div>

              </section>

              {/* CARDÁPIO */}

              <section className="my-restaurant-section">

                <h3>Cardápio</h3>

                <div className="my-restaurant-table-wrap">

                  <table className="my-restaurant-table">

                    <thead>
                      <tr>
                        <th>Nome do item</th>
                        <th>Preço (R$)</th>
                        <th aria-label="Excluir item" />
                      </tr>
                    </thead>

                    <tbody>
                      {products.map((product) => (
                        <tr key={product.key}>

                          {/* NOME DO PRODUTO */}

                          <td>
                            <input
                              aria-label="Nome do item"
                              value={product.name}
                              onChange={(event) =>
                                changeProduct(
                                  product.key,
                                  'name',
                                  event.target.value
                                )
                              }
                              disabled={busy}
                              maxLength={150}
                            />
                          </td>

                          {/* PREÇO DO PRODUTO */}

                          <td>
                            <input
                              aria-label="Preço do item"
                              inputMode="decimal"
                              value={product.price}
                              onChange={(event) =>
                                changeProduct(
                                  product.key,
                                  'price',
                                  event.target.value
                                )
                              }
                              disabled={busy}
                            />
                          </td>

                          {/* EXCLUIR PRODUTO */}

                          <td>
                            <button
                              type="button"
                              className="my-restaurant-remove"
                              onClick={() =>
                                removeProduct(product.key)
                              }
                              disabled={busy}
                              aria-label={`Excluir ${product.name}`}
                              title="Excluir item"
                            >
                              ×
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>

                {/* CARDÁPIO VAZIO */}

                {products.length === 0 && (
                  <p className="my-restaurant-muted">
                    Nenhum item cadastrado.
                  </p>
                )}


                {/* ADICIONAR PRODUTO */}

                <button
                  type="button"
                  className="my-restaurant-add"
                  onClick={addProduct}
                  disabled={busy}
                >
                  + Adicionar item
                </button>

              </section>

              {/* EXCLUIR RESTAURANTE */}

              <section
                className="
                  my-restaurant-section
                  my-restaurant-danger-zone
                "
              >
                <button
                  type="button"
                  className="my-restaurant-delete"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  Excluir restaurante
                </button>
              </section>

            </>
          )}

        </form>

        {/* RODAPÉ FIXO */}

        <footer className="my-restaurant-footer">

          <button
            type="submit"
            form="my-restaurant-form"
            className="my-restaurant-save"
            disabled={loading || busy}
          >
            {saving
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>

        </footer>

        {/* CONFIRMAR EXCLUSÃO */}

        {confirmDelete && (
          <div className="my-restaurant-confirm-overlay">

            <div
              className="my-restaurant-confirm"
              role="alertdialog"
              aria-modal="true"
              aria-label="Confirmar exclusão"
            >

              <h3>Excluir restaurante?</h3>

              <p>
                O restaurante, seus produtos e registros
                relacionados serão excluídos
                definitivamente.
              </p>

              <div className="my-restaurant-confirm-actions">

                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="my-restaurant-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting
                    ? 'Excluindo...'
                    : 'Excluir'}
                </button>

              </div>

            </div>

          </div>
        )}

      </section>
    </div>
  );
}

export default MyRestaurant;