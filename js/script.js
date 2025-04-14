// listes des emojis utilisés
// ❓📍😞💡🤔🤷

// listes des sites
let sites = [];
// variables for charts
let windDirectionChart = null;
let windGustsChart = null;
// variables for forecast period
let isForecastPeriodChange = false;
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

const geoLocateButton = document.getElementById('geoLocateButton');
if (geoLocateButton) {
    geoLocateButton.addEventListener('click', async () => {
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
                    displayBestSites(0, nearbySites);
                } catch (error) {
                    document.getElementById('geoMessage').textContent = 'Erreur lors de la géolocalisation : ' + error.message;
                }
            }, (error) => {
                document.getElementById('geoMessage').textContent = 'Impossible de récupérer votre position. Veuillez vérifier vos paramètres de localisation.';
            });
        } else {
            document.getElementById('geoMessage').textContent = 'La géolocalisation n\'est pas prise en charge par votre navigateur.';
        }
        updateDynamicMessagesVisibility();
    });
}

const cityInputButton = document.getElementById('cityInput');
if (cityInputButton) {
    cityInputButton.addEventListener('click', async () => {
        document.getElementById('geoMessage').textContent = '';
    });
}

const searchCityButton = document.getElementById('searchCityButton');
if (searchCityButton) {
    searchCityButton.addEventListener('click', async () => {
        document.getElementById('geoMessage').textContent = ' ';
        updateDynamicMessagesVisibility();
        const cityInput = document.getElementById('cityInput').value.trim();

        if (!cityInput) {
            document.getElementById('geoMessage').textContent = "😞 On ne connait pas cette ville";
            return;
        }

        displayBestSites(cityInput, 0)
    });
}

/** AFFICAHGE MEILLEUR SPOT */

async function displayBestSites(city, nearbySites) {
    try {
        if (city) {
            const coordinates = await getCoordinates(city);

            nearbySites = findNearbySites(coordinates.latitude, coordinates.longitude);
            console.log(city);
        }

        const bestSiteInfo1 = document.getElementById('bestSiteInfoToday');
        const bestSiteInfo2 = document.getElementById('bestSiteInfoTomorrow');
        if (nearbySites.length > 0) {
            bestSiteInfo1.innerHTML = "🤔 Recherche du meilleur site en cours...";
            updateDynamicMessagesVisibility();
            const results1 = await fetchWeatherForAllSites(nearbySites, 1);
            const bestSite1 = findBestSite(results1);
            console.log(bestSite1)
            const results2 = await fetchWeatherForAllSites(nearbySites, 2);
            const bestSite2 = findBestSite(results2);
            console.log(bestSite2)
            if (bestSite1) {
                bestSiteInfo1.innerHTML = `💡 Le meilleur site pour aujourd'hui est : <strong>${bestSite1.site}</strong> (${bestSite1.commune}) avec <strong>${bestSite1.favorablePeriods}</strong> périodes favorables.`;
                bestSiteInfo1.setAttribute('data-site1', bestSite1.site);
                console.log(bestSiteInfo1.getAttribute('data-site1'));
                bestSiteInfo1.style.cursor = 'pointer';
            }
            else {
                bestSiteInfo1.innerHTML = "😞 Aucun site favorable trouvé pour aujourd'hui, à moins de 30km.";
                bestSiteInfo1.removeAttribute('data-site1');
                bestSiteInfo1.style.cursor = 'default';
            }


            if (bestSite2) {
                bestSiteInfo2.innerHTML = `💡 Le meilleur site pour demain est : <strong>${bestSite2.site}</strong> (${bestSite2.commune}) avec <strong>${bestSite2.favorablePeriods}</strong> périodes favorables.`;
                bestSiteInfo2.setAttribute('data-site2', bestSite2.site);
                bestSiteInfo2.style.cursor = 'pointer';
            }
            else {
                bestSiteInfo2.innerHTML = "😞 Aucun site favorable trouvé pour demain, à moins de 30km.";
                bestSiteInfo2.removeAttribute('data-site2');
                bestSiteInfo2.style.cursor = 'default';
            }
            loadSites();
        } else {
            bestSiteInfo1.innerHTML = "😞 Aucun site de décollage trouvé à proximité.";
            bestSiteInfo2.innerHTML = "😞 Aucun site de décollage trouvé à proximité.";

        }
    } catch (error) {
        console.log(error);
        document.getElementById('geoMessage').textContent = "❓ On ne connait pas cette ville, vérifiez l'orthographe de la ville 🤷";
    }
    updateDynamicMessagesVisibility();
}

