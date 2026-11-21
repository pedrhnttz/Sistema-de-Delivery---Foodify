import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// COMPONENTES
// ==========================================

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import MyRestaurant from '../../components/my-restaurant/my-restaurant';

// ==========================================
// SERVIÇOS
// ==========================================

import {
  getMyRestaurants,
  createDefaultRestaurant,
} from '../../services/restaurant-service';

// ==========================================
// ESTILOS
// ==========================================

import './my-restaurants.css';


// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function MyRestaurants() {
  const navigate = useNavigate();

  // ----------------------------------------
  // ESTADOS
  // ----------------------------------------

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);


  // ========================================
  // CARREGAR RESTAURANTES
  // ========================================

  useEffect(() => {
    let active = true;

    async function loadRestaurants() {
      try {
        setLoading(true);
        setError('');

        const response = await getMyRestaurants();

        if (!active) return;

        const list = Array.isArray(response)
          ? response
          : response.restaurants;

        if (!Array.isArray(list)) {
          throw new Error('Formato de resposta inválido.');
        }

        setRestaurants(list);

      } catch (err) {
        if (active) {
          setError(
            err.message ||
            'Não foi possível carregar seus restaurantes.'
          );
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


  // ========================================
  // CRIAR NOVO RESTAURANTE
  // ========================================

  async function handleCreateRestaurant() {
    if (creatingRestaurant) return;

    setCreatingRestaurant(true);
    setError('');

    try {
      // Cria o restaurante com dados padrão
      const newRestaurant = await createDefaultRestaurant();

      // Adiciona o novo restaurante à lista
      setRestaurants((previous) => [
        ...previous,
        newRestaurant,
      ]);

      // Abre automaticamente o popup
      setSelectedRestaurant(newRestaurant);

    } catch (err) {
      console.error(
        'Erro ao criar restaurante:',
        err
      );

      setError(
        err.message ||
        'Não foi possível criar o restaurante.'
      );

    } finally {
      setCreatingRestaurant(false);
    }
  }


  // ========================================
  // ABRIR POPUP
  // ========================================

  function handleOpenRestaurant(restaurant) {
    setSelectedRestaurant(restaurant);
  }


  // ========================================
  // FECHAR POPUP
  // ========================================

  function handleCloseRestaurant() {
    setSelectedRestaurant(null);
  }


  // ========================================
  // ATUALIZAR RESTAURANTE NA LISTA
  // ========================================

  function handleRestaurantSaved(updatedRestaurant) {
    if (!updatedRestaurant) return;

    setRestaurants((previous) =>
      previous.map((restaurant) =>
        restaurant.id === updatedRestaurant.id
          ? updatedRestaurant
          : restaurant
      )
    );

    // Fecha o popup após salvar
    setSelectedRestaurant(null);
  }


  // ========================================
  // REMOVER RESTAURANTE DA LISTA
  // ========================================

  function handleRestaurantDeleted(restaurantId) {
    setRestaurants((previous) =>
      previous.filter(
        (restaurant) =>
          restaurant.id !== restaurantId
      )
    );

    // Fecha o popup após excluir
    setSelectedRestaurant(null);
  }


  // ========================================
  // JSX
  // ========================================

  return (
    <div className="my-restaurants-page">

      {/* ==================================
          CABEÇALHO
      ================================== */}

      <Header />


      {/* ==================================
          CONTEÚDO PRINCIPAL
      ================================== */}

      <main className="my-restaurants-content">

        {/* TÍTULO E BOTÃO CRIAR */}

        <div className="my-restaurants-heading">

          <h1>Meus Restaurantes</h1>

          <button
            type="button"
            className="my-restaurants-create"
            onClick={handleCreateRestaurant}
            disabled={creatingRestaurant}
          >
            {creatingRestaurant
              ? 'Criando restaurante...'
              : '+ Criar novo restaurante'}
          </button>

        </div>


        {/* DIVISÓRIA */}

        <div className="my-restaurants-divider" />


        {/* ==================================
            CARREGAMENTO
        ================================== */}

        {loading && (
          <p className="my-restaurants-message">
            Carregando restaurantes...
          </p>
        )}


        {/* ==================================
            MENSAGEM DE ERRO
        ================================== */}

        {!loading && error && (
          <p
            className="my-restaurants-error"
            role="alert"
          >
            {error}
          </p>
        )}


        {/* ==================================
            LISTA VAZIA
        ================================== */}

        {!loading && !error && restaurants.length === 0 && (
          <div className="my-restaurants-empty">

            <h2>Nenhum restaurante cadastrado</h2>

            <p>
              Você ainda não possui restaurantes
              vinculados à sua conta.
            </p>

          </div>
        )}


        {/* ==================================
            LISTA DE RESTAURANTES
        ================================== */}

        {!loading && !error && restaurants.length > 0 && (
          <div className="my-restaurants-list">

            {restaurants.map((restaurant) => (
              <article
                key={restaurant.id}
                className="my-restaurants-item"
              >

                {/* IMAGEM PADRÃO */}

                <div
                  className="my-restaurants-avatar"
                  aria-hidden="true"
                />


                {/* INFORMAÇÕES */}

                <div className="my-restaurants-info">

                  <h2>{restaurant.name}</h2>

                  <p>{restaurant.food_type}</p>

                </div>


                {/* BOTÕES DE AÇÃO */}

                <div className="my-restaurants-actions">

                  {/* VISUALIZAR RESTAURANTE */}

                  <button
                    type="button"
                    className="my-restaurants-view"
                    onClick={() =>
                      navigate(
                        `/restaurante/${restaurant.id}`
                      )
                    }
                  >
                    Visualizar
                  </button>


                  {/* EDITAR RESTAURANTE */}

                  <button
                    type="button"
                    className="my-restaurants-options-button"
                    onClick={() =>
                      handleOpenRestaurant(restaurant)
                    }
                    aria-label={`Opções de ${restaurant.name}`}
                    title="Opções"
                  >
                    <span aria-hidden="true">⁝</span>
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

      </main>


      {/* ==================================
          RODAPÉ
      ================================== */}

      <Footer />


      {/* ==================================
          POPUP MY RESTAURANT
          INSTÂNCIA ÚNICA
      ================================== */}

      {selectedRestaurant && (
        <MyRestaurant
          restaurant={selectedRestaurant}
          onClose={handleCloseRestaurant}
          onSaved={handleRestaurantSaved}
          onDeleted={handleRestaurantDeleted}
        />
      )}

    </div>
  );
}

export default MyRestaurants;