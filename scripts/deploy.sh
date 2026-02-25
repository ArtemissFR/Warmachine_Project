#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Déploiement complet de Warmachine Portfolio
# Usage    : bash scripts/deploy.sh
# Prérequis : Debian/Ubuntu, exécuté depuis la racine du projet
# ─────────────────────────────────────────────────────────────────────────────

set -e   # Arrêt immédiat en cas d'erreur
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Couleurs ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

step()  { echo -e "\n${BLUE}${BOLD}▶ $1${NC}"; }
ok()    { echo -e "  ${GREEN}✅ $1${NC}"; }
warn()  { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
fail()  { echo -e "  ${RED}❌ $1${NC}"; exit 1; }

# ── Vérification : root ou sudo ───────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  fail "Ce script doit être exécuté en tant que root (ou avec sudo)"
fi

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Warmachine Portfolio — Déploiement     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# ─── ÉTAPE 1 : Node.js ───────────────────────────────────────────────────────
step "1/7 — Vérification de Node.js"
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  ok "Node.js déjà installé : $NODE_VER"
else
  warn "Node.js absent — installation de Node.js 18..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >/dev/null 2>&1
  apt-get install -y nodejs >/dev/null 2>&1
  ok "Node.js installé : $(node -v)"
fi

# ─── ÉTAPE 2 : PM2 ───────────────────────────────────────────────────────────
step "2/7 — Vérification de PM2"
if command -v pm2 &>/dev/null; then
  ok "PM2 déjà installé : $(pm2 -v)"
else
  warn "PM2 absent — installation..."
  npm install -g pm2 >/dev/null 2>&1
  ok "PM2 installé : $(pm2 -v)"
fi

# ─── ÉTAPE 3 : sqlite3 CLI ───────────────────────────────────────────────────
step "3/7 — Vérification de sqlite3"
if command -v sqlite3 &>/dev/null; then
  ok "sqlite3 CLI déjà disponible"
else
  warn "sqlite3 absent — installation..."
  apt-get install -y sqlite3 >/dev/null 2>&1
  ok "sqlite3 installé"
fi

# ─── ÉTAPE 4 : Dépendances Node ──────────────────────────────────────────────
step "4/7 — Installation des dépendances npm"
cd "$PROJECT_DIR"
npm install --omit=dev
ok "node_modules installés"

# ─── ÉTAPE 5 : Dossiers & structure ──────────────────────────────────────────
step "5/7 — Création des dossiers"
mkdir -p "$PROJECT_DIR/data" "$PROJECT_DIR/logs" "$PROJECT_DIR/backups" "$PROJECT_DIR/public/uploads"
ok "Dossiers créés : data/, logs/, backups/, public/uploads/"

# ─── ÉTAPE 6 : Base de données ───────────────────────────────────────────────
step "6/7 — Initialisation de la base de données"
if [ -f "$PROJECT_DIR/data/database.sqlite" ]; then
  ok "Base de données existante conservée : data/database.sqlite"
else
  node "$PROJECT_DIR/scripts/init-db.js"
  ok "Base de données initialisée"
fi

# ─── ÉTAPE 7 : PM2 & démarrage ───────────────────────────────────────────────
step "7/7 — Lancement avec PM2"
cd "$PROJECT_DIR"

# Arrêter l'ancienne instance si elle existe
if pm2 describe warmachine &>/dev/null; then
  warn "Instance existante détectée — redémarrage..."
  pm2 restart warmachine --update-env
else
  pm2 start ecosystem.config.js --env production
fi

# Sauvegarde + auto-démarrage
pm2 save >/dev/null 2>&1
ok "Service PM2 'warmachine' actif"

# Générer la config de démarrage auto (sans l'appliquer automatiquement)
STARTUP_CMD=$(pm2 startup | grep "sudo env" || true)
if [ -n "$STARTUP_CMD" ]; then
  echo ""
  echo -e "  ${YELLOW}${BOLD}Action requise :${NC} Copie-colle cette commande pour activer le démarrage automatique :"
  echo -e "  ${YELLOW}$STARTUP_CMD${NC}"
fi

# ─── Résumé ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✅  Déploiement terminé avec succès    ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Application disponible sur : ${BOLD}http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo ""
echo -e "  Commandes utiles :"
echo -e "  ${BLUE}pm2 status${NC}               — État du service"
echo -e "  ${BLUE}pm2 logs warmachine${NC}      — Logs en temps réel"
echo -e "  ${BLUE}pm2 monit${NC}                — Dashboard CPU/mémoire"
echo ""
