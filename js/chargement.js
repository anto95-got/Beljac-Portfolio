const loader = document.querySelector('.loading-container');
const navbar = document.getElementById('navbar');
document.body.classList.add('loading'); // Désactive interactions

window.addEventListener('load', () => {
  loader.classList.add('hide');

  setTimeout(() => {
    loader.remove();
    document.body.classList.remove('loading'); // Rétablit les interactions
    navbar.style.display = 'block'; // Affiche la navbar après le chargement
  },1500 );
});

gsap.to(".ballon", {
    y: -150,
    duration: 0.6,
    ease: "power2.out",
    yoyo: true,
    repeat: -1
  });
