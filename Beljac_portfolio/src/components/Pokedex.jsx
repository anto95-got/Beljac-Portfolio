import React, { useState, useEffect, useRef } from "react";
import gsap from 'gsap';
import './Pokédex.css';

// Images locales (on les importe pour éviter les chemins cassés)
import imgLoupAgneau from '../assets/Pokedex/loup_agneau.png';
import imgLoupChien from '../assets/Pokedex/Loup_chien.jpg';
import imgBelleBete from '../assets/Pokedex/belle_bete.jpg';
import imgChaperonRouge from '../assets/Pokedex/petitchaperonrouge.jpg';
import imgFrankenstein from '../assets/Pokedex/frankenstein.jpeg';
import imgIleMoreau from '../assets/Pokedex/ile-du-docteur-moreau.jpg';
import imgFermeAnimaux from '../assets/Pokedex/lafermedesanimaux.jpeg';
import imgLivreJungle from '../assets/Pokedex/livre-jungle.jpg';
import imgPlaneteSinges from '../assets/Pokedex/laPlanetedessinge.webp';
import imgCrocBlanc from '../assets/Pokedex/Croc_blanc.jpg';
import imgPacteLoups from '../assets/Pokedex/Le-Pacte-des-loups.webp';
import imgAvatar from '../assets/Pokedex/Avatar.jpeg';
import imgLoupWallStreet from '../assets/Pokedex/LeloupWallStreet.jpg';
import imgFenrir from '../assets/Pokedex/fenrir.jpg';
import imgBeteGevaudan from '../assets/Pokedex/labetedugevaudan.jpg';
import imgLouveCapitole from '../assets/Pokedex/a-louvre-capitole.jpg';
import imgMetamorphoses from '../assets/Pokedex/metamorphoses.jpg';
import imgVasarely from '../assets/Pokedex/vasarely.jpg';
import imgFondDefault from '../assets/Pokedex/fond_poke.jpg';

// --- 1. TES DONNÉES (Tu les écris ici à la main) ---
const pokemonData = [
  {
    id: 1,
    name: "Le Loup et l’Agneau",
    category: "Litterature",
    img: imgLoupAgneau,
    description: "Une fable de La Fontaine opposant la force brutale du loup à l’innocence de l’agneau, dénonçant l’injustice du plus fort."
  },
  {
    id: 2,
    name: "Le Loup et le Chien",
    category: "Litterature",
    img: imgLoupChien,
    description: "Une fable de La Fontaine qui confronte la liberté sauvage à la sécurité confortable mais contraignante."
  },
  {
    id: 3,
    name: "La Belle et la Bête",
    category: "Litterature",
    img: imgBelleBete,
    description: "Un conte où l’amour permet de dépasser l’apparence monstrueuse et révèle l’humanité cachée."
  },
  {
    id: 4,
    name: "Le Petit Chaperon rouge",
    category: "Litterature",
    img: imgChaperonRouge,
    description: "Un conte mettant en scène le danger incarné par le loup et la naïveté de l’innocence."
  },
  {
    id: 5,
    name: "Frankenstein",
    category: "Litterature",
    img: imgFrankenstein,
    description: "Un roman de Mary Shelley questionnant la création de la vie et la frontière entre l’homme et le monstre."
  },
  {
    id: 6,
    name: "L’Île du docteur Moreau",
    category: "Litterature",
    img: imgIleMoreau,
    description: "Un roman de H. G. Wells explorant les limites de la science et la transformation de l’animal en homme."
  },
  {
    id: 7,
    name: "La Ferme des animaux",
    category: "Litterature",
    img: imgFermeAnimaux,
    description: "Une fable politique de George Orwell où les animaux incarnent les dérives du pouvoir."
  },
  {
    id: 8,
    name: "Le Livre de la jungle",
    category: "Litterature",
    img: imgLivreJungle,
    description: "Un récit de Kipling sur l’apprentissage de la vie sauvage et les lois du monde animal."
  },
  {
    id: 9,
    name: "La Planète des singes",
    category: "Litterature",
    img: imgPlaneteSinges,
    description: "Un roman de Pierre Boulle inversant les rôles entre humains et animaux intelligents."
  },
  {
    id: 10,
    name: "Croc-Blanc",
    category: "Litterature",
    img: imgCrocBlanc,
    description: "Un roman de Jack London racontant la lutte entre instinct sauvage et monde humain."
  },
  {
    id: 11,
    name: "Le Pacte des loups",
    category: "Cinema",
    img: imgPacteLoups,
    description: "Un film inspiré de la Bête du Gévaudan mêlant légende, mystère et violence."
  },
  {
    id: 12,
    name: "Avatar",
    category: "Cinema",
    img: imgAvatar,
    description: "Un film explorant le lien entre l’homme, la nature et les créatures d’un monde extraterrestre."
  },
  {
    id: 13,
    name: "Le Loup de Wall Street",
    category: "Cinema",
    img: imgLoupWallStreet,
    description: "Un film de Martin Scorsese utilisant la métaphore animale pour représenter la prédation financière."
  },
  {
    id: 14,
    name: "Fenrir",
    category: "Mythologie",
    img: imgFenrir,
    description: "Un loup géant de la mythologie nordique destiné à provoquer la fin du monde lors du Ragnarök."
  },
  {
    id: 15,
    name: "La Bête du Gévaudan",
    category: "Mythologie",
    img: imgBeteGevaudan,
    description: "Une créature légendaire responsable d’attaques mystérieuses en France au XVIIIe siècle."
  },
  {
    id: 16,
    name: "La Louve du Capitole",
    category: "Mythologie",
    img: imgLouveCapitole,
    description: "Symbole fondateur de Rome, la louve qui a nourri Romulus et Rémus."
  },
  {
    id: 17,
    name: "Métamorphoses",
    category: "Mythologie",
    img: imgMetamorphoses,
    description: "Récits d’Ovide mettant en scène la transformation des hommes en animaux ou créatures mythiques."
  },
  {
    id: 18,
    name: "Vasarely",
    category: "Art",
    img: imgVasarely,
    description: "Art optique jouant sur la perception et la transformation visuelle des formes."
  }
];


