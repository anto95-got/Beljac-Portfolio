import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const timelineData = [
  { year: "2019-Actuel", title: "Éducateur de Football", desc: "Coach U6-U13 à Argenteuil FC. Gestion d'équipe et pédagogie." },
  { year: "2022-2023", title: "Baccalauréat", desc: "Spécialité Mathématique, Physique-Chimie, option Math-Expert." },
  { year: "2023", title: "Animateur de colonie", desc: "Animation d'une semaine avec Chic-Planète pour la BNP." },
  { year: "2024-2026", title: "BTS SIO (SLAM)", desc: "En cours de passage du diplôme en alternance." },
  { year: "2024-Actuel", title: "Alternant chez INEO", desc: "Filiale de Equans. Technicien en alternance." },
];

const Timeline = () => {
  
  useEffect(() => {
    // 1. Ligne centrale
    gsap.fromTo(".timeline-line", 
      { height: "0%" },
      { 
        height: "100%", 
        duration: 1.5, 
        ease: "none", 
        scrollTrigger: { 
          trigger: ".timeline-section", 
          start: "top center", // Commence quand le haut de la section est au milieu de l'écran
          end: "bottom center",
          toggleActions: "play reverse play reverse" // Joue, Inverse, Rejoue, Inverse
        } 
      }
    );

    // 2. Blocs gauche/droite
    gsap.utils.toArray('.timeline-row').forEach((row, i) => {
      gsap.fromTo(row, 
        { opacity: 0, x: i % 2 === 0 ? -100 : 100 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.8, 
          ease: "power2.out",
          scrollTrigger: {
            trigger: row,
            start: "top 75%", // Déclenche un peu plus tôt
            end: "bottom 25%", // Finit un peu plus tard
            toggleActions: "play reverse play reverse" // L'animation se joue et s'inverse à chaque passage
          }
        }
      );
    });
  }, []);

  return (
    <section id="parcours" className="container py-5">
      <h2 className="section-title">Mon <span>Parcours</span></h2>
      <div className="timeline-section">
        <div className="timeline-line"></div>
        {timelineData.map((item, index) => (
          <div key={index} className={`timeline-row ${index % 2 === 0 ? 'left' : 'right'}`}>
            <div className={index % 2 === 0 ? "timeline-content" : "timeline-dummy"}>
              {index % 2 === 0 && (
                 <>
                  <h4 className="text-warning fw-bold">{item.title}</h4>
                  <small className="text-white d-block mb-2 fw-bold">{item.year}</small>
                  <p className="mb-0 text-light">{item.desc}</p>
                 </>
              )}
            </div>
            <div className="timeline-dot"></div>
            <div className={index % 2 !== 0 ? "timeline-content" : "timeline-dummy"}>
              {index % 2 !== 0 && (
                 <>
                  <h4 className="text-warning fw-bold">{item.title}</h4>
                  <small className="text-white d-block mb-2 fw-bold">{item.year}</small>
                  <p className="mb-0 text-light">{item.desc}</p>
                 </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Timeline;