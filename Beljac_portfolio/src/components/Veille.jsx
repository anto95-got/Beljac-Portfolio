import React, { useState } from 'react';
import lionImg from '../assets/lion_ajana_fond.png'; 

const Veille = ({ onBack }) => {
  // Navigation (Index de la slide actuelle)
  const [currentSection, setCurrentSection] = useState(0);

  // Accordéons (ID de la carte ouverte)
  const [activeAlt, setActiveAlt] = useState(1);
  const [activeAladdin, setActiveAladdin] = useState(1);

  // --- DONNÉES AVEC TES IMAGES EXACTES ---
  // Assure-toi que ces fichiers sont dans le dossier "public" !
  const alternanceCards = [
    { id: 1, title: "Organigramme", icon: "1", img: "/veille/org-photo.png" },
    { id: 2, title: "Mes Missions", icon: "2", img: "/veille/photo-mission.jpg" },
  ];

  const aladdinCards = [
    { id: 1, title: "Introduction", icon: "1", img: "/veille/7.png" },
    { id: 2, title: "BlackRock", icon: "2", img: "/veille/8.png" },
    { id: 3, title: "Larry Fink", icon: "3", img: "/veille/9.png" },
    { id: 4, title: "Influence", icon: "4", img: "/veille/10.png" },
    { id: 5, title: "Création", icon: "5", img: "/veille/11.png" },
    { id: 6, title: "L'IA au contrôle", icon: "6", img: "/veille/12.png" },
    { id: 7, title: "Conclusion", icon: "7", img: "/veille/13.png" },
  ];

  // Fonctions de Navigation
  const goNext = () => { if (currentSection < 4) setCurrentSection(prev => prev + 1); };
  const goPrev = () => { if (currentSection > 0) setCurrentSection(prev => prev - 1); };
  const goToSlide = (index) => { setCurrentSection(index); };

  return (
    <div className="veille-window">
      
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={{background: 'rgba(0,0,0,0.8)', zIndex: 999}}>
        <div className="container">
          <a className="navbar-brand text-warning fw-bold" href="#">VEILLE TECH</a>
          <button className="btn btn-outline-warning btn-sm fw-bold ms-auto rounded-pill" onClick={onBack}>
             RETOUR PORTFOLIO
          </button>
        </div>
      </nav>

      {/* SLIDER VERTICAL */}
      <div className="veille-slider" style={{ transform: `translateY(-${currentSection * 100}vh)` }}>

        {/* 0. HERO */}
        <section className="veille-section">
          <h1 className="display-1 fw-bold text-white">MA <span className="text-warning">VEILLE</span></h1>
          <h2 className="display-3 fw-bold text-white">TECHNOLOGIQUE</h2>
          <button className="btn btn-warning btn-lg rounded-pill px-5 mt-5 fw-bold" onClick={goNext}>
            COMMENCER
          </button>
        </section>

        {/* 1. SOMMAIRE */}
        <section className="veille-section">
          <h2 className="section-title mb-5">Sommaire</h2>
          <ul className="summary-list text-center" style={{listStyle: 'none'}}>
            <li onClick={() => goToSlide(2)}>01. Introduction</li>
            <li onClick={() => goToSlide(3)}>02. Présentation du Sujet</li>
            <li onClick={() => goToSlide(4)}>03. Sujet : Aladdin</li>
          </ul>
          <div className="nav-controls">
            <button className="nav-btn" onClick={goPrev}style={{backgroundColor:'white'}}><img src="/veille/up-arrow.png" alt="btn_Prev" style={{width:'22px'}}/></button>
            <button className="nav-btn" onClick={goNext}style={{backgroundColor:'white'}}><img src="/veille/down-arrow.png" alt="btn_Next" style={{width:'22px'}} /></button>
          </div>
        </section>

        {/* 2. PRESENTATION */}
        <section className="veille-section">
          <div className="container">
            <h2 className="section-title">01. <span>Introduction</span></h2>
            <div className="row align-items-center">
              <div className="col-lg-6">
                <h3 className="text-white mb-3">Sujet de la VEILLE TECHNOLOGIQUE <span className="text-warning">IA Prédictive en économie</span></h3>
                <p className="lead text-light mb-4">
                  Moyen associée pour maintenir la veille  <strong>Agent IA</strong>.
                </p>
                <a href="/Antonybeljaccv.pdf" download className="btn btn-warning fw-bold rounded-pill px-4">Voir l'agent  </a>
              </div>
              <div className="col-lg-6 text-center mt-4 mt-lg-0">
                 <img src={lionImg} alt="Profil" className="img-fluid rounded-circle" style={{maxWidth: '300px', border: '3px solid #f1ce09'}} />
              </div>
            </div>
          </div>
          <div className="nav-controls">
            <button className="nav-btn" onClick={goPrev} style={{backgroundColor:'white'}}><img src="/veille/up-arrow.png" alt="btn_Prev" style={{width:'22px'}}/></button>
            <button className="nav-btn" onClick={goNext} style={{backgroundColor:'white'}}><img src="/veille/down-arrow.png" alt="btn_Next" style={{width:'22px'}} /></button>
          </div>
        </section>

        {/* 3. ALTERNANCE (Avec Images !) */}
        <section className="veille-section">
          <h2 className="section-title">02. <span>Sujet</span></h2>
          <div className="accordion-container">
            {alternanceCards.map((card) => (
              <div 
                key={card.id} 
                className={`accordion-card ${activeAlt === card.id ? 'active' : ''}`}
                style={{backgroundImage: `url(${card.img})`}} // L'image est appliquée ici
                onClick={() => setActiveAlt(card.id)}
              >
                <div className="accordion-content">
                  <div className="card-icon">{card.icon}</div>
                  <div className="card-title">{card.title}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="nav-controls">
            <button className="nav-btn" onClick={goPrev} style={{backgroundColor:'white'}}><img src="/veille/up-arrow.png" alt="btn_Prev" style={{width:'22px'}}/></button>
            <button className="nav-btn" onClick={goNext} style={{backgroundColor:'white'}}><img src="/veille/down-arrow.png" alt="btn_Next" style={{width:'22px'}} /></button>
          </div>
        </section>

        {/* 4. ALADDIN (Avec Images !) */}
        <section className="veille-section">
          <h2 className="section-title">03. <span>Sujet : Aladdin</span></h2>
          <div className="accordion-container">
            {aladdinCards.map((card) => (
              <div 
                key={card.id} 
                className={`accordion-card ${activeAladdin === card.id ? 'active' : ''}`}
                style={{backgroundImage: `url(${card.img})`}} // L'image est appliquée ici
                onClick={() => setActiveAladdin(card.id)}
              >
                <div className="accordion-content">
                  <div className="card-icon">{card.icon}</div>
                  <div className="card-title">{card.title}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="nav-controls">
            <button className="nav-btn" onClick={goPrev} style={{backgroundColor:'white'}}><img src="/veille/up-arrow.png" alt="btn_Prev" style={{width:'22px'}}/></button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Veille;