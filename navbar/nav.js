document.addEventListener("DOMContentLoaded", function () {
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar').innerHTML = data;
            initNavbar(); // Initialiser les événements après l'insertion du HTML
        });

    function initNavbar() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        const navProjet = document.getElementById('navprojet');
        const projet = document.getElementById('projet');
        const dropdownArrow = document.querySelector('.dropdown__arrow');

        if (!navMenu || !navToggle || !navProjet || !projet || !dropdownArrow) return;

        // Afficher ou masquer le menu principal sur les petits écrans
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show-menu');
        });

        // Afficher ou masquer le dropdown "Projets"
        projet.addEventListener('click', () => {
            navProjet.classList.toggle('active');
            dropdownArrow.classList.toggle('active');
        });

        // Fermer le dropdown "Projets" lorsqu'on clique en dehors de celui-ci
        document.addEventListener('click', (event) => {
            if (!projet.contains(event.target) && !navProjet.contains(event.target)) {
                navProjet.classList.remove('active');
                dropdownArrow.classList.remove('active');
            }
            if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
                navMenu.classList.remove('show-menu');
            }
        });

        // Ouvrir le dropdown "projet" si l'utilisateur passe dessus
        projet.addEventListener('mouseover', () => {
            navProjet.classList.add('active');
            dropdownArrow.classList.add('active');
        });

        // Effet sticky sur le scroll
        window.addEventListener("scroll", function(){
            var header = document.querySelector("header");
            header.classList.toggle("sticky", window.scrollY > 0);
        });
    }
});