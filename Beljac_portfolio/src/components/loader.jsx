import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Vérifie que les noms correspondent à tes fichiers
import crownImg from '../assets/ajana_logo_basic.png'; 
import lionImg from '../assets/lion_ajana_fond.png'; // La bonne image

const Loader = ({ onComplete }) => {
  const containerRef = useRef(null);
  const crownRef = useRef(null);
  const lionRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => onComplete()
    });

    // 1. La couronne apparait
    tl.fromTo(crownRef.current, 
      { opacity: 0, scale: 0.5, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 1, ease: "back.out(1.7)" }
    )
    // 2. La couronne tourne et disparait
    .to(crownRef.current, { 
      rotationY: 360, 
      duration: 0.8, 
      opacity: 0, 
      scale: 0.5 
    })
    // 3. Le Lion surgit
    .fromTo(lionRef.current, 
      { opacity: 0, scale: 0.1, display: 'none' },
      { display: 'block', opacity: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.3)" }, 
      "-=0.5"
    )
    // 4. Rugissement
    .to(lionRef.current, { 
      x: -3, duration: 0.1, yoyo: true, repeat: 5 
    })
    // 5. Sortie vers le haut
    .to(containerRef.current, { 
      y: "-100%", duration: 0.8, ease: "power4.inOut", delay: 0.5 
    });

  }, [onComplete]);

  return (
    <div className="loader-container" ref={containerRef} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', 
      background: 'black', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      {/* TAILLE REDUITE ICI (width: 120px) */}
      <img ref={crownRef} src={crownImg} alt="Couronne" style={{width: '120px', position: 'absolute'}} />
      <img ref={lionRef} src={lionImg} alt="Lion" style={{width: '120px', opacity: 0, position: 'absolute'}} />
    </div>
  );
};

export default Loader;