// listes des emojis utilisés
// ❓📍😞💡🤔🤷

// listes des sites
let sites = [];
// variables for charts
let windDirectionChart = null;
let windGustsChart = null;
//  const for display
const WIND_DIRECTIONS = {
    180: 'S',
    202.5: 'SSO',
    225: 'SO',
    247.5: 'OSO',
    270: 'O',
    292.5: 'ONO',
    315: 'NO',
    337.5: 'NNO',
    0: 'N',
    22.5: 'NNE',
    45: 'NE',
    67.5: 'ENE',
    90: 'E',
    112.5: 'ESE',
    135: 'SE',
    157.5: 'SSE'
};

// Déterminer l'icône en fonction du code météo
const weatherIcons = {
    0: '☀️', // Ensoleillé
    1: '🌤️', // Principalement ensoleillé
    2: '⛅', // Partiellement nuageux
    3: '☁️', // Nuageux
    45: '🌫️', // Brouillard
    48: '🌫️', // Brouillard givrant
    51: '🌦️', // Bruine légère
    53: '🌧️', // Bruine modérée
    55: '🌧️', // Bruine dense
    61: '🌦️', // Pluie légère
    63: '🌧️', // Pluie modérée
    65: '🌧️', // Pluie forte
    71: '❄️', // Neige légère
    73: '❄️', // Neige modérée
    75: '❄️', // Neige forte
    95: '⛈️', // Orage
    96: '⛈️', // Orage avec grêle légère
    99: '⛈️'  // Orage avec grêle forte
};

/** GEOLOCALISATION */

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function findNearbySites(latitude, longitude, maxDistance = 30) {
    return sites.filter(site => {
        const distance = calculateDistance(latitude, longitude, site.latitude, site.longitude);
        return distance <= maxDistance;
    });
}

document.getElementById('geoLocateButton').addEventListener('click', async () => {
    document.getElementById('cityInput').value = '';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {
                // Récupérer la ville géolocalisée avec Nominatim
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();

                const cityName = data.address.city || data.address.town || data.address.village;

                if (!cityName) {
                    document.getElementById('geoMessage').textContent = "😞 Nous n'avons pas pu vous localiser.";
                    return;
                }

                // Afficher le message de la ville géolocalisée
                document.getElementById('geoMessage').textContent = `📍 Vous êtes environ à ${cityName}.`;

                // Trouver les sites proches
                const nearbySites = findNearbySites(latitude, longitude);

                const bestSiteInfo = document.getElementById('bestSiteInfo');
                if (nearbySites.length > 0) {
                    bestSiteInfo.innerHTML = "🤔 Recherche du meilleur site en cours...";
                    const results = await fetchWeatherForAllSites(nearbySites);
                    const bestSite = findBestSite(results);

                    if (bestSite) {
                        bestSiteInfo.innerHTML = `💡 Le meilleur site pour les 2 prochains jours est : <strong>${bestSite.site}</strong> (${bestSite.commune}) avec <strong>${bestSite.favorablePeriods}</strong> périodes favorables.`;
                        bestSiteInfo.setAttribute('data-site', bestSite.site);
                        bestSiteInfo.style.cursor = 'pointer';
                    } else {
                        bestSiteInfo.innerHTML = "😞 Aucun site favorable trouvé pour les 2 prochains jours, à moins de 30km.";
                        bestSiteInfo.removeAttribute('data-site');
                        bestSiteInfo.style.cursor = 'default';
                    }
                } else {
                    bestSiteInfo.innerHTML = "😞 Aucun site de décollage trouvé à moins de 30 km.";
                }
            } catch (error) {
                document.getElementById('geoMessage').textContent = 'Erreur lors de la géolocalisation : ' + error.message;
            }
        }, (error) => {
            document.getElementById('geoMessage').textContent = 'Impossible de récupérer votre position. Veuillez vérifier vos paramètres de localisation.';
        });
    } else {
        document.getElementById('geoMessage').textContent = 'La géolocalisation n\'est pas prise en charge par votre navigateur.';
    }
    loadSites();
});

