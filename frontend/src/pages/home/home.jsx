import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import { getRestaurants } from '../../services/restaurant-service';
import { getProducts } from '../../services/product-service';
import { getDeliveryQuote } from '../../services/delivery-service';

import './home.css';

import burger from '../../assets/images/home-icons/burger.png';
import cake from '../../assets/images/home-icons/cake.png';
import coxinha from '../../assets/images/home-icons/coxinha.png';
import croissant from '../../assets/images/home-icons/croissant.png';
import hotdog from '../../assets/images/home-icons/hot-dog.png';
import icecream from '../../assets/images/home-icons/icecream.png';
import maki from '../../assets/images/home-icons/maki.png';
import meat from '../../assets/images/home-icons/meat.png';
import noodle from '../../assets/images/home-icons/noodle.png';
import pizza from '../../assets/images/home-icons/pizza.png';
import spaguetti from '../../assets/images/home-icons/spaguetti.png';
import wine from '../../assets/images/home-icons/wine.png';

function Home() {
  const [categoryIndex, setCategoryIndex] = useState(0);

  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);
  const [restaurantCatalog, setRestaurantCatalog] = useState([]);
  const [deliveryQuotes, setDeliveryQuotes] = useState({});

  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [restaurantError, setRestaurantError] = useState('');
  const [productError, setProductError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const data = await getRestaurants();
        setRestaurantCatalog(data);

        const shuffledRestaurants = [...data].sort(
          () => Math.random() - 0.5
        );

        setRestaurants(shuffledRestaurants.slice(0, 6));
      } catch (error) {
        setRestaurantError(error.message);
      } finally {
        setLoadingRestaurants(false);
      }
    }

    async function loadProducts() {
      try {
        const data = await getProducts();

        const shuffledProducts = [...data].sort(
          () => Math.random() - 0.5
        );

        setProducts(shuffledProducts.slice(0, 4));
      } catch (error) {
        setProductError(error.message);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadRestaurants();
    loadProducts();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDeliveryQuotes() {
      const addressId = localStorage.getItem('currentAddressId');
      const token = localStorage.getItem('token');

      // Limpa os valores do endereço anterior
      setDeliveryQuotes({});

      if (!addressId || !token) {
        return;
      }

      const restaurantIds = [
        ...new Set(
          products.map((product) => product.restaurant_id)
        )
      ];

      const quotes = {};

      await Promise.all(
        restaurantIds.map(async (restaurantId) => {
          try {
            const quote = await getDeliveryQuote(
              Number(addressId),
              Number(restaurantId)
            );

            quotes[restaurantId] = quote;
          } catch (error) {
            console.error(
              `Erro ao calcular frete do restaurante ${restaurantId}:`,
              error.message
            );
          }
        })
      );

      if (!cancelled) {
        setDeliveryQuotes(quotes);
      }
    }

    // Calcula ao carregar os produtos
    loadDeliveryQuotes();

    // Recalcula quando o endereço muda no Header
    function handleAddressUpdated() {
      loadDeliveryQuotes();
    }

    window.addEventListener(
      'address-updated',
      handleAddressUpdated
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        'address-updated',
        handleAddressUpdated
      );
    };
  }, [products]);

  const categories = [
    { id: 1, name: 'Lanches', slug: 'lanches', image: burger },
    { id: 2, name: 'Bolos & Doces', slug: 'bolos_doces', image: cake },
    { id: 3, name: 'Salgados', slug: 'salgados', image: coxinha },
    { id: 4, name: 'Padaria', slug: 'padaria', image: croissant },
    { id: 5, name: 'Cachorro-Quente', slug: 'cachorro_quente', image: hotdog },
    { id: 6, name: 'Sorvetes', slug: 'sorvetes', image: icecream },
    { id: 7, name: 'Japonesa', slug: 'japonesa', image: maki },
    { id: 8, name: 'Carne', slug: 'carne', image: meat },
    { id: 9, name: 'Chinesa', slug: 'chinesa', image: noodle },
    { id: 10, name: 'Pizza', slug: 'pizza', image: pizza },
    { id: 11, name: 'Italiana', slug: 'italiana', image: spaguetti },
    { id: 12, name: 'Bebidas', slug: 'bebidas', image: wine }
  ];

  const visibleCategories = 5;

  function handleNextCategories() {
    setCategoryIndex((current) =>
      Math.min(current + 1, categories.length - visibleCategories)
    );
  }

  function handlePreviousCategories() {
    setCategoryIndex((current) => Math.max(current - 1, 0));
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function getRestaurantName(restaurantId) {
    const restaurant = restaurantCatalog.find(
      (item) => item.id === restaurantId
    );

    return restaurant ? restaurant.name : 'Restaurante';
  }

  return (
    <main className="home-page">
      <Header />

      <div className="home-content">

        <section className="home-categories">
          <h2>
            Pedir seu delivery no Foodify é rápido e prático!
            Conheça as categorias
          </h2>

          <div className="categories-carousel">
            <button
              type="button"
              className="category-arrow"
              onClick={handlePreviousCategories}
              disabled={categoryIndex === 0}
              aria-label="Categorias anteriores"
            >
              &#10094;
            </button>

            <div className="categories-list">
              {categories
                .slice(
                  categoryIndex,
                  categoryIndex + visibleCategories
                )
                .map((category) => (
                  <button
                    type="button"
                    className="category-item"
                    key={category.id}
                    onClick={() => navigate(`/categoria/${category.slug}`)}
                  >
                    <div className="category-image">
                      <img
                        src={category.image}
                        alt={category.name}
                      />
                    </div>

                    <span className="category-name">
                      {category.name}
                    </span>
                  </button>
                ))}
            </div>

            <button
              type="button"
              className="category-arrow"
              onClick={handleNextCategories}
              disabled={
                categoryIndex >= categories.length - visibleCategories
              }
              aria-label="Próximas categorias"
            >
              &#10095;
            </button>
          </div>
        </section>

        <section className="home-suggestions">
          <h2>Sugestões de pedidos</h2>

          {loadingProducts && (
            <p>Carregando sugestões...</p>
          )}

          {productError && (
            <p>{productError}</p>
          )}

          {!loadingProducts && !productError && products.length === 0 && (
            <p>Nenhum produto cadastrado.</p>
          )}

          {!loadingProducts && !productError && products.length > 0 && (  
            <div className="suggestions-list">
              {products.map((product) => {
                const restaurant = restaurantCatalog.find(
                  (item) => item.id === product.restaurant_id
                );

                return (
                  <article
                    className="suggestion-card"
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      navigate(`/restaurante/${product.restaurant_id}`, {
                        state: { productId: product.id }
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/restaurante/${product.restaurant_id}`, {
                          state: { productId: product.id }
                        });
                      }
                    }}
                  >
                    <div className="suggestion-image"></div>

                    <div className="suggestion-info">
                      <h3>{product.name}</h3>

                      <div className="suggestion-price">
                        {formatPrice(product.price)}
                      </div>

                      <div className="suggestion-divider"></div>

                      <div className="suggestion-restaurant">
                        <div className="suggestion-restaurant-image"></div>

                        <div className="suggestion-restaurant-details">
                          <span className="suggestion-restaurant-name">
                            {restaurant?.name || 'Restaurante'}
                          </span>

                          <div className="suggestion-delivery">
                            {deliveryQuotes[product.restaurant_id] ? (
                              <>
                                <span>
                                  {Number(
                                    deliveryQuotes[product.restaurant_id].distance_km
                                  ).toLocaleString('pt-BR', {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1
                                  })} km
                                </span>

                                <span>·</span>

                                <span className="suggestion-delivery-price">
                                  {formatPrice(
                                    deliveryQuotes[product.restaurant_id].delivery_fee
                                  )}
                                </span>
                              </>
                            ) : (
                              <span>Frete a calcular</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="home-restaurants">
          <h2>Restaurantes</h2>

          {loadingRestaurants && (
            <p>Carregando restaurantes...</p>
          )}

          {restaurantError && (
            <p>{restaurantError}</p>
          )}

          {!loadingRestaurants && !restaurantError && restaurants.length === 0 && (
            <p>Nenhum restaurante cadastrado.</p>
          )}

          {!loadingRestaurants && !restaurantError && restaurants.length > 0 && (
            <div className="restaurants-list">
              {restaurants.map((restaurant) => (
                <article
                  className="restaurant-card"
                  key={restaurant.id}
                  onClick={() =>
                    navigate(`/restaurante/${restaurant.id}`)
                  }
                >
                  <div className="restaurant-image"></div>

                  <div className="restaurant-info">
                    <h3>{restaurant.name}</h3>
                    <p>{restaurant.food_type}</p>
                    <span className="restaurant-distance">
                      {restaurant.street}, {restaurant.number} - {restaurant.neighborhood}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>

      <Footer />
    </main>
  );
}

  export default Home;