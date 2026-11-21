import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { checkoutOrder } from '../../services/order-service';

import './cart-popup.css';

function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CartPopup({
  isOpen,
  onClose,
  orderId,
  items = [],
  restaurant,
  deliveryQuote,
  onRemoveItem,
  onEditItem,
  onCompleted,
}) {
  const navigate = useNavigate();

  const [step, setStep] = useState('cart');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentCode, setPaymentCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  if (!isOpen) return null;

  const isEmpty = items.length === 0;

  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.unit_price) * Number(item.quantity),
    0
  );

  const deliveryFee = deliveryQuote?.delivery_fee;
  const hasDeliveryFee = deliveryFee != null;

  const total = hasDeliveryFee
    ? subtotal + Number(deliveryFee)
    : subtotal;

  // ========================================
  // NAVEGAÇÃO
  // ========================================

  function resetCheckout() {
    setStep('cart');
    setPaymentMethod('');
    setPaymentCode('');
    setError('');
    setCompletedOrder(null);
  }

  function handleClose() {
    if (submitting) return;

    resetCheckout();
    onClose();
  }

  function handleViewMenu() {
    if (!restaurant?.id) return;

    handleClose();
    navigate(`/restaurante/${restaurant.id}`);
  }

  function handleContinue() {
    setError('');

    if (!orderId) {
      setError('Não foi possível identificar o carrinho.');
      return;
    }

    if (!localStorage.getItem('currentAddressId')) {
      setError('Selecione um endereço de entrega.');
      return;
    }

    if (!hasDeliveryFee) {
      setError('Aguarde o cálculo da taxa de entrega.');
      return;
    }

    setStep('payment');
  }

  async function handleCheckout() {
    if (submitting) return;

    setError('');

    const addressId = Number(
      localStorage.getItem('currentAddressId')
    );

    if (!Number.isInteger(addressId) || addressId <= 0) {
      setError('Selecione um endereço válido.');
      return;
    }

    if (!paymentMethod) {
      setError('Selecione uma forma de pagamento.');
      return;
    }

    const requiresCode = [
      'pix',
      'credit_card',
      'debit_card'
    ].includes(paymentMethod);

    if (requiresCode && !paymentCode.trim()) {
      setError('Informe o código de validação do pagamento.');
      return;
    }

    if (!orderId || isEmpty || !hasDeliveryFee) {
      setError('O carrinho ainda não está pronto para finalizar.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await checkoutOrder(
        orderId,
        addressId,
        paymentMethod,
        'delivery',
        paymentMethod === 'cash' ? null : paymentCode.trim()
      );

      setCompletedOrder(response.order);
      setStep('success');

      window.dispatchEvent(new Event('cart-updated'));

      try {
        await onCompleted?.(response.order);
      } catch (refreshError) {
        console.error(
          'Pedido finalizado, mas houve erro ao atualizar o carrinho:',
          refreshError
        );
      }

    } catch (err) {
      setError(
        err.message || 'Não foi possível finalizar o pedido.'
      );

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="cart-popup-overlay"
      onClick={handleClose}
    >
      <aside
        className="cart-popup"
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        onClick={(event) => event.stopPropagation()}
      >

        <button
          type="button"
          className="cart-popup-close"
          onClick={handleClose}
          disabled={submitting}
          aria-label="Fechar carrinho"
        >
          ×
        </button>

        {error && (
          <p className="cart-checkout-error" role="alert">
            {error}
          </p>
        )}

        {step === 'success' ? (
          <div className="cart-checkout-success">
            <h2>Pedido realizado com sucesso!</h2>

            <p>
              Seu pedido foi confirmado.
            </p>

            <p>
              Total: R$ {formatPrice(completedOrder?.total ?? total)}
            </p>

            <button
              type="button"
              className="cart-popup-continue"
              onClick={handleClose}
            >
              Concluir
            </button>
          </div>

        ) : isEmpty ? (

          /* CARRINHO VAZIO */

          <div className="cart-popup-empty">
            <p className="cart-popup-empty-title">
              Sua sacola está vazia
            </p>

            <p>Adicione itens</p>
          </div>

        ) : step === 'payment' ? (

          <>
            <div className="cart-popup-content">

              <div className="cart-popup-header">
                <h2>Forma de pagamento</h2>
                <p>Selecione como deseja pagar.</p>
              </div>

              <div className="cart-checkout-methods">

                <label className="cart-checkout-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="pix"
                    checked={paymentMethod === 'pix'}
                    onChange={(event) => {
                      setPaymentMethod(event.target.value);
                      setPaymentCode('');
                      setError('');
                    }}
                  />
                  <span>Pix</span>
                </label>

                <label className="cart-checkout-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="credit_card"
                    checked={paymentMethod === 'credit_card'}
                    onChange={(event) => {
                      setPaymentMethod(event.target.value);
                      setPaymentCode('');
                      setError('');
                    }}
                  />
                  <span>Cartão de crédito</span>
                </label>

                <label className="cart-checkout-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="debit_card"
                    checked={paymentMethod === 'debit_card'}
                    onChange={(event) => {
                      setPaymentMethod(event.target.value);
                      setPaymentCode('');
                      setError('');
                    }}
                  />
                  <span>Cartão de débito</span>
                </label>

                <label className="cart-checkout-method">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(event) => {
                      setPaymentMethod(event.target.value);
                      setPaymentCode('');
                      setError('');
                    }}
                  />
                  <span>Dinheiro</span>
                </label>

              </div>
              
              {paymentMethod !== '' && paymentMethod !== 'cash' && (
                <div className="cart-payment-validation">
                  <label htmlFor="payment-code">
                    Código de validação
                  </label>

                  <input
                    id="payment-code"
                    name="payment_code"
                    type="text"
                    value={paymentCode}
                    onChange={(event) => {
                      setPaymentCode(event.target.value);
                    }}
                    placeholder={
                      paymentMethod === 'pix'
                        ? 'Digite o código Pix'
                        : 'Digite o token de autorização'
                    }
                    autoComplete="off"
                    disabled={submitting}
                  />

                  <p>
                    Ambiente de demonstração.
                    Nenhum pagamento real será realizado.
                  </p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <p className="cart-payment-info">
                  O pagamento será realizado na entrega.
                </p>
              )}

              <div className="cart-popup-summary">
                <div className="cart-popup-summary-row">
                  <span>Subtotal</span>
                  <span>R$ {formatPrice(subtotal)}</span>
                </div>

                <div className="cart-popup-summary-row">
                  <span>Taxa de entrega</span>
                  <span>R$ {formatPrice(deliveryFee)}</span>
                </div>
              </div>

            </div>

            <div className="cart-popup-footer">

              <div className="cart-popup-total">
                <strong>Total</strong>
                <strong>R$ {formatPrice(total)}</strong>
              </div>

              <button
                type="button"
                className="cart-popup-continue"
                onClick={handleCheckout}
                disabled={submitting || !paymentMethod}
              >
                {submitting
                  ? 'Finalizando...'
                  : 'Confirmar pedido'}
              </button>

              <button
                type="button"
                className="cart-checkout-back"
                onClick={() => {
                  setError('');
                  setStep('cart');
                }}
                disabled={submitting}
              >
                Voltar ao carrinho
              </button>

            </div>
          </>

        ) : (

          /* ==================================
              CARRINHO
          ================================== */

          <>
            <div className="cart-popup-content">

              <div className="cart-popup-header">
                <span>Seu pedido em</span>

                <div className="cart-popup-restaurant">
                  <strong>
                    {restaurant?.name || 'Restaurante'}
                  </strong>

                  <button
                    type="button"
                    onClick={handleViewMenu}
                    disabled={!restaurant?.id}
                  >
                    Ver Cardápio
                  </button>
                </div>
              </div>

              <div className="cart-popup-products">
                <h3>Seu pedido</h3>

                {items.map((item) => (
                  <div
                    className="cart-popup-item"
                    key={item.id}
                  >

                    <div className="cart-popup-item-info">
                      <strong>
                        {item.quantity}x {item.product_name}
                      </strong>
                    </div>

                    <span className="cart-popup-item-price">
                      R$ {formatPrice(
                        Number(item.unit_price) * Number(item.quantity)
                      )}
                    </span>

                    <div className="cart-popup-item-actions">

                      <button
                        type="button"
                        className="cart-popup-edit"
                        onClick={() => onEditItem?.(item)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="cart-popup-remove"
                        onClick={() => onRemoveItem?.(item.id)}
                      >
                        Remover
                      </button>

                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-popup-summary">

                <div className="cart-popup-summary-row">
                  <span>Subtotal</span>
                  <span>R$ {formatPrice(subtotal)}</span>
                </div>

                <div className="cart-popup-summary-row">
                  <span>Taxa de entrega</span>
                  <span>
                    {hasDeliveryFee
                      ? `R$ ${formatPrice(deliveryFee)}`
                      : 'A calcular'}
                  </span>
                </div>

              </div>
            </div>

            <div className="cart-popup-footer">

              <div className="cart-popup-total">
                <strong>Total</strong>
                <strong>
                  {hasDeliveryFee
                    ? `R$ ${formatPrice(total)}`
                    : 'A calcular'}
                </strong>
              </div>

              <button
                type="button"
                className="cart-popup-continue"
                onClick={handleContinue}
              >
                Escolher forma de pagamento
              </button>

            </div>
          </>
        )}

      </aside>
    </div>
  );
}

export default CartPopup;