document.getElementById('cityInput').addEventListener('focus', () => {
    document.getElementById('geoMessage').textContent = '';
});

document.getElementById('searchCityButton').addEventListener('click', async () => {
    document.getElementById('geoMessage').textContent = '';
    const cityInput = document.getElementById('cityInput').value.trim();

    if (!cityInput) {
        document.getElementById('geoMessage').textContent = "😞 On ne connait pas cette ville";
        return;
    }

    try {
        const coordinates = await getCoordinates(cityInput);
        const nearbySites = findNearbySites(coordinates.latitude, coordinates.longitude);

        const bestSiteInfo = document.getElementById('bestSiteInfo');
        if (nearbySites.length > 0) {
            bestSiteInfo.innerHTML = "🤔 Recherche du meilleur site en cours...";
            const results = await fetchWeatherForAllSites(nearbySites);
            const bestSite = findBestSite(results);

            if (bestSite) {
                bestSiteInfo.innerHTML = `💡 Le meilleur site pour les 2 prochains jours est : <strong>${bestSite.site}</strong> (${bestSite.commune}) avec <strong>${bestSite.favorablePeriods}</strong> périodes favorables.`;
                bestSiteInfo.setAttribute('data-site', bestSite.site);
                bestSiteInfo.style.cursor = 'pointer';
            } else {
                bestSiteInfo.innerHTML = "😞 Aucun site favorable trouvé pour les 2 prochains jours, à moins de 30km.";
                bestSiteInfo.removeAttribute('data-site');
                bestSiteInfo.style.cursor = 'default';
            }
            loadSites();
        } else {
            bestSiteInfo.innerHTML = "😞 Aucun site de décollage trouvé à proximité.";
        }
    } catch (error) {
        document.getElementById('geoMessage').textContent = "❓ On ne connait pas cette ville, vérifiez l'orthographe de la ville 🤷";
    }
});

