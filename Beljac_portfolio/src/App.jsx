import React, { useState, useEffect } from 'react';
import Loader from './components/loader';
import Skills from './components/skills';
import Timeline from './components/Timeline';
import Veille from './components/Veille';
import Projects from './components/Projects';
import Activities from './components/Activities';
import gsap from 'gsap';
import './App.css';

import lionImg from './assets/lion_ajana_fond.png'; 

function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('portfolio'); 

  const handleContactClick = () => {
    setView('portfolio');
    setTimeout(() => {
        const contactSection = document.getElementById('contact');
        if(contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (!loading && view === 'portfolio') {
      gsap.from(".hero-content", { y: 50, opacity: 0, duration: 1 });
      gsap.from(".hero-img", { scale: 0.8, opacity: 0, duration: 1, delay: 0.3 });
    }
  }, [loading, view]);

  return (
    <>
      {loading && <Loader onComplete={() => setLoading(false)} />}

      {!loading && (
        <>
          {/* --- VUES SECONDAIRES --- */}
          {view === 'veille' && <Veille onBack={() => setView('portfolio')} />}
          {view === 'projects' && <Projects onBack={() => setView('portfolio')} />}
          {view === 'activities' && <Activities onBack={() => setView('portfolio')} onContact={handleContactClick} />}

          {/* --- VUE PRINCIPALE (PORTFOLIO) --- */}
          {view === 'portfolio' && (
            <div className="main-content">
              
              <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={{backgroundColor: '#000', borderBottom: '1px solid #333'}}>
                <div className="container">
                  <a className="navbar-brand text-warning fw-bold" href="#home" onClick={() => setView('portfolio')}>BELJAC</a>
                  <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                  </button>
                  <div className="collapse navbar-collapse" id="navbarNav">
                    <div className="navbar-nav ms-auto text-center align-items-center">
                      <a className="nav-link" href="#home">Accueil</a>
                      <a className="nav-link" href="#parcours">Parcours</a>
                      <a className="nav-link" href="#skills">Compétences</a>
                      <a className="nav-link" href="#" onClick={(e) => {e.preventDefault(); setView('projects');}}>Projets</a>
                      <a className="nav-link" href="#" onClick={(e) => {e.preventDefault(); setView('activities');}}>Activités</a>
                      <a className="nav-link" href="#contact">Contact</a>
                      <button className="btn btn-outline-warning ms-lg-3 btn-sm fw-bold rounded-pill" onClick={() => setView('veille')}>
                        VEILLE TECH
                      </button>
                    </div>
                  </div>
                </div>
              </nav>

              {/* HERO */}
              <section id="home" className="d-flex align-items-center justify-content-center" style={{minHeight: '100vh', paddingTop: '80px'}}>
                <div className="container">
                  <div className="row align-items-center justify-content-center">
                    <div className="col-lg-6 hero-content text-center text-lg-start">
                      <h1 className="display-3 fw-bold">Portfolio d'<span>Antony</span></h1>
                      <h3 className="text-warning mb-4">Développeur & Éducateur</h3>
                      <p className="lead text-white">Explorez mes projets ainsi que mes activités personnelles et professionnelles.</p>
                      <div className="mt-4 d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
                        <a href="#contact" className="btn btn-warning btn-lg rounded-pill px-5">Contact</a>
                        <button className="btn btn-outline-light btn-lg rounded-pill px-5" onClick={() => setView('projects')}>Mes Projets</button>
                        <button className="btn btn-outline-light btn-lg rounded-pill px-5" onClick={() => setView('activities')}>Mes Activités</button>
                      </div>
                    </div>
                    <div className="col-lg-6 text-center hero-img mt-5 mt-lg-0">
                      <img src={lionImg} alt="Lion Antony" className="img-fluid" style={{maxHeight: '400px'}} />
                    </div>
                  </div>
                </div>
              </section>

              <Timeline />
              <Skills />

              {/* CV SECTION - CORRIGÉE */}
              <section id="cv" className="py-5 text-center">
                <div className="container">
                  <h2 className="section-title">Mon <span>CV</span></h2>
                  <div className="d-inline-block p-4" style={{background: '#111', borderRadius: '15px', border: '1px solid #333'}}>
                    <img src={lionImg} alt="Lion Decor" className="img-fluid mb-4" style={{height: '100px'}} />
                    <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                        {/* Lien de téléchargement */}
                        <a href="/Antonybeljaccv.pdf" download="Antony_Beljac_CV.pdf" className="btn btn-warning btn-lg fw-bold">
                            <i className="ri-download-line me-2"></i> Télécharger PDF
                        </a>
                        {/* Lien de visualisation (ouvre un nouvel onglet) */}
                        <a href="/Antonybeljaccv.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-lg fw-bold">
                            <i className="ri-eye-line me-2"></i> Voir en ligne
                        </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* CONTACT SECTION - CORRIGÉE (Labels ajoutés) */}
              <section id="contact" className="py-5 mb-5">
                <div className="container">
                  <h2 className="section-title">Me <span>Contacter</span></h2>
                  <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                      <form action="https://formsubmit.co/nany.beljac@gmail.com" method="POST" style={{background: '#111', padding: '2.5rem', borderRadius: '15px', border: '1px solid #333', textAlign: 'left'}}>
                        
                        <div className="mb-4">
                            <label className="form-label text-warning fw-bold text-uppercase">Votre Nom</label>
                            <input type="text" name="name" className="form-control bg-dark text-white border-secondary p-3" placeholder="Ex: Jean Dupont" required />
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-warning fw-bold text-uppercase">Votre Email</label>
                            <input type="email" name="email" className="form-control bg-dark text-white border-secondary p-3" placeholder="Ex: jean@email.com" required />
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-warning fw-bold text-uppercase">Sujet</label>
                            <input type="text" name="subject" className="form-control bg-dark text-white border-secondary p-3" placeholder="Ex: Offre de stage / Projet" />
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-warning fw-bold text-uppercase">Message</label>
                            <textarea name="msg" rows="5" className="form-control bg-dark text-white border-secondary p-3" placeholder="Écrivez votre message ici..."></textarea>
                        </div>

                        <button type="submit" className="btn btn-warning w-100 py-3 fw-bold fs-5 rounded-pill">ENVOYER LE MESSAGE</button>
                      </form>
                    </div>
                  </div>
                </div>
              </section>

              <footer className="text-center py-4 bg-black text-white border-top border-secondary">
                <p className="m-0">&copy; 2025 Antony Beljac.</p>
              </footer>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default App;