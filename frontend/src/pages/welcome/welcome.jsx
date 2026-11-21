import { Link } from 'react-router-dom';
import './welcome.css';

function Welcome() {
  return (
    <main className="welcome-page">
      <section className="welcome-card">
        <h1>Bem-vindo ao Foodify!</h1>

        <p className="welcome-description">
          Foodify. É do Brasil. É tudo pra mim.
        </p>

        <Link to="/login" className="welcome-login-button">
          Entrar
        </Link>

        <div className="welcome-divider"></div>

        <p className="welcome-register-text">
          Ainda não tem uma conta?{' '}
          <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </section>
    </main>
  );
}

export default Welcome;