let nextDom = document.getElementById('next')
let prevDom = document.getElementById('prev')
let carouselDom = document.querySelector('.carousel')
let listItemDom = document.querySelector('.carousel .list')
let thumbnailBorderDom = document.querySelector('.carousel .thumbnail')

nextDom.onclick = function () {
    showSlider('next')
}
prevDom.onclick = function () {
    showSlider('prev')
}
let timeRunning = 3000;
let runTimeOut;
let TimeAutoNext = 7000;
let runAutoRun = setTimeout(() => {
    nextDom.click()
}, TimeAutoNext)

function showSlider(type) {
    let itemSlider = document.querySelectorAll('.carousel .list .item')
    let itemThumbnail = document.querySelectorAll('.carousel .thumbnail .item')

    if (type === 'next') {
        listItemDom.appendChild(itemSlider[0])
        thumbnailBorderDom.appendChild(itemThumbnail[0])
        carouselDom.classList.add('next')
    } else {
        let positionLastItem = itemSlider.length - 1
        listItemDom.prepend(itemSlider[positionLastItem])
        thumbnailBorderDom.prepend(itemThumbnail[positionLastItem])
        carouselDom.classList.add('prev')
    }

   
    clearTimeout(runTimeOut);
    runTimeOut = setTimeout(() => {
        carouselDom.classList.remove('next')
        carouselDom.classList.remove('prev')
    }, timeRunning)

    clearTimeout(runAutoRun);
    
}


const videos = document.querySelectorAll(".videoprojet"); // Sélectionne toutes les vidéos

videos.forEach((video) => {
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
    video.addEventListener("click", (event) => {
        event.stopPropagation(); // **Empêche la fermeture immédiate**
        if (!video.classList.contains("fullscreen")) {
            videos.forEach(v => v.classList.remove("fullscreen")); // Ferme les autres vidéos
            video.classList.add("fullscreen"); // Active le mode fullscreen
            video.muted = false; // Active le son
            video.play(); // Démarre la vidéo
        }
    });

    // Quand la vidéo se termine, elle revient à sa taille normale
    video.addEventListener("ended", () => {
        video.classList.remove("fullscreen");
        video.muted = true; // Remet en sourdine
    });
});

// Ferme la vidéo si on clique en dehors
document.addEventListener("click", (event) => {
    videos.forEach(video => {
        if (!video.contains(event.target)) {
            video.classList.remove("fullscreen");
            video.muted = true; // Remet en sourdine
            video.pause();
            video.currentTime = 0;
        }
    });
});

function rediriger(){
    window.location.href = "acceuil.html#contact"; // Remplacez par l'URL de votre choix

}
function voir1(){
    location.href = "#coach"; // Remplacez par l'URL de votre choix

}

function voir2(){
    location.href = "#foot"; // Remplacez par l'URL de votre choix

}

function voir3(){
    location.href = "#ajf"; // Remplacez par l'URL de votre choix

}