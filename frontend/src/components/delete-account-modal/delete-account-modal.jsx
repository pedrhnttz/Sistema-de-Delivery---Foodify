import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './delete-account-modal.css';

function DeleteAccountModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleDelete() {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Sua sessão expirou. Entre novamente.');
      }

      const baseUrl = (
        import.meta.env.VITE_API_URL || '/api'
      ).replace(/\/$/, '');

      const response = await fetch(
        `${baseUrl}/users/me`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Não foi possível excluir sua conta.'
        );
      }

      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-updated'));

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Erro ao excluir conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="delete-account-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="delete-account-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <div className="delete-account-icon">
          !
        </div>

        <h2 id="delete-account-title">
          Excluir minha conta?
        </h2>

        <p id="delete-account-description">
          Tem certeza de que deseja excluir sua conta
          do Foodify?
        </p>

        <p>
          Esta ação é permanente e não poderá ser desfeita.
        </p>

        {error && (
          <p className="delete-account-error" role="alert">
            {error}
          </p>
        )}

        <div className="delete-account-actions">
          <button
            type="button"
            className="delete-account-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="delete-account-confirm"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Excluir conta'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountModal;