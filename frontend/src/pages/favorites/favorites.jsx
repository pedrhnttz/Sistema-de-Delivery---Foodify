import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';

import { getCurrentUser } from '../../services/user-service';
import { getFavorites, deleteFavorite } from '../../services/favorite-service';
import { getRestaurants } from '../../services/restaurant-service';
import { getProducts } from '../../services/product-service';

import favoriteIconTrue from '../../assets/images/favorite-icon-true.png';
import favoriteIconRemove from '../../assets/images/favorite-icon-remove.png';

import './favorites.css';

function Favorites() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingIds, setRemovingIds] = useState([]);

  const formatPrice = (value) =>
    Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  const loadFavorites = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUserId(null);
      setFavorites([]);
      setRestaurants([]);
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const user = await getCurrentUser();

      if (!user?.id) {
        throw new Error('Não foi possível identificar o usuário.');
      }

      const [favoriteData, restaurantData, productData] =
        await Promise.all([
          getFavorites(user.id),
          getRestaurants(),
          getProducts()
        ]);

      setUserId(user.id);
      setFavorites(Array.isArray(favoriteData) ? favoriteData : []);
      setRestaurants(Array.isArray(restaurantData) ? restaurantData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
      setError(err.message || 'Não foi possível carregar os favoritos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const favoriteRestaurants = useMemo(() => {
    return favorites
      .filter((favorite) => favorite.restaurant_id != null)
      .map((favorite) => {
        const restaurant = restaurants.find(
          (item) =>
            Number(item.id) === Number(favorite.restaurant_id)
        );

        return restaurant
          ? { ...restaurant, favoriteId: favorite.id }
          : null;
      })
      .filter(Boolean);
  }, [favorites, restaurants]);

  const favoriteProducts = useMemo(() => {
    return favorites
      .filter((favorite) => favorite.product_id != null)
      .map((favorite) => {
        const product = products.find(
          (item) => Number(item.id) === Number(favorite.product_id)
        );

        return product
          ? { ...product, favoriteId: favorite.id }
          : null;
      })
      .filter(Boolean);
  }, [favorites, products]);

  function getRestaurantName(restaurantId) {
    return (
      restaurants.find(
        (restaurant) =>
          Number(restaurant.id) === Number(restaurantId)
      )?.name || 'Restaurante'
    );
  }

  async function handleRemoveFavorite(event, favoriteId) {
    event.stopPropagation();

    if (userId == null || removingIds.includes(favoriteId)) {
      return;
    }

    setRemovingIds((current) => [...current, favoriteId]);

    try {
      await deleteFavorite(favoriteId, userId);

      setFavorites((current) =>
        current.filter(
          (favorite) => Number(favorite.id) !== Number(favoriteId)
        )
      );

      window.dispatchEvent(new Event('favorites-updated'));
    } catch (err) {
      console.error('Erro ao remover favorito:', err);
      setError(err.message || 'Não foi possível remover o favorito.');
    } finally {
      setRemovingIds((current) =>
        current.filter((id) => id !== favoriteId)
      );
    }
  }

  function openRestaurant(restaurantId) {
    navigate(`/restaurant/${restaurantId}`);
  }

  function openProduct(product) {
    navigate(`/restaurant/${product.restaurant_id}`, {
      state: { productId: product.id }
    });
  }

  function handleCardKeyDown(event, callback) {
    if (event.target !== event.currentTarget) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  }

  function FavoriteButton({ favoriteId, name }) {
    const removing = removingIds.includes(favoriteId);

    return (
      <button
        type="button"
        className="favorites-remove-button"
        disabled={removing}
        aria-label={`Remover ${name} dos favoritos`}
        title="Remover dos favoritos"
        onClick={(event) =>
          handleRemoveFavorite(event, favoriteId)
        }
      >
        <img
          src={favoriteIconTrue}
          className="favorites-icon-true"
          alt=""
        />

        <img
          src={favoriteIconRemove}
          className="favorites-icon-remove"
          alt=""
        />
      </button>
    );
  }

  return (
    <main className="favorites-page">
      <Header />

      <div className="favorites-content">
        <h1 className="favorites-page-title">Meus favoritos</h1>

        {loading ? (
          <p className="favorites-message">
            Carregando favoritos...
          </p>
        ) : (
          <>
            {error && (
              <p className="favorites-error" role="alert">
                {error}
              </p>
            )}

            {userId == null ? (
              <p className="favorites-message">
                Faça login para visualizar seus favoritos.
              </p>
            ) : (
              <>
                {/* RESTAURANTES FAVORITOS */}
                <section className="favorites-section">
                  <h2>Restaurantes</h2>

                  {favoriteRestaurants.length === 0 ? (
                    <p className="favorites-message">
                      Você ainda não possui restaurantes favoritos.
                    </p>
                  ) : (
                    <div className="favorites-grid">
                      {favoriteRestaurants.map((restaurant) => (
                        <article
                          key={restaurant.favoriteId}
                          className="favorites-card"
                          role="link"
                          tabIndex={0}
                          onClick={() =>
                            openRestaurant(restaurant.id)
                          }
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              openRestaurant(restaurant.id)
                            )
                          }
                        >
                          <div className="favorites-card-image" />

                          <div className="favorites-card-info">
                            <div className="favorites-card-title-row">
                              <h3>{restaurant.name}</h3>

                              <FavoriteButton
                                favoriteId={restaurant.favoriteId}
                                name={restaurant.name}
                              />
                            </div>

                            <p>
                              {restaurant.food_type || 'Restaurante'}
                            </p>

                            {restaurant.address && (
                              <span className="favorites-card-detail">
                                {restaurant.address}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <div className="favorites-divider" />

                {/* PRODUTOS FAVORITOS */}
                <section className="favorites-section">
                  <h2>Itens</h2>

                  {favoriteProducts.length === 0 ? (
                    <p className="favorites-message">
                      Você ainda não possui itens favoritos.
                    </p>
                  ) : (
                    <div className="favorites-grid">
                      {favoriteProducts.map((product) => (
                        <article
                          key={product.favoriteId}
                          className="favorites-card"
                          role="link"
                          tabIndex={0}
                          onClick={() => openProduct(product)}
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              openProduct(product)
                            )
                          }
                        >
                          <div className="favorites-card-image" />

                          <div className="favorites-card-info">
                            <div className="favorites-card-title-row">
                              <h3>{product.name}</h3>

                              <FavoriteButton
                                favoriteId={product.favoriteId}
                                name={product.name}
                              />
                            </div>

                            <p>
                              {getRestaurantName(product.restaurant_id)}
                            </p>

                            <span className="favorites-card-detail">
                              {product.food_type}
                            </span>

                            <strong className="favorites-card-price">
                              {formatPrice(product.price)}
                            </strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}

export default Favorites;