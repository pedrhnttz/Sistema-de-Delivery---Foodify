import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Welcome from '../pages/welcome/welcome';
import Login from '../pages/login/login';
import Verification from '../pages/verification/verification';
import Register from '../pages/register/register';
import Home from '../pages/home/home';
import Restaurant from '../pages/restaurant/restaurant';
import GoogleCallback from '../pages/google-callback/google-callback';
import ProfileData from '../pages/profile-data/profile-data';
import RestaurantCategory from '../pages/restaurant-category/restaurant-category';
import Search from '../pages/search/search';
import Favorites from '../pages/favorites/favorites';
import PersonalInfo from '../pages/personal-info/personal-info';
import Credentials from '../pages/credentials/credentials';
import MyRestaurants from '../pages/my-restaurants/my-restaurants';
import MyOrders from '../pages/my-orders/my-orders';
import OrderDetails from '../pages/order-details/order-details';

// Redirecionamento para rotas inexistentes
function FallbackRoute() {
  const token = localStorage.getItem('token');

  return (
    <Navigate
      to={token ? '/home' : '/'}
      replace
    />
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/verificar-codigo"
          element={<Verification />}
        />

        <Route path="/cadastro" element={<Register />} />

        <Route path="/home" element={<Home />} />

        <Route
          path="/restaurante/:id"
          element={<Restaurant />}
        />

        <Route
          path="/login/google/callback"
          element={<GoogleCallback />}
        />

        <Route
          path="/perfil/dados"
          element={<ProfileData />}
        />

        <Route
          path="/perfil/informacoes-pessoais"
          element={<PersonalInfo />}
        />

        <Route
          path="/perfil/credenciais"
          element={<Credentials />}
        />

        <Route
          path="/categoria/:categorySlug"
          element={<RestaurantCategory />}
        />

        <Route
          path="/perfil/meus-restaurantes"
          element={<MyRestaurants />}
        />

        <Route path="/pedidos" element={<MyOrders />} />

        <Route
          path="/pedidos/:orderId"
          element={<OrderDetails />}
        />

        <Route path="/pesquisa" element={<Search />} />

        <Route path="/favorites" element={<Favorites />} />

        {/* Rotas inexistentes */}
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;