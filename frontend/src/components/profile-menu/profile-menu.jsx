import { Link, useNavigate } from 'react-router-dom';

import './profile-menu.css';

import invoiceIcon from '../../assets/images/invoice-icon.png';
import invoiceIconHover from '../../assets/images/invoice-icon-hover.png';

import favoriteIcon from '../../assets/images/favorite-icon.png';
import favoriteIconHover from '../../assets/images/favorite-icon-hover.png';

import settingsIcon from '../../assets/images/settings-icon.png';
import settingsIconHover from '../../assets/images/settings-icon-hover.png';

import storeIcon from '../../assets/images/store-icon.png';
import storeIconHover from '../../assets/images/store-icon-hover.png';

import logoutIcon from '../../assets/images/logout-icon.png';
import logoutIconHover from '../../assets/images/logout-icon-hover.png';

function ProfileMenu({ onClose, user }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    onClose();
    navigate('/login');
  }

  const menuItems = [
    {
      label: 'Pedidos',
      path: '/pedidos',
      icon: invoiceIcon,
      hoverIcon: invoiceIconHover
    },
    {
      label: 'Favoritos',
      path: '/favorites',
      icon: favoriteIcon,
      hoverIcon: favoriteIconHover
    },
    {
      label: 'Meus Dados',
      path: '/perfil/dados',
      icon: settingsIcon,
      hoverIcon: settingsIconHover
    },
    {
      label: 'Minhas Lojas',
      path: '/perfil/meus-restaurantes',
      icon: storeIcon,
      hoverIcon: storeIconHover
    }
  ];

  return (
    <div
      className="profile-menu-overlay"
      onClick={onClose}
    >
      <aside
        className="profile-menu"
        onClick={(event) => event.stopPropagation()}
        aria-label="Menu do perfil"
      >
        {/* CABEÇALHO */}
        <div className="profile-menu-header">
          <h2>
            Olá, {user?.name || 'usuário'}
          </h2>
        </div>

        {/* OPÇÕES */}
        <nav className="profile-menu-links">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="profile-menu-item"
              onClick={onClose}
            >
              <span className="profile-menu-icon">
                <img
                  src={item.icon}
                  alt=""
                  className="profile-menu-icon-normal"
                />

                <img
                  src={item.hoverIcon}
                  alt=""
                  className="profile-menu-icon-hover"
                />
              </span>

              <span className="profile-menu-item-label">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* SAIR */}
        <div className="profile-menu-logout">
          <button
            type="button"
            className="profile-menu-item profile-menu-logout-button"
            onClick={handleLogout}
          >
            <span className="profile-menu-icon">
              <img
                src={logoutIcon}
                alt=""
                className="profile-menu-icon-normal"
              />

              <img
                src={logoutIconHover}
                alt=""
                className="profile-menu-icon-hover"
              />
            </span>

            <span className="profile-menu-item-label">
              Sair
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default ProfileMenu;