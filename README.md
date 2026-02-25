# Warmachine Portfolio 🚀

Portfolio personnel avec suivi de **musculation** — Node.js/Express, SQLite, géré par **PM2**.

---

## 📁 Structure du Projet
```
Warmachine_Project/
├── public/                  # Frontend (HTML, CSS, JS)
├── scripts/
│   ├── deploy.sh            # Déploiement complet automatisé
│   ├── uninstall.sh         # Vérification & désinstallation
│   ├── init-db.js           # Initialisation de la base de données
│   └── backup-db.sh         # Sauvegarde horodatée
├── data/
│   └── database.sqlite      # Base de données (créée automatiquement)
├── backups/                 # Sauvegardes horodatées
├── logs/
│   ├── out.log              # Logs stdout (PM2)
│   └── error.log            # Logs stderr (PM2)
├── server.js                # Serveur Express
├── ecosystem.config.js      # Configuration PM2
└── package.json
```

---

## 🚀 Déploiement (1 commande)

```bash
# Cloner le projet
git clone <url-du-repo> ~/Warmachine_Project
cd ~/Warmachine_Project

# Lancer le déploiement complet
bash scripts/deploy.sh
```

Le script effectue automatiquement :
1. Vérifie / installe **Node.js 18**
2. Vérifie / installe **PM2** et **sqlite3**
3. Installe les dépendances npm (`npm install --omit=dev`)
4. Crée les dossiers `data/`, `logs/`, `backups/`
5. Initialise la **base de données SQLite** (conserve les données existantes)
6. Démarre l'application avec **PM2** (ou redémarre si déjà actif)

> ✅ Le script est **idempotent** : peut être relancé sans risque de perte de données.

---

## 🔍 Vérifier l'état

```bash
bash scripts/uninstall.sh --check
# ou
npm run check
```

Affiche pour chaque composant : Node.js, PM2, sqlite3, le service, la BDD (taille + nombre d'entrées), les ports réseau...

---

## 🔧 Gestion quotidienne

### Service PM2
```bash
pm2 status                   # État du service
pm2 restart warmachine       # Redémarrer
pm2 stop warmachine          # Arrêter
```

### Mise à jour du code
```bash
git pull
npm install --omit=dev
pm2 restart warmachine
```

### Auto-démarrage au reboot
```bash
pm2 startup    # Copie-colle la commande affichée
pm2 save
```

---

## 📋 Logs & Debugging

```bash
pm2 logs warmachine             # Temps réel (stdout + stderr)
pm2 logs warmachine --err       # Erreurs uniquement
pm2 monit                       # Dashboard CPU/mémoire interactif
tail -f logs/error.log          # Fichier d'erreurs directement
```

### Si l'app ne répond pas
```bash
# Voir les erreurs
pm2 logs warmachine --err --lines 30

# Tester directement (sans PM2)
node server.js

# Vérifier le port
ss -tlnp | grep 3000
```

---

## 📋 Base de Données SQLite

### Tables
| Table | Colonnes | Description |
|---|---|---|
| `users` | id, username, password_hash, profile_picture | Comptes utilisateurs |
| `gym_entries` | id, date, exercise, category, weight, reps, user_id | Séances de musculation |
| `body_weight` | id, date, weight, user_id | Historique poids corporel |
| `gym_targets` | id, exercise, target_weight, user_id | Objectifs de records (PR) |

### Commandes utiles
```bash
# Initialiser les tables (si besoin)
npm run db:init

# Consulter manuellement
sqlite3 data/database.sqlite
.tables
SELECT * FROM gym_entries ORDER BY date DESC;
SELECT * FROM body_weight ORDER BY date ASC;
.quit
```

### Sauvegarde
```bash
# Sauvegarde manuelle
npm run db:backup

# Sauvegarde automatique quotidienne (cron à 3h du matin)
crontab -e
# Ajouter :
0 3 * * * cd ~/Warmachine_Project && bash scripts/backup-db.sh >> logs/backup.log 2>&1
```

### Restaurer un backup
```bash
pm2 stop warmachine
cp backups/database_YYYY-MM-DD_HH-MM-SS.sqlite data/database.sqlite
pm2 start ecosystem.config.js --env production
```

---

## 🌐 API REST

### Authentification & Profil
| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Créer un nouveau compte |
| `POST` | `/api/auth/login` | Se connecter (session 30j) |
| `POST` | `/api/auth/logout` | Se déconnecter |
| `GET` | `/api/auth/me` | Vérifier l'état de connexion |
| `POST` | `/api/user/upload-photo` | Uploader une photo de profil (Multer) |

### Musculation & Suivi (Nécessite Connexion)
| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/gym` | Lister les séances de l'utilisateur |
| `POST` | `/api/gym` | Ajouter une séance |
| `DELETE` | `/api/gym/:id` | Supprimer une séance |
| `POST` | `/api/gym/import` | Import en masse (JSON) |
| `GET` | `/api/weight` | Historique du poids |
| `POST` | `/api/weight` | Ajouter une pesée |
| `GET` | `/api/targets` | Liste des objectifs (PR) |
| `POST` | `/api/targets` | Ajouter un objectif |

---

## 🗑️ Désinstallation

```bash
bash scripts/uninstall.sh --uninstall
# ou
npm run uninstall
```

Supprime (avec confirmations interactives) : service PM2, `node_modules/`, `logs/`, et optionnellement la BDD, PM2 et Node.js. Propose un backup avant suppression.

---

## ⚡ Raccourcis npm

| Commande | Action |
|---|---|
| `npm run deploy` | Déploiement complet |
| `npm run check` | Vérifier l'état du système |
| `npm run uninstall` | Désinstaller |
| `npm run db:init` | Initialiser la BDD |
| `npm run db:backup` | Sauvegarder la BDD |
| `npm run dev` | Lancer en mode développement (nodemon) |
