// src/Projects.jsx
import React, { useState, useEffect, useRef } from 'react';
import './Projects.css';
import './phone.css';
import './Flappy.css';

// Images Icones
import htmlIcon from '/icon-img/icon-html.png';
import cssIcon from '/icon-img/icon-css.png';
import jsIcon from '/icon-img/icon-javascript.png';

const Projects = ({ onBack }) => {
  const [currentProject, setCurrentProject] = useState('menu');

  // --- LOGIQUE METEO ---
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(false);

  const fetchWeather = () => {
    if (city === '') return;
    const APIKey = '437e71e05bf76d394418b68153fb2e7b';
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${APIKey}`)
      .then(response => response.json())
      .then(json => {
        if (json.cod === '404') {
          setError(true);
          setWeatherData(null);
        } else {
          setError(false);
          setWeatherData(json);
        }
      });
  };

  // --- LOGIQUE PHONE ---
  const [startPhone, setStartPhone] = useState(false);

  // --- LOGIQUE FLAPPY BIRD ---
  const [startFlappy, setStartFlappy] = useState(false);
  const canvasRef = useRef(null);
  const [scores, setScores] = useState({ current: 0, best: 0 });

  useEffect(() => {
    if (currentProject === 'flappy' && startFlappy && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = 'https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png';

      let gamePlaying = false;
      const gravity = 0.5;
      const speed = 6.2;
      const size = [51, 36];
      const jump = -11.5;
      const cTenth = canvas.width / 10;

      let index = 0,
        bestScore = 0,
        flight,
        flyHeight,
        currentScore = 0,
        pipes = [];

      const pipeWidth = 78;
      const pipeGap = 270;
      const pipeLoc = () =>
        Math.random() * ((canvas.height - (pipeGap + pipeWidth)) - pipeWidth) + pipeWidth;

      const setup = () => {
        currentScore = 0;
        flight = jump;
        flyHeight = canvas.height / 2 - size[1] / 2;
        pipes = Array(3)
          .fill()
          .map((_, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);
      };

      const render = () => {
        index++;

        // Background
        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height,
          -((index * (speed / 2)) % canvas.width) + canvas.width,
          0,
          canvas.width,
          canvas.height
        );
        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height,
          -((index * (speed / 2)) % canvas.width),
          0,
          canvas.width,
          canvas.height
        );

        if (gamePlaying) {
          pipes.forEach(pipe => {
            pipe[0] -= speed;

            // Top pipe
            ctx.drawImage(
              img,
              432,
              588 - pipe[1],
              pipeWidth,
              pipe[1],
              pipe[0],
              0,
              pipeWidth,
              pipe[1]
            );

            // Bottom pipe
            ctx.drawImage(
              img,
              432 + pipeWidth,
              108,
              pipeWidth,
              canvas.height - pipe[1] + pipeGap,
              pipe[0],
              pipe[1] + pipeGap,
              pipeWidth,
              canvas.height - pipe[1] + pipeGap
            );

            if (pipe[0] <= -pipeWidth) {
              currentScore++;
              bestScore = Math.max(bestScore, currentScore);
              setScores({ current: currentScore, best: bestScore });
              pipes = [
                ...pipes.slice(1),
                [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()],
              ];
            }

            if (
              [
                pipe[0] <= cTenth + size[0],
                pipe[0] + pipeWidth >= cTenth,
                pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + size[1],
              ].every(Boolean)
            ) {
              gamePlaying = false;
              setup();
              setScores({ current: 0, best: bestScore });
            }
          });
        }

        if (gamePlaying) {
          ctx.drawImage(
            img,
            432,
            Math.floor((index % 9) / 3) * size[1],
            ...size,
            cTenth,
            flyHeight,
            ...size
          );
          flight += gravity;
          flyHeight = Math.min(flyHeight + flight, canvas.height - size[1]);
        } else {
          ctx.drawImage(
            img,
            432,
            Math.floor((index % 9) / 3) * size[1],
            ...size,
            canvas.width / 2 - size[0] / 2,
            flyHeight,
            ...size
          );
          flyHeight = canvas.height / 2 - size[1] / 2;
          ctx.fillStyle = 'white';
          ctx.font = 'bold 30px courier';
          ctx.fillText(`Best score : ${bestScore}`, 55, 245);
          ctx.fillText(`Click to play`, 60, 535);
        }

        requestAnimationFrame(render);
      };

      const handleClick = () => {
        if (!gamePlaying) {
          gamePlaying = true;
        }
        flight = jump;
      };

      setup();
      img.onload = render;
      canvas.addEventListener('click', handleClick);

      return () => {
        canvas.removeEventListener('click', handleClick);
      };
    }
  }, [currentProject, startFlappy]);

  return (
    <div className="projects-window">
      {/* NAVBAR */}
      <nav
        className="navbar navbar-expand-lg navbar-dark fixed-top"
        style={{ backgroundColor: '#000', borderBottom: '1px solid #333' }}
      >
        <div className="container">
          <a className="navbar-brand text-warning fw-bold" href="#">
            MES PROJETS
          </a>
          <button
            className="btn btn-outline-warning btn-sm fw-bold ms-auto rounded-pill"
            onClick={onBack}
          >
            RETOUR PORTFOLIO
          </button>
        </div>
      </nav>

      {/* --- MENU SELECTION --- */}
      {currentProject === 'menu' && (
        <div className="container text-center" style={{ marginTop: '100px' }}>
          <h1 className="display-4 fw-bold mb-5">
            CHOISIS UN <span className="text-warning">PROJET</span>
          </h1>
          <div className="project-selector">
            <div className="project-card-choice" onClick={() => setCurrentProject('meteo')}>
              <i className="fa-solid fa-cloud-sun-rain"></i>
              <h3>Météo App</h3>
            </div>

            <div className="project-card-choice" onClick={() => setCurrentProject('phone')}>
              <i className="fa-solid fa-mobile-screen-button"></i>
              <h3>iPhone 16 Animé</h3>
            </div>

            <div className="project-card-choice" onClick={() => setCurrentProject('flappy')}>
              <i className="fa-solid fa-dove"></i>
              <h3>Flappy Bird</h3>
            </div>
          </div>
        </div>
      )}

      {/* --- PROJET METEO --- */}
      {currentProject === 'meteo' && (
        <div className="meteo-section">
          <div className="text-center w-100">
            <button
              className="btn btn-outline-light mb-4"
              onClick={() => setCurrentProject('menu')}
            >
               Retour Menu
            </button>
            <div className="mb-4">
              <h2>Météo App</h2>
              <div className="d-flex justify-content-center gap-3 mt-2">
                <img src={htmlIcon} width="40" alt="HTML" />
                <img src={cssIcon} width="40" alt="CSS" />
                <img src={jsIcon} width="40" alt="JS" />
              </div>
            </div>
            <div className="d-flex justify-content-center">
              <div
                className={`meteo-box ${weatherData ? 'active' : ''} ${
                  error ? 'error' : ''
                }`}
              >
                <div className="search-box">
                  <i className="fa-solid fa-location-dot"></i>
                  <input
                    type="text"
                    placeholder="Entrer une ville"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                  <button onClick={fetchWeather}>
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>
                </div>
                {error && (
                  <div className="not-found">
                    <img src="/meteo/404.png" alt="404" />
                    <p>Oops! Ville invalide :/</p>
                  </div>
                )}
                {weatherData && (
                  <>
                    <div className="weather-box">
                      <img
                        src={`/meteo/${weatherData.weather[0].main.toLowerCase()}.png`}
                        alt="Icon"
                        onError={e => (e.target.src = '/meteo/cloud.png')}
                      />
                      <p className="temperature">
                        {parseInt(weatherData.main.temp)}
                        <span>°C</span>
                      </p>
                      <p className="description">{weatherData.weather[0].description}</p>
                    </div>
                    <div className="weather-details">
                      <div className="detail">
                        <i className="fa-solid fa-water"></i>
                        <span>{weatherData.main.humidity}%</span>
                        <p>Humidité</p>
                      </div>
                      <div className="detail">
                        <i className="fa-solid fa-wind"></i>
                        <span>{parseInt(weatherData.wind.speed)} Km/h</span>
                        <p>Vent</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PROJET PHONE (IPHONE 16) --- */}
      {currentProject === 'phone' && (
        <>
          {!startPhone && (
            <div
              className="d-flex flex-column align-items-center justify-content-center"
              style={{ minHeight: '100vh', textAlign: 'center' }}
            >
              <button
                className="btn btn-outline-light mb-5 position-absolute start-0 m-3"
                style={{ top: '4rem', zIndex: 1000 }}
                onClick={() => setCurrentProject('menu')}
              >
                 Menu
              </button>
              <h1 className="display-3 fw-bold">
                <span>iPhone </span>
              </h1>
              <p className="lead text-white mb-5">
                Animation d&apos;un iPhone avec changement de couleurs et Dynamic Island.
              </p>
              <h3 className="mb-4">Langages Utilisés</h3>
              <div className="d-flex gap-4 mb-5">
                <div className="glass-card p-3 rounded">
                  <img src={htmlIcon} width="50" alt="HTML" />
                  <h5 className="mt-2 text-black">HTML</h5>
                </div>
                <div className="glass-card p-3 rounded">
                  <img src={cssIcon} width="50" alt="CSS" />
                  <h5 className="mt-2 text-black">CSS</h5>
                </div>
              </div>
              <button
                className="btn btn-warning btn-lg rounded-pill px-5 fw-bold"
                style={{ fontSize: '2rem' }}
                onClick={() => setStartPhone(true)}
              >
                COMMENCER
              </button>
            </div>
          )}
          {startPhone && (
            <div className="phone-project-wrapper">
              <button
                className="btn btn-outline-light mb-4 position-absolute start-0 m-4"
                style={{ top: '4.25rem', zIndex: 999 }}
                onClick={() => setStartPhone(false)}
              >
                 Retour
              </button>

              {/* SECTION IPHONE SCOPÉE */}
              <section className="pho" id="phone">
                {/* Radios pour les thèmes */}
                <input type="radio" name="theme" id="deep-purple" defaultChecked />
                <input type="radio" name="theme" id="gold" />
                <input type="radio" name="theme" id="space-black" />
                <input type="radio" name="theme" id="silver" />

                <div className="phone">
                  {/* Boutons latéraux */}
                  <div className="buttons">
                    <div className="left">
                      <div className="button"></div>
                      <div className="button"></div>
                      <div className="button"></div>
                    </div>

                    <div className="right">
                      <div className="button"></div>
                    </div>
                  </div>

                  <div className="camera"></div>

                  <div className="screen-container">
                    <div className="bg">
                      <div className="deep-purple">
                        <div className="section">
                          <div className="glow"></div>
                        </div>
                        <div className="section">
                          <div className="glow"></div>
                        </div>
                      </div>

                      <div className="gold">
                        <div className="section">
                          <div className="glow"></div>
                        </div>
                        <div className="section">
                          <div className="glow"></div>
                        </div>
                      </div>

                      <div className="space-black">
                        <div className="section">
                          <div className="glow"></div>
                        </div>
                        <div className="section">
                          <div className="glow"></div>
                        </div>
                      </div>

                      <div className="silver">
                        <div className="section">
                          <div className="glow"></div>
                        </div>
                        <div className="section">
                          <div className="glow"></div>
                        </div>
                      </div>
                    </div>

                    <div className="notch-container" tabIndex={0}>
                      <div className="notch">
                        <div className="content">
                          <div className="left">
                            <div className="title"></div>
                            <div className="text"></div>
                          </div>
                          <div className="right">
                            <div className="bar">
                              <div className="duration"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="notch-blur"></div>
                    </div>
                  </div>
                </div>

                {/* Palette de couleurs */}
                <div className="pallette">
                  <label htmlFor="deep-purple" className="swatch"></label>
                  <label htmlFor="gold" className="swatch"></label>
                  <label htmlFor="space-black" className="swatch"></label>
                  <label htmlFor="silver" className="swatch"></label>
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {/* --- PROJET FLAPPY BIRD --- */}
      {currentProject === 'flappy' && (
        <div className="flappy-wrapper">
          {!startFlappy && (
            <div className="flappy-intro container" style={{ position: 'relative' }}>
              <button
                className="btn btn-outline-light mb-5 m-5"
                style={{ position: 'fixed', top: '4rem', left: '1.5rem', zIndex: 1100 }}
                onClick={() => setCurrentProject('menu')}
              >
                 Menu
              </button>

              <h1 className="display-3 fw-bold">
                <span>Flappy-Bird</span>
              </h1>
              <p className="lead">Jeu classique refait en JavaScript Canvas.</p>

              <h3>Langages Utilisés</h3>
              <div className="flappy-cards">
                <div className="f-card">
                  <div className="f-content-card">
                    <img src={htmlIcon} alt="HTML" />
                    <h1>HTML</h1>
                  </div>
                </div>
                <div className="f-card">
                  <div className="f-content-card">
                    <img src={cssIcon} alt="CSS" />
                    <h1>CSS</h1>
                  </div>
                </div>
                <div className="f-card">
                  <div className="f-content-card">
                    <img src={jsIcon} alt="JS" />
                    <h1>JavaScript</h1>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-warning btn-lg rounded-pill px-5 fw-bold"
                style={{ fontSize: '2rem' }}
                onClick={() => setStartFlappy(true)}
              >
                COMMENCER
              </button>
            </div>
          )}

          {startFlappy && (
            <div className="flappy-game-container" style={{ position: 'relative' }}>
              <button
                className="btn btn-outline-light mb-3 m-4"
                style={{ position: 'fixed', top: '4rem', left: '1.5rem', zIndex: 1100 }}
                onClick={() => setStartFlappy(false)}
              >
                 Retour Présentation
              </button>

              <h2 className="flappy-title">FLAPPY BIRD</h2>

              <canvas id="flappy-canvas" ref={canvasRef} width="431" height="768"></canvas>

              <div className="score-board">
                <div id="bestScore">Best: {scores.best}</div>
                <div id="currentScore">Current: {scores.current}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
