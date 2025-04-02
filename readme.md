# Météo Parapente Haute-Loire

Ce projet est une application web permettant de consulter les prévisions météorologiques pour les sites de parapente en Haute-Loire. Elle fournit des informations détaillées sur la vitesse du vent, la direction du vent, les rafales, ainsi que des périodes favorables pour voler.

## Fonctionnalités

- **Sélection de site** : Choisissez un site de parapente dans un menu déroulant.
- **Prévisions météorologiques** : Affiche les prévisions de vent pour les 10 prochains jours.
- **Graphiques interactifs** : Visualisez les vitesses et directions du vent sous forme de graphiques.
- **Périodes favorables** : Liste des périodes où les conditions sont idéales pour voler.
- **Lien vers Météo Parapente** : Accédez à des prévisions détaillées pour chaque site.

## Structure du projet

- **`index.html`** : Page principale de l'application.
- **`data/data.json`** : Données des sites de parapente (nom, coordonnées, orientation, etc.).
- **`js/script.js`** : Script JavaScript pour charger les données, interagir avec l'API météo et afficher les graphiques.

## Technologies utilisées

- **HTML/CSS** : Structure et style de la page.
- **JavaScript** : Gestion des données et interactions utilisateur.
- **Chart.js** : Bibliothèque pour les graphiques.
- **Tailwind CSS** : Framework CSS pour un design moderne et réactif.
- **API Open-Meteo** : Récupération des données météorologiques.
- **IA** : Copilot in VScode, Mistral Le Chat.

## Installation

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/Peperperrier/meteo-parapente-43.git