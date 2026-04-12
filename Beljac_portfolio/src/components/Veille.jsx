import React, { useEffect, useState } from 'react';
import lionImg from '../assets/lion_ajana_fond.png';
import './Veille.css';
import robot from '../assets/Ameca-Full-figure-Social-Humanoid-Robot-Realistic-Facial-Expression-Heinz-Nixdorf-Museumsforum-Engineered-Arts.jpg';

const formatDate = (value) => {
  if (!value) return 'Date inconnue';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return parsedDate.toLocaleDateString('fr-FR');
};

const toTimestamp = (value) => {
  const parsedDate = new Date(value);
  const timestamp = parsedDate.getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const VEILLE_API_URL = import.meta.env.VITE_VEILLE_API_URL || '/api/veille';

const decodeEntities = (rawText) => {
  if (!rawText) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return String(rawText);
  }
  const parser = new DOMParser();
  const parsed = parser.parseFromString(String(rawText), 'text/html');
  return parsed.documentElement.textContent || '';
};

const cleanText = (rawText) => {
  const decoded = decodeEntities(rawText || '');
  return decoded
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toNewsKey = (item) => `${item?.link || ''}|${item?.title || ''}`.trim().toLowerCase();

const normalizeNews = (item) => ({
  title: cleanText(item?.title || 'Titre inconnu'),
  summary: cleanText(item?.summary || 'Pas de résumé disponible.'),
  content: cleanText(item?.content || item?.summary || 'Voir l’article source.'),
  source: cleanText(item?.source || 'Source inconnue'),
  link: cleanText(item?.link || '#'),
  date: cleanText(item?.date || ''),
});

const normalizeEntry = (entry) => ({
  weekId: cleanText(entry?.weekId || ''),
  week: cleanText(entry?.week || ''),
  news: Array.isArray(entry?.news) ? entry.news.map((item) => normalizeNews(item)) : [],
});

const normalizeApiData = (payload) => {
  // Compat legacy: ancien format [ { week, news }... ]
  if (Array.isArray(payload)) {
    const historyBlocks = payload
      .map((entry) => normalizeEntry(entry))
      .filter((entry) => entry.news.length > 0)
      .sort((a, b) => {
        const maxA = Math.max(...a.news.map((item) => toTimestamp(item.date)), 0);
        const maxB = Math.max(...b.news.map((item) => toTimestamp(item.date)), 0);
        return maxB - maxA;
      });

    return {
      latest: historyBlocks[0] || { weekId: '', week: '', news: [] },
      history: historyBlocks.slice(1),
      updatedAt: '',
    };
  }

  const latest = normalizeEntry(payload?.latest || {});
  const history = Array.isArray(payload?.history)
    ? payload.history.map((entry) => normalizeEntry(entry)).filter((entry) => entry.news.length > 0)
    : [];

  return {
    latest,
    history,
    updatedAt: cleanText(payload?.updatedAt || ''),
  };
};

const Veille = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [activeAlt, setActiveAlt] = useState(1);
  const [activeAladdin, setActiveAladdin] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [veilleData, setVeilleData] = useState({
    latest: { weekId: '', week: '', news: [] },
    history: [],
    updatedAt: '',
  });
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadNews = async () => {
      try {
        setIsLoadingNews(true);
        setNewsError('');

        const fetchJson = async (url) => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Erreur HTTP ${response.status} sur ${url}`);
          return response.json();
        };

        let payload;
        try {
          payload = await fetchJson(VEILLE_API_URL);
        } catch {
          payload = await fetchJson('/veille/historique_ia_robotique.json');
        }

        const normalized = normalizeApiData(payload);
        if (isMounted) setVeilleData(normalized);
      } catch {
        if (isMounted) {
          setNewsError('Impossible de charger les actualités pour le moment.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingNews(false);
        }
      }
    };

    loadNews();
    return () => {
      isMounted = false;
    };
  }, []);

  const latestNews = Array.isArray(veilleData.latest.news) ? veilleData.latest.news : [];
  const oldNews = (() => {
    const flattened = (Array.isArray(veilleData.history) ? veilleData.history : [])
      .flatMap((entry) => (Array.isArray(entry.news) ? entry.news : []))
      .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));

    const dedup = new Set();
    return flattened.filter((item) => {
      const key = toNewsKey(item);
      if (!key || dedup.has(key)) return false;
      dedup.add(key);
      return true;
    });
  })();

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

          {isLoadingNews && <p className="text-light mt-4">Chargement des actualités...</p>}
          {!isLoadingNews && newsError && <p className="text-warning fw-bold mt-4">{newsError}</p>}

          {!isLoadingNews && !newsError && (
            <>
              <h3 className="actus-subtitle">Actualités récentes</h3>
              <div className="actualite-grid">
                {latestNews.map((item) => (
                  <article key={`${item.link}-${item.date}`} className="actus-card">
                    <div className="actus-meta">{formatDate(item.date)}</div>
                    <div className="actus-meta">{item.source}</div>
                    <p>{item.summary}</p>
                    <button
                      type="button"
                      className="btn btn-outline-warning btn-sm fw-bold rounded-pill mt-2"
                      onClick={() => setSelectedNews(item)}
                    >
                      Voir
                    </button>
                  </article>
                ))}
              </div>

              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-outline-warning fw-bold rounded-pill px-4"
                  onClick={() => setShowHistory((prev) => !prev)}
                  disabled={oldNews.length === 0}
                >
                  {showHistory ? 'Masquer historique' : 'Historique'}
                </button>
              </div>

              {showHistory && (
                <>
                  <h3 className="actus-subtitle archives-title">Historique</h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                    <div className="actualite-grid">
                      {oldNews.map((item) => (
                        <article key={`${item.link}-${item.date}`} className="actus-card">
                          <div className="actus-meta">{formatDate(item.date)}</div>
                          <div className="actus-meta">{item.source}</div>
                          <p>{item.summary}</p>
                          <button
                            type="button"
                            className="btn btn-outline-warning btn-sm fw-bold rounded-pill mt-2"
                            onClick={() => setSelectedNews(item)}
                          >
                            Voir
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
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

      {selectedNews && (
        <div
          onClick={() => setSelectedNews(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1rem',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(680px, 100%)',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#111',
              border: '1px solid #333',
              borderRadius: '14px',
              padding: '1.25rem',
              color: '#fff',
            }}
          >
            <button
              type="button"
              className="btn btn-outline-warning btn-sm fw-bold rounded-pill mb-3"
              onClick={() => setSelectedNews(null)}
            >
              Fermer
            </button>
            <p className="actus-meta mb-1">{formatDate(selectedNews.date)}</p>
            <p className="actus-meta mb-2">{selectedNews.source}</p>
            <h2 className="text-warning">{selectedNews.title}</h2>
            <p className="mb-3">{selectedNews.content}</p>
            <a
              href={selectedNews.link}
              target="_blank"
              rel="noreferrer"
              className="btn btn-warning btn-sm fw-bold rounded-pill"
            >
              Lire l’article complet
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Veille;
