import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import MealPopup from '../../components/meal-popup/meal-popup';

import { getCurrentUser } from '../../services/user-service';
import { getRestaurantById } from '../../services/restaurant-service';
import { getProducts } from '../../services/product-service';
import { getDeliveryQuote } from '../../services/delivery-service';

import {
  getFavorites,
  createFavorite,
  deleteFavorite
} from '../../services/favorite-service';

import {
  createCart,
  addProductToCart
} from '../../services/order-service';

import searchIcon from '../../assets/images/search.png';
import favoriteIcon from '../../assets/images/favorite-icon.png';
import favoriteIconHover from '../../assets/images/favorite-icon-hover.png';
import favoriteIconTrue from '../../assets/images/favorite-icon-true.png';

import './restaurant.css';

function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDistance(value) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function Restaurant() {
  const { id } = useParams();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [selectedMeal, setSelectedMeal] = useState(null);

  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [deliveryQuote, setDeliveryQuote] = useState(null);

  const [userId, setUserId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const [favoriteError, setFavoriteError] = useState('');

  const [addingToCart, setAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // RESTAURANTE E PRODUTOS
  useEffect(() => {
    let active = true;

    async function loadRestaurant() {
      try {
        setLoading(true);
        setError('');

        const [restaurantData, productsData] = await Promise.all([
          getRestaurantById(id),
          getProducts()
        ]);

        if (!active) return;

        setRestaurant(restaurantData);

        const restaurantProducts = productsData.filter(
          (product) =>
            Number(product.restaurant_id) === Number(id)
        );

        setProducts(restaurantProducts);

        const productId = location.state?.productId;

        if (productId) {
          const selectedProduct = restaurantProducts.find(
            (product) =>
              Number(product.id) === Number(productId)
          );

          if (selectedProduct) {
            setSelectedMeal({
              ...selectedProduct,
              restaurantName: restaurantData.name
            });
          }
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRestaurant();

    return () => {
      active = false;
    };
  }, [id, location.state]);

  // FRETE E DISTÂNCIA
  useEffect(() => {
    let active = true;
    let requestId = 0;

    async function loadRestaurantDeliveryQuote() {
      const currentRequestId = ++requestId;

      const addressId = localStorage.getItem('currentAddressId');
      const token = localStorage.getItem('token');

      setDeliveryQuote(null);

      if (!addressId || !token) return;

      try {
        const quote = await getDeliveryQuote(
          Number(addressId),
          Number(id)
        );

        if (active && currentRequestId === requestId) {
          setDeliveryQuote(quote);
        }
      } catch (err) {
        console.error('Erro ao calcular entrega:', err);

        if (active && currentRequestId === requestId) {
          setDeliveryQuote(null);
        }
      }
    }

    loadRestaurantDeliveryQuote();

    window.addEventListener(
      'address-updated',
      loadRestaurantDeliveryQuote
    );

    return () => {
      active = false;
      requestId++;

      window.removeEventListener(
        'address-updated',
        loadRestaurantDeliveryQuote
      );
    };
  }, [id]);

  // CARREGAR FAVORITOS DO USUÁRIO
  useEffect(() => {
    let active = true;

    async function loadUserFavorites() {
      if (!localStorage.getItem('token')) {
        setUserId(null);
        setFavorites([]);
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
          throw new Error('Usuário não identificado.');
        }

        const data = await getFavorites(currentUser.id);

        if (!active) return;

        setUserId(currentUser.id);
        setFavorites(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar favoritos:', err);

        if (active) {
          setFavoriteError(
            'Não foi possível carregar seus favoritos.'
          );
        }
      }
    }

    loadUserFavorites();

    return () => {
      active = false;
    };
  }, []);

  // BUSCA DO CARDÁPIO
  const filteredProducts = products.filter((product) =>
    String(product.name || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function findFavorite(type, targetId) {
    return favorites.find((favorite) => {
      const value =
        type === 'restaurant'
          ? favorite.restaurant_id
          : favorite.product_id;

      return value != null &&
        Number(value) === Number(targetId);
    });
  }

  // ADICIONAR OU REMOVER FAVORITO
  async function handleToggleFavorite(type, targetId) {
    if (!userId) {
      setFavoriteError(
        'Faça login para adicionar aos favoritos.'
      );
      return;
    }

    const key = `${type}-${targetId}`;

    if (favoriteLoading[key]) return;

    setFavoriteLoading((current) => ({
      ...current,
      [key]: true
    }));

    setFavoriteError('');

    try {
      const existingFavorite = findFavorite(type, targetId);

      if (existingFavorite) {
        await deleteFavorite(existingFavorite.id, userId);

        setFavorites((current) =>
          current.filter(
            (favorite) => favorite.id !== existingFavorite.id
          )
        );
      } else {
        const createdFavorite = await createFavorite({
          userId,
          restaurantId:
            type === 'restaurant' ? Number(targetId) : null,
          productId:
            type === 'product' ? Number(targetId) : null
        });

        setFavorites((current) => [
          ...current,
          createdFavorite
        ]);
      }

      window.dispatchEvent(new Event('favorites-updated'));
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err);
      setFavoriteError(
        err.message || 'Não foi possível atualizar o favorito.'
      );
    } finally {
      setFavoriteLoading((current) => ({
        ...current,
        [key]: false
      }));
    }
  }

  function handleSelectProduct(product) {
    setSelectedMeal({
      ...product,
      restaurantName: restaurant.name
    });
  }

  // CARRINHO
  async function handleAddToCart({ meal, quantity }) {
    if (addingToCart) return;

    try {
      setAddingToCart(true);

      const cart = await createCart();

      await addProductToCart(
        cart.order_id,
        meal.id,
        quantity
      );

      window.dispatchEvent(new Event('cart-updated'));

      setSelectedMeal(null);
    } catch (err) {
      console.error('Erro ao adicionar produto:', err);

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Não foi possível adicionar o produto ao carrinho.'
      );
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <main className="restaurant-page">
        <Header />
        <div className="restaurant-content restaurant-status">
          <p>Carregando restaurante...</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="restaurant-page">
        <Header />
        <div className="restaurant-content restaurant-status">
          <p>{error || 'Restaurante não encontrado.'}</p>
        </div>
        <Footer />
      </main>
    );
  }

  const restaurantFavorite = Boolean(
    findFavorite('restaurant', restaurant.id)
  );

  const distance = deliveryQuote?.distance_km;
  const deliveryFee = deliveryQuote?.delivery_fee;

  return (
    <main className="restaurant-page">
      <Header />

      <div className="restaurant-content">
        {/* BANNER */}
        <section className="restaurant-banner"></section>

        {/* IDENTIFICAÇÃO */}
        <section className="restaurant-details">
          <div className="restaurant-identity">
            <div className="restaurant-logo"></div>

            <div className="restaurant-name">
              <h1>{restaurant.name}</h1>
              <p>{restaurant.food_type}</p>
            </div>
          </div>

          <button
            type="button"
            className={`restaurant-favorite-button ${
              restaurantFavorite ? 'active' : ''
            }`}
            onClick={() =>
              handleToggleFavorite('restaurant', restaurant.id)
            }
            disabled={Boolean(
              favoriteLoading[`restaurant-${restaurant.id}`]
            )}
            aria-label={
              restaurantFavorite
                ? 'Remover restaurante dos favoritos'
                : 'Favoritar restaurante'
            }
            aria-pressed={restaurantFavorite}
          >
            <img
              className="favorite-icon-normal"
              src={restaurantFavorite ? favoriteIconTrue : favoriteIcon}
              alt=""
            />

            {!restaurantFavorite && (
              <img
                className="favorite-icon-hover"
                src={favoriteIconHover}
                alt=""
              />
            )}
          </button>

        </section>

        {favoriteError && (
          <p className="restaurant-favorite-error" role="alert">
            {favoriteError}
          </p>
        )}

        {/* PESQUISA E FRETE */}
        <section className="restaurant-toolbar">
          <div className="restaurant-search">
            <img
              src={searchIcon}
              alt=""
              className="restaurant-search-icon"
            />

            <input
              type="search"
              placeholder="Buscar no cardápio"
              aria-label="Buscar no cardápio"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="restaurant-delivery-card">
            <div className="restaurant-delivery-detail">
              <span className="restaurant-delivery-label">
                Distância
              </span>

              <strong>
                {distance != null
                  ? `${formatDistance(distance)} km`
                  : 'A calcular'}
              </strong>
            </div>

            <div className="restaurant-delivery-divider" />

            <div className="restaurant-delivery-detail">
              <span className="restaurant-delivery-label">
                Taxa de entrega
              </span>

              <strong
                className={
                  Number(deliveryFee) === 0 &&
                  deliveryFee != null
                    ? 'restaurant-delivery-free'
                    : ''
                }
              >
                {deliveryFee == null
                  ? 'A calcular'
                  : Number(deliveryFee) === 0
                    ? 'Grátis'
                    : formatPrice(deliveryFee)}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <div className="restaurant-divider" />

      {/* CARDÁPIO */}
      <section className="restaurant-menu">
        <h2>Cardápio</h2>

        <div className="restaurant-products">
          {filteredProducts.map((product) => {
            const isFavorite = Boolean(
              findFavorite('product', product.id)
            );

            return (
              <article
                className="product-card"
                key={product.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectProduct(product)}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    handleSelectProduct(product);
                  }
                }}
              >
                <div className="product-info">
                  <div className="product-title-row">
                    <h3>{product.name}</h3>

                    <button
                      type="button"
                      className={`product-favorite-button ${
                        isFavorite ? 'active' : ''
                      }`}
                      aria-label={
                        isFavorite
                          ? `Remover ${product.name} dos favoritos`
                          : `Favoritar ${product.name}`
                      }
                      aria-pressed={isFavorite}
                      disabled={Boolean(
                        favoriteLoading[`product-${product.id}`]
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleFavorite('product', product.id);
                      }}
                      onKeyDown={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <img
                        className="favorite-icon-normal"
                        src={isFavorite ? favoriteIconTrue : favoriteIcon}
                        alt=""
                      />

                      {!isFavorite && (
                        <img
                          className="favorite-icon-hover"
                          src={favoriteIconHover}
                          alt=""
                        />
                      )}
                    </button>
                  </div>

                  <p>{product.food_type}</p>

                  <strong>
                    {formatPrice(product.price)}
                  </strong>
                </div>

                <div className="product-image"></div>
              </article>
            );
          })}

          {filteredProducts.length === 0 && (
            <p className="no-products">
              Nenhum produto encontrado.
            </p>
          )}
        </div>
      </section>

      {/* POPUP DO PRODUTO */}
      {selectedMeal && (
        <MealPopup
          meal={{
            ...selectedMeal,
            distance: deliveryQuote?.distance_km,
            deliveryFee: deliveryQuote?.delivery_fee
          }}
          onClose={() => setSelectedMeal(null)}
          onAddToCart={handleAddToCart}
          isFavorite={Boolean(
            findFavorite('product', selectedMeal.id)
          )}
          onToggleFavorite={(productId) =>
            handleToggleFavorite('product', productId)
          }
          favoriteDisabled={Boolean(
            favoriteLoading[`product-${selectedMeal.id}`]
          )}
        />
      )}

      <Footer />
    </main>
  );
}

export default Restaurant;