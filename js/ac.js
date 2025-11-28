

  
  const phrases = ["Développeur en BTS SIO", "Educateur de football",];
  let i = 0;
  let j = 0;
  let currentPhrase = [];
  let isDeleting = false;
  const typingElement = document.getElementById("typing-text");

  function loopTyping() {
      typingElement.innerHTML = currentPhrase.join(""); 
      if (i < phrases.length) {
          if (!isDeleting && j <= phrases[i].length) {
              currentPhrase.push(phrases[i][j]);
              j++;
              typingElement.innerHTML = currentPhrase.join("");
          }

          if (isDeleting && j >= 0) {
              currentPhrase.pop();
              j--;
              typingElement.innerHTML = currentPhrase.join("");
          }

          if (j === phrases[i].length) {
              isDeleting = true;
              setTimeout(loopTyping, 3000); // Temps d'affichage avant suppression
              return;
          }

          if (j === 0 && isDeleting) {
              isDeleting = false;
              i++;
              if (i === phrases.length) i = 0;
          }
      }
      setTimeout(loopTyping, isDeleting ? 50 : 100); // Vitesse de frappe et d'effacement
  }

  loopTyping();

  const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
          if (entry.isIntersecting) {
              entry.target.classList.add('show');
          } else {
              entry.target.classList.remove('show');
          }
      });
  });

  const video = document.getElementById("videoprojet");

  // Lecture en passant la souris
  video.addEventListener("mouseenter", () => {
      video.play();
  });

  // Pause et reset quand la souris quitte
  video.addEventListener("mouseleave", () => {
    if (!video.classList.contains("fullscreen")) {
        video.pause(); // **Pause uniquement si en mode normal**
        video.currentTime = 0; // **Réinitialisation**
    }
});


  // Agrandir et jouer toute la vidéo au clic
  video.addEventListener("click", () => {
      if (!video.classList.contains("fullscreen")) {
          video.classList.add("fullscreen"); // Ajoute la classe fullscreen
          video.muted = false; // Active le son
          video.play(); // Démarre la vidéo
      }
  });

  // Quand la vidéo se termine, elle revient à sa taille normale
  video.addEventListener("ended", () => {
      video.classList.remove("fullscreen");
      video.muted = true; // Remettre en sourdine
  });
  // quand on clic n'imoprte ou sur la page même sur la video 
  document.addEventListener("click", (event) => {
      if (!video.contains(event.target)) {
          video.classList.remove("fullscreen");
          video.muted = true; // Remettre en sourdine
          video.pause();
          video.currentTime = 0;
      }
  }); 
 
  document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // Animation de l'accueil
    gsap.from(".home-content", {
        opacity: 0,
        y: 50,
        scale: 0.9,
        duration: 8,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".home",
            start: "top 80%",
            toggleActions: "play none none reverse",
        }
    });

    gsap.from(".home-img img", {
        opacity: 0,
        x: 100,
        duration: 8,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".home",
            start: "top 70%",
            toggleActions: "play none none reverse",
        }
    });

    // Animation de la section vidéo
    gsap.from(".video .text", {
        opacity: 0,
        y: 50,
        duration: 4,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".video",
            start: "top 85%",
            toggleActions: "play none none reverse",
        }
    });

    gsap.from(".video video", {
        opacity: 0,
        scale: 0.8,
        duration: 4,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".video",
            start: "top 75%",
            toggleActions: "play none none reverse",
        }
    });

    // Animation de la section contact
    gsap.from(".contact form", {
        opacity: 0,
        y: 50,
        duration: 5,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".contact",
            start: "top 85%",
            toggleActions: "play none none reverse",
        }
    });

    gsap.from(".contact h2", {
        opacity: 0,
        x: -50,
        duration: 5,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".contact",
            start: "top 90%",
            toggleActions: "play none none reverse",
        }
    });
});