async function fetchWeatherForAllSites(sitesToCheck, day) {
    const results = [];

    for (const site of sitesToCheck) {
        try {
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&hourly=windspeed_10m,winddirection_10m,windgusts_10m&current_weather=true&windspeed_unit=kmh&timezone=auto&forecast_days=2`
            );
            const weatherData = await weatherResponse.json();

            // Analyser les données météo pour les 2 prochains jours
            const hourlyDates = weatherData.hourly.time.slice(day * 24 - 24, day * 24); // 2 jours * 24 heures
            const hourlyWindSpeeds = weatherData.hourly.windspeed_10m.slice(day * 24 - 24, day * 24);
            const hourlyWindDirections = weatherData.hourly.winddirection_10m.slice(day * 24 - 24, day * 24);
            const hourlyWindGusts = weatherData.hourly.windgusts_10m.slice(day * 24 - 24, day * 24);
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

    // Retourner le site avec le plus de périodes favorables seulement si > 0
    if (results[0] && results[0].favorablePeriods > 0) {
        return results[0];
    }
    return null;
}

// document.getElementById('bestSiteInfo').addEventListener('click', function () {
const bestSiteInfoButtton1 = document.getElementById('bestSiteInfoToday');
if (bestSiteInfoButtton1) {
    bestSiteInfoButtton1.addEventListener('click', async () => {
        const siteName = bestSiteInfoButtton1.getAttribute('data-site1'); // Récupérer le nom du site depuis l'attribut
        if (siteName) {
            const cityDropdown = document.getElementById('cityDropdown');
            cityDropdown.value = siteName; // Sélectionner le site dans le menu déroulant
            fetchWeather(); // Appeler la fonction pour rechercher la météo
        }
    });
}
const bestSiteInfoButtton2 = document.getElementById('bestSiteInfoTomorrow');
if (bestSiteInfoButtton2) {
    bestSiteInfoButtton2.addEventListener('click', async () => {
        const siteName = bestSiteInfoButtton2.getAttribute('data-site2'); // Récupérer le nom du site depuis l'attribut
        if (siteName) {
            const cityDropdown = document.getElementById('cityDropdown');
            cityDropdown.value = siteName; // Sélectionner le site dans le menu déroulant
            fetchWeather(); // Appeler la fonction pour rechercher la météo
        }
    });
}

function updateDynamicMessagesVisibility() {
    const dynamicContent = document.getElementById('dynamicContent');
    const geoMessage = document.getElementById('geoMessage');
    const bestSiteInfoToday = document.getElementById('bestSiteInfoToday');
    const bestSiteInfoTomorrow = document.getElementById('bestSiteInfoTomorrow');

    // Vérifie si l'un des éléments contient du texte
    const hasContent = geoMessage.textContent.trim() !== '' ||
        bestSiteInfoToday.textContent.trim() !== '' ||
        bestSiteInfoTomorrow.textContent.trim() !== '';

    // Affiche ou masque le conteneur en fonction de la présence de contenu
    if (hasContent) {
        dynamicContent.classList.remove('hidden');
    } else {
        dynamicContent.classList.add('hidden');
    }
}

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
    updateDynamicMessagesVisibility();
}

/** INITIALISATION */
// Charger les villes au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('cityInput')) {
        await loadSites();

        // Vérifier si un site est spécifié dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const siteFromUrl = urlParams.get('site');

        if (siteFromUrl) {
            console.log(siteFromUrl);
            const cityDropdown = document.getElementById('cityDropdown');
            // Attendre que le menu déroulant soit mis à jour
            setTimeout(() => {
                cityDropdown.value = siteFromUrl;
                console.log("Valeur du menu déroulant:", cityDropdown.value);
                fetchWeather(); // Charger la météo une fois que la valeur est définie
            }, 100);
            console.log(cityDropdown.value);
            fetchWeather(); // Charger automatiquement la météo pour ce site
        }
    } else {
        createMapSites();
    }
});

function createMapSites() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("L'élément avec l'ID 'map' est introuvable.");
        return;
    }

    const map = L.map('map').setView([45.0, 3.0], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // marker de couleur pour la map
    var blueIcon = new L.Icon({
        iconUrl: 'img/marker-icon-2x-blue.png',
        shadowUrl: 'img/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var greenIcon = new L.Icon({
        iconUrl: 'img/marker-icon-2x-green.png',
        shadowUrl: 'img/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    fetch('data/data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(site => {
                // Définir la couleur du marqueur en fonction de la présence d'une balise
                const iconeColor = site.balise && site.balise.length > 0 ? greenIcon : blueIcon;

                // Utiliser un cercle comme marqueur avec la couleur définie
                const marker = L.marker([site.latitude, site.longitude], {
                    icon: iconeColor
                }).addTo(map);

                // Ajouter un popup au marqueur
                marker.bindPopup(`
                    <div class="popup-content">
                        <h3 class="font-bold text-lg mb-2">${site.nom}</h3>
                        <p class="text-sm mb-2">${site.description || ''}</p>
                        <p class="text-sm mb-2">Orientation : ${site.orientation}</p>
                        <a href="index.html?site=${encodeURIComponent(site.nom)}" 
                           class="inline-block bg-yellow-400 text-white px-4 py-2 rounded-lg 
                                  hover:bg-yellow-500 transition-colors text-sm text-center 
                                  no-underline" 
                           onclick="window.location.href='index.html?site=${encodeURIComponent(site.nom)}'; return false;">
                            Voir la météo du site
                        </a>
                    </div>
                `);

                marker.on('click', () => {
                    marker.openPopup();
                });
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données :', error);
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                errorMessage.textContent = "Impossible de charger les données des sites.";
                errorMessage.classList.remove('hidden');
            }
        });
}

// Gestion du menu mobile
const mobileMenu = document.getElementById('mobileMenu');
const hamburgerButton = document.querySelector('.md\\:hidden');
const closeMenuButton = document.getElementById('closeMenu');

if (hamburgerButton && mobileMenu && closeMenuButton) {
    // Ouvrir le menu
    hamburgerButton.addEventListener('click', () => {
        mobileMenu.classList.remove('hidden');
        // Petit délai pour permettre la transition
        setTimeout(() => {
            mobileMenu.classList.remove('translate-x-full');
        }, 10);
    });

    // Fermer le menu
    closeMenuButton.addEventListener('click', () => {
        mobileMenu.classList.add('translate-x-full');
        // Attendre la fin de l'animation avant de cacher
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
        }, 300);
    });
}

// function createMapSites() {
//     // Vérifiez si l'élément avec l'ID 'map' existe
//     const mapElement = document.getElementById('map');
//     if (!mapElement) {
//         console.error("L'élément avec l'ID 'map' est introuvable.");
//         return;
//     }

//     // Initialisation de la carte
//     const map = L.map('map').setView([45.0, 3.0], 8); // Coordonnées centrées sur une région (exemple : Auvergne)

//     // Ajout des tuiles OpenStreetMap
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//     }).addTo(map);

//     // Chargement des données depuis data.json
//     fetch('data/data.json')
//         .then(response => response.json())
//         .then(async data => {
//             for (const site of data) {
//                 try {
//                     // Récupérer les données météo pour le site
//                     const weatherResponse = await fetch(
//                         `https://api.open-meteo.com/v1/forecast?latitude=${site.latitude}&longitude=${site.longitude}&hourly=winddirection_10m&timezone=auto`
//                     );
//                     const weatherData = await weatherResponse.json();

//                     // Extraire les directions du vent pour les 12 prochaines heures
//                     const windDirections = weatherData.hourly.winddirection_10m.slice(0, 12);

//                     // Convertir l'orientation du site en degrés
//                     const orientationDegrees = Object.keys(WIND_DIRECTIONS).find(
//                         key => WIND_DIRECTIONS[key] === site.orientation
//                     );

//                     if (!orientationDegrees) {
//                         console.error(`Orientation inconnue pour le site : ${site.nom}`);
//                         continue;
//                     }

//                     // Définir la plage d'orientation acceptable (±45° autour de l'orientation)
//                     const orientationRange = {
//                         min: (orientationDegrees - 45 + 360) % 360, // 45° avant
//                         max: (parseFloat(orientationDegrees) + 45) % 360 // 45° après
//                     };

//                     // Vérifier si toutes les directions du vent sont alignées avec l'orientation
//                     const isAligned = windDirections.every(direction =>
//                         (orientationRange.min <= orientationRange.max && direction >= orientationRange.min && direction <= orientationRange.max) ||
//                         (orientationRange.min > orientationRange.max && (direction >= orientationRange.min || direction <= orientationRange.max))
//                     );

//                     // Définir la couleur du marqueur (vert si aligné, orange sinon)
//                     const markerColor = isAligned ? 'green' : 'orange';

//                     // Ajouter un marqueur pour le site
//                     L.circleMarker([site.latitude, site.longitude], {
//                         color: markerColor,
//                         radius: 8,
//                         fillOpacity: 0.8
//                     })
//                         .addTo(map)
//                         .bindPopup(`<strong>${site.nom}</strong><br>${site.description || 'Pas de description disponible.'}`);
//                 } catch (error) {
//                     console.error(`Erreur lors de la récupération des données météo pour le site ${site.nom}:`, error);
//                 }
//             }
//         })
//         .catch(error => {
//             console.error('Erreur lors du chargement des données :', error);
//             const errorMessage = document.getElementById('errorMessage');
//             if (errorMessage) {
//                 errorMessage.textContent = "Impossible de charger les données des sites.";
//                 errorMessage.classList.remove('hidden');
//             }
//         });
// }


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
    const forecastPeriod = document.getElementById('forecastPeriod').value; // Récupérer la période sélectionnée

    // Reset previous state
    weatherInfo.classList.add('hidden');
    errorMessage.classList.add('hidden');
    // geoMessage.classList.add('hidden');
    errorMessage.textContent = '';

    if (!cityDropdown) {
        await new Promise(resolve => setTimeout(resolve, 150));
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

        document.getElementById('temperature').textContent = `${Math.round(weatherData.current_weather.temperature)}°`;

        // Ajouter une icône météo
        const weatherIcon = document.getElementById('weatherIcon');
        const weatherCode = weatherData.current_weather.weathercode;

        weatherIcon.textContent = weatherIcons[weatherCode] || '❓'; // Afficher une icône par défaut si le code n'est pas trouvé

        const currentWindSpeed = weatherData.current_weather.windspeed;
        const currentWindDirection = weatherData.current_weather.winddirection;

        document.getElementById('windSpeed').textContent = `${currentWindSpeed.toFixed(1)}`;//km/h
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

        document.getElementById('windGusts').textContent = `${typeof currentWindGust === 'number' ? currentWindGust.toFixed(1) : currentWindGust} `;

        // Prepare data for charts
        const hourlyDates = weatherData.hourly.time.slice(0, forecastPeriod * 24); // Ajuster en fonction de la période
        const hourlyWindSpeeds = weatherData.hourly.windspeed_10m.slice(0, forecastPeriod * 24);
        const hourlyWindDirections = weatherData.hourly.winddirection_10m.slice(0, forecastPeriod * 24);
        const hourlyWindGusts = weatherData.hourly.windgusts_10m.slice(0, forecastPeriod * 24);

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

        // Après avoir affiché les données météo
        if (!isForecastPeriodChange) {
            document.getElementById('weatherInfo').classList.remove('hidden');
            document.getElementById('weatherDisplaySection').classList.remove('hidden');
            // Ajouter le défilement smooth vers la section
            document.getElementById('weatherDisplaySection').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
    }
}



/** WEATHER DATA FUCNTION */
function saveForecastPeriod() {
    const forecastPeriod = document.getElementById('forecastPeriod').value;
    localStorage.setItem('forecastPeriod', forecastPeriod);
}

function loadForecastPeriod() {
    const savedPeriod = localStorage.getItem('forecastPeriod');
    if (savedPeriod) {
        document.getElementById('forecastPeriod').value = savedPeriod;
    }
}

const forecastPeriodButton = document.getElementById('forecastPeriod');
if (forecastPeriodButton) {
    forecastPeriodButton.addEventListener('change', async () => {
        isForecastPeriodChange = true; // Indiquer que le changement provient de forecastPeriod
        saveForecastPeriod(); // Sauvegarder la période sélectionnée
        await fetchWeather(); // Recharger les graphiques avec la nouvelle période
        isForecastPeriodChange = false; // Réinitialiser le drapeau après l'appel
    });
}

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
    resultsContainer.id = 'lowWindPeriods';
    resultsContainer.classList.add('mt-6', 'p-5', 'bg-gradient-to-br', 'from-blue-50', 'to-blue-100',
        'rounded-2xl', 'shadow-lg', 'border', 'border-blue-200');

    // Titre avec icône
    const titleContainer = document.createElement('div');
    titleContainer.classList.add('flex', 'items-center', 'gap-2', 'mb-4');

    const titleIcon = document.createElement('i');
    titleIcon.classList.add('fas', 'fa-check-circle', 'text-green-500', 'text-xl');

    const title = document.createElement('h4');
    title.textContent = `Périodes favorables: vent < 15 km/h, rafales < 25 km/h, direction proche de ${siteOrientation}`;
    title.classList.add('text-lg', 'font-bold', 'text-blue-800');

    titleContainer.appendChild(titleIcon);
    titleContainer.appendChild(title);
    resultsContainer.appendChild(titleContainer);

    // Liste avec un style amélioré
    const list = document.createElement('ul');
    list.classList.add('space-y-2', 'max-h-60', 'overflow-y-auto', 'pr-2', 'custom-scrollbar');

    // Ajouter un style pour la scrollbar personnalisée
    const style = document.createElement('style');
    style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(219, 234, 254, 0.5);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
  }
`;
    document.head.appendChild(style);

    // Note: Pour chaque élément de la liste, vous pourriez utiliser ce format:
    // const listItem = document.createElement('li');
    // listItem.classList.add('p-2', 'bg-white', 'rounded-lg', 'shadow-sm', 'border-l-4', 'border-green-400', 'flex', 'items-center');
    // listItem.innerHTML = `<i class="fas fa-wind text-blue-600 mr-2 text-sm"></i><span>${périodeTexte}</span>`;
    // list.appendChild(listItem);

    resultsContainer.appendChild(list);

    // Facultatif: Ajouter un pied de conteneur avec un texte d'aide
    const footer = document.createElement('div');
    footer.classList.add('mt-4', 'text-xs', 'text-blue-600', 'italic', 'flex', 'items-center');
    footer.innerHTML = '<i class="fas fa-info-circle mr-1"></i>Conditions optimales pour un vol en sécurité';
    resultsContainer.appendChild(footer);

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
