import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';

import { getOrderInvoice } from '../../services/order-service';

import './order-details.css';

// ==========================================
// CONSTANTES
// ==========================================

const ORDER_STEPS = [
  { status: 'confirmed', label: 'Pedido confirmado' },
  { status: 'preparing', label: 'Em preparação' },
  { status: 'on_the_way', label: 'Saiu para entrega' },
  { status: 'delivered', label: 'Entregue' },
];

const PAYMENT_LABELS = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  cash: 'Dinheiro',
};

// ==========================================
// FORMATAÇÃO
// ==========================================

function formatPrice(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getStatusLabel(status) {
  const step = ORDER_STEPS.find(
    (item) => item.status === status
  );

  return step?.label || 'Status indisponível';
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ========================================
  // CARREGAR PEDIDO
  // ========================================

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      try {
        setLoading(true);
        setError('');

        const response = await getOrderInvoice(orderId);

        if (!active) return;

        setInvoice(response.invoice);

      } catch (err) {
        if (active) {
          setError(
            err.message ||
            'Não foi possível carregar o pedido.'
          );
        }

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

  const statusIndex = ORDER_STEPS.findIndex(
    (step) => step.status === invoice?.status
  );

  const address = invoice?.delivery_address;

  return (
    <div className="order-details-page">
      <Header />

      <main className="order-details-content">

        <button
          type="button"
          className="order-details-back"
          onClick={() => navigate('/pedidos')}
        >
          ← Voltar aos pedidos
        </button>

        <h1>Detalhes do pedido</h1>

        {loading && (
          <p>Carregando detalhes do pedido...</p>
        )}

        {error && (
          <p className="order-details-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && invoice && (
          <>
            {/* RESTAURANTE E STATUS */}

            <section className="order-details-card">
              <div className="order-details-restaurant">
                <div className="order-details-avatar">
                  🍽
                </div>

                <div>
                  <h2>
                    {invoice.restaurant?.name ||
                      'Restaurante'}
                  </h2>

                  <p>{getStatusLabel(invoice.status)}</p>
                </div>
              </div>

              {/* ACOMPANHAMENTO */}

              <div className="order-details-tracking">
                <h3>Acompanhamento</h3>

                <div className="order-details-steps">
                  {ORDER_STEPS.map((step, index) => (
                    <div
                      key={step.status}
                      className={
                        `order-details-step ${
                          index <= statusIndex
                            ? 'completed'
                            : ''
                        }`
                      }
                    >
                      <span className="order-details-step-dot" />

                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* PRODUTOS */}

            <section className="order-details-card">
              <h2>Itens do pedido</h2>

              <div className="order-details-items">
                {invoice.items.map((item, index) => (
                  <div
                    className="order-details-item"
                    key={item.product_id ?? index}
                  >
                    <span>
                      {item.quantity}x {item.product_name}
                    </span>

                    <strong>
                      {formatPrice(item.subtotal)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="order-details-totals">
                <div>
                  <span>Subtotal</span>
                  <span>
                    {formatPrice(invoice.subtotal)}
                  </span>
                </div>

                <div>
                  <span>Taxa de entrega</span>
                  <span>
                    {formatPrice(invoice.delivery_cost)}
                  </span>
                </div>

                <div className="order-details-total">
                  <strong>Total</strong>
                  <strong>
                    {formatPrice(invoice.total)}
                  </strong>
                </div>
              </div>
            </section>

            {/* ENDEREÇO */}

            <section className="order-details-card">
              <h2>Endereço de entrega</h2>

              {address ? (
                <div className="order-details-address">
                  <p>
                    {address.street}, {address.number}
                  </p>

                  {address.complement && (
                    <p>{address.complement}</p>
                  )}

                  <p>
                    {address.neighborhood} — {address.city}/{address.state}
                  </p>

                  <p>CEP: {address.postal_code}</p>
                </div>
              ) : (
                <p>Endereço indisponível.</p>
              )}
            </section>

            {/* PAGAMENTO */}

            <section className="order-details-card">
              <h2>Pagamento</h2>

              <p>
                {PAYMENT_LABELS[invoice.payment_method] ||
                  invoice.payment_method}
              </p>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default OrderDetails;