import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';

import {
  getCurrentUser,
  updateCurrentUser
} from '../../services/user-service';

import './personal-info.css';

function PersonalInfo() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: '',
    phone: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const data = await getCurrentUser();

        if (!active) return;

        setUser({
          name: data.name || '',
          phone: data.phone || ''
        });
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Não foi possível carregar seus dados.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setUser((current) => ({
      ...current,
      [name]: value
    }));

    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const name = user.name.trim();
    const phone = user.phone.trim();

    if (!name) {
      setError('Informe seu nome completo.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Envia somente os dados pessoais.
      // O e-mail será alterado exclusivamente
      // na futura página de credenciais.
      const response = await updateCurrentUser({
        name,
        phone
      });

      const updatedUser = response?.user || {
        name,
        phone
      };

      setUser({
        name: updatedUser.name ?? name,
        phone: updatedUser.phone ?? phone
      });

      if (response?.access_token) {
        localStorage.setItem(
          'token',
          response.access_token
        );

        window.dispatchEvent(
          new Event('auth-updated')
        );
      }

      setSuccess('Informações atualizadas com sucesso!');
    } catch (err) {
      setError(
        err.message || 'Não foi possível salvar as alterações.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="personal-info-page">
      <Header />

      <main className="personal-info-content">
        <h1>Editar informações pessoais</h1>

        {loading ? (
          <p className="personal-info-message">
            Carregando informações...
          </p>
        ) : (
          <form
            className="personal-info-form"
            onSubmit={handleSubmit}
          >
            <div className="personal-info-field">
              <label htmlFor="personal-name">
                Nome completo
              </label>

              <input
                id="personal-name"
                name="name"
                type="text"
                value={user.name}
                onChange={handleChange}
                placeholder="Nome completo"
                autoComplete="name"
                maxLength={150}
                required
              />
            </div>

            <div className="personal-info-field">
              <label htmlFor="personal-phone">
                Telefone
              </label>

              <input
                id="personal-phone"
                name="phone"
                type="tel"
                value={user.phone}
                onChange={handleChange}
                placeholder="Telefone"
                autoComplete="tel"
                maxLength={20}
              />
            </div>

            <p className="personal-info-description">
              Confira se seu nome e telefone estão corretos
              antes de salvar as alterações.
            </p>

            {error && (
              <p
                className="personal-info-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {success && (
              <p
                className="personal-info-success"
                role="status"
              >
                {success}
              </p>
            )}

            <div className="personal-info-actions">
              <button
                type="button"
                className="personal-info-back"
                onClick={() => navigate('/perfil/dados')}
                disabled={saving}
              >
                Voltar
              </button>

              <button
                type="submit"
                className="personal-info-save"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default PersonalInfo;