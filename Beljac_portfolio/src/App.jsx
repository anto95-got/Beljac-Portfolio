import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Home() { return <div className="container py-5"><h1 className="mb-3">Accueil</h1></div>; }
function Projects() { return <div className="container py-5"><h1 className="mb-3">Projets</h1></div>; }
function Contact() { return <div className="container py-5"><h1 className="mb-3">Contact</h1></div>; }

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar Bootstrap de base (mobile-ready) */}
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">Mon Portfolio</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav"
                  aria-controls="nav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div id="nav" className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item"><Link className="nav-link" to="/">Accueil</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/projects">Projets</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Pages */}
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/projects" element={<Projects/>} />
        <Route path="/contact" element={<Contact/>} />
      </Routes>

      {/* Footer simple */}
      <footer className="py-4 text-center text-muted">
        <i className="bi bi-github"></i> &nbsp;© {new Date().getFullYear()} — Tous droits réservés
      </footer>
    </BrowserRouter>
  );
}
