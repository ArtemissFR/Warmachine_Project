# 🌌 CORE OPS — Interface de Contrôle v3.1.0 (ELITE)

[![Status](https://img.shields.io/badge/Status-Operational-00ffcc.svg?style=flat-square)]()
[![Version](https://img.shields.io/badge/Version-3.1.0_ELITE-purple.svg?style=flat-square)]()
[![Platform](https://img.shields.io/badge/Platform-PWA-blue.svg?style=flat-square)]()

**CORE OPS** est un portail personnel haute performance conçu pour centraliser l'entraînement, la productivité et la création artistique. Basé sur une esthétique cyber-industrielle et une interface immersive, ce système permet un suivi précis des objectifs physiques et une gestion optimisée des services quotidiens.

---

## 🛠️ Modules Principaux

### 1. 💪 CORE TRAINING (Module 01)
Le coeur névralgique du système pour le suivi athlétique :
- **Workspace Dynamique** : Épinglez vos modules favoris (KCAL, Stats, Routines) pour un accès instantané.
- **Analytics & IA** : Graphiques d'évolution (Poids, Volume) via Chart.js et analyse cognitive des performances.
- **Workout Log** : Création de routines personnalisées et enregistrement de performances en temps réel avec calcul du 1RM.
- **Nutrition Tracker** : Gestion du déficit/surplus calorique quotidien avec barres de progression dynamiques.
- **Visual Evolution** : Comparateur de photos "Avant/Après" pour suivre la métamorphose physique.

### 2. 🌐 NEBULA LINK (Module 02)
Interface d'accès rapide aux services locaux et liens stratégiques pour une navigation fluide et centralisée.

### 3. 🎨 VISUAL ARCHIVE (Module 03)
Galerie immersive dédiée à l'archivage de créations visuelles, allant du dessin traditionnel à l'art généré par Intelligence Artificielle.

---

## 🚀 Fonctionnalités Avancées

- **Interface Elite UI** : Design néon haute-fidélité utilisant des variables CSS avancées, des effets de flou (glassmorphism) et des micro-animations fluides.
- **Système de Rang** : Progression gamifiée basée sur l'assiduité (Recrue → Elite).
- **PWA Ready** : Installation sur mobile et bureau avec support hors-ligne via Service Workers.
- **Composants Nexus** : Architecture modulaire utilisant des Custom Web Components (`<nexus-navbar>`, `<nexus-assistant>`, etc.).
- **Assistant Intégré** : Support interactif flottant pour guider l'utilisateur à travers les différents modules.

---

## 💻 Stack Technique

- **Frontend** : HTML5, Vanilla CSS3 (Custom Properties, Grid, Flexbox).
- **Logic** : JavaScript ES6+ (Web Components API).
- **Data Viz** : [Chart.js](https://www.chartjs.org/) pour les rendus analytiques.
- **Offline** : Service Workers & Web App Manifest.
- **Typography** : Outfit & Inter (Google Fonts).

---

## 📂 Structure du Projet

```text
Warmachine_Project/
├── index.html          # Portail d'entrée principal
├── training.html       # Module d'entraînement complet
├── network.html        # Nebula Link (Services)
├── gallery.html        # Visual Archive (Galerie)
├── settings.html       # Configuration du système
├── sw.js               # Service Worker (PWA)
├── manifest.json       # Manifeste d'installation
├── css/
│   └── style.css       # Design System & Core Styles
├── js/
│   ├── core.js         # Logique globale du système
│   ├── components.js   # Définition des Web Components
│   ├── training.js     # Moteur du module Training
│   └── theme.js        # Gestionnaire d'apparence
└── assets/             # Ressources (Images, Icones)
```

---

## 🛠️ Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/ArtemissFR/Warmachine_Project.git
   ```
2. Ouvrez `index.html` dans votre navigateur ou utilisez une extension type *Live Server*.
3. Pour l'expérience PWA, accédez au site via HTTPS pour activer l'installation du Service Worker.

---

<p align="center">
  <i>Développé avec précision pour les utilisateurs exigeants.</i><br>
  <b>SÉCURISÉ · EFFICIENT · ÉLITE</b>
</p>