async function fetchWeatherForAllSites(sitesToCheck) {
    const results = [];

    for (const site of sitesToCheck) {
        try {
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&hourly=windspeed_10m,winddirection_10m,windgusts_10m&current_weather=true&windspeed_unit=kmh&timezone=auto&forecast_days=2`
            );
            const weatherData = await weatherResponse.json();

            // Analyser les données météo pour les 2 prochains jours
            const hourlyDates = weatherData.hourly.time.slice(0, 48); // 2 jours * 24 heures
            const hourlyWindSpeeds = weatherData.hourly.windspeed_10m.slice(0, 48);
            const hourlyWindDirections = weatherData.hourly.winddirection_10m.slice(0, 48);
            const hourlyWindGusts = weatherData.hourly.windgusts_10m.slice(0, 48);
            // Format dates
            const formattedDates = hourlyDates.map(date => new Date(date).toLocaleString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                hour: '2-digit'
            }));

            // Calculer les périodes favorables pour ce site
            let favorablePeriods = 0;
            const orientationDegrees = Object.keys(WIND_DIRECTIONS).find(
                key => WIND_DIRECTIONS[key] === site.orientation
            );

            const orientationRange = {
                min: (orientationDegrees - 45 + 360) % 360, // 45° avant
                max: (parseFloat(orientationDegrees) + 45) % 360 // 45° après
            };

            for (let i = 0; i < hourlyDates.length; i++) {
                const speed = hourlyWindSpeeds[i];
                const gust = hourlyWindGusts[i];
                const direction = hourlyWindDirections[i];

                // Extract the hour from the date
                const rawDate = formattedDates[i];
                const hour = rawDate.split(' ')[2].replace('h', '').trim();
                // console.log(hourlyDates[i]);
                // const hour = rawDate.split(' ')[2].replace('h', '').trim();

                // Vérifier si la direction est dans la plage acceptable
                const isDirectionValid =
                    (orientationRange.min <= orientationRange.max && direction >= orientationRange.min && direction <= orientationRange.max) ||
                    (orientationRange.min > orientationRange.max && (direction >= orientationRange.min || direction <= orientationRange.max));

                if (speed < 15 && gust < 25 && isDirectionValid && hour >= 10 && hour <= 19) {
                    favorablePeriods++;
                }
            }

            // Ajouter les résultats pour ce site
            results.push({
                site: site.nom,
                commune: site.commune,
                favorablePeriods
            });
        } catch (error) {
            console.error(`Erreur lors de la récupération des données pour le site ${site.nom}:`, error);
        }
    }

    return results;
}

function findBestSite(results) {
    // Trier les sites par nombre de périodes favorables (ordre décroissant)
    results.sort((a, b) => b.favorablePeriods - a.favorablePeriods);

    // Retourner le site avec le plus de périodes favorables
    return results[0];
}

document.getElementById('bestSiteInfo').addEventListener('click', function () {
    const siteName = this.getAttribute('data-site'); // Récupérer le nom du site depuis l'attribut
    if (siteName) {
        const cityDropdown = document.getElementById('cityDropdown');
        cityDropdown.value = siteName; // Sélectionner le site dans le menu déroulant
        fetchWeather(); // Appeler la fonction pour rechercher la météo
    }
});

async function getCoordinates(city) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            document.getElementById('geoMessage').textContent = "❓ Nous ne connaissons pas cette ville.";
            return;
        }
        else {
            // console.log(data.results[0]);
            document.getElementById('geoMessage').textContent = `📍 ${data.results[0].name}, ${data.results[0].postcodes[0]}.`;
        }

        return {
            latitude: data.results[0].latitude,
            longitude: data.results[0].longitude,
            name: data.results[0].name
        };
    } catch (error) {
        document.getElementById('geoMessage').textContent = "😲 Oups, une erreur est survenue";
    }
}

/** INITIALISATION */
// Charger les villes au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    await loadSites();
    // loadCities();
});

async function loadCities() {
    try {
        const response = await fetch('data/data.json');
        const sites = await response.json();

        // Remplir le menu déroulant
        const cityDropdown = document.getElementById('cityDropdown');
        sites.forEach(site => {
            const option = document.createElement('option');
            option.value = site.nom;
            option.textContent = site.nom;
            cityDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}

function updateCityDropdown() {
    const cityDropdown = document.getElementById('cityDropdown');
    cityDropdown.innerHTML = ''; // Réinitialiser le menu déroulant

    sites.forEach(site => {
        const option = document.createElement('option');
        option.value = site.nom;
        option.textContent = site.nom;
        cityDropdown.appendChild(option);
    });

    // console.log('Menu déroulant mis à jour avec les sites triés.');
}

async function loadSites() {
    try {
        const response = await fetch('data/data.json');
        const allSites = await response.json();

        const cityInput = document.getElementById('cityInput').value.trim();
        if (cityInput) {
            filterSitesByCity(allSites, cityInput);
        }
        else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLatitude = position.coords.latitude;
                const userLongitude = position.coords.longitude;

                // Trier les sites par distance
                sites = allSites.sort((a, b) => {
                    const distanceA = calculateDistance(userLatitude, userLongitude, a.latitude, a.longitude);
                    const distanceB = calculateDistance(userLatitude, userLongitude, b.latitude, b.longitude);
                    return distanceA - distanceB;
                });

                // console.log('Sites triés par distance (géolocalisation) :', sites);
                updateCityDropdown(); // Mettre à jour le menu déroulant
            }, (error) => {
                console.warn('Géolocalisation désactivée ou refusée.');
                if (cityInput) {
                    filterSitesByCity(allSites, cityInput);
                } else {
                    sites = allSites;
                    updateCityDropdown(); // Mettre à jour le menu déroulant
                }
            });
        } else {
            console.warn('Géolocalisation non supportée et aucune ville saisie.');
            sites = allSites;
            updateCityDropdown(); // Mettre à jour le menu déroulant
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données :', error);
    }
}

// Fonction pour filtrer les sites en fonction d'une ville saisie
async function filterSitesByCity(allSites, cityInput) {
    try {
        const coordinates = await getCoordinates(cityInput);

        if (coordinates) {
            const { latitude, longitude } = coordinates;

            // Trier les sites par distance à partir des coordonnées de la ville
            sites = allSites.sort((a, b) => {
                const distanceA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
                const distanceB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
                return distanceA - distanceB;
            });

            // console.log(`Sites triés par distance (ville : ${cityInput}) :`, sites);
        } else {
            console.warn(`Ville inconnue : ${cityInput}. Chargement de tous les sites.`);
            sites = allSites;
        }

        updateCityDropdown(); // Mettre à jour le menu déroulant
    } catch (error) {
        console.error('Erreur lors de la récupération des coordonnées de la ville :', error);
        sites = allSites;
        updateCityDropdown(); // Mettre à jour le menu déroulant
    }
}

async function fetchWeather() {
    const cityDropdown = document.getElementById('cityDropdown').value;
    const weatherInfo = document.getElementById('weatherInfo');
    const errorMessage = document.getElementById('errorMessage');
    const geoMessage = document.getElementById('geoMessage');

    // Reset previous state
    weatherInfo.classList.add('hidden');
    errorMessage.classList.add('hidden');
    geoMessage.classList.add('hidden');
    errorMessage.textContent = '';

    if (!cityDropdown) {
        errorMessage.textContent = 'Veuillez entrer un nom de ville';
        errorMessage.classList.remove('hidden');
        return;
    }

    try {
        // Charger les données du fichier JSON
        const site = sites.find(site => site.nom === cityDropdown);

        if (!site) {
            throw new Error('Données du site introuvables');
        }

        // Fetch weather data
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&hourly=windspeed_10m,winddirection_10m,windgusts_10m&current_weather=true&windspeed_unit=kmh&timezone=auto&forecast_days=10`
        );
        const weatherData = await weatherResponse.json();

        // Update current weather UI
        document.getElementById('cityName').textContent = site.commune;

        // Ajouter les informations supplémentaires
        const additionalInfo = document.getElementById('additionalInfo');
        additionalInfo.innerHTML = `
            <div class="bg-gray-100 p-2 md:p-4 rounded-lg text-left text-xs md:text-sm">
                ${site.description ? `<p><strong>Description :</strong> ${site.description}</p>` : ''}
                ${site.orientation ? `<p><strong>Orientation :</strong> ${site.orientation}</p>` : ''}
                ${site.observations ? `<p><strong>Observations :</strong> ${site.observations}</p>` : ''}
                <p><strong>Voir plus :</strong> <a href="https://meteo-parapente.com/#/${site.latitude},${site.longitude},12" target="_blank" class="text-blue-500 underline">Météo détaillée par meteo-parapente</a></p>
                ${site.balise ? `<p><strong>Balises disponibles :</strong></p>
                    <ul>
                        ${Array.isArray(site.balise) ? site.balise.map(b => `<li><a href="${b}" target="_blank" class="text-blue-500 underline">${b}</a></li>`).join('') : `<li><a href="${site.balise}" target="_blank" class="text-blue-500 underline">${site.balise}</a></li>`}
                    </ul>` : ''}
            </div>
        `;

        document.getElementById('temperature').textContent = `${Math.round(weatherData.current_weather.temperature)}°C`;

        // Ajouter une icône météo
        const weatherIcon = document.getElementById('weatherIcon');
        const weatherCode = weatherData.current_weather.weathercode;

        weatherIcon.textContent = weatherIcons[weatherCode] || '❓'; // Afficher une icône par défaut si le code n'est pas trouvé

        const currentWindSpeed = weatherData.current_weather.windspeed;
        const currentWindDirection = weatherData.current_weather.winddirection;

        document.getElementById('windSpeed').textContent = `${currentWindSpeed.toFixed(1)} km/h`;
        document.getElementById('windDirection').textContent = getWindDirectionText(currentWindDirection);

        // Get current hour index and show current wind gust
        const currentTime = new Date();
        const currentHourIndex = weatherData.hourly.time.findIndex(time =>
            new Date(time).getHours() === currentTime.getHours() &&
            new Date(time).getDate() === currentTime.getDate()
        );

        const currentWindGust = currentHourIndex !== -1 ?
            weatherData.hourly.windgusts_10m[currentHourIndex] :
            "N/A";

        document.getElementById('windGusts').textContent = `${typeof currentWindGust === 'number' ? currentWindGust.toFixed(1) : currentWindGust} km/h`;

        // Prepare data for charts
        const hourlyDates = weatherData.hourly.time.slice(0, 240); // 10 days * 24 hours
        const hourlyWindSpeeds = weatherData.hourly.windspeed_10m.slice(0, 240);
        const hourlyWindDirections = weatherData.hourly.winddirection_10m.slice(0, 240);
        const hourlyWindGusts = weatherData.hourly.windgusts_10m.slice(0, 240);

        // Format dates
        const formattedDates = hourlyDates.map(date => new Date(date).toLocaleString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            hour: '2-digit'
        }));

        // Create charts - removed the first chart and kept only gusts chart and direction chart
        createWindGustsChart(formattedDates, hourlyWindSpeeds, hourlyWindGusts);
        createWindDirectionChart(formattedDates, hourlyWindDirections);
        listLowWindPeriods(formattedDates, hourlyWindSpeeds, hourlyWindDirections, hourlyWindGusts, site.orientation);

        // Show weather info
        weatherInfo.classList.remove('hidden');

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
    }
}



// Weather data functions

function getWindDirectionText(degrees) {
    // Find the closest direction
    const closestDegree = Object.keys(WIND_DIRECTIONS)
        .map(Number)
        .reduce((prev, curr) =>
            (Math.abs(curr - degrees) < Math.abs(prev - degrees) ? curr : prev)
        );
    return WIND_DIRECTIONS[closestDegree];
}

function createWindDirectionChart(dates, windDirections) {
    const ctx = document.getElementById('windDirectionChart').getContext('2d');

    // Destroy previous chart if exists
    if (windDirectionChart) {
        windDirectionChart.destroy();
    }

    // Convert degrees to direction text
    const windDirectionTexts = windDirections.map(getWindDirectionText);

    windDirectionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Direction du Vent',
                data: windDirections,
                borderColor: 'green',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Direction du Vent'
                    },
                    ticks: {
                        stepSize: 45,
                        suggestedMin: 0,
                        suggestedMax: 360,
                        callback: function (value) {
                            return getWindDirectionText(value);
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 20
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return getWindDirectionText(context.parsed.y);
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function createWindGustsChart(dates, windSpeeds, windGusts) {
    const ctx = document.getElementById('windGustsChart').getContext('2d');

    // Destroy previous chart if exists
    if (windGustsChart) {
        windGustsChart.destroy();
    }

    windGustsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Vitesse du Vent (km/h)',
                    data: windSpeeds,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)',
                    borderWidth: 2,
                    tension: 0.2
                },
                {
                    label: 'Rafales de Vent (km/h)',
                    data: windGusts,
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Vitesse du Vent et Rafales'
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Vitesse (km/h)'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 20
                    }
                }
            },
            plugins: [{
                id: 'afterDraw',
                afterDraw: (chart) => {
                    const { ctx, chartArea } = chart;
                    // Zone pour vitesse du vent < 20 km/h
                    ctx.save();
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                    ctx.fillRect(
                        chartArea.left,
                        chartArea.bottom - (20 * chart.scales.y.height / chart.scales.y.max),
                        chartArea.width,
                        (20 * chart.scales.y.height / chart.scales.y.max)
                    );
                    // Zone pour rafales de vent < 30 km/h
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
                    ctx.fillRect(
                        chartArea.left,
                        chartArea.bottom - (30 * chart.scales.y.height / chart.scales.y.max),
                        chartArea.width,
                        (10 * chart.scales.y.height / chart.scales.y.max)
                    );
                    ctx.restore();
                }
            }]
        }
    });
}

function listLowWindPeriods(dates, windSpeeds, windDirections, windGusts, siteOrientation) {
    // Supprimer l'ancienne fenêtre si elle existe
    const existingResultsContainer = document.getElementById('lowWindPeriods');
    if (existingResultsContainer) {
        existingResultsContainer.remove();
    }

    // Créer un nouveau conteneur pour les résultats
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'lowWindPeriods'; // Ajoutez un ID unique pour identifier ce conteneur
    resultsContainer.classList.add('mt-4', 'md:mt-6', 'p-3', 'md:p-4', 'bg-blue-50', 'rounded-lg', 'shadow-md', 'text-sm', 'md:text-base');

    const title = document.createElement('h4');
    title.textContent = `Périodes favorables: vent < 15 km/h, rafales < 25 km/h, direction proche de ${siteOrientation}`;
    title.classList.add('text-base', 'md:text-lg', 'font-semibold', 'mb-2', 'md:mb-4');
    resultsContainer.appendChild(title);

    const list = document.createElement('ul');
    list.classList.add('list-disc', 'pl-4', 'md:pl-6', 'max-h-40', 'md:max-h-60', 'overflow-y-auto');

    const favorableDays = {}; // Stocker les périodes favorables par jour

    // Convertir l'orientation du site en degrés
    const orientationDegrees = Object.keys(WIND_DIRECTIONS).find(
        key => WIND_DIRECTIONS[key] === siteOrientation
    );

    if (!orientationDegrees) {
        console.error(`Orientation inconnue : ${siteOrientation}`);
        return;
    }

    const orientationRange = {
        min: (orientationDegrees - 45 + 360) % 360, // 45° avant
        max: (parseFloat(orientationDegrees) + 45) % 360 // 45° après
    };

    for (let i = 0; i < dates.length; i++) {
        const speed = windSpeeds[i];
        const direction = windDirections[i];
        const gust = windGusts[i];
        const directionText = getWindDirectionText(direction);

        // Vérifier si la direction est dans la plage acceptable
        const isDirectionValid =
            (orientationRange.min <= orientationRange.max && direction >= orientationRange.min && direction <= orientationRange.max) ||
            (orientationRange.min > orientationRange.max && (direction >= orientationRange.min || direction <= orientationRange.max));


        // Extract the hour from the date
        const rawDate = dates[i];
        const hour = rawDate.split(' ')[2].replace('h', '').trim();

        // Check if wind speed is < 20, gusts < 30 and direction is between NNO and E
        if (speed < 15 && gust < 25 && isDirectionValid && hour >= 10 && hour <= 19) {
            // console.log(`Valid: ${hour} - ${speed} km/h - Rafales: ${gust} km/h - ${directionText}`);
            const listItem = document.createElement('li');
            listItem.textContent = `${dates[i]} - ${speed.toFixed(1)} km/h - Rafales: ${gust.toFixed(1)} km/h - ${directionText}`;
            list.appendChild(listItem);

            // Extraire le jour de la date
            const day = dates[i].split(' ')[0] + ' ' + dates[i].split(' ')[1];
            if (!favorableDays[day]) {
                favorableDays[day] = 0;
            }
            favorableDays[day]++;
        }
    }

    resultsContainer.appendChild(list);

    // Append the results to the weather info section
    document.getElementById('weatherInfo').appendChild(resultsContainer);

    const additionalInfo = document.getElementById('additionalInfo');
    // Insérer les résultats juste après le conteneur "additionalInfo"
    // additionalInfo.parentNode.insertBefore(resultsContainer, additionalInfo.nextSibling);

    // Identifier les meilleurs jours
    const bestDays = Object.keys(favorableDays).filter(day => favorableDays[day] >= 4);

    // Ajouter les meilleurs jours dans "additionalInfo"
    if (bestDays.length > 0) {
        const bestDaysText = document.createElement('p');
        bestDaysText.classList.add('mt-3', 'md:mt-4', 'text-green-600', 'font-semibold', 'text-sm', 'md:text-base');
        bestDaysText.textContent = `Les meilleurs jours sont : ${bestDays.join(', ')} ⭐`;
        additionalInfo.appendChild(bestDaysText);
    }

}



window.addEventListener('resize', function () {
    if (windGustsChart) {
        windGustsChart.resize();
    }
    if (windDirectionChart) {
        windDirectionChart.resize();
    }
});
