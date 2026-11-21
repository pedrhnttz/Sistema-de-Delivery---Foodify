import { useState } from 'react';

import favoriteIcon from '../../assets/images/favorite-icon.png';
import favoriteIconHover from '../../assets/images/favorite-icon-hover.png';
import favoriteIconTrue from '../../assets/images/favorite-icon-true.png';

import './meal-popup.css';

function MealPopup({
  meal,
  onClose,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
  favoriteDisabled = false
}) {
  const [quantity, setQuantity] = useState(1);

  if (!meal) return null;

  function formatPrice(price) {
    return Number(price).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  const unitPrice = Number(meal.price) || 0;
  const totalPrice = unitPrice * quantity;

  function handleAddToCart() {
    onAddToCart?.({
      meal,
      quantity,
      totalPrice
    });
  }

  return (
    <div
      className="meal-popup-overlay"
      onClick={onClose}
    >
      <section
        className="meal-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-popup-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* IMAGEM */}
        <div className="meal-popup-left">
          <div className="meal-popup-image"></div>
        </div>

        {/* INFORMAÇÕES */}
        <div className="meal-popup-right">
          <button
            type="button"
            className="meal-popup-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            &times;
          </button>

          <div className="meal-popup-details">

            {/* NOME E FAVORITO */}
            <div className="meal-popup-title-row">
              <h2 id="meal-popup-title">
                {meal.name}
              </h2>

              <button
                type="button"
                className={`meal-popup-favorite ${
                  isFavorite ? 'active' : ''
                }`}
                onClick={() => onToggleFavorite?.(meal.id)}
                disabled={
                  favoriteDisabled || !onToggleFavorite
                }
                aria-label={
                  isFavorite
                    ? `Remover ${meal.name} dos favoritos`
                    : `Favoritar ${meal.name}`
                }
                aria-pressed={isFavorite}
              >
                <img
                  className="meal-favorite-normal"
                  src={
                    isFavorite
                      ? favoriteIconTrue
                      : favoriteIcon
                  }
                  alt=""
                />

                {!isFavorite && (
                  <img
                    className="meal-favorite-hover"
                    src={favoriteIconHover}
                    alt=""
                  />
                )}
              </button>
            </div>

            {/* PREÇO */}
            <strong className="meal-popup-price">
              {formatPrice(unitPrice)}
            </strong>

            {/* RESTAURANTE E ENTREGA */}
            <div className="meal-popup-restaurant">
              <div className="meal-popup-restaurant-name">
                {meal.restaurantName || 'Restaurante'}
              </div>

              <div className="meal-popup-delivery">
                {meal.distance != null && (
                  <span>
                    {typeof meal.distance === 'number'
                      ? `${meal.distance.toLocaleString('pt-BR', {
                          maximumFractionDigits: 2
                        })} km`
                      : meal.distance}
                  </span>
                )}

                {meal.deliveryFee != null && (
                  <>
                    <span>·</span>
                    <span>
                      {formatPrice(meal.deliveryFee)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RODAPÉ DO POPUP */}
          <div className="meal-popup-footer">
            <div className="meal-popup-quantity">
              <button
                type="button"
                onClick={() =>
                  setQuantity((current) =>
                    Math.max(1, current - 1)
                  )
                }
                aria-label="Diminuir quantidade"
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => current + 1)
                }
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="meal-popup-add"
              onClick={handleAddToCart}
            >
              <span>Adicionar</span>
              <strong>
                {formatPrice(totalPrice)}
              </strong>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MealPopup;