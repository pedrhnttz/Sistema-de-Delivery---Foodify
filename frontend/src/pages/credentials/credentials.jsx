import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';

import {
  getCurrentUser,
  updateCurrentUser
} from '../../services/user-service';

import './credentials.css';

function Credentials() {
  const navigate = useNavigate();

  const [originalEmail, setOriginalEmail] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const user = await getCurrentUser();

        if (!active) return;

        setOriginalEmail(user.email || '');
        setEmail(user.email || '');
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Não foi possível carregar o e-mail.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  async function handleContinue(event) {
    event.preventDefault();

    if (saving) return;

    const newEmail = email.trim().toLowerCase();

    if (!newEmail) {
      setError('Informe um e-mail válido.');
      return;
    }

    if (newEmail === originalEmail.trim().toLowerCase()) {
      setError('Informe um e-mail diferente do atual.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateCurrentUser({
        email: newEmail
      });

      // Exibe a confirmação antes de redirecionar.
      window.alert(
        `E-mail alterado com sucesso!\n\n` +
        `Seu novo endereço de acesso é:\n${newEmail}\n\n` +
        `Para continuar utilizando o Foodify, você precisará ` +
        `fazer login novamente com seu novo e-mail.`
      );

      // Encerra a sessão após o usuário confirmar a mensagem.
      localStorage.removeItem('token');

      window.dispatchEvent(new Event('auth-updated'));

      navigate('/login', {
        replace: true
      });
    } catch (err) {
      setError(
        err.message || 'Não foi possível atualizar o e-mail.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="credentials-page">
      <Header />

      <main className="credentials-content">
        <h1>Credenciais</h1>

        {loading ? (
          <p>Carregando credenciais...</p>
        ) : (
          <form onSubmit={handleContinue}>
            <fieldset className="credentials-email-field">
              <legend>E-mail</legend>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                placeholder="Digite seu e-mail"
                autoComplete="email"
                maxLength={150}
                required
              />
            </fieldset>

            <p className="credentials-description">
              Ao alterar seu e-mail, será necessário
              entrar novamente na sua conta.
            </p>

            {error && (
              <p className="credentials-error" role="alert">
                {error}
              </p>
            )}

            <div className="credentials-actions">
              <button
                type="button"
                className="credentials-back"
                onClick={() => navigate('/perfil/dados')}
                disabled={saving}
              >
                Voltar
              </button>

              <button
                type="submit"
                className="credentials-continue"
                disabled={saving || loading}
              >
                {saving ? 'Salvando...' : 'Continuar'}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Credentials;