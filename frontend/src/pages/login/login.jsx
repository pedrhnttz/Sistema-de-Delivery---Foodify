import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendLoginCode } from '../../services/auth-service';
import './login.css';

import logo from '../../assets/images/foodify-logo-white.png';
import googleLogo from '../../assets/images/google-logo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      await sendLoginCode(email);

      navigate('/verificar-codigo', {
        state: { email }
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href =
      `${import.meta.env.VITE_API_URL}/auth/google/login`;
  }

  return (
    <main className="login-page">
      <section className="login-card">

        <img
          src={logo}
          alt="Foodify"
          className="login-logo"
        />

        <h1>Entre na sua conta</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            id="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {error && <p>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Continuar'}
          </button>
        </form>

        <div className="login-divider">
          <span>ou</span>
        </div>

        <button
          type="button"
          className="login-google-button"
          onClick={handleGoogleLogin}
        >
          <img src={googleLogo} alt="Google" />
          <span>Entrar com Google</span>
        </button>

        <div className="login-footer">
          <p>
            Não tem uma conta?{' '}
            <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </div>

      </section>
    </main>
  );
}

export default Login;