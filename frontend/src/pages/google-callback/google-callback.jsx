import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function GoogleCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash.substring(1)
    );

    const accessToken = params.get('access_token');

    if (!accessToken) {
      setError('Não foi possível realizar o login com Google.');
      return;
    }

    localStorage.setItem('token', accessToken);

    window.history.replaceState(
      null,
      '',
      window.location.pathname
    );

    navigate('/home', { replace: true });
  }, [navigate]);

  if (error) {
    return (
      <main>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>
          Voltar para o login
        </button>
      </main>
    );
  }

  return (
    <main>
      <p>Finalizando login com Google...</p>
    </main>
  );
}

export default GoogleCallback;