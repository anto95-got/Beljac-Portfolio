document.addEventListener("DOMContentLoaded", function () {
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
            initNavbar(); // Initialiser les événements après l'insertion du HTML
        });
    });