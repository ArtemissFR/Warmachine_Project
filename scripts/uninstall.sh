#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# uninstall.sh — Vérification et désinstallation complète de Warmachine
# Usage     : bash scripts/uninstall.sh [--check | --uninstall]
#   --check      Vérifie l'état de chaque composant (sans rien supprimer)
#   --uninstall  Désinstalle et supprime tout ce que deploy.sh a installé
#
# Par défaut (sans argument) : mode --check
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:---check}"

# ── Couleurs ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

found()   { echo -e "  ${GREEN}✅  INSTALLÉ   ${NC}— $1"; }
missing() { echo -e "  ${RED}❌  ABSENT     ${NC}— $1"; }
removed() { echo -e "  ${YELLOW}🗑️   SUPPRIMÉ   ${NC}— $1"; }
skipped() { echo -e "  ${BLUE}➖  IGNORÉ     ${NC}— $1"; }
info()    { echo -e "  ${BLUE}ℹ️   ${NC}$1"; }

# ─────────────────────────────────────────────────────────────────────────────
# MODE CHECK — Vérifie l'état de chaque composant
# ─────────────────────────────────────────────────────────────────────────────
check_state() {
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║   Warmachine — Vérification de l'état   ║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
  echo ""

  echo -e "${BOLD}── Logiciels ───────────────────────────────${NC}"

  # Node.js
  if command -v node &>/dev/null; then
    found "Node.js $(node -v)"
  else
    missing "Node.js"
  fi

  # npm
  if command -v npm &>/dev/null; then
    found "npm $(npm -v)"
  else
    missing "npm"
  fi

  # PM2
  if command -v pm2 &>/dev/null; then
    found "PM2 $(pm2 -v)"
  else
    missing "PM2"
  fi

  # sqlite3 CLI
  if command -v sqlite3 &>/dev/null; then
    found "sqlite3 CLI"
  else
    missing "sqlite3 CLI"
  fi

  echo ""
  echo -e "${BOLD}── Service PM2 ─────────────────────────────${NC}"

  # Service warmachine dans PM2
  if command -v pm2 &>/dev/null && pm2 describe warmachine &>/dev/null 2>&1; then
    STATUS=$(pm2 describe warmachine 2>/dev/null | grep "status" | awk '{print $4}' | head -1)
    found "Service PM2 'warmachine' (status: $STATUS)"
  else
    missing "Service PM2 'warmachine'"
  fi

  # PM2 startup enregistré
  if [ -f "$HOME/.pm2/dump.pm2" ]; then
    found "PM2 sauvegarde (pm2 save effectué)"
  else
    missing "PM2 sauvegarde"
  fi

  echo ""
  echo -e "${BOLD}── Projet ─────────────────────────────────${NC}"

  # node_modules
  if [ -d "$PROJECT_DIR/node_modules" ]; then
    COUNT=$(ls "$PROJECT_DIR/node_modules" | wc -l)
    found "node_modules/ ($COUNT paquets)"
  else
    missing "node_modules/"
  fi

  # Dossier data
  if [ -d "$PROJECT_DIR/data" ]; then
    found "Dossier data/"
  else
    missing "Dossier data/"
  fi

  # Base de données SQLite
  if [ -f "$PROJECT_DIR/data/database.sqlite" ]; then
    SIZE=$(du -h "$PROJECT_DIR/data/database.sqlite" | awk '{print $1}')
    USERS=$(sqlite3 "$PROJECT_DIR/data/database.sqlite" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "?")
    ENTRIES=$(sqlite3 "$PROJECT_DIR/data/database.sqlite" "SELECT COUNT(*) FROM gym_entries;" 2>/dev/null || echo "?")
    WEIGHTS=$(sqlite3 "$PROJECT_DIR/data/database.sqlite" "SELECT COUNT(*) FROM body_weight;" 2>/dev/null || echo "?")
    TARGETS=$(sqlite3 "$PROJECT_DIR/data/database.sqlite" "SELECT COUNT(*) FROM gym_targets;" 2>/dev/null || echo "?")
    found "database.sqlite ($SIZE) — $USERS inscrits, $ENTRIES séances, $WEIGHTS pesées, $TARGETS objectifs"
  else
    missing "data/database.sqlite"
  fi

  # Dossier logs
  if [ -d "$PROJECT_DIR/logs" ]; then
    found "Dossier logs/"
  else
    missing "Dossier logs/"
  fi

  # Dossier uploads (Images de profil)
  if [ -d "$PROJECT_DIR/public/uploads" ]; then
    COUNT=$(ls "$PROJECT_DIR/public/uploads" 2>/dev/null | wc -l)
    found "Dossier public/uploads/ ($COUNT image(s))"
  else
    missing "Dossier public/uploads/"
  fi

  # Dossier backups
  if [ -d "$PROJECT_DIR/backups" ]; then
    COUNT=$(ls "$PROJECT_DIR/backups" 2>/dev/null | wc -l)
    found "Dossier backups/ ($COUNT fichier(s))"
  else
    missing "Dossier backups/"
  fi

  echo ""
  echo -e "${BOLD}── Réseau ─────────────────────────────────${NC}"

  # Port 3000 en écoute
  if command -v ss &>/dev/null; then
    if ss -tlnp 2>/dev/null | grep -q ":3000"; then
      found "Port 3000 en écoute"
    else
      missing "Port 3000 (application non joignable)"
    fi
  fi

  # Réponse HTTP
  if command -v curl &>/dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/ 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      found "Réponse HTTP 200 sur localhost:3000"
    else
      missing "Réponse HTTP (code: $HTTP_CODE)"
    fi
  fi

  echo ""
  echo -e "  ${BLUE}Pour désinstaller : ${BOLD}bash scripts/uninstall.sh --uninstall${NC}"
  echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# MODE UNINSTALL — Supprime tout ce que deploy.sh a installé
# ─────────────────────────────────────────────────────────────────────────────
do_uninstall() {
  echo ""
  echo -e "${RED}${BOLD}╔══════════════════════════════════════════╗${NC}"
  echo -e "${RED}${BOLD}║   Warmachine — Désinstallation complète  ║${NC}"
  echo -e "${RED}${BOLD}╚══════════════════════════════════════════╝${NC}"
  echo ""

  # Confirmation
  echo -e "${RED}${BOLD}⚠️  ATTENTION${NC} : Cette opération va :"
  echo -e "   • Arrêter et supprimer le service PM2 'warmachine'"
  echo -e "   • Supprimer node_modules/, logs/"
  echo -e "   • ${RED}${BOLD}Optionnellement supprimer data/ (base de données)${NC}"
  echo ""
  read -r -p "Continuer ? (oui/non) : " CONFIRM
  if [[ "$CONFIRM" != "oui" ]]; then
    echo -e "\n  ${YELLOW}Désinstallation annulée.${NC}\n"
    exit 0
  fi

  # Proposer de sauvegarder la BDD avant suppression
  if [ -f "$PROJECT_DIR/data/database.sqlite" ]; then
    echo ""
    read -r -p "Sauvegarder la base de données avant suppression ? (oui/non) : " DO_BACKUP
    if [[ "$DO_BACKUP" == "oui" ]]; then
      bash "$PROJECT_DIR/scripts/backup-db.sh"
    fi
  fi

  echo ""

  # ── 1. Arrêter et supprimer le service PM2 ─────────────────────────────────
  if command -v pm2 &>/dev/null && pm2 describe warmachine &>/dev/null 2>&1; then
    pm2 stop warmachine >/dev/null 2>&1
    pm2 delete warmachine >/dev/null 2>&1
    pm2 save >/dev/null 2>&1
    removed "Service PM2 'warmachine' supprimé"
  else
    skipped "Service PM2 'warmachine' (déjà absent)"
  fi

  # ── 2. Supprimer node_modules ──────────────────────────────────────────────
  if [ -d "$PROJECT_DIR/node_modules" ]; then
    rm -rf "$PROJECT_DIR/node_modules"
    removed "node_modules/ supprimé"
  else
    skipped "node_modules/ (déjà absent)"
  fi

  # ── 3. Supprimer les logs ─────────────────────────────────────────────────
  if [ -d "$PROJECT_DIR/logs" ]; then
    rm -rf "$PROJECT_DIR/logs"
    removed "logs/ supprimé"
  else
    skipped "logs/ (déjà absent)"
  fi

  # ── 4. Supprimer la base de données (avec confirmation) ───────────────────
  if [ -f "$PROJECT_DIR/data/database.sqlite" ]; then
    echo ""
    read -r -p "Supprimer la base de données SQLite (toutes les données) ? (oui/non) : " DEL_DB
    if [[ "$DEL_DB" == "oui" ]]; then
      rm -f "$PROJECT_DIR/data/database.sqlite"
      removed "data/database.sqlite supprimé"
    else
      skipped "data/database.sqlite conservé"
    fi
  fi

  # ── 5. PM2 (optionnel) ───────────────────────────────────────────────────
  echo ""
  read -r -p "Désinstaller PM2 globalement ? (oui/non) : " DEL_PM2
  if [[ "$DEL_PM2" == "oui" ]]; then
    npm uninstall -g pm2 >/dev/null 2>&1
    removed "PM2 désinstallé"
  else
    skipped "PM2 conservé"
  fi

  # ── 6. Node.js (optionnel) ───────────────────────────────────────────────
  echo ""
  read -r -p "Désinstaller Node.js ? (oui/non) : " DEL_NODE
  if [[ "$DEL_NODE" == "oui" ]]; then
    apt-get remove -y nodejs >/dev/null 2>&1
    apt-get autoremove -y >/dev/null 2>&1
    removed "Node.js désinstallé"
  else
    skipped "Node.js conservé"
  fi

  # ── Résumé ────────────────────────────────────────────────────────────────
  echo ""
  echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}${BOLD}║   ✅  Désinstallation terminée           ║${NC}"
  echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  Pour redéployer : ${BOLD}bash scripts/deploy.sh${NC}"
  echo ""
}

# ─── Dispatch ────────────────────────────────────────────────────────────────
case "$MODE" in
  --check)      check_state  ;;
  --uninstall)  do_uninstall ;;
  *)
    echo "Usage : bash scripts/uninstall.sh [--check | --uninstall]"
    exit 1
    ;;
esac
