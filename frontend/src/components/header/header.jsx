import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCurrentUser } from '../../services/user-service';
import {
  getAddresses,
  deleteAddress
} from '../../services/address-service';
import { getDeliveryQuote } from '../../services/delivery-service';

import {
  createCart,
  getCartItems,
  removeCartItem
} from '../../services/order-service';

import ProfileMenu from '../profile-menu/profile-menu';
import LocationPopup from '../location-popup/location-popup';
import AddressFormPopup from '../address-form-popup/address-form-popup';
import CartPopup from '../cart-popup/cart-popup';

import './header.css';

import logo from '../../assets/images/foodify-logo-white.png';
import searchIcon from '../../assets/images/search.png';
import locationArrow from '../../assets/images/angle-small-down.png';
import profileIcon from '../../assets/images/user-icon.png';
import loginIcon from '../../assets/images/login-icon.png';
import orderIcon from '../../assets/images/order-icon.png';
import orderIconWhite from '../../assets/images/order-icon-white.png';

function Header() {
  // Controle dos popups
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLocationPopupOpen, setIsLocationPopupOpen] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Barra de pesquisa
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Usuário e endereços
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('token')));
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [userLocation, setUserLocation] = useState('');

  // Carrinho
  const [cartOrderId, setCartOrderId] = useState(null);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  // Frete
  const [deliveryQuote, setDeliveryQuote] = useState(null);

  // Função pesquisa
  function handleSearch(event) {
    event.preventDefault();

    const term = search.trim();

    if (!term) return;

    navigate(`/pesquisa?q=${encodeURIComponent(term)}`);
  }

  // Formatação de valores
  function formatPrice(value) {
    return Number(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Carregar usuário
  async function loadUser() {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error.message);
      setUser(null);
    }
  }

  // Carregar endereços
  async function loadAddresses() {
    try {
      const addressData = await getAddresses();

      setAddresses(addressData);

      const currentAddressId =
        localStorage.getItem('currentAddressId');

      const selectedAddress = addressData.find(
        (address) =>
          String(address.id) === String(currentAddressId)
      );

      if (selectedAddress) {
        setUserLocation(
          `${selectedAddress.street}, ${selectedAddress.number}`
        );
      } else {
        setUserLocation('');
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error.message);
    }
  }

  // Calcular frete do carrinho
  async function loadDeliveryQuote(restaurantId, items) {
    const addressId =
      localStorage.getItem('currentAddressId');

    setDeliveryQuote(null);

    if (
      !addressId ||
      !restaurantId ||
      !items ||
      items.length === 0
    ) {
      return;
    }

    try {
      const quote = await getDeliveryQuote(
        Number(addressId),
        Number(restaurantId)
      );

      setDeliveryQuote(quote);
    } catch (error) {
      console.error(
        'Erro ao calcular frete:',
        error.message
      );
    }
  }

  // Carregar carrinho
  async function loadCart() {
    try {
      if (!localStorage.getItem('token')) {
        setCartOrderId(null);
        setCartRestaurant(null);
        setCartItems([]);
        setCartTotal(0);
        setDeliveryQuote(null);
        return;
      }

      const cartData = await createCart();
      const orderId = cartData.order_id;

      setCartOrderId(orderId);

      const cartResponse = await getCartItems(orderId);

      const restaurant =
        cartResponse.restaurant || null;

      const items =
        cartResponse.items || [];

      setCartRestaurant(restaurant);
      setCartItems(items);
      setCartTotal(Number(cartResponse.total || 0));

      await loadDeliveryQuote(restaurant?.id, items);
    } catch (error) {
      console.error(
        'Erro ao carregar carrinho:',
        error.message
      );
      setDeliveryQuote(null);
    }
  }

  // Abrir carrinho
  async function handleOpenCart() {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    await loadCart();
    setIsCartOpen(true);
  }

  // Remover item do carrinho
  async function handleRemoveItem(itemId) {
    try {
      await removeCartItem(cartOrderId, itemId);
      await loadCart();
    } catch (error) {
      console.error(
        'Erro ao remover produto:',
        error.message
      );
    }
  }

  // Abrir popup de localização
  async function handleOpenLocation() {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    await loadAddresses();
    setIsLocationPopupOpen(true);
  }

  // Abrir formulário de endereço
  function handleAddAddress() {
    setEditingAddress(null);
    setIsLocationPopupOpen(false);
    setIsAddressFormOpen(true);
  }

  // Editar endereço
  function handleEditAddress(address) {
    setEditingAddress(address);
    setIsLocationPopupOpen(false);
    setIsAddressFormOpen(true);
  }

  // Deletar endereço
  async function handleDeleteAddress(address) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o endereço ${address.street}, ${address.number}?`
    );

    if (!confirmed) return;

    try {
      await deleteAddress(address.id);

      const currentAddressId =
        localStorage.getItem('currentAddressId');

      const wasSelected =
        String(currentAddressId) === String(address.id);

      if (wasSelected) {
        localStorage.removeItem('currentAddressId');
        setUserLocation('');
        setDeliveryQuote(null);
      }

      await loadAddresses();

      window.dispatchEvent(new Event('address-updated'));

      await loadCart();
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      alert(error.message || 'Não foi possível excluir o endereço.');
    }
  }

  // Selecionar endereço existente
  async function handleSelectAddress(addressId) {
    localStorage.setItem(
      'currentAddressId',
      String(addressId)
    );

    await loadAddresses();
    await loadCart();

    window.dispatchEvent(
      new Event('address-updated')
    );
  }

  // Salvar endereço novo
  async function handleAddressSaved(address) {
    localStorage.setItem(
      'currentAddressId',
      String(address.id)
    );

    await loadAddresses();
    await loadCart();

    window.dispatchEvent(new Event('address-updated'));

    setEditingAddress(null);
    setIsAddressFormOpen(false);
    setIsLocationPopupOpen(true);
  }

  // Sincronizar o Header com alterações de autenticação
  useEffect(() => {
    function syncAuth() {
      const authenticated = Boolean(localStorage.getItem('token'));
      setIsLoggedIn(authenticated);
      if (!authenticated) {
        setUser(null);
        setAddresses([]);
        setUserLocation('');
        setIsProfileMenuOpen(false);
        setIsLocationPopupOpen(false);
        setIsAddressFormOpen(false);
        setIsCartOpen(false);
        setCartOrderId(null);
        setCartRestaurant(null);
        setCartItems([]);
        setCartTotal(0);
        setDeliveryQuote(null);
      }
    }

    window.addEventListener('auth-updated', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('auth-updated', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  // Inicialização
  useEffect(() => {
    if (localStorage.getItem('token')) {
      loadUser();
      loadAddresses();
      loadCart();
    }

    function handleCartUpdated() {
      loadCart();
    }

    function handleAddressUpdated() {
      loadAddresses();
    }

    window.addEventListener(
      'cart-updated',
      handleCartUpdated
    );

    window.addEventListener(
      'address-updated',
      handleAddressUpdated
    );

    return () => {
      window.removeEventListener(
        'cart-updated',
        handleCartUpdated
      );

      window.removeEventListener(
        'address-updated',
        handleAddressUpdated
      );
    };
  }, []);

  // Quantidade de itens
  const itemCount = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity),
    0
  );

  return (
    <>
      <header className="main-header">

        {/* LOGO */}
        <div className="header-logo">
          <Link to="/home">
            <img
              src={logo}
              alt="Foodify"
              className="header-logo"
            />
          </Link>
        </div>
        
        {/* PESQUISA */}
        <form
          className="header-search"
          onSubmit={handleSearch}
          role="search"
        >
          <button
            type="submit"
            className="header-search-button"
            aria-label="Pesquisar"
          >
            <img
              src={searchIcon}
              alt=""
            />
          </button>

          <input
            type="search"
            placeholder="Busque por item ou loja"
            aria-label="Buscar restaurantes ou itens"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>

        {/* AÇÕES */}
        <nav className="header-actions">

          {/* LOCALIZAÇÃO */}
          <button
            type="button"
            className="header-location"
            onClick={handleOpenLocation}
          >
            <span>
              {userLocation || 'Onde você está?'}
            </span>

            <img
              src={locationArrow}
              alt=""
            />
          </button>

          {/* PERFIL OU LOGIN */}
          {isLoggedIn ? (
            <button
              type="button"
              className="header-profile"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              aria-label="Abrir menu de perfil"
            >
              <img src={profileIcon} alt="" />
            </button>
          ) : (
            <button
              type="button"
              className="header-login"
              onClick={() => navigate('/login')}
              title="Fazer login"
            >
              <img src={loginIcon} alt="" />
            </button>
          )}

          {/* CARRINHO */}
          <button
            type="button"
            className={`header-cart ${
              itemCount > 0
                ? 'header-cart-active'
                : ''
            }`}
            onClick={handleOpenCart}
          >
            <img
              src={
                itemCount > 0
                  ? orderIconWhite
                  : orderIcon
              }
              alt="Carrinho"
            />

            <div className="header-cart-info">
              <span className="cart-total">
                R$ {formatPrice(cartTotal)}
              </span>

              <span className="cart-items">
                {itemCount}{' '}
                {itemCount === 1
                  ? 'item'
                  : 'itens'}
              </span>
            </div>
          </button>

        </nav>
      </header>
 
      {/* POPUP DE LOCALIZAÇÃO */}
      {isLoggedIn && isLocationPopupOpen && (
        <LocationPopup
          addresses={addresses}
          onClose={() => setIsLocationPopupOpen(false)}
          onAdd={handleAddAddress}
          onSelectAddress={handleSelectAddress}
          onEdit={handleEditAddress}
          onDelete={handleDeleteAddress}
        />
      )}

      {/* FORMULÁRIO DE ENDEREÇO */}
      {isLoggedIn && isAddressFormOpen && (
        <AddressFormPopup
          address={editingAddress}
          onClose={() => {
            setEditingAddress(null);
            setIsAddressFormOpen(false);
            setIsLocationPopupOpen(true);
          }}
          onSaved={handleAddressSaved}
        />
      )}

      {/* MENU DE PERFIL */}
      {isLoggedIn && isProfileMenuOpen && (
        <ProfileMenu
          user={user}
          onClose={() =>
            setIsProfileMenuOpen(false)
          }
        />
      )}

      {/* CARRINHO */}
      <CartPopup
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        orderId={cartOrderId}
        items={cartItems}
        restaurant={cartRestaurant}
        deliveryQuote={deliveryQuote}
        onRemoveItem={handleRemoveItem}
        onCompleted={async () => {
          await loadCart();
        }}
      />
    </>
  );
}

export default Header;