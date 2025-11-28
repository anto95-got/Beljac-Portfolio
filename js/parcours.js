document.addEventListener("DOMContentLoaded", () => {
    initCVAnimation();
    initCardAnimations();
    initCardHoverEffect();
});

/* 🎬 Animation du CV */
function initCVAnimation() {
    const cv = document.getElementById("cv-image");
    if (!cv) return; // Vérifie que l'élément existe

    cv.addEventListener("click", () => {
        cv.classList.add("fullscreen"); 
    });

    document.addEventListener("click", (event) => {
        if (!cv.contains(event.target)) {
            cv.classList.remove("fullscreen");
        }
    });
}

function initCardAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.from(".card", {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".Langague",  // La section qui contient les cartes
            start: "top 80%", // Débute quand 80% de la section est visible
            toggleActions: "play none none none" // Joue une seule fois
        }
    });
}

/* 🎨 Effet 3D au survol des cartes */
const  card = document.querySelectorAll(".card");

card.forEach(el => {
    el.addEventListener('mousemove', e => {

        let elRect = el.getBoundingClientRect()

        let x = e.clientX - elRect.x
        let y = e.clientY - elRect.y

        let midCardWidth = elRect.width / 2
        let midCardHeight = elRect.height / 2

        let angleY = (x - midCardWidth) / 1
        let angleX = (y - midCardHeight) / 1

        el.children[0].style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.1)`
    })

    el.addEventListener('mouseleave', () => {
        el.children[0].style.transform = "rotateX(0) rotateY(0)"
 
    })
})

