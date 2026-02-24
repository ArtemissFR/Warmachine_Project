# Portfolio Warmachine - Dockerisé 🚀

Ce projet est un portfolio personnel créatif incluant une application de suivi de musculation avancée. Il est désormais entièrement dockerisé avec un backend Node.js et une base de données SQLite persistante.

## 🌟 Fonctionnalités
- **Frontend** : Design futuriste, effets 3D, mode sombre/clair, animations de transition.
- **Gym App** : Suivi des séances, calcul de 1RM, graphiques de progression (Chart.js), records personnels.
- **Data** : Stockage côté serveur (SQLite) avec persistance via Docker.

## 🛠️ Installation & Lancement

### Prérequis
- [Docker](https://www.docker.com/get-started) installé sur votre machine.
- [Docker Compose](https://docs.docker.com/compose/install/) (généralement inclus avec Docker Desktop).

### Démarrage Rapide
1. Ouvrez un terminal à la racine du projet.
2. Lancez les containers avec Docker Compose :
   ```bash
   docker-compose up -d --build
   ```
3. Accédez au portfolio dans votre navigateur :
   [http://localhost:3000](http://localhost:3000)

### Gestion des Données
Les données de musculation sont enregistrées dans le dossier `./data/database.sqlite`. Ce dossier est monté en tant que **volume Docker**, ce qui signifie que vos données sont conservées même si vous arrêtez ou supprimez le container.

## 📁 Architecture du Projet
- `public/` : Fichiers statiques (HTML, CSS, JS).
- `server.js` : Serveur backend Node.js / Express.
- `data/` : Dossier contenant la base de données SQLite.
- `Dockerfile` : Instructions de build de l'image.
- `docker-compose.yml` : Configuration de l'orchestration.

## 🔧 Commandes Utiles
- **Arrêter le serveur** : `docker-compose stop`
- **Relancer le serveur** : `docker-compose start`
- **Voir les logs** : `docker logs -f warmachine-portfolio`
- **Supprimer et reconstruire** : `docker-compose down && docker-compose up -d --build`
