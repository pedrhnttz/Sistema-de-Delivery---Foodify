import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import backgroundLogin from '../../assets/images/background-login.png';

import './register.css';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || '/api'
).replace(/\/$/, '');

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function formatPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === 'phone' ? formatPhone(value) : value
    }));

    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.replace(/\D/g, '');

    if (!name || !email || !phone) {
      setError('Preencha todos os campos.');
      return;
    }

    if (phone.length < 10 || phone.length > 11) {
      setError('Informe um telefone válido com DDD.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          phone,
          email
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          'Não foi possível realizar o cadastro.'
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Não foi possível conectar ao servidor. Tente novamente.'
          : err.message || 'Erro ao realizar cadastro.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="register-page"
      style={{
        backgroundImage: `url("${backgroundLogin}")`
      }}
    >
      <div className="register-overlay">
        <section className="register-card">
          {!success ? (
            <>
              <button
                type="button"
                className="register-back"
                onClick={() => navigate('/login')}
                aria-label="Voltar para o login"
              >
                ‹
              </button>

              <h1>Crie sua conta</h1>

              <p className="register-subtitle">
                Preencha seus dados para começar no Foodify
              </p>

              <form onSubmit={handleSubmit}>
                <fieldset className="register-field">
                  <legend>Nome completo</legend>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Digite seu nome completo"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </fieldset>

                <fieldset className="register-field">
                  <legend>Telefone</legend>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                  />
                </fieldset>

                <fieldset className="register-field">
                  <legend>E-mail</legend>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Digite seu e-mail"
                    autoComplete="email"
                    maxLength={150}
                    required
                  />
                </fieldset>

                {error && (
                  <p className="register-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="register-submit"
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </form>

              <div className="register-bottom">
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                >
                  Entrar
                </button>
              </div>
            </>
          ) : (
            <div className="register-success" role="status">
              <div className="register-success-icon">
                ✓
              </div>

              <h1>Cadastro realizado!</h1>

              <p>
                Sua conta foi criada com sucesso.
              </p>

              <p>
                Agora você pode entrar no Foodify
                utilizando o e-mail cadastrado.
              </p>

              <button
                type="button"
                className="register-submit"
                onClick={() => navigate('/login', {
                  replace: true
                })}
              >
                Ir para o login
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Register;