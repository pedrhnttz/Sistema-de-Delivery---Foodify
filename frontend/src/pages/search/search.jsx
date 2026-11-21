import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  useNavigate,
  useSearchParams
} from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';

import SearchFilterPopup, {
  DEFAULT_SEARCH_FILTERS,
  SEARCH_CATEGORIES
} from '../../components/search-filter-popup/search-filter-popup';

import { getRestaurants } from '../../services/restaurant-service';
import { getProducts } from '../../services/product-service';
import { getDeliveryQuote } from '../../services/delivery-service';
import { getCurrentUser } from '../../services/user-service';
import { getFavorites } from '../../services/favorite-service';

import favoriteIconTrue from '../../assets/images/favorite-icon-true.png';

import './search.css';

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

function formatDistance(value) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function hasValidNumber(value) {
  return value !== null &&
    value !== undefined &&
    value !== '' &&
    Number.isFinite(Number(value));
}

function getCategoryMatch(restaurant, categoryId) {
  const category = SEARCH_CATEGORIES.find(
    (item) => item.id === categoryId
  );

  if (!category) return false;

  const foodType = normalizeText(restaurant?.food_type);

  return category.terms.some((term) =>
    foodType.includes(normalizeText(term))
  );
}

function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const query = searchParams.get('q')?.trim() || '';

  const [activeTab, setActiveTab] = useState('restaurants');

  const [restaurants, setRestaurants] = useState([]);
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [deliveryQuotes, setDeliveryQuotes] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [error, setError] = useState('');

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_SEARCH_FILTERS,
    categories: []
  }));

  const quoteRequestId = useRef(0);

  const hasActiveFilters =
    filters.sort !== DEFAULT_SEARCH_FILTERS.sort ||
    filters.maxDistance !== DEFAULT_SEARCH_FILTERS.maxDistance ||
    filters.categories.length > 0;

  // CARREGAR CATÁLOGO
  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        setLoading(true);
        setError('');

        const [restaurantData, productData] = await Promise.all([
          getRestaurants(),
          getProducts()
        ]);

        if (!active) return;

        setRestaurants(
          Array.isArray(restaurantData) ? restaurantData : []
        );

        setProducts(
          Array.isArray(productData) ? productData : []
        );
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Não foi possível carregar a pesquisa.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  // FAVORITOS
  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      if (!localStorage.getItem('token')) {
        setFavorites([]);
        return;
      }

      try {
        const user = await getCurrentUser();

        if (!user?.id) return;

        const data = await getFavorites(user.id);

        if (active) {
          setFavorites(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(
          'Erro ao carregar favoritos na pesquisa:',
          error
        );

        if (active) {
          setFavorites([]);
        }
      }
    }

    loadFavorites();

    function handleFavoritesUpdated() {
      loadFavorites();
    }

    window.addEventListener(
      'favorites-updated',
      handleFavoritesUpdated
    );

    return () => {
      active = false;

      window.removeEventListener(
        'favorites-updated',
        handleFavoritesUpdated
      );
    };
  }, []);

  function isFavorite(type, id) {
    return favorites.some((favorite) => {
      if (type === 'restaurant') {
        return Number(favorite.restaurant_id) === Number(id);
      }

      if (type === 'product') {
        return Number(favorite.product_id) === Number(id);
      }

      return false;
    });
  }

  // ÍNDICE DE RESTAURANTES
  const restaurantMap = useMemo(() => {
    return new Map(
      restaurants.map((restaurant) => [
        String(restaurant.id),
        restaurant
      ])
    );
  }, [restaurants]);

  // PREÇO MÍNIMO POR RESTAURANTE
  const restaurantMinPrices = useMemo(() => {
    const prices = new Map();

    products.forEach((product) => {
      if (!hasValidNumber(product.price)) return;

      const restaurantId = String(product.restaurant_id);
      const price = Number(product.price);
      const currentPrice = prices.get(restaurantId);

      if (
        currentPrice === undefined ||
        price < currentPrice
      ) {
        prices.set(restaurantId, price);
      }
    });

    return prices;
  }, [products]);

  // BUSCA ORIGINAL POR NOME
  const matchingRestaurants = useMemo(() => {
    const term = normalizeText(query);

    if (!term) return [];

    return restaurants.filter((restaurant) =>
      normalizeText(restaurant.name).includes(term)
    );
  }, [restaurants, query]);

  const matchingProducts = useMemo(() => {
    const term = normalizeText(query);

    if (!term) return [];

    return products.filter((product) =>
      normalizeText(product.name).includes(term)
    );
  }, [products, query]);

  // RESTAURANTES ENVOLVIDOS NA PESQUISA
  const resultRestaurantIds = useMemo(() => {
    return [
      ...new Set([
        ...matchingRestaurants.map((restaurant) =>
          String(restaurant.id)
        ),
        ...matchingProducts
          .map((product) => product.restaurant_id)
          .filter((id) => id != null)
          .map(String)
      ])
    ];
  }, [matchingRestaurants, matchingProducts]);

  const restaurantIdsKey = resultRestaurantIds.join(',');

  // COTAÇÕES DE ENTREGA
  useEffect(() => {
    let active = true;

    async function loadQuotes() {
      const requestId = ++quoteRequestId.current;

      const addressId = localStorage.getItem('currentAddressId');
      const token = localStorage.getItem('token');

      setDeliveryQuotes({});

      if (
        !addressId ||
        !token ||
        resultRestaurantIds.length === 0
      ) {
        setLoadingQuotes(false);
        return;
      }

      setLoadingQuotes(true);

      const results = await Promise.all(
        resultRestaurantIds.map(async (restaurantId) => {
          try {
            const quote = await getDeliveryQuote(
              Number(addressId),
              Number(restaurantId)
            );

            return [String(restaurantId), quote];
          } catch (err) {
            console.error(
              `Erro ao calcular frete de ${restaurantId}:`,
              err
            );
            return null;
          }
        })
      );

      if (active && requestId === quoteRequestId.current) {
        setDeliveryQuotes(
          Object.fromEntries(results.filter(Boolean))
        );
        setLoadingQuotes(false);
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
      quoteRequestId.current++;

      window.removeEventListener(
        'address-updated',
        handleAddressUpdated
      );
    };
  }, [restaurantIdsKey]);

  // VERIFICAR CATEGORIA
  function matchesCategories(restaurant) {
    if (filters.categories.length === 0) {
      return true;
    }

    return filters.categories.some((categoryId) =>
      getCategoryMatch(restaurant, categoryId)
    );
  }

  // VERIFICAR DISTÂNCIA
  function matchesDistance(restaurantId) {
    if (filters.maxDistance === 100) {
      return true;
    }

    const quote = deliveryQuotes[String(restaurantId)];

    if (!hasValidNumber(quote?.distance_km)) {
      return false;
    }

    return Number(quote.distance_km) <= filters.maxDistance;
  }

  // OBTER PREÇO DE ORDENAÇÃO
  function getSortPrice(item, type) {
    if (type === 'products') {
      return hasValidNumber(item.price)
        ? Number(item.price)
        : null;
    }

    return restaurantMinPrices.get(String(item.id)) ?? null;
  }

  // OBTER DISTÂNCIA DE ORDENAÇÃO
  function getSortDistance(item, type) {
    const restaurantId =
      type === 'products'
        ? item.restaurant_id
        : item.id;

    const distance =
      deliveryQuotes[String(restaurantId)]?.distance_km;

    return hasValidNumber(distance)
      ? Number(distance)
      : null;
  }

  // ORDENAÇÃO
  function sortResults(items, type) {
    const sorted = [...items];

    sorted.sort((a, b) => {
      if (
        filters.sort === 'highest-price' ||
        filters.sort === 'lowest-price'
      ) {
        const priceA = getSortPrice(a, type);
        const priceB = getSortPrice(b, type);

        if (priceA === null && priceB !== null) return 1;
        if (priceB === null && priceA !== null) return -1;

        if (priceA !== null && priceB !== null) {
          const difference =
            filters.sort === 'highest-price'
              ? priceB - priceA
              : priceA - priceB;

          if (difference !== 0) return difference;
        }
      }

      if (filters.sort === 'nearest') {
        const distanceA = getSortDistance(a, type);
        const distanceB = getSortDistance(b, type);

        if (distanceA === null && distanceB !== null) return 1;
        if (distanceB === null && distanceA !== null) return -1;

        if (distanceA !== null && distanceB !== null) {
          const difference = distanceA - distanceB;

          if (difference !== 0) return difference;
        }
      }

      return String(a.name || '').localeCompare(
        String(b.name || ''),
        'pt-BR',
        { sensitivity: 'base' }
      );
    });

    return sorted;
  }

  // RESULTADOS DE RESTAURANTES
  const filteredRestaurants = sortResults(
    matchingRestaurants.filter((restaurant) =>
      matchesCategories(restaurant) &&
      matchesDistance(restaurant.id)
    ),
    'restaurants'
  );

  // RESULTADOS DE ITENS
  const filteredProducts = sortResults(
    matchingProducts.filter((product) => {
      const restaurant = restaurantMap.get(
        String(product.restaurant_id)
      );

      if (!restaurant) return false;

      return (
        matchesCategories(restaurant) &&
        matchesDistance(restaurant.id)
      );
    }),
    'products'
  );

  function handleApplyFilters(nextFilters) {
    setFilters(nextFilters);
    setIsFilterOpen(false);
  }

  function handleClearFilters() {
    setFilters({
      ...DEFAULT_SEARCH_FILTERS,
      categories: []
    });
  }

  function openRestaurant(restaurantId) {
    navigate(`/restaurante/${restaurantId}`);
  }

  function openProduct(product) {
    navigate(`/restaurante/${product.restaurant_id}`, {
      state: { productId: product.id }
    });
  }

  function renderDelivery(restaurantId) {
    const quote = deliveryQuotes[String(restaurantId)];

    if (!quote) {
      return (
        <span>
          {loadingQuotes
            ? 'Calculando entrega...'
            : 'Frete a calcular'}
        </span>
      );
    }

    return (
      <>
        {hasValidNumber(quote.distance_km) && (
          <span>
            {formatDistance(quote.distance_km)} km
          </span>
        )}

        {hasValidNumber(quote.distance_km) &&
          hasValidNumber(quote.delivery_fee) && (
            <span className="search-result-separator">·</span>
          )}

        {hasValidNumber(quote.delivery_fee) && (
          <span
            className={
              Number(quote.delivery_fee) === 0
                ? 'search-result-free'
                : ''
            }
          >
            {Number(quote.delivery_fee) === 0
              ? 'Entrega grátis'
              : formatPrice(quote.delivery_fee)}
          </span>
        )}
      </>
    );
  }

  return (
    <div className="search-page">
      <Header />

      <main className="search-content">
        <h1 className="search-title">
          {query ? (
            <>
              Buscando por <span>{query}</span>
            </>
          ) : (
            'Pesquisar no Foodify'
          )}
        </h1>

        {/* ABAS */}
        <div className="search-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'restaurants'}
            className={`search-tab ${
              activeTab === 'restaurants' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('restaurants')}
          >
            Restaurantes
            {!loading && (
              <span className="search-tab-count">
                {filteredRestaurants.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'products'}
            className={`search-tab ${
              activeTab === 'products' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('products')}
          >
            Itens
            {!loading && (
              <span className="search-tab-count">
                {filteredProducts.length}
              </span>
            )}
          </button>
        </div>

        {/* FILTROS */}
        <div className="search-filters">
          <button
            type="button"
            className={`search-filter-button ${
              hasActiveFilters ? 'active' : ''
            }`}
            onClick={() => setIsFilterOpen(true)}
            aria-haspopup="dialog"
          >
            <span>Filtros</span>
            <span aria-hidden="true">☰</span>
          </button>

          <button
            type="button"
            className="search-clear-button"
            onClick={handleClearFilters}
          >
            Limpar
          </button>
        </div>

        {/* RESULTADOS */}
        {loading ? (
          <p className="search-message">
            Carregando resultados...
          </p>
        ) : error ? (
          <p className="search-message search-error">
            {error}
          </p>
        ) : !query ? (
          <p className="search-message">
            Digite o nome de um restaurante ou item na barra de pesquisa.
          </p>
        ) : activeTab === 'restaurants' ? (
          filteredRestaurants.length === 0 ? (
            <p className="search-message">
              {loadingQuotes && filters.maxDistance < 100
                ? 'Calculando distâncias...'
                : `Nenhum restaurante encontrado para "${query}" com os filtros selecionados.`}
            </p>
          ) : (
            <div className="search-results-grid">
              {filteredRestaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  type="button"
                  className="search-result-card"
                  onClick={() => openRestaurant(restaurant.id)}
                >
                  <div className="search-result-image">
                    {restaurant.image_url && (
                      <img
                        src={restaurant.image_url}
                        alt={restaurant.name}
                      />
                    )}
                  </div>

                  <div className="search-result-info">
                    <div className="search-result-title-row">
                      <h2 title={restaurant.name}>
                        {restaurant.name}
                      </h2>

                      {isFavorite('restaurant', restaurant.id) && (
                        <img
                          src={favoriteIconTrue}
                          alt="Restaurante favorito"
                          className="search-result-favorite-icon"
                        />
                      )}
                    </div>

                    <p className="search-result-type">
                      {restaurant.food_type}
                    </p>

                    <div className="search-result-delivery">
                      {renderDelivery(restaurant.id)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : filteredProducts.length === 0 ? (
          <p className="search-message">
            {loadingQuotes && filters.maxDistance < 100
              ? 'Calculando distâncias...'
              : `Nenhum item encontrado para "${query}" com os filtros selecionados.`}
          </p>
        ) : (
          <div className="search-results-grid">
            {filteredProducts.map((product) => {
              const restaurant = restaurantMap.get(
                String(product.restaurant_id)
              );

              return (
                <button
                  key={product.id}
                  type="button"
                  className="search-result-card"
                  onClick={() => openProduct(product)}
                >
                  <div className="search-result-image">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                      />
                    )}
                  </div>

                  <div className="search-result-info">
                    <div className="search-result-title-row">
                      <h2 title={product.name}>
                        {product.name}
                      </h2>

                      {isFavorite('product', product.id) && (
                        <img
                          src={favoriteIconTrue}
                          alt="Produto favorito"
                          className="search-result-favorite-icon"
                        />
                      )}
                    </div>

                    <p className="search-result-type">
                      {restaurant?.name || 'Restaurante'}
                    </p>

                    <p className="search-result-product-price">
                      {hasValidNumber(product.price)
                        ? formatPrice(product.price)
                        : 'Preço indisponível'}
                    </p>

                    <div className="search-result-delivery">
                      {renderDelivery(product.restaurant_id)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* POPUP DE FILTROS */}
      {isFilterOpen && (
        <SearchFilterPopup
          filters={filters}
          onClose={() => setIsFilterOpen(false)}
          onApply={handleApplyFilters}
        />
      )}
    </div>
  );
}

export default Search;