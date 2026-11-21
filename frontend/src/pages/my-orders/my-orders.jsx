import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';

import { getMyOrders } from '../../services/order-service';

import './my-orders.css';

const FINAL_STATUSES = new Set([
  'delivered',
]);

const CART_STATUSES = new Set([
  'cart',
]);

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function formatStatus(status) {
  const labels = {
    confirmed: 'Pedido confirmado',
    preparing: 'Em preparação',
    on_the_way: 'Saiu para entrega',
    delivered: 'Pedido entregue',
  };

  return labels[normalizeStatus(status)] || status;
}

function OrderCard({ order, onDetails }) {
  const items = order.items || [];

  return (
    <article className="my-orders-card">
      <div className="my-orders-card-header">

        <div className="my-orders-avatar">
          {order.restaurant_image ? (
            <img
              src={order.restaurant_image}
              alt=""
            />
          ) : (
            <span>🍽</span>
          )}
        </div>

        <div className="my-orders-card-info">
          <h3>
            {order.restaurant_name || 'Restaurante'}
          </h3>

          <p>{formatStatus(order.status)}</p>
        </div>

        <button
          type="button"
          className="my-orders-details-button"
          onClick={() => onDetails(order.id)}
          aria-label="Ver detalhes do pedido"
        >
          ›
        </button>
      </div>

      <div className="my-orders-card-products">
        {items.map((item, index) => (
          <div
            className="my-orders-product"
            key={item.id ?? index}
          >
            <span className="my-orders-product-quantity">
              {item.quantity}
            </span>

            <span>
              {item.product_name || item.name}
            </span>
          </div>
        ))}
      </div>

      <div className="my-orders-card-actions">
        <button
          type="button"
          onClick={() => onDetails(order.id)}
        >
          Ver detalhes
        </button>
      </div>
    </article>
  );
}

function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await getMyOrders();

        if (!active) return;

        const list = Array.isArray(response)
          ? response
          : response.orders;

        if (!Array.isArray(list)) {
          throw new Error('Resposta inválida do servidor.');
        }

        setOrders(list);

      } catch (err) {
        if (active) {
          setError(
            err.message || 'Não foi possível carregar os pedidos.'
          );
        }

      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const visibleOrders = orders.filter(
    (order) => !CART_STATUSES.has(
      normalizeStatus(order.status)
    )
  );

  const ongoingOrders = visibleOrders.filter(
    (order) => !FINAL_STATUSES.has(
      normalizeStatus(order.status)
    )
  );

  const historyOrders = visibleOrders.filter(
    (order) => FINAL_STATUSES.has(
      normalizeStatus(order.status)
    )
  );

  function handleDetails(orderId) {
    navigate(`/pedidos/${orderId}`);
  }

  return (
    <div className="my-orders-page">
      <Header />

      <main className="my-orders-content">
        <h1>Meus pedidos</h1>

        {loading && (
          <p>Carregando pedidos...</p>
        )}

        {error && (
          <p className="my-orders-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <section className="my-orders-section">
              <h2>Pedidos em andamento</h2>

              {ongoingOrders.length === 0 ? (
                <p className="my-orders-empty">
                  Você não possui pedidos em andamento.
                </p>
              ) : (
                <div className="my-orders-grid">
                  {ongoingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onDetails={handleDetails}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="my-orders-section">
              <h2>Histórico</h2>

              {historyOrders.length === 0 ? (
                <p className="my-orders-empty">
                  Você ainda não possui pedidos finalizados.
                </p>
              ) : (
                <div className="my-orders-grid">
                  {historyOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onDetails={handleDetails}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MyOrders;