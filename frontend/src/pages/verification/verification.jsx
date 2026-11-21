import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verifyLoginCode } from '../../services/auth-service';
import './verification.css';

import logo from '../../assets/images/foodify-logo-white.png';

function Verification() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;
  const purpose = location.state?.purpose || 'login';

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await verifyLoginCode(email, code);
      localStorage.setItem('token', response.access_token);
      window.dispatchEvent(new Event('auth-updated'));
      if (purpose === 'credentials') {
        navigate('/perfil/alterar-email', {
          replace: true,
          state: {
            email
          }
        });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="verification-page">
      <section className="verification-card">

        <img
          src={logo}
          alt="Foodify"
          className="verification-logo"
        />

        <h1>Verifique seu e-mail</h1>

        <p>
          Enviamos um código de acesso para seu e-mail.
          Digite os 6 dígitos abaixo.
        </p>

        {email && <p>{email}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="Digite o código de 6 dígitos"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, ''))
            }
            required
          />

          {error && <p>{error}</p>}

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
          >
            {loading ? 'Verificando...' : 'Confirmar código'}
          </button>
        </form>

        <div className="verification-footer">
          <Link to="/login">Voltar para o login</Link>
        </div>

      </section>
    </main>
  );
}

export default Verification;