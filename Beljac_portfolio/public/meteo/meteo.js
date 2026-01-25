const container = document.querySelector('.container');
const search = document.querySelector('.search-box button');
const weatherBox = document.querySelector('.weather-box');
const weatherDetails = document.querySelector('.weather-details');
const error404 = document.querySelector('.not-found');

search.addEventListener('click', () => {
    const APIKey = '437e71e05bf76d394418b68153fb2e7b'; 
    const city = document.querySelector('.search-box input').value;

    if (city === '')
        return;

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${APIKey}`)
        .then(response => response.json())
        .then(json => {

            if (json.cod === '404') {
                container.style.height = '400px';
                weatherBox.style.display = 'none';
                weatherDetails.style.display = 'none';
                error404.style.display = 'block';
                error404.classList.add('fadeIn');
                return;
            }

            error404.style.display = 'none';
            error404.classList.remove('fadeIn');

            const image = document.querySelector('.weather-box img');
            const temperature = document.querySelector('.weather-box .temperature');
            const description = document.querySelector('.weather-box .description');
            const humidity = document.querySelector('.weather-details .humidity span');
            const wind = document.querySelector('.weather-details .wind span');
            
            // Ajout du nom de la ville dans la div weather-details
            let cityName = document.querySelector('.weather-details .city-name');
            if (!cityName) {
                cityName = document.createElement('div');
                cityName.classList.add('city-name');
                weatherDetails.insertBefore(cityName, weatherDetails.firstChild);
            }
            cityName.textContent = `City: ${json.name}`;

            switch (json.weather[0].main) {
                case 'Clear':
                    image.src = 'meteo/clear.png';
                    break;

                case 'Rain':
                    image.src = 'meteo/rain.png';
                    break;

                case 'Snow':
                    image.src = 'meteo/snow.png';
                    break;

                case 'Clouds':
                    image.src = 'meteo/cloud.png';
                    break;

                case 'Haze':
                    image.src = 'meteo/mist.png';
                    break;

                default:
                    image.src = '';
            }

            temperature.innerHTML = `${parseInt(json.main.temp)}<span>°C</span>`;
            description.innerHTML = `${json.weather[0].description}`;
            humidity.innerHTML = `${json.main.humidity}%`;
            wind.innerHTML = `${parseInt(json.wind.speed)}Km/h`;

            weatherBox.style.display = '';
            weatherDetails.style.display = '';
            weatherBox.classList.add('fadeIn');
            weatherDetails.classList.add('fadeIn');
            container.style.height = '590px';
        });
});

function start(){
    location.href = "#met"; // Remplacez par l'URL de votre choix

}



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

