import './footer.css';
import logo from '../../assets/images/foodify-logo-white.png';

function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-divider"></div>

      <div className="footer-content">
        <img src={logo} alt="Foodify" className="footer-logo" />

        <p>© 2026 Foodify. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;