import { useState } from 'react';
import './location-popup.css';

import localImage from '../../assets/images/local.png';
import localIcon from '../../assets/images/local-icon.png';
import editIcon from '../../assets/images/edit-icon.png';
import deleteIcon from '../../assets/images/delete-icon.png';

import addImage from '../../assets/images/add.png';
import addHoverImage from '../../assets/images/add-hover.png';

function LocationPopup({
  addresses = [],
  onClose,
  onAdd,
  onSelectAddress,
  onEdit,
  onDelete
}) {
  const [currentAddressId, setCurrentAddressId] = useState(
    localStorage.getItem('currentAddressId')
  );

  const [activeActionsId, setActiveActionsId] = useState(null);

  function handleSelectAddress(addressId) {
    setCurrentAddressId(String(addressId));
    onSelectAddress?.(addressId);
  }

  function handleToggleActions(addressId) {
    setActiveActionsId((current) =>
      String(current) === String(addressId)
        ? null
        : addressId
    );
  }

  function handleEditAddress(address) {
    setActiveActionsId(null);
    onEdit?.(address);
  }

  function handleDeleteAddress(address) {
    setActiveActionsId(null);
    onDelete?.(address);
  }

  return (
    <div className="location-popup-overlay">
      <div className="location-popup-box">

        {/* FECHAR POPUP */}
        <button
          type="button"
          className="location-popup-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        {/* IMAGEM PRINCIPAL */}
        <img
          src={localImage}
          alt="Localização"
          className="location-popup-image"
        />

        <h2>Onde você quer receber seu pedido?</h2>

        {/* LISTA DE ENDEREÇOS */}
        <div className="location-popup-addresses">
          {addresses.map((address) => {
            const isSelected =
              String(currentAddressId) === String(address.id);

            const actionsOpen =
              String(activeActionsId) === String(address.id);

            return (
              <div
                key={address.id}
                className={`location-popup-address ${
                  isSelected ? 'selected' : ''
                }`}
              >

                {/* ÍCONES À ESQUERDA */}
                <div className="location-popup-address-icons">

                  {actionsOpen ? (
                    <>
                      <button
                        type="button"
                        className="location-popup-icon-button"
                        onClick={() => handleEditAddress(address)}
                        aria-label="Editar endereço"
                      >
                        <img src={editIcon} alt="" />
                      </button>

                      <button
                        type="button"
                        className="location-popup-icon-button"
                        onClick={() => handleDeleteAddress(address)}
                        aria-label="Excluir endereço"
                      >
                        <img src={deleteIcon} alt="" />
                      </button>
                    </>
                  ) : (
                    <img
                      src={localIcon}
                      alt=""
                      className="location-popup-local-icon"
                    />
                  )}

                </div>

                {/* INFORMAÇÕES DO ENDEREÇO */}
                <button
                  type="button"
                  className="location-popup-address-content"
                  onClick={() => handleSelectAddress(address.id)}
                >
                  {address.label && (
                    <strong>{address.label}</strong>
                  )}

                  <span className="location-popup-address-street">
                    {address.street}, {address.number}
                  </span>

                  <span className="location-popup-address-details">
                    {address.neighborhood} - {address.city}/{address.state}
                  </span>

                  {address.complement && (
                    <span className="location-popup-address-details">
                      {address.complement}
                    </span>
                  )}
                </button>

                {/* TRÊS PONTINHOS */}
                <button
                  type="button"
                  className={`location-popup-actions-toggle ${
                    actionsOpen ? 'active' : ''
                  }`}
                  onClick={() => handleToggleActions(address.id)}
                  aria-label={
                    actionsOpen
                      ? 'Ocultar ações do endereço'
                      : 'Mostrar ações do endereço'
                  }
                  aria-expanded={actionsOpen}
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>

              </div>
            );
          })}
        </div>

        {/* ADICIONAR ENDEREÇO */}
        <button
          type="button"
          className="location-popup-add"
          onClick={onAdd}
          aria-label="Adicionar endereço"
        >
          <img
            className="location-popup-add-normal"
            src={addImage}
            alt=""
          />

          <img
            className="location-popup-add-hover"
            src={addHoverImage}
            alt=""
          />
        </button>

      </div>
    </div>
  );
}

export default LocationPopup;