import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import './App.css';

export const Nav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollOrNavigate = (hash) => {
    if (location.pathname !== '/') {
      navigate(`/${hash}`);
    } else {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={{ backgroundColor: 'transparent !important', borderBottom: '1px solid #333' }}>
      <div className="container">
        <Link className="navbar-brand text-warning fw-bold" to="/">BELJAC</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav ms-auto text-center align-items-center">
            <Link className="nav-link" to="/#home" onClick={() => scrollOrNavigate('#home')}>Accueil</Link>
            <Link className="nav-link" to="/#parcours" onClick={() => scrollOrNavigate('#parcours')}>Parcours</Link>
            <Link className="nav-link" to="/#skills" onClick={() => scrollOrNavigate('#skills')}>Compétences</Link>
            <Link className="nav-link" to="/projects">Projets</Link>
            <Link className="nav-link" to="/activities">Activités</Link>
            <Link className="nav-link" to="/pokedex">Pokédex</Link>
            <Link className="nav-link" to="/#contact" onClick={() => scrollOrNavigate('#contact')}>Contact</Link>
            <button className="btn btn-outline-warning ms-lg-3 btn-sm fw-bold rounded-pill" onClick={() => navigate('/veille')}>
              VEILLE TECH
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