// --- 2. TON COMPOSANT ---
const Pokedex = () => {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const containerRef = useRef(null);

  // Filtrage
  const categories = ['all', ...new Set(pokemonData.map(p => p.category))];
  const filteredPokemons = filter === 'all' 
    ? pokemonData 
    : pokemonData.filter(p => p.category === filter);

  // Animation GSAP
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children, 
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.2)" }
      );
    }
  }, [filter]);

  // Logique 3D (MouseMove)
  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const content = el.querySelector('.card-3d-content');
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const angleY = (x - rect.width / 2) / 10;
    const angleX = (rect.height / 2 - y) / 10;
    content.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.05)`;
  };

  const handleMouseLeave = (e) => {
    const content = e.currentTarget.querySelector('.card-3d-content');
    content.style.transform = "rotateX(0) rotateY(0) scale(1)";
  };

  const openModal = (poke) => setSelected(poke);
  const closeModal = () => setSelected(null);

  return (
    <div className="pokedex-page">
      <div className="container py-5">
        <h2 className="section-title">Pokédex <span>Explorer</span></h2>

        {/* Filtres */}
        <div className="d-flex justify-content-center gap-3 mb-5 flex-wrap">
          {categories.map((cat) => (
            <button 
              key={cat}
              className={`btn ${filter === cat ? 'btn-warning' : 'btn-outline-light'} text-uppercase fw-bold px-4 rounded-pill`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? 'Tous' : cat}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="row g-4 justify-content-center" ref={containerRef}>
          {filteredPokemons.map((poke) => (
            <div key={poke.id} className="col-auto">
              <div 
                className="card-3d-container"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="card-3d-content">
                  <img src={poke.img} alt={poke.name} />
                  <h5 className="pokemon-name">{poke.name}</h5>
                  
                  <div className="summary-hover">
                    <p className="description-text">{poke.description}</p>
                    <button 
                      className="btn btn-warning fw-bold"
                      onClick={() => openModal(poke)}
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pop-up détaillé */}
      {selected && (
        <div className="pokedex-overlay" onClick={closeModal}>
          <div className="pokedex-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal} aria-label="Fermer le détail">×</button>
            <div className="modal-body">
              <img className="modal-img" src={selected.img} alt={selected.name} />
              <div className="modal-info">
                <h3>{selected.name}</h3>
                <p>{selected.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pokedex;
