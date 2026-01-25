import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

// Données avec Catégories
const skillsData = [
  { id: 1, name: "HTML", category: "front", img: "icon-html.png" },
  { id: 2, name: "CSS", category: "front", img: "icon-css.png" },
  { id: 3, name: "JavaScript", category: "front", img: "icon-javascript.png" },
  { id: 4, name: "React", category: "front", img: "icon-react.png" },
  { id: 5, name: "PHP", category: "back", img: "icon-php.png" },
  { id: 6, name: "Java", category: "back", img: "icon-java.png" },
  { id: 7, name: "Python", category: "back", img: "icon-python.png" },
  { id: 8, name: "C#", category: "back", img: "icon-csharp.png" },
  { id: 9, name: "Windows", category: "os", img: "icon-windows.png" },
  { id: 10, name: "MacOS", category: "os", img: "icon-macos.png" },
  { id: 11, name: "Linux", category: "os", img: "icon-linux.png" },
  {id: 12, name: "Git", category: "back", img: "icon-git.png" },
  {id: 13, name: "Bootstrap", category: "front", img: "icon-bootstrap.png" },
  {id: 14, name: "bash", category: "back", img: "icon-bash.png" },
];

// Composant Carte Unique avec Effet 3D
const Card3D = ({ skill }) => {
  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const content = el.querySelector('.card-3d-content');
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midCardWidth = rect.width / 2;
    const midCardHeight = rect.height / 2;
    const angleY = (x - midCardWidth) / 8;
    const angleX = (midCardHeight - y) / 8;
    content.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.1)`;
  };

  const handleMouseLeave = (e) => {
    const content = e.currentTarget.querySelector('.card-3d-content');
    content.style.transform = "rotateX(0) rotateY(0) scale(1)";
  };

  return (
    <div className="card-3d-container" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="card-3d-content">
        <img src={`/icon-img/${skill.img}`} alt={skill.name} />
        <h5>{skill.name}</h5>
      </div>
    </div>
  );
};

const Skills = () => {
  const [filter, setFilter] = useState('all');
  const containerRef = useRef(null);

  // Filtrage
  const filteredSkills = filter === 'all' 
    ? skillsData 
    : skillsData.filter(skill => skill.category === filter);

  // Animation à chaque changement de filtre
  useEffect(() => {
    gsap.fromTo(containerRef.current.children, 
      { opacity: 0, y: 20, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)" }
    );
  }, [filter]);

  return (
    <section id="skills" className="container py-5">
      <h2 className="section-title">Langages <span>Utilisés</span></h2>
      
      {/* BOUTONS DE FILTRES */}
      <div className="d-flex justify-content-center gap-3 mb-5 flex-wrap">
        {[
          { key: 'all', label: 'Tout' },
          { key: 'front', label: 'Front-End' },
          { key: 'back', label: 'Back-End' },
          { key: 'os', label: 'Systèmes (OS)' }
        ].map((btn) => (
          <button 
            key={btn.key}
            className={`btn ${filter === btn.key ? 'btn-warning' : 'btn-outline-light'} text-uppercase fw-bold px-4 rounded-pill`}
            onClick={() => setFilter(btn.key)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* GRILLE DES CARTES */}
      <div className="row g-5 justify-content-center" ref={containerRef}>
        {filteredSkills.map((skill) => (
          <div key={skill.id} className="col-auto">
            <Card3D skill={skill} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Skills;