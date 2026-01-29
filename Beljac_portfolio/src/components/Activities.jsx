import React, { useState, useRef, useEffect } from 'react';
import './Activities.css';

const Activities = ({ onContact }) => {
  const [currentSlide, setCurrentSlide] = useState(0); // 0 = Carousel, 1=Coach, 2=Foot, 3=Projet
  
  // Refs pour le DOM du carousel
  const carouselRef = useRef(null);
  const listRef = useRef(null);
  const thumbnailRef = useRef(null);
  const timeRef = useRef(null);

  // --- LOGIQUE CAROUSEL (Adaptée de ton JS) ---
  const showSlider = (type) => {
    const listItems = listRef.current.querySelectorAll('.item');
    const thumbnailItems = thumbnailRef.current.querySelectorAll('.item');
    const carousel = carouselRef.current;

    if (type === 'next') {
      listRef.current.appendChild(listItems[0]);
      thumbnailRef.current.appendChild(thumbnailItems[0]);
      carousel.classList.add('next');
    } else {
      listRef.current.prepend(listItems[listItems.length - 1]);
      thumbnailRef.current.prepend(thumbnailItems[thumbnailItems.length - 1]);
      carousel.classList.add('prev');
    }

    setTimeout(() => {
      carousel.classList.remove('next');
      carousel.classList.remove('prev');
    }, 2000); // Temps de l'animation CSS
  };

  // Auto-run du carousel
  useEffect(() => {
    const autoRun = setInterval(() => {
      showSlider('next');
    }, 10500); // Change slide toutes les 10.5 secondes
    return () => clearInterval(autoRun);
  }, []);

  // Fonction pour aller voir un détail
  const goToDetail = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  return (
    <div className="activities-wrapper">

      {/* SLIDER VERTICAL (Transition fluide entre carousel et détails) */}
      <div className="activities-slider" style={{ transform: `translateY(-${currentSlide * 100}vh)` }}>

        {/* --- SLIDE 0 : LE CARROUSEL --- */}
        <div className="activity-section">
          <div className="carousel" ref={carouselRef}>
            
            <div className="list" ref={listRef}>
              
              {/* ITEM 1 : COACH */}
              <div className="item">
                <img src="/projet-photo/belgique-photo.JPG" alt="Coach" />
                <div className="content">
                  <div className="author">Antony</div>
                  <div className="title">Transmettre mon football</div>
                  <div className="topic">Éducateur</div>
                  <div className="des">L'une de mes principales activités est d'éduquer et entraîner des jeunes.</div>
                  <div className="buttons">
                    <button onClick={() => goToDetail(1)}>VOIR PLUS</button>
                    <button onClick={onContact}>CONTACT</button>
                  </div>
                </div>
              </div>

              {/* ITEM 2 : PROJET DUO */}
              <div className="item">
                <img src="/projet-photo/ajf-banniere.png" alt="Projet" />
                <div className="content">
                  <div className="author">Antony et Junior</div>
                  <div className="title">Tournoi de football</div>
                  <div className="topic">Projet en duo</div>
                  <div className="des">Nous avons un projet très ambitieux en cours de processus.</div>
                  <div className="buttons">
                    <button onClick={() => goToDetail(3)}>VOIR PLUS</button>
                    <button onClick={onContact}>CONTACT</button>
                  </div>
                </div>
              </div>

              {/* ITEM 3 : JOUEUR */}
              <div className="item">
                <img src="/projet-photo/photo-foot.JPG" alt="Joueur" />
                <div className="content">
                  <div className="author">Antony</div>
                  <div className="title">Joueur de Football</div>
                  <div className="topic">Passion</div>
                  <div className="des">Depuis petit je suis footballeur avec l'ambition d'atteindre le monde semi-pro.</div>
                  <div className="buttons">
                    <button onClick={() => goToDetail(2)}>VOIR PLUS</button>
                    <button onClick={onContact}>CONTACT</button>
                  </div>
                </div>
              </div>

            </div>

            {/* THUMBNAILS (Images petites) */}
            <div className="thumbnail" ref={thumbnailRef}>
              <div className="item">
                <img src="/projet-photo/futsal-photo.jpg" alt="" />
                <div className="content">
                  <div className="title">Éducateur</div>
                </div>
              </div>
              <div className="item">
                <img src="/projet-photo/ajf-affiche.JPG" alt="" />
                <div className="content">
                  <div className="title">Projet</div>
                </div>
              </div>
              <div className="item">
                <img src="/projet-photo/tir-photo.JPG" alt="" />
                <div className="content">
                  <div className="title">Joueur</div>
                </div>
              </div>
            </div>

            {/* FLÈCHES */}
            <div className="arrows" >
              <button onClick={() => showSlider('prev')} style={{justifyContent:'center'}}>
                <img src="veille/down-arrow.png" alt="" style={{ width: '22px', transform: 'rotate(90deg)' }} />
              </button>
              <button onClick={() => showSlider('next')}>
                <img src="veille/down-arrow.png" alt="" style={{ width: '22px', transform: 'rotate(-0.25turn)' }} />
              </button>
            </div>

            <div className="time" ref={timeRef}></div>
          </div>
        </div>

        {/* --- SLIDE 1 : DÉTAIL COACH --- */}
        <div className="activity-section detail-slide">
           <div className="detail-content">
              <div className="detail-text">
                 <h2>Expérience <span>Coach</span></h2>
                 <p>Le rôle de coach me tient à cœur. Je transmets mon expérience depuis longtemps et mon meilleur souvenir reste le tournoi en Belgique avec mes U10.</p>
              </div>
              <div className="detail-media">
                 <video src="/projet-photo/videocoach.mp4" controls className="img-fluid rounded"></video>
              </div>
           </div>
        </div>

        {/* --- SLIDE 2 : DÉTAIL FOOT (JOUEUR) --- */}
        <div className="activity-section detail-slide">
           <div className="detail-content">
              <div className="detail-text">
                 <h2>Plus qu'un <span>Sport</span></h2>
                 <p>Toute ma vie j'ai joué au football. J'ai pu faire les meilleures rencontres et expériences de ma vie grâce à ce sport et aux personnes qui le pratiquent.</p>
              </div>
              <div className="detail-media">
                 <video src="/projet-photo/video-footut.mp4" controls className="img-fluid rounded"></video>
              </div>
           </div>
        </div>

        {/* --- SLIDE 3 : DÉTAIL PROJET (AJF) --- */}
        <div className="activity-section detail-slide">
           <div className="detail-content">
              <div className="detail-text">
                 <h2>Projet en <span>Duo</span></h2>
                 <p>Projet très ambitieux en cours de création. C'est encore Top Secret ! 🤫</p>
              </div>
              <div className="detail-media">
                 <img src="/projet-photo/top-secret.jpg" alt="Top Secret" />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Activities;
