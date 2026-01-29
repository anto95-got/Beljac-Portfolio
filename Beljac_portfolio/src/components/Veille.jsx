import React, { useState, useEffect } from 'react';
import lionImg from '../assets/lion_ajana_fond.png';
import './Veille.css';
import robot from '../../dist/veille/ameca.jpg';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const Veille = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [activeAlt, setActiveAlt] = useState(1);
  const [activeAladdin, setActiveAladdin] = useState(1);
  const [news, setNews] = useState([
    { id: 'sample-1', title: "OpenAI présente GPT-o3", date: "24 jan 2026", summary: "Modèle multimodal orienté agents, plans plus longs et sûreté renforcée.", link: "#" },
    { id: 'sample-2', title: "Boston Dynamics dévoile Atlas NG", date: "21 jan 2026", summary: "Nouvelle génération du robot humanoïde avec IA embarquée pour la manutention.", link: "#" },
    { id: 'sample-3', title: "UE : cadre IA pour robots industriels", date: "18 jan 2026", summary: "Lignes directrices sur traçabilité et sécurité des systèmes robotiques.", link: "#" },
    { id: 'sample-4', title: "Nvidia lance Jetson Orion", date: "15 jan 2026", summary: "Plateforme edge pour robots autonomes optimisée RL + vision temps réel.", link: "#" },
  ]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [errorNews, setErrorNews] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoadingNews(true);
      try {
        const q = query(collection(db, 'actus'), orderBy('date', 'desc'), limit(4));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const items = snap.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || 'Sans titre',
            summary: doc.data().summary || '',
            date: doc.data().date || '',
            link: doc.data().link || '#'
          }));
          setNews(items);
        }
        setErrorNews(null);
      } catch (err) {
        console.warn('Actus Firestore non chargées, fallback local.', err);
        setErrorNews("Impossible de récupérer les actus, affichage des données locales.");
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

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

  const goNext = () => { if (currentSection < 4) setCurrentSection(prev => prev + 1); };
  const goPrev = () => { if (currentSection > 0) setCurrentSection(prev => prev - 1); };

  return (
    <div className="veille-window">
      <div className="veille-slider" style={{ transform: `translateY(-${currentSection * 100}vh)` }}>

        {/* 0. HERO */}
        <section className="veille-section" id="hero-veille">
          <div className="presentation">
            <h1 className="display-5 fw-bold text-white">MA <span className="text-warning">VEILLE TECHNOLOGIQUE</span></h1>
            <h3 className='display-13 fw-bold text-white'>Portera sur les robots IA, des machines équipées d'une intelligence artificielle qui les contrôle.</h3>
            <button className="btn btn-warning btn-lg rounded-pill px-5 mt-5 fw-bold" onClick={goNext}>
              COMMENCER
            </button>
          </div>
          <div className="img">
            <img src={robot} alt="Robot IA" />
            <h2 className="display-8 fw-bold text-white">Robot IA</h2>
          </div>
        </section>

        {/* 1. ACTUALITES */}
        <section className="veille-section actus-section" id='actua'>
          <h1 id='titre' className='display-5 fw-bold text-white'>Actualités IA & Robots</h1>
          {errorNews && <p className="text-warning small">{errorNews}</p>}
          {loadingNews ? (
            <p className="text-light">Chargement des actus...</p>
          ) : (
            <div className="actualite-grid">
              {news.map((item) => (
                <article key={item.id} className="actus-card">
                  <div className="actus-meta">{item.date}</div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <a href={item.link} target="_blank" rel="noreferrer" className="link-light fw-bold">Lire</a>
                </article>
              ))}
            </div>
          )}
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

        {/* 3. ALTERNANCE */}
        <section className="veille-section">
          <h2 className="section-title">02. <span>Sujet</span></h2>
          <div className="accordion-container">
            {alternanceCards.map((card) => (
              <div 
                key={card.id} 
                className={`accordion-card ${activeAlt === card.id ? 'active' : ''}`}
                style={{backgroundImage: `url(${card.img})`}}
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

        {/* 4. ALADDIN */}
        <section className="veille-section">
          <h2 className="section-title">03. <span>Sujet : Aladdin</span></h2>
          <div className="accordion-container">
            {aladdinCards.map((card) => (
              <div 
                key={card.id} 
                className={`accordion-card ${activeAladdin === card.id ? 'active' : ''}`}
                style={{backgroundImage: `url(${card.img})`}}
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
