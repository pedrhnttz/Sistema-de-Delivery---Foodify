import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';

import { getRestaurants } from '../../services/restaurant-service';
import { getDeliveryQuote } from '../../services/delivery-service';

import './restaurant-category.css';

const categories = {
  lanches: {
    name: 'Lanches',
    terms: ['lanche', 'hamburg', 'burger', 'sanduiche']
  },
  bolos_doces: {
    name: 'Bolos & Doces',
    terms: ['bolo', 'doce', 'confeitaria', 'sobremesa']
  },
  salgados: {
    name: 'Salgados',
    terms: ['salgado', 'coxinha', 'pastel', 'esfiha']
  },
  padaria: {
    name: 'Padaria',
    terms: ['padaria', 'pao', 'panificadora']
  },
  cachorro_quente: {
    name: 'Cachorro-Quente',
    terms: ['cachorro quente', 'hot dog', 'hotdog']
  },
  sorvetes: {
    name: 'Sorvetes',
    terms: ['sorvete', 'gelato', 'acai']
  },
  japonesa: {
    name: 'Japonesa',
    terms: ['japonesa', 'japones', 'sushi', 'temaki']
  },
  carne: {
    name: 'Carne',
    terms: ['carne', 'churrasco', 'churrascaria', 'steak']
  },
  chinesa: {
    name: 'Chinesa',
    terms: ['chinesa', 'chines', 'yakisoba']
  },
  pizza: {
    name: 'Pizza',
    terms: ['pizza', 'pizzaria']
  },
  italiana: {
    name: 'Italiana',
    terms: ['italiana', 'italiano', 'massa', 'macarrao']
  },
  bebidas: {
    name: 'Bebidas',
    terms: ['bebida', 'sucos', 'cafe', 'bar']
  }
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function RestaurantCategory() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [deliveryQuotes, setDeliveryQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const category = categories[categorySlug];

  // Carregar restaurantes
  useEffect(() => {
    let active = true;

    async function loadRestaurants() {
      try {
        setLoading(true);
        setError('');

        const data = await getRestaurants();

        if (active) {
          setRestaurants(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Erro ao carregar restaurantes.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRestaurants();

    return () => {
      active = false;
    };
  }, []);

  // Filtrar por tipo de restaurante
  const filteredRestaurants = category
    ? restaurants.filter((restaurant) => {
        const foodType = normalizeText(restaurant.food_type);

        return category.terms.some((term) =>
          foodType.includes(normalizeText(term))
        );
      })
    : [];

  // Recalcular entregas ao trocar de endereço
  useEffect(() => {
    let active = true;
    let requestId = 0;

    async function loadQuotes() {
      const currentRequest = ++requestId;

      const addressId = localStorage.getItem('currentAddressId');
      const token = localStorage.getItem('token');

      setDeliveryQuotes({});

      if (!addressId || !token || filteredRestaurants.length === 0) {
        return;
      }

      const results = await Promise.all(
        filteredRestaurants.map(async (restaurant) => {
          try {
            const quote = await getDeliveryQuote(
              Number(addressId),
              Number(restaurant.id)
            );

            return [restaurant.id, quote];
          } catch (err) {
            console.error(
              `Erro ao calcular entrega do restaurante ${restaurant.id}:`,
              err
            );

            return null;
          }
        })
      );

      if (active && currentRequest === requestId) {
        setDeliveryQuotes(
          Object.fromEntries(results.filter(Boolean))
        );
      }
    }

    loadQuotes();

    function handleAddressUpdated() {
      loadQuotes();
    }

    window.addEventListener(
      'address-updated',
      handleAddressUpdated
    );

    return () => {
      active = false;
      requestId++;

      window.removeEventListener(
        'address-updated',
        handleAddressUpdated
      );
    };
  }, [restaurants, categorySlug]);

  return (
    <div className="restaurant-category-page">
      <Header />

      <main className="restaurant-category-content">
        <h1 className="restaurant-category-title">
          {category?.name || 'Categoria não encontrada'}
        </h1>

        {loading && (
          <p className="restaurant-category-message">
            Carregando restaurantes...
          </p>
        )}

        {error && (
          <p className="restaurant-category-message">
            {error}
          </p>
        )}

        {!loading && !error && !category && (
          <p className="restaurant-category-message">
            Esta categoria não está disponível.
          </p>
        )}

        {!loading &&
          !error &&
          category &&
          filteredRestaurants.length === 0 && (
            <p className="restaurant-category-message">
              Nenhum restaurante encontrado nesta categoria.
            </p>
          )}

        {!loading && !error && category && (
          <div className="restaurant-category-grid">
            {filteredRestaurants.map((restaurant) => {
              const quote = deliveryQuotes[restaurant.id];

              return (
                <button
                  type="button"
                  className="restaurant-category-card"
                  key={restaurant.id}
                  onClick={() =>
                    navigate(`/restaurante/${restaurant.id}`)
                  }
                >
                  <div className="restaurant-category-logo">
                    {restaurant.image_url ? (
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                      />
                    ) : (
                      <span>
                        {restaurant.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="restaurant-category-info">
                    <h2 title={restaurant.name}>
                      {restaurant.name}
                    </h2>

                    <p className="restaurant-category-type">
                      {restaurant.food_type}
                    </p>

                    <div className="restaurant-category-delivery">
                      {quote ? (
                        <>
                          <span>
                            {Number(quote.distance_km).toLocaleString(
                              'pt-BR',
                              {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1
                              }
                            )} km
                          </span>

                          <span className="restaurant-category-dot">
                            ·
                          </span>

                          <span className="restaurant-category-fee">
                            {Number(quote.delivery_fee) === 0
                              ? 'Grátis'
                              : formatPrice(quote.delivery_fee)}
                          </span>
                        </>
                      ) : (
                        <span>Frete a calcular</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default RestaurantCategory;