import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DeleteAccountModal from '../../components/delete-account-modal/delete-account-modal';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';

import './profile-data.css';

function ProfileData() {
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const options = [
    {
      title: 'Informações pessoais',
      description: 'Nome e telefone',
      path: '/perfil/informacoes-pessoais'
    },
    {
      title: 'Credenciais',
      description: 'E-mail de acesso à minha conta',
      path: '/perfil/credenciais'
    },
    {
      title: 'Deletar conta',
      description: 'Excluir permanentemente minha conta',
      action: 'delete-account',
      danger: true
    }
  ];

  function handleOptionClick(option) {
    if (option.action === 'delete-account') {
      setShowDeleteModal(true);
      return;
    }

    if (option.path) {
      navigate(option.path);
    }
  }

  function handleCloseDeleteModal() {
    setShowDeleteModal(false);
  }

  return (
    <div className="profile-data-page">
      <Header />

      <main className="profile-data-content">
        <h1>Meus dados</h1>

        <nav
          className="profile-data-options"
          aria-label="Configurações da conta"
        >
          {options.map((option) => (
            <button
              key={option.path || option.action}
              type="button"
              className={`profile-data-option ${
                option.danger
                  ? 'profile-data-option-danger'
                  : ''
              }`}
              onClick={() => handleOptionClick(option)}
            >
              <span className="profile-data-option-text">
                <span className="profile-data-option-title">
                  {option.title}
                </span>

                <span className="profile-data-option-description">
                  {option.description}
                </span>
              </span>

              <span
                className="profile-data-chevron"
                aria-hidden="true"
              >
                ›
              </span>
            </button>
          ))}
        </nav>
      </main>

      <Footer />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
      />
    </div>
  );
}

export default ProfileData